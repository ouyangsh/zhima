/**
 * 钩针花样文本解析器 v4
 * 基于 YarnLab 文档的完整语法支持
 * https://yarnlabdocs.oboard.fun/crochet/basic.html
 * https://yarnlabdocs.oboard.fun/crochet/advanced.html
 * 
 * === 基础针法 ===
 * CH  锁针       chain
 * SL  引拔针     slip stitch
 * X   短针       single crochet (sc)
 * T   中长针     half double crochet (hdc)
 * F   长针       double crochet (dc)
 * E   长长针     treble crochet (tc/tr)
 * DTR 3卷长针    double treble
 * K   跳过       skip
 * 
 * === 加针后缀(V=2针加到同一针, W=3针加到同一针) ===
 * V/XV  短针加针    sc-inc (2 in 1)
 * TV    中长针加针  hdc-inc
 * FV    长针加针    dc-inc
 * EV    长长针加针  tc-inc
 * W/XW  短针3加针   3-sc in 1
 * TW    中长针3加针 3-hdc in 1
 * FW    长针3加针   3-dc in 1
 * 
 * === 减针后缀(A=2并1, M=3并1) ===
 * A/XA  短针减针    sc2tog
 * TA    中长针减针  hdc2tog
 * FA    长针减针    dc2tog
 * M/XM  短针3并1   sc3tog
 * TM    中长针3并1 hdc3tog
 * FM    长针3并1   dc3tog
 * 
 * === 内外钩(前/后柱针) ===
 * NX / NT / NF / NE  前柱(内钩) front post
 * WX / WT / WF / WE  后柱(外钩) back post  (注: 用 bpX 避免和 W=3加 冲突)
 * 
 * === 特殊针法 ===
 * BLO(...)  只钩后半针 back loop only
 * FLO(...)  只钩前半针 front loop only
 * Q / TQ    中长针枣形针 hdc cluster (bobble)
 * FQ        长针枣形针   dc cluster
 * G / TG    中长针爆米花针 hdc popcorn
 * FG        长针爆米花针   dc popcorn
 * 
 * === 结构语法 ===
 * Pn:         部件定义
 * P1, P2:     多部件同时定义
 * Rn:         环形行
 * Hn:         平织行
 * Rn-Rn:      行范围
 * 环起        环形起针 magic ring
 * n(...)      重复 n 次
 * [...]       同一针目内的多针(可选)
 * 缝合:       缝合指令
 * PnRn        部件引用/合并
 * 颜色名      行内颜色
 * # 标题      注释
 */

