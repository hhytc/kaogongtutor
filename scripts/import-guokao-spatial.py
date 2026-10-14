#!/usr/bin/env python3
"""Import only observed 2022–2026 national spatial questions from a pinned vault.

Usage: python3 scripts/import-guokao-spatial.py /path/to/kaogongzhentizhengliu
This never replaces existing question IDs/versions or imports the full vault.
"""
from pathlib import Path
from html.parser import HTMLParser
import collections
import hashlib
import html
import json
import re
import shutil
import subprocess
import sys
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
REVISION = '84ab93d4b64b61d897bece8a1c0a5bab06b4feb2'
SOURCE = 'https://github.com/ERRRC/kaogongzhentizhengliu'
YEARS = {'2022', '2023', '2024', '2025', '2026'}
PACK = ROOT / 'public/data/errrc/guokao_spatial_2022_2026.json'


class PlainText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in ('p', 'br', 'div', 'li'):
            self.parts.append('\n')

    def handle_data(self, data):
        self.parts.append(data)


def plain(fragment):
    parser = PlainText()
    parser.feed(fragment)
    return re.sub(r'\n\s*\n+', '\n', html.unescape(''.join(parser.parts))).strip()


def section(source, title):
    match = re.search(r'^### ' + re.escape(title) + r'\s*\n(.*?)(?=^### |\Z)', source, re.M | re.S)
    return match.group(1).strip() if match else ''


