import React from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Rect, Line, Path, Circle, Text as SvgText, TSpan } from 'react-native-svg';
import { colors } from '../../../shared/theme';
import { shortDate, kfmt, sg } from '../utils/progressEngine';

const AX = colors.text.quaternary;
const GRID = colors.border.default;
const PLAN = colors.text.primary;
const EAT = colors.accent.primary;
const MAINT = colors.text.secondary;
const TARGET = colors.accent.amber;
const WEIGHT = colors.macro.protein;
const STRENGTH = colors.accent.cyan;
const BG = colors.background.secondary;

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

const drawn = vals => runs(vals).filter(r => r.length > 1).flatMap(r => r.map(i => vals[i]));

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
  const gut = 46;
  const pw = width - gut;
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
  const ts = tickStep(mx);
  const ticks = [];
  for (let t = ts; t < mx; t += ts) ticks.push(Math.round(t * 100) / 100);
  const shown = ticks.filter(t => py == null || Math.abs(y(t) - py) >= 14);

  const onPress = e => {
    if (!onSelect) return;
    const x = e.nativeEvent.locationX;
    if (x < 0 || x > pw) return;
    const i = Math.min(n - 1, Math.floor(x / (bw + gap)));
    if (slots[i].v == null) return;
    onSelect(i === sel ? null : i);
  };

  return (
    <Pressable onPress={onPress}>
      <View pointerEvents="none">
        <Svg width={width} height={H}>
          {shown.map(t => (
            <React.Fragment key={t}>
              <Line x1={0} x2={pw} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <SvgText x={width} y={y(t) + 3} fontSize={10} fill={AX} textAnchor="end">{tickText(t)}</SvgText>
            </React.Fragment>
          ))}
          <Line x1={0} x2={pw} y1={base} y2={base} stroke={GRID} strokeWidth={1} />
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
                    x={i === 0 ? x : x + bw / 2}
                    y={H - 6}
                    fontSize={10}
                    fill={hot ? EAT : AX}
                    textAnchor={i === 0 ? 'start' : 'middle'}
                  >
                    {shortDate(s.monday)}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}
          {plan != null && (
            <>
              <Line x1={0} x2={pw} y1={py} y2={py} stroke={PLAN} strokeOpacity={0.75} strokeWidth={1.5} strokeDasharray="4 4" />
              <SvgText x={width} y={py + 3} fontSize={10} textAnchor="end">
                <TSpan fill={AX}>plan </TSpan>
                <TSpan fontWeight="700" fill={PLAN}>{plan.toFixed(1)}</TSpan>
              </SvgText>
            </>
          )}
        </Svg>
      </View>
    </Pressable>
  );
};

export const EnergyChart = ({ eat, maint, target, slots, width }) => {
  const n = eat.length;
  const H = 172;
  const top = 12;
  const bot = 24;
  const gut = 40;
  const pw = width - gut;
  const li = lastIdx(eat);
  const all = [...drawn(eat), ...drawn(maint), li >= 0 ? eat[li] : null, target].filter(v => v != null);
  const lo = Math.floor((Math.min(...all) - 100) / 200) * 200;
  const hi = Math.ceil((Math.max(...all) + 100) / 200) * 200;
  const mid = (lo + hi) / 2;
  const y = v => top + (H - top - bot) * (1 - (v - lo) / (hi - lo));
  const x = i => 2 + (pw - 2) * (n === 1 ? 0 : i / (n - 1));
  const both = eat.map((v, i) => (v != null && maint[i] != null ? v : null));
  const labels = xLabels(n, slots.map(s => s.monday), H - 6, 'e');
  const ty = target != null ? y(target) : null;
  const grid = [lo, mid, hi].filter(g => g !== mid || ty == null || Math.abs(y(g) - ty) > 12);

  return (
    <Svg width={width} height={H}>
      {grid.map(g => (
        <React.Fragment key={g}>
          <Line x1={0} x2={pw} y1={y(g)} y2={y(g)} stroke={GRID} strokeWidth={1} />
          <SvgText x={width} y={y(g) + 3} fontSize={10} fill={AX} textAnchor="end">{kfmt(g)}</SvgText>
        </React.Fragment>
      ))}
      {runs(both).map((r, k) => {
        if (r.length < 2) return null;
        const up = r.map(i => `${x(i).toFixed(1)} ${y(maint[i]).toFixed(1)}`);
        const dn = [...r].reverse().map(i => `${x(i).toFixed(1)} ${y(eat[i]).toFixed(1)}`);
        return <Path key={k} d={`M${up.join(' L')} L${dn.join(' L')} Z`} fill={colors.accent.success} fillOpacity={0.14} />;
      })}
      {target != null && (
        <Line x1={0} x2={pw} y1={y(target)} y2={y(target)} stroke={TARGET} strokeOpacity={0.85} strokeWidth={1.5} strokeDasharray="2 4" />
      )}
      {runs(maint).map((r, k) => r.length > 1 && (
        <Path key={k} d={line(r, x, y, maint)} stroke={MAINT} strokeWidth={2} strokeDasharray="5 4" fill="none" />
      ))}
      {runs(eat).map((r, k) => r.length > 1 && (
        <Path key={k} d={line(r, x, y, eat)} stroke={EAT} strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" fill="none" />
      ))}
      {li >= 0 && <Circle cx={x(li)} cy={y(eat[li])} r={4.5} fill={EAT} stroke={BG} strokeWidth={2} />}
      {labels.map(l => (
        <SvgText key={l.key} x={x(l.i)} y={l.y} fontSize={10} fill={l.hot ? EAT : AX} textAnchor={l.anchor}>{l.text}</SvgText>
      ))}
    </Svg>
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