// ===== 针法定义 =====
// count: 该针法产出多少针到当前行
// consume: 消耗上一行多少针 (默认 1)
const STITCH_MAP = {
    // 基础针法
    'CH': { name: '锁针', en: 'ch', count: 1 },
    'SL': { name: '引拔针', en: 'sl st', count: 0 },
    'SS': { name: '引拔针', en: 'sl st', count: 0 },
    'S': { name: '引拔针', en: 'sl st', count: 0 },
    'X': { name: '短针', en: 'sc', count: 1 },
    'T': { name: '中长针', en: 'hdc', count: 1 },
    'F': { name: '长针', en: 'dc', count: 1 },
    'E': { name: '长长针', en: 'tr', count: 1 },
    'DTR': { name: '3卷长针', en: 'dtr', count: 1 },
    'K': { name: '跳过', en: 'skip', count: 0 },

    // 加针 (V = 2合1, W = 3合1)
    'V': { name: '短针加针', en: 'inc', count: 2 },
    'XV': { name: '短针加针', en: 'sc-inc', count: 2 },
    'TV': { name: '中长针加针', en: 'hdc-inc', count: 2 },
    'FV': { name: '长针加针', en: 'dc-inc', count: 2 },
    'EV': { name: '长长针加针', en: 'tr-inc', count: 2 },
    'XW': { name: '短针3加', en: '3sc-inc', count: 3 },
    'TW': { name: '中长针3加', en: '3hdc-inc', count: 3 },
    'FW': { name: '长针3加', en: '3dc-inc', count: 3 },
    'W': { name: '短针3加', en: '3sc-inc', count: 3 },

    // 减针 (A = 2并1, M = 3并1)
    'A': { name: '短针减针', en: 'dec', count: 1, consume: 2 },
    'XA': { name: '短针减针', en: 'sc2tog', count: 1, consume: 2 },
    'TA': { name: '中长针减针', en: 'hdc2tog', count: 1, consume: 2 },
    'FA': { name: '长针减针', en: 'dc2tog', count: 1, consume: 2 },
    'EA': { name: '长长针减针', en: 'tr2tog', count: 1, consume: 2 },
    'M': { name: '短针3并1', en: 'sc3tog', count: 1, consume: 3 },
    'XM': { name: '短针3并1', en: 'sc3tog', count: 1, consume: 3 },
    'TM': { name: '中长针3并1', en: 'hdc3tog', count: 1, consume: 3 },
    'FM': { name: '长针3并1', en: 'dc3tog', count: 1, consume: 3 },

    // 内钩(前柱) front post
    'NX': { name: '前柱短针', en: 'fpsc', count: 1 },
    'NT': { name: '前柱中长针', en: 'fphdc', count: 1 },
    'NF': { name: '前柱长针', en: 'fpdc', count: 1 },
    'NE': { name: '前柱长长针', en: 'fptr', count: 1 },

    // 外钩(后柱) back post — 用 bp 前缀避免与 W(3加) 冲突
    'bpX': { name: '后柱短针', en: 'bpsc', count: 1 },
    'bpT': { name: '后柱中长针', en: 'bphdc', count: 1 },
    'bpF': { name: '后柱长针', en: 'bpdc', count: 1 },
    'bpE': { name: '后柱长长针', en: 'bptr', count: 1 },

    // 枣形针 cluster/bobble
    'Q': { name: '枣形针', en: 'bobble', count: 1 },
    'TQ': { name: '中长针枣形针', en: 'hdc-bob', count: 1 },
    'FQ': { name: '长针枣形针', en: 'dc-bob', count: 1 },

    // 爆米花针 popcorn
    'G': { name: '爆米花针', en: 'popcorn', count: 1 },
    'TG': { name: '中长针爆米花', en: 'hdc-pop', count: 1 },
    'FG': { name: '长针爆米花', en: 'dc-pop', count: 1 },
};

const MODIFIER_MAP = {
    'BLO': '只钩后半针',
    'FLO': '只钩前半针',
};

/**
 * 判断文本是否为颜色/注释
 */