def category(point):
    # Projection/folding must be recognized before generic "空间重构".
    if '视图' in point:
        return 'views'
    if '投影面积' in point or '翻折覆盖' in point:
        return 'paper_folding'
    if '截面' in point or '截切' in point or '剖切' in point:
        return 'cross_section'
    if '立体拼合' in point:
        return 'assembly'
    if '空间重构' in point or '六面体' in point:
        return 'origami'
    return None


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    vault = Path(sys.argv[1]).resolve()
    revision = subprocess.check_output(['git', '-C', str(vault), 'rev-parse', 'HEAD'], text=True).strip()
    if revision != REVISION:
        raise SystemExit(f'Expected pinned revision {REVISION}, found {revision}')
    known = {}
    for name in ['origami', 'assembly', 'cross_section']:
        for question in json.loads((ROOT / f'public/data/errrc/{name}.json').read_text()):
            known[question['id']] = question
    imported, inventory, hashes = [], [], {}
    paper_audit_path = ROOT / 'public/data/errrc/guokao_spatial_papers.json'
    paper_audit = json.loads(paper_audit_path.read_text()) if paper_audit_path.exists() else None
    topics = {
        'origami': ('空间重构与外表面展开', ['相对面与相邻面', '公共边与公共顶点', '图案方向与旋转']),
        'assembly': ('立体拼合与方块约束', ['体积与方块数量守恒', '凹凸互补', '颜色与多组件约束']),
        'cross_section': ('立体截面与空心组合体', ['三点确定切面', '空心与组合体截面', '选非与存在性判断']),
        'views': ('三视图与观察投影', ['观察方向与投影', '遮挡与可见棱线', '颜色和数量联合约束']),
        'paper_folding': ('折纸覆盖与投影面积', ['沿折线翻折', '覆盖与重叠面积', '纸面积和投影面积']),
    }
    image_root = ROOT / 'public/data/errrc/images'
    image_root.mkdir(parents=True, exist_ok=True)

    def copy_images(fragment):
        images = []
        for path in re.findall(r'<img\b[^>]*\bsrc=["\']([^"\']+)', fragment):
            rel = path[path.index('90-图片/'):] if '90-图片/' in path else path
            original = vault / rel
            if not original.is_file():
                raise ValueError(f'Missing image: {original}')
            target = image_root / original.name
            digest = hashlib.sha256(original.read_bytes()).hexdigest()
            if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() != digest:
                raise ValueError(f'Conflicting image basename: {target.name}')
            if not target.exists():
                shutil.copyfile(original, target)
            hashes[str(target.relative_to(ROOT / 'public'))] = digest
            images.append(f'data/errrc/images/{original.name}')
        return list(dict.fromkeys(images))

    for path in sorted((vault / '10-真题/判断推理/图形推理').glob('*.md')):
        source = path.read_text()
        fields = dict(re.findall(r'^([^:\n]+): "(.*)"$', source.split('---', 2)[1], re.M))
        if fields.get('地区') != '国考' or fields.get('年份') not in YEARS:
            continue
        topic = category(fields['考点'])
        if not topic:
            continue
        qid = 'errrc:' + fields['qid']
        relative = str(path.relative_to(vault))
        url = SOURCE + '/blob/' + REVISION + '/' + quote(relative, safe='/')
        inventory.append({
            'id': qid, 'year': fields['年份'], 'paper': fields['试卷'],
            'category': topic, 'point': fields['考点'], 'sourcePath': relative,
            'sourceUrl': url, 'presentBefore': qid in known,
        })
        if qid in known:
            continue
        stem, choices = section(source, '题干'), section(source, '选项')
        # The source heading is a platform label; do not imply official release.
        analysis = section(source, '官方解析').split('> [!warning]')[0]
        options, correct = [], []
        for key, value in re.findall(r'^- ([A-D])\. (.*)$', choices, re.M):
            if '✅' in value:
                correct.append(key)
            clean = value.replace('✅', '').strip()
            option = {'key': key, 'text': plain(clean) or key}
            option_images = copy_images(clean)
            if option_images:
                if len(option_images) > 1:
                    raise ValueError(f'{qid}: multiple option images require manual treatment')
                option['imageUrl'] = option_images[0]
            options.append(option)
        if len(options) != 4 or len(correct) != 1:
            raise ValueError(f'{qid}: expected four options and one source answer')
        name, points = topics[topic]
        short = fields['考点'].split(' / ', 1)[-1]
        paper_type = '行政执法' if '行政执法' in fields['试卷'] else '地市级' if '地市级' in fields['试卷'] else '副省级'
        question = {
            'id': qid, 'version': 1, 'source': fields['试卷'],
            'title': f'{fields["年份"]}国考{paper_type} · {short.split("（")[0]}',
            'track': 'geometry', 'unitId': topic + '_guokao', 'unitName': name,
            'questionRole': 'example', 'category': topic, 'subType': short,
            'questionText': plain(stem), 'stemImages': copy_images(stem),
            'options': options, 'correctAnswer': correct[0],
            'detailedAnalysis': plain(analysis), 'analysisImages': copy_images(analysis),
            'knowledgePoints': points,
            'meta': {'sourceRepo': SOURCE, 'upstreamRevision': REVISION,
                     'sourcePath': relative, 'sourceUrl': url, 'qid': fields['qid'],
                     'year': fields['年份'], 'region': '国考', 'paper': fields['试卷'],
                     'point': fields['考点'], 'isRealExam': True},
        }
        if paper_audit:
            question['meta']['appearances'] = [
                {'year': str(row['year']), 'paper': row['paper'],
                 'questionNumber': str(row['questionNumber']), 'sourceUrl': row['sourceUrl']}
                for row in paper_audit['appearances'] if row['id'] == qid and row.get('checked')
            ]
        if not question['questionText'] or not question['detailedAnalysis']:
            raise ValueError(f'{qid}: missing stem or analysis')
        imported.append(question)

    PACK.write_text(json.dumps(imported, ensure_ascii=False, indent=2) + '\n')
    audit = {
        'years': sorted(YEARS), 'upstreamRevision': REVISION,
        'sourceStatus': '公开题库中的考生回忆版，题号与跨卷重复另行核对；不是官方原卷完整性证明',
        'uniqueSpatialQuestions': len(inventory), 'presentBefore': sum(x['presentBefore'] for x in inventory),
        'added': len(imported), 'questions': inventory, 'copiedImageSha256': hashes,
    }
    if paper_audit:
        audit['checkedPaperCount'] = paper_audit['paperCount']
        audit['checkedAppearanceCount'] = paper_audit['appearanceCount']
        audit['paperSources'] = 'data/errrc/guokao_spatial_papers.json'
    (ROOT / 'public/data/errrc/guokao_spatial_audit.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'unique': len(inventory), 'existing': audit['presentBefore'], 'added': len(imported),
                      'categories': dict(collections.Counter(x['category'] for x in inventory)),
                      'imageFiles': len(hashes)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
