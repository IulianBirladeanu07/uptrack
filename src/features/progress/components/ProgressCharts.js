import React from 'react';
import { Pressable, View } from 'react-native';
import Svg, { G, Rect, Line, Path, Circle, Text as SvgText } from 'react-native-svg';
import { colors } from '../../../shared/theme';
import { shortDate, kfmt, sg } from '../utils/progressEngine';

const AX = colors.text.quaternary;
const GRID = colors.border.default;
const PLAN = colors.text.primary;
const EAT = colors.accent.primary;
const TARGET = colors.accent.amber;
const WEIGHT = colors.macro.protein;
const STRENGTH = colors.accent.cyan;
const BG = colors.background.secondary;
const DAY_MS = 24 * 60 * 60 * 1000;
const BREAK = 10;
const LP = 10;

const runs = vals => {
  const out = [];
  let cur = [];
  vals.forEach((v, i) => {
    if (v == null) {
      if (cur.length) out.push(cur);
      cur = [];
    } else cur.push(i);
  });
  if (cur.length) out.push(cur);
  return out;
};

const line = (idx, xf, yf, vals) =>
  idx.map((i, k) => `${k ? 'L' : 'M'}${xf(i).toFixed(1)} ${yf(vals[i]).toFixed(1)}`).join(' ');

const lastIdx = vals => {
  for (let i = vals.length - 1; i >= 0; i--) if (vals[i] != null) return i;
  return -1;
};

const xLabels = (n, mondays, y, key) => {
  const at = [0, Math.round((n - 1) / 2), n - 1];
  return at.map((i, k) => ({
    key: `${key}${k}`,
    i,
    y,
    anchor: k === 0 ? 'start' : k === 2 ? 'end' : 'middle',
    text: shortDate(mondays[i]),
    hot: k === 2,
  }));
};

const tickStep = mx => (mx <= 1.2 ? 0.25 : mx <= 3 ? 0.5 : 1);

const tickText = t => (Number.isInteger(t) ? t.toFixed(1) : String(t));