function isColorOrNote(text) {
    const t = text.trim();
    if (!t) return false;
    if (/^\d*[A-Z]{1,3}$/i.test(t) && lookupStitch(t.toUpperCase())) return false;
    if (/^\d+\(/.test(t)) return false;
    if (/^环起/.test(t)) return false;
    if (/^(BLO|FLO)\(/i.test(t)) return false;
    if (/^P\d+R\d+/i.test(t)) return false;
    if (/^\[/.test(t)) return false;
    if (/^[\u4e00-\u9fa5]+$/.test(t)) return true;
    return false;
}

/**
 * 查找针法定义 (支持多字符如 FV, TQ, DTR, bpF 等)
 */
function lookupStitch(code) {
    return STITCH_MAP[code] || STITCH_MAP[code.toUpperCase()] || null;
}

// ===== 主解析函数 =====
export function parsePattern(text) {
    if (!text || !text.trim()) return emptyResult();

    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    let title = '';
    let author = '';
    const partsMap = {};
    const partsList = [];
    const sewings = [];
    let currentPartIds = [];

    for (const line of lines) {
        // 注释/标题
        if (line.startsWith('#') && !line.startsWith('# @')) {
            title = line.replace(/^#+\s*/, '');
            continue;
        }
        if (line.startsWith('# @author')) {
            author = line.replace(/^# @author\s*/, '');
            continue;
        }

        // 缝合指令
        const sewMatch = line.match(/^缝合[：:]\s*(.+)$/);
        if (sewMatch) {
            sewings.push(parseSewing(sewMatch[1]));
            continue;
        }

        // 部件定义: P1: 名称 / P1, P2: / P1, P2: 名称
        const partDefMatch = line.match(/^(P\d+(?:\s*[,，]\s*P\d+)*)\s*[：:]\s*(.*)$/);
        if (partDefMatch) {
            const partIdsStr = partDefMatch[1];
            const partName = partDefMatch[2].trim();
            const ids = partIdsStr.match(/P(\d+)/g).map(p => parseInt(p.replace('P', '')));
            currentPartIds = ids;
            for (const id of ids) {
                if (!partsMap[id]) {
                    const part = { id, name: partName || `部件${id}`, rows: [] };
                    partsMap[id] = part;
                    partsList.push(part);
                } else if (partName) {
                    partsMap[id].name = partName;
                }
            }
            continue;
        }

        // 行定义: R / H
        const rowMatch = line.match(/^([RH])(\d+)(?:-[RH]?(\d+))?[：:]\s*(.+)$/i);
        if (rowMatch) {
            const rowType = rowMatch[1].toUpperCase() === 'R' ? 'round' : 'flat';
            const startNum = parseInt(rowMatch[2]);
            const endNum = rowMatch[3] ? parseInt(rowMatch[3]) : startNum;
            const rawInstruction = rowMatch[4].replace(/[,，]\s*$/, '').trim();

            if (currentPartIds.length === 0) {
                if (!partsMap[0]) {
                    const part = { id: 0, name: '主体', rows: [] };
                    partsMap[0] = part;
                    partsList.push(part);
                }
                currentPartIds = [0];
            }

            for (let r = startNum; r <= endNum; r++) {
                for (const pid of currentPartIds) {
                    const part = partsMap[pid];
                    const prevRow = part.rows.length > 0 ? part.rows[part.rows.length - 1] : null;
                    const prevStitches = prevRow ? prevRow.endStitches : 0;
                    const parsed = parseRowInstruction(rawInstruction, prevStitches, partsMap);
                    part.rows.push({ rowNumber: r, type: rowType, rawInstruction, ...parsed });
                }
            }
            continue;
        }
    }

    for (const part of partsList) recalculateStitches(part.rows);
    return { title, author, parts: partsList, sewings, stats: calculateStats(partsList) };
}

// ===== 行指令解析 =====
function parseRowInstruction(instruction, prevStitches, partsMap) {
    let color = '';
    let modifier = '';
    let modifierName = '';

    const rawParts = instruction.split(/[,，]\s*/);
    const stitchParts = [];
    let hasRing = false;
    const joinRefs = [];

    for (const rp of rawParts) {
        const trimmed = rp.trim();
        if (!trimmed) continue;

        if (isColorOrNote(trimmed)) {
            if (trimmed === '环起') { hasRing = true; }
            else { color = trimmed; }
            continue;
        }

        const refMatch = trimmed.match(/^P(\d+)R(\d+)$/i);
        if (refMatch) {
            joinRefs.push({ part: parseInt(refMatch[1]), row: parseInt(refMatch[2]) });
            continue;
        }

        stitchParts.push(trimmed);
    }

    // 部件合并引用
    if (joinRefs.length > 0) {
        let totalJoin = 0;
        const allSt = [];
        const refDescs = [];
        for (const ref of joinRefs) {
            const rp = partsMap[ref.part];
            if (rp) {
                const rr = rp.rows.find(r => r.rowNumber === ref.row);
                if (rr) { totalJoin += rr.endStitches; allSt.push(...(rr.stitches || [])); }
            }
            refDescs.push(`P${ref.part}R${ref.row}`);
        }
        const extra = parseStitchSegments(stitchParts, 0);
        allSt.push(...extra.stitches);
        totalJoin += extra.endStitches;
        return {
            stitches: allSt,
            description: `合并 ${refDescs.join(' + ')}${extra.stitches.length > 0 ? ' + ' + extra.description : ''}`,
            isRing: false, endStitches: totalJoin, startStitches: totalJoin,
            color, modifier: '', modifierName: '',
        };
    }

    const combined = stitchParts.join(', ');

    // 修饰符 BLO/FLO
    const modMatch = combined.match(/^(BLO|FLO)\((.+)\)$/i);
    let actual = combined;
    if (modMatch) {
        modifier = modMatch[1].toUpperCase();
        modifierName = MODIFIER_MAP[modifier] || modifier;
        actual = modMatch[2];
    }

    // 环起
    if (hasRing && stitchParts.length > 0) {
        const parsed = parseStitchSegments(stitchParts, 0);
        return {
            stitches: parsed.stitches,
            description: `环形起针, ${parsed.description}`,
            isRing: true, endStitches: parsed.endStitches, startStitches: parsed.endStitches,
            color, modifier, modifierName,
        };
    }
    if (hasRing && stitchParts.length === 0) {
        return {
            stitches: [], description: '环形起针',
            isRing: true, endStitches: 0, startStitches: 0,
            color, modifier: '', modifierName: '',
        };
    }

    // 常规解析
    const parsed = parseStitchSegments(
        stitchParts.length > 1 ? stitchParts : [actual], prevStitches
    );
    let desc = parsed.description;
    if (modifier) desc = `${modifierName}(${desc})`;

    return {
        stitches: parsed.stitches, description: desc,
        isRing: false, endStitches: parsed.endStitches,
        startStitches: prevStitches || parsed.endStitches,
        color, modifier, modifierName,
    };
}

// ===== 针法片段解析 =====
function parseStitchSegments(segments, prevStitches) {
    const allStitches = [];
    const allDescs = [];

    for (const seg of segments) {
        const t = seg.trim();
        if (!t) continue;
        const result = parseSingleSegment(t, prevStitches);
        allStitches.push(...result.stitches);
        allDescs.push(result.description);
    }

    const endStitches = allStitches.reduce((sum, s) => {
        const def = STITCH_MAP[s.type] || { count: 1 };
        return sum + def.count;
    }, 0);

    return { stitches: allStitches, description: allDescs.join(', '), endStitches };
}

/**
 * 解析单个片段: 6X, FV, 6(X, V), 6(3X, FV), [X, F, X], 环起6X
 */
function parseSingleSegment(instruction, prevStitches) {
    const stitches = [];

    // 1. 环起NX
    const ringMatch = instruction.match(/^环起(\d+)([A-Za-z]{1,3})?$/);
    if (ringMatch) {
        const count = parseInt(ringMatch[1]);
        const type = (ringMatch[2] || 'X').toUpperCase();
        const st = lookupStitch(type) || STITCH_MAP['X'];
        for (let i = 0; i < count; i++) stitches.push({ type, name: st.name });
        return { stitches, description: `环形起针${count}${st.name}`, endStitches: count * st.count };
    }

    // 2. 方括号: [X, F, X] (同一针目内多针)
    const bracketMatch = instruction.match(/^\[(.+)\]$/);
    if (bracketMatch) {
        const innerParts = bracketMatch[1].split(/[,，]\s*/);
        const groupNames = [];
        for (const part of innerParts) {
            const parsed = parseStitchToken(part.trim());
            if (parsed) {
                stitches.push(...parsed.stitches);
                groupNames.push(parsed.desc);
            }
        }
        const endStitches = stitches.reduce((sum, s) => (lookupStitch(s.type)?.count || 1) + sum, 0);
        return { stitches, description: `[ ${groupNames.join(', ')} ]`, endStitches };
    }

    // 3. 重复: 6(X, V), 6(3X, FV), 2(18X, A)
    const repeatMatch = instruction.match(/^(\d+)\((.+)\)$/);
    if (repeatMatch) {
        const repeatCount = parseInt(repeatMatch[1]);
        const innerStr = repeatMatch[2];
        const innerParts = innerStr.split(/[,，]\s*/);

        const groupStitches = [];
        const groupNames = [];

        for (const part of innerParts) {
            const parsed = parseStitchToken(part.trim());
            if (parsed) {
                groupStitches.push(...parsed.stitches);
                groupNames.push(parsed.desc);
            }
        }

        for (let r = 0; r < repeatCount; r++) {
            for (const s of groupStitches) stitches.push({ ...s });
        }

        const endStitches = stitches.reduce((sum, s) => (lookupStitch(s.type)?.count || 1) + sum, 0);
        return { stitches, description: `${repeatCount} × ( ${groupNames.join(', ')} )`, endStitches };
    }

    // 4. 单个 token: 48X, FV, 3TV, G, DTR, etc.
    const parsed = parseStitchToken(instruction);
    if (parsed) {
        return { stitches: parsed.stitches, description: parsed.desc, endStitches: parsed.stitches.reduce((s, st) => (lookupStitch(st.type)?.count || 1) + s, 0) };
    }

    // 5. 无法解析
    return { stitches: [], description: instruction, endStitches: prevStitches || 0 };
}

/**
 * 解析单个针法 token: "X", "6X", "FV", "3TV", "DTR", "G"
 * 支持: [数字][多字符针法代码]
 */
function parseStitchToken(token) {
    const t = token.trim().toUpperCase();
    if (!t) return null;

    // 尝试匹配: 可选数字 + 针法代码 (1-3 字母)
    // 优先匹配长代码: DTR(3), 然后 FV/TV/FQ/TG/NF/bpF(2), 最后 X/V/A(1)
    const match = t.match(/^(\d+)?([A-Z]{1,3})$/);
    if (!match) return null;

    const count = match[1] ? parseInt(match[1]) : 1;
    const code = match[2];

    // 查找针法: 优先 3 字母, 然后 2 字母, 最后 1 字母
    let st = null;
    let typeKey = '';

    if (code.length >= 3) {
        st = lookupStitch(code);
        if (st) typeKey = code;
    }
    if (!st && code.length >= 2) {
        st = lookupStitch(code);
        if (st) typeKey = code;
        // 如果 2 字母匹配不到, 尝试拆分: 第一个字母 + 第二个字母
        if (!st) {
            const first = lookupStitch(code.charAt(0));
            const second = lookupStitch(code.substring(1));
            // 这通常不是需要的, compound stitches 已在 STITCH_MAP 中
        }
    }
    if (!st && code.length === 1) {
        st = lookupStitch(code);
        if (st) typeKey = code;
    }

    if (!st) return null;

    const stitches = [];
    for (let i = 0; i < count; i++) {
        stitches.push({ type: typeKey, name: st.name });
    }

    const desc = count > 1 ? `${count}${st.name}` : st.name;
    return { stitches, desc };
}

// ===== 缝合指令 =====
function parseSewing(text) {
    const points = [];
    const parts = text.split(/[,，]\s*/);
    for (const part of parts) {
        const m = part.trim().match(/P(\d+)R(\d+)(?:S(\d+))?/i);
        if (m) {
            points.push({ part: parseInt(m[1]), row: parseInt(m[2]), stitch: m[3] ? parseInt(m[3]) : null });
        }
    }
    return { raw: text.trim(), points };
}

// ===== 针数重算 =====
function recalculateStitches(rows) {
    for (let i = 0; i < rows.length; i++) {
        if (i === 0) {
            if (rows[i].isRing) rows[i].startStitches = rows[i].endStitches;
        } else {
            rows[i].startStitches = rows[i - 1].endStitches;
            if (rows[i].endStitches === 0 && rows[i].stitches.length === 0) {
                rows[i].endStitches = rows[i].startStitches;
            }
        }
    }
}

// ===== 统计 =====
function calculateStats(parts) {
    let totalRounds = 0, totalStitches = 0;
    for (const part of parts) {
        totalRounds += part.rows.length;
        totalStitches += part.rows.reduce((sum, r) => sum + r.endStitches, 0);
    }
    const estimatedLengthCm = totalStitches * 2;
    const estimatedWeightG = Math.round((estimatedLengthCm / 100) * 0.83 * 100) / 100;
    return { totalParts: parts.length, totalRounds, totalStitches, estimatedLengthCm, estimatedWeightG };
}

function emptyResult() {
    return {
        title: '', author: '', parts: [], sewings: [],
        stats: { totalParts: 0, totalRounds: 0, totalStitches: 0, estimatedLengthCm: 0, estimatedWeightG: 0 }
    };
}

// ===== 示例花样 =====
export function getSamplePattern() {
    return `# 小熊玩偶
# @author 织嘛用户

R1: 卡其色, 环起, 6X
R2: 6V
R3: 6(X, V)
R4: 6(X, V, X)
R5: 6(3X, V)
R6: 6(2X, V, 2X)
R7: 6(5X, V)
R8: 6(3X, V, 3X)
R9-R16: 48X
R17: 6(3X, A, 3X)
R18: 6(5X, A)
R19: 6(2X, A, 2X)
R20: 6(3X, A)
R21: 6(X, A, X)
R22: 6(X, A)
R23: 6A

P1, P2:
R1: 环起6X
R2: 6V
R3: 6(X, V)
R4: 2(8X, V)
R5-R6: 20X

P3:
R7: P1R6, P2R6
R8: 40X
R9: 2(18X, A)
R10: 2(17X, A)
R11: 2(16X, A)
R12: 2(15X, A)
R13: 2(14X, A)
R14: 2(13X, A)
R15: 2(12X, A)
R16: 2(11X, A)
R17: 2(10X, A)
R18-R22: 22X
R23: 10A, 2X
R24: 6A

缝合: P3R24, P0R1

P4, P5:
R1: 环起6X
R2: 6V
R3-R8: 12X

缝合: P4R8, P1R2
缝合: P5R8, P2R2

P6, P7:
R1: 环起4X
R2: 4V
R3: 4(X, V)
R4: 4(X, V, X)
R5: 4(3X, V)
R6: 4(2X, V, 2X)

缝合: P6R6S2, P0R17S5
缝合: P7R6S6, P0R17S33`;
}

// ===== 针法颜色 (用于圆形图解渲染) =====
export function getStitchColor(type) {
    const colors = {
        'X': '#4A90D9', 'V': '#E74C3C', 'XV': '#E74C3C',
        'A': '#F39C12', 'XA': '#F39C12', 'M': '#E67E22', 'XM': '#E67E22',
        'T': '#9B59B6', 'TV': '#C0392B', 'TA': '#D35400', 'TW': '#C0392B',
        'F': '#2ECC71', 'FV': '#E74C3C', 'FA': '#F39C12', 'FW': '#27AE60',
        'E': '#1ABC9C', 'EV': '#E74C3C', 'EA': '#F39C12',
        'W': '#C0392B', 'XW': '#C0392B',
        'CH': '#95A5A6', 'SL': '#7F8C8D', 'SS': '#7F8C8D', 'S': '#7F8C8D',
        'K': '#BDC3C7',
        'NX': '#3498DB', 'NT': '#8E44AD', 'NF': '#27AE60', 'NE': '#16A085',
        'bpX': '#2980B9', 'bpT': '#7D3C98', 'bpF': '#1E8449', 'bpE': '#148F77',
        'Q': '#D4AC0D', 'TQ': '#D4AC0D', 'FQ': '#D4AC0D',
        'G': '#F1C40F', 'TG': '#F1C40F', 'FG': '#F1C40F',
        'DTR': '#17A589', 'TM': '#D35400', 'FM': '#D35400',
    };
    return colors[type] || '#333';
}

// ===== 术语参考 (来自 YarnLab terms.html) =====
export function getStitchReference() {
    return [
        {
            category: '基础针法', items: [
                { symbol: 'CH', cn: '锁针', en: 'Chain', note: '基础针法，起针常用' },
                { symbol: 'S / SL', cn: '引拔针', en: 'Slip Stitch', note: '连接、结束、移动位置' },
                { symbol: 'X', cn: '短针', en: 'Single Crochet (sc)', note: '最常用基础针法' },
                { symbol: 'T', cn: '中长针', en: 'Half Double Crochet (hdc)', note: '高度介于短针和长针之间' },
                { symbol: 'F', cn: '长针', en: 'Double Crochet (dc)', note: '较长的基础针法' },
                { symbol: 'E', cn: '长长针', en: 'Treble Crochet (tr)', note: '比长针更长' },
                { symbol: 'DTR', cn: '3卷长针', en: 'Double Treble', note: '绕线3圈的长针' },
            ]
        },
        {
            category: '加减针', items: [
                { symbol: 'V', cn: '加针(2)', en: 'Increase', note: '同一针里钩2针' },
                { symbol: 'W', cn: '加针(3)', en: '3-Increase', note: '同一针里钩3针' },
                { symbol: 'A', cn: '减针(2)', en: 'Decrease', note: '2针并1针' },
                { symbol: 'M', cn: '减针(3)', en: '3-Decrease', note: '3针并1针' },
                { symbol: 'TV / FV', cn: '复合加针', en: 'Compound Inc', note: 'T/F + 加针后缀V' },
                { symbol: 'TA / FA', cn: '复合减针', en: 'Compound Dec', note: 'T/F + 减针后缀A' },
            ]
        },
        {
            category: '特殊针法', items: [
                { symbol: 'K', cn: '跳过', en: 'Skip', note: '跳过一针不钩' },
                { symbol: 'NX / NF', cn: '前柱针(内钩)', en: 'Front Post', note: '从前面绕柱钩' },
                { symbol: 'bpX / bpF', cn: '后柱针(外钩)', en: 'Back Post', note: '从后面绕柱钩' },
                { symbol: 'Q / TQ / FQ', cn: '枣形针', en: 'Bobble', note: '多针合一的凸起效果' },
                { symbol: 'G / TG / FG', cn: '爆米花针', en: 'Popcorn', note: '类似枣形但更立体' },
            ]
        },
        {
            category: '修饰符', items: [
                { symbol: 'BLO(...)', cn: '只钩后半针', en: 'Back Loop Only', note: '只钩远离自己的半条线' },
                { symbol: 'FLO(...)', cn: '只钩前半针', en: 'Front Loop Only', note: '只钩靠近自己的半条线' },
                { symbol: '环起', cn: '环形起针', en: 'Magic Ring', note: '环形钩织的起始' },
            ]
        },
    ];
}

// ===== 语法参考 (来自 YarnLab symbols.html) =====
export function getSymbolSyntax() {
    return [
        { syntax: '6X', meaning: '重复6次短针', example: '在6个针目里各钩1个短针' },
        { syntax: 'X, V', meaning: '逗号分隔', example: '相邻针目依次入针' },
        { syntax: '6(X, V)', meaning: '重复组', example: '重复6组(1短针+1加针)' },
        { syntax: '[X, T, F]', meaning: '同一针入针', example: '同一个针目里钩多种针法' },
        { syntax: 'R1-R5: 6X', meaning: '行范围', example: 'R1到R5都重复6针短针' },
        { syntax: 'P1, P2:', meaning: '多部件定义', example: '同时定义两个相同部件' },
        { syntax: 'P1R6, P2R6', meaning: '部件合并', example: '合并引用其他部件的行' },
        { syntax: '缝合: P1R1, P2R6', meaning: '缝合指令', example: '将两个部件的行连接' },
    ];
}

// ===== 钩针规格对照表 (来自 YarnLab selectors.html) =====
export function getHookSizes() {
    return [
        { mm: 0.6, steel: '14', yarn: '蕾丝线' },
        { mm: 0.75, steel: '13', yarn: '蕾丝线' },
        { mm: 0.85, steel: '12', yarn: '蕾丝线' },
        { mm: 1.0, steel: '11', yarn: '蕾丝线' },
        { mm: 1.05, steel: '10', yarn: '蕾丝线' },
        { mm: 1.25, steel: '9', yarn: '蕾丝线' },
        { mm: 1.4, steel: '8', yarn: '蕾丝线' },
        { mm: 1.5, steel: '7', yarn: '蕾丝线' },
        { mm: 1.65, steel: '6', yarn: '蕾丝线' },
        { mm: 1.8, steel: '5', yarn: '蕾丝线' },
        { mm: 2.0, us: '-', yarn: '细线' },
        { mm: 2.25, us: 'B/1', yarn: '细线' },
        { mm: 2.75, us: 'C/2', yarn: '细线' },
        { mm: 3.0, us: '-', yarn: '中细线' },
        { mm: 3.25, us: 'D/3', yarn: '中细线' },
        { mm: 3.5, us: 'E/4', yarn: '中细线' },
        { mm: 3.75, us: 'F/5', yarn: '中细线' },
        { mm: 4.0, us: 'G/6', yarn: '中粗线' },
        { mm: 4.25, us: 'G/6', yarn: '中粗线' },
        { mm: 4.5, us: '7', yarn: '中粗线' },
        { mm: 5.0, us: 'H/8', yarn: '粗线' },
        { mm: 5.5, us: 'I/9', yarn: '粗线' },
        { mm: 6.0, us: 'J/10', yarn: '粗线' },
        { mm: 6.5, us: 'K/10½', yarn: '粗线' },
        { mm: 7.0, us: '-', yarn: '特粗线' },
        { mm: 8.0, us: 'L/11', yarn: '特粗线' },
        { mm: 9.0, us: 'M/13', yarn: '特粗线' },
        { mm: 10.0, us: 'N/15', yarn: '特粗线' },
    ];
}