export const PaceChart = ({ slots, plan, width, sel = null, onSelect }) => {
  const n = slots.length;
  const H = 176;
  const top = 18;
  const bot = 24;
  const gut = 52;
  const pw = width - gut - LP;
  const gap = n > 12 ? 3 : 5;
  const bw = (pw - gap * (n - 1)) / n;
  const base = H - bot;
  const vals = slots.map(s => s.v).filter(v => v != null);
  const mx = Math.max(...vals, plan || 0, 0.1) * 1.08;
  const y = v => top + (base - top) * (1 - v / mx);
  const step = n <= 8 ? 2 : n <= 12 ? 3 : 4;
  const li = lastIdx(slots.map(s => s.v));
  const active = sel != null && slots[sel]?.v != null ? sel : li;
  const py = plan != null ? y(plan) : null;
  const trend = slots.map((s, i) => (s.avg != null ? [i * (bw + gap) + bw / 2, y(s.avg)] : null)).filter(Boolean);
  const ts = tickStep(mx);
  const ticks = [];
  for (let t = ts; t < mx; t += ts) ticks.push(Math.round(t * 100) / 100);
  const shown = ticks.filter(t => py == null || Math.abs(y(t) - py) >= 26);

  const onPress = e => {
    if (!onSelect) return;
    const x = e.nativeEvent.locationX - LP;
    if (x < 0 || x > pw) return;
    const i = Math.min(n - 1, Math.floor(x / (bw + gap)));
    if (slots[i].v == null) return;
    onSelect(i === sel ? null : i);
  };

  return (
    <Pressable onPress={onPress}>
      <View pointerEvents="none">
        <Svg width={width} height={H}>
          <G transform={`translate(${LP} 0)`}>
          {shown.map(t => (
            <React.Fragment key={t}>
              <Line x1={-LP} x2={pw} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <SvgText x={width - LP} y={y(t) + 3} fontSize={10} fill={AX} textAnchor="end">{tickText(t)}</SvgText>
            </React.Fragment>
          ))}
          <Line x1={-LP} x2={pw} y1={base} y2={base} stroke={GRID} strokeWidth={1} />
          {slots.map((s, i) => {
            const x = i * (bw + gap);
            const hot = i === active;
            const showLabel = (n - 1 - i) % step === 0;
            return (
              <React.Fragment key={i}>
                {s.v != null && (
                  <>
                    <Rect
                      x={x}
                      y={y(s.v)}
                      width={bw}
                      height={Math.max(base - y(s.v), 2)}
                      rx={3}
                      fill={EAT}
                      fillOpacity={hot ? 1 : 0.5}
                    />
                    {hot && (
                      <SvgText
                        x={x + bw / 2}
                        y={y(s.v) - 5}
                        fontSize={10}
                        fontWeight="600"
                        fill={hot ? EAT : AX}
                        textAnchor="middle"
                      >
                        {s.v.toFixed(1)}
                      </SvgText>
                    )}
                  </>
                )}
                {showLabel && (
                  <SvgText
                    x={x + bw / 2}
                    y={H - 6}
                    fontSize={10}
                    fill={hot ? EAT : AX}
                    textAnchor="middle"
                  >
                    {shortDate(s.monday)}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}
          {trend.length > 1 && (
            <Path d={trend.map((p, k) => `${k ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')} stroke={PLAN} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" fill="none" />
          )}
          {trend.length > 1 && <Circle cx={trend[trend.length - 1][0]} cy={trend[trend.length - 1][1]} r={3.5} fill={PLAN} stroke={BG} strokeWidth={1.5} />}
          {plan != null && (
            <>
              <Line x1={-LP} x2={pw} y1={py} y2={py} stroke={PLAN} strokeOpacity={0.75} strokeWidth={1.5} strokeDasharray="4 4" />
              <SvgText x={width - LP} y={py - 3} fontSize={10} fill={AX} textAnchor="end">plan</SvgText>
              <SvgText x={width - LP} y={py + 10} fontSize={10} fontWeight="700" fill={PLAN} textAnchor="end">{plan.toFixed(1)}</SvgText>
            </>
          )}
          </G>
        </Svg>
      </View>
    </Pressable>
  );
};

export const BalanceChart = ({ bal, target, slots, width, sel = null, onSelect }) => {
  const n = bal.length;
  const H = 176;
  const top = 18;
  const bot = 24;
  const gut = 52;
  const pw = width - gut - LP;
  const gap = n > 12 ? 3 : 5;
  const brk = slots.map((s, i) => i > 0 && Math.round((s.monday - slots[i - 1].monday) / DAY_MS) > 8);
  const nb = brk.filter(Boolean).length;
  const lab = new Set();
  for (let k = n - 1; k >= 0; k -= n <= 8 ? 2 : n <= 12 ? 3 : 4) lab.add(k);
  brk.forEach((on, k) => {
    if (on || k === 0) {
      lab.add(k);
      if (k + 1 < n && !brk[k + 1]) lab.delete(k + 1);
    }
  });
  const bw = Math.min(36, (pw - gap * (n - 1) - BREAK * nb) / n);
  let acc = 0;
  const xs = bal.map((_, i) => {
    if (i > 0) acc += gap + (brk[i] ? BREAK : 0);
    const x = acc;
    acc += bw;
    return x;
  });
  const base = H - bot;
  const vals = bal.filter(v => v != null);
  const lo = Math.min(0, ...vals, target ?? 0);
  const hi = Math.max(0, ...vals, target ?? 0);
  const pad = Math.max(hi - lo, 200) * 0.1;
  const y = v => top + (base - top) * (1 - (v - (lo - pad)) / (hi - lo + 2 * pad));
  const y0 = y(0);
  const li = lastIdx(bal);
  const active = sel != null && bal[sel] != null ? sel : li;
  const ty = target != null ? y(target) : null;

  const onPress = e => {
    if (!onSelect) return;
    const x = e.nativeEvent.locationX - LP;
    if (x < 0 || x > pw) return;
    let i = 0;
    xs.forEach((bx, k) => {
      if (x >= bx - gap / 2) i = k;
    });
    if (bal[i] == null) return;
    onSelect(i === sel ? null : i);
  };

  return (
    <Pressable onPress={onPress}>
      <View pointerEvents="none">
        <Svg width={width} height={H}>
          <G transform={`translate(${LP} 0)`}>
          <Line x1={-LP} x2={pw} y1={y0} y2={y0} stroke={GRID} strokeWidth={1} />
          {(ty == null || Math.abs(ty - y0) >= 26) && (
            <SvgText x={width - LP} y={y0 + 3} fontSize={10} fill={AX} textAnchor="end">maint</SvgText>
          )}
          {brk.map((on, i) =>
            on ? (
              <Line
                key={`b${i}`}
                x1={xs[i] - (gap + BREAK) / 2}
                x2={xs[i] - (gap + BREAK) / 2}
                y1={top}
                y2={base}
                stroke={GRID}
                strokeWidth={1}
                strokeDasharray="2 3"
              />
            ) : null,
          )}
          {bal.map((v, i) => {
            const x = xs[i];
            const hot = i === active;
            const showLabel = lab.has(i);
            return (
              <React.Fragment key={i}>
                {v != null && (
                  <>
                    <Rect
                      x={x}
                      y={v < 0 ? y0 : y(v)}
                      width={bw}
                      height={Math.max(Math.abs(y(v) - y0), 2)}
                      rx={3}
                      fill={EAT}
                      fillOpacity={hot ? 1 : 0.5}
                    />
                    {hot && (
                      <SvgText
                        x={x + bw / 2}
                        y={v < 0 ? y(v) + 12 : y(v) - 5}
                        fontSize={10}
                        fontWeight="600"
                        fill={EAT}
                        textAnchor="middle"
                      >
                        {kfmt(v)}
                      </SvgText>
                    )}
                  </>
                )}
                {showLabel && (
                  <SvgText
                    x={x + bw / 2}
                    y={H - 6}
                    fontSize={10}
                    fill={hot ? EAT : AX}
                    textAnchor="middle"
                  >
                    {shortDate(slots[i].monday)}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}
          {ty != null && (
            <>
              <Line x1={-LP} x2={pw} y1={ty} y2={ty} stroke={TARGET} strokeOpacity={0.85} strokeWidth={1.5} strokeDasharray="4 4" />
              <SvgText x={width - LP} y={ty - 3} fontSize={10} fill={AX} textAnchor="end">target</SvgText>
              <SvgText x={width - LP} y={ty + 10} fontSize={10} fontWeight="700" fill={TARGET} textAnchor="end">{kfmt(target)}</SvgText>
            </>
          )}
          </G>
        </Svg>
      </View>
    </Pressable>
  );
};

export const StrengthChart = ({ strength, weight, slots, width }) => {
  const n = strength.length;
  const H = 176;
  const top = 8;
  const bot = 24;
  const gut = 54;
  const pw = width - gut;
  const all = [...strength, ...weight, 0].filter(v => v != null);
  const lo = Math.floor(Math.min(...all) - 1);
  const hi = Math.ceil(Math.max(...all) + 1);
  const y = v => top + (H - top - bot) * (1 - (v - lo) / (hi - lo));
  const x = i => 2 + (pw - 2) * (n === 1 ? 0 : i / (n - 1));
  const si = lastIdx(strength);
  const wi = lastIdx(weight);
  let ys = si >= 0 ? y(strength[si]) : 0;
  let yw = wi >= 0 ? y(weight[wi]) : 0;
  if (si >= 0 && wi >= 0 && Math.abs(ys - yw) < 14) {
    const m = (ys + yw) / 2;
    if (ys < yw) {
      ys = m - 7;
      yw = m + 7;
    } else {
      ys = m + 7;
      yw = m - 7;
    }
  }
  const labels = xLabels(n, slots.map(s => s.monday), H - 6, 's');

  return (
    <Svg width={width} height={H}>
      <Line x1={0} x2={pw} y1={y(0)} y2={y(0)} stroke={PLAN} strokeOpacity={0.5} strokeWidth={1} strokeDasharray="4 4" />
      <SvgText x={pw + 8} y={y(0) + 3} fontSize={10} fill={AX}>start</SvgText>
      {runs(weight).map((r, k) => r.length > 1 && (
        <Path key={k} d={line(r, x, y, weight)} stroke={WEIGHT} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" fill="none" />
      ))}
      {runs(strength).map((r, k) => r.length > 1 && (
        <Path key={k} d={line(r, x, y, strength)} stroke={STRENGTH} strokeWidth={2.8} strokeLinejoin="round" strokeLinecap="round" fill="none" />
      ))}
      {wi >= 0 && <Circle cx={x(wi)} cy={y(weight[wi])} r={4.5} fill={WEIGHT} stroke={BG} strokeWidth={2} />}
      {si >= 0 && <Circle cx={x(si)} cy={y(strength[si])} r={4.5} fill={STRENGTH} stroke={BG} strokeWidth={2} />}
      {si >= 0 && <SvgText x={pw + 8} y={ys + 4} fontSize={12} fontWeight="700" fill={STRENGTH}>{`${sg(strength[si], 1)}%`}</SvgText>}
      {wi >= 0 && <SvgText x={pw + 8} y={yw + 4} fontSize={12} fontWeight="700" fill={WEIGHT}>{`${sg(weight[wi], 1)}%`}</SvgText>}
      {labels.map(l => (
        <SvgText key={l.key} x={x(l.i)} y={l.y} fontSize={10} fill={l.hot ? EAT : AX} textAnchor={l.anchor}>{l.text}</SvgText>
      ))}
    </Svg>
  );
};