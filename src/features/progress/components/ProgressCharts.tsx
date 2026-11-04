import React from 'react';
import { Pressable, View } from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import Svg, { G, Rect, Line, Path, Circle, Text as SvgText } from 'react-native-svg';
import { colors } from '../../../shared/theme';
import { shortDate, kfmt, sg } from '../utils/progressEngine';
import type { EnergyModel, PaceModel, StrengthModel } from '../utils/progressEngine';

const AX = colors.text.tertiary;
const GRID = colors.border.default;
const PLAN = colors.text.primary;
const EAT = colors.accent.primary;
const PACE = colors.accent.primary;
const WEIGHT = colors.macro.protein;
const STRENGTH = colors.accent.cyan;
const BG = colors.background.secondary;
const DAY_MS = 24 * 60 * 60 * 1000;
const BREAK = 10;
const LP = 10;

type Vals = (number | null)[];

type XLabel = {
  key: string;
  i: number;
  y: number;
  anchor: 'start' | 'middle' | 'end';
  text: string;
  hot: boolean;
};

const runs = (vals: Vals) => {
  const out: number[][] = [];
  let cur: number[] = [];
  vals.forEach((v, i) => {
    if (v == null) {
      if (cur.length) out.push(cur);
      cur = [];
    } else cur.push(i);
  });
  if (cur.length) out.push(cur);
  return out;
};

const line = (idx: number[], xf: (i: number) => number, yf: (v: number) => number, vals: Vals) =>
  idx.map((i, k) => `${k ? 'L' : 'M'}${xf(i).toFixed(1)} ${yf(vals[i] as number).toFixed(1)}`).join(' ');

const lastIdx = (vals: Vals) => {
  for (let i = vals.length - 1; i >= 0; i--) if (vals[i] != null) return i;
  return -1;
};

const xLabels = (n: number, mondays: Date[], y: number, key: string) => {
  const at = [0, Math.round((n - 1) / 2), n - 1];
  return at.map((i, k): XLabel => ({
    key: `${key}${k}`,
    i,
    y,
    anchor: k === 0 ? 'start' : k === 2 ? 'end' : 'middle',
    text: shortDate(mondays[i]),
    hot: k === 2,
  }));
};

const tickStep = (mx: number) => (mx <= 1.2 ? 0.25 : mx <= 3 ? 0.5 : 1);

const tickText = (t: number) => (Number.isInteger(t) ? t.toFixed(1) : String(t));

type PaceChartProps = {
  slots: PaceModel['slots'];
  plan: number | null;
  width: number;
  sel?: number | null;
  onSelect?: (i: number | null) => void;
};

export const PaceChart = ({ slots, plan, width, sel = null, onSelect }: PaceChartProps) => {
  const n = slots.length;
  const H = 160;
  const top = 12;
  const bot = 22;
  const gut = 52;
  const pw = width - gut - LP;
  const gap = n > 12 ? 3 : 5;
  const bw = (pw - gap * (n - 1)) / n;
  const base = H - bot;
  const vals = slots.map(s => s.v).filter((v): v is number => v != null);
  const lo = Math.min(0, ...vals);
  const hi = Math.max(0, ...vals, plan ?? 0);
  const hasNegativeRate = vals.some(v => v < 0);
  const pad = hasNegativeRate ? Math.max((hi - lo) * 0.1, 0.1) : 0;
  const chartLo = hasNegativeRate ? lo - pad : 0;
  const chartHi = hasNegativeRate ? hi + pad : Math.max(...vals, plan ?? 0, 0.1) * 1.1;
  const y = (v: number) => top + (base - top) * ((chartHi - v) / (chartHi - chartLo));
  const zeroY = y(0);
  const step = n <= 8 ? 2 : n <= 12 ? 3 : 4;
  const li = lastIdx(slots.map(s => s.v));
  const active = sel != null && slots[sel]?.v != null ? sel : li;
  const py = plan != null ? y(plan) : null;
  const trend = n >= 12 ? slots.map((s, i) => (s.avg != null ? [i * (bw + gap) + bw / 2, y(s.avg)] : null)).filter((pt): pt is number[] => pt != null) : [];
  const ts = tickStep(Math.max(Math.abs(lo), Math.abs(hi)));
  const ticks: number[] = [];
  for (let t = Math.ceil(chartLo / ts) * ts; t <= chartHi; t += ts) {
    if (Math.abs(t) > 0.001) ticks.push(Math.round(t * 100) / 100);
  }
  const shown = ticks.filter(t => py == null || Math.abs(y(t) - py) >= 26);
  const activeValue = active >= 0 ? slots[active]?.v : null;
  const activeLabel = activeValue != null
    ? {
        x: active * (bw + gap) + bw / 2,
        y: activeValue >= 0
          ? Math.max(y(activeValue) - 8, top + 10)
          : Math.min(y(activeValue) + 14, H - 4),
        text: activeValue.toFixed(1),
      }
    : null;

  const onPress = (e: GestureResponderEvent) => {
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
          <Line x1={-LP} x2={pw} y1={zeroY} y2={zeroY} stroke={GRID} strokeWidth={1} />
          {slots.map((s, i) => {
            const x = i * (bw + gap);
            const hot = i === active;
            const showLabel = (n - 1 - i) % step === 0;
            const valueY = s.v == null ? zeroY : y(s.v);
            return (
              <React.Fragment key={i}>
                {s.v != null && (
                    <Rect
                      x={x}
                      y={Math.min(valueY, zeroY)}
                      width={bw}
                      height={Math.max(Math.abs(zeroY - valueY), 2)}
                      rx={3}
                      fill={PACE}
                      fillOpacity={hot ? 1 : s.cur ? 0.24 : 0.5}
                    />
                )}
                {showLabel && (
                  <SvgText
                    x={x + bw / 2}
                    y={H - 6}
                    fontSize={10}
                    fill={hot ? PACE : AX}
                    textAnchor="middle"
                  >
                    {shortDate(s.monday)}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}
          {trend.length > 1 && (
            <Path d={trend.map((p, k) => `${k ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')} stroke={PLAN} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" fill="none" />
          )}
          {trend.length > 1 && <Circle cx={trend[trend.length - 1][0]} cy={trend[trend.length - 1][1]} r={3.5} fill={PLAN} stroke={BG} strokeWidth={1.5} />}
          {activeLabel && (
            <SvgText x={activeLabel.x} y={activeLabel.y} fontSize={10} fontWeight="600" fill={PACE} textAnchor="middle">
              {activeLabel.text}
            </SvgText>
          )}
          {plan != null && py != null && (
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

export type WeightTrendPoint = { monday: Date; average: number };

export const WeightTrendChart = ({ points, width }: { points: WeightTrendPoint[]; width: number }) => {
  const H = 116;
  const left = 4;
  const right = 54;
  const top = 14;
  const bottom = 26;
  const plotWidth = width - left - right;
  const values = points.map(point => point.average);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * 0.35, 0.3);
  const low = min - pad;
  const high = max + pad;
  const firstTime = points[0].monday.getTime();
  const lastTime = points[points.length - 1].monday.getTime();
  const span = Math.max(lastTime - firstTime, DAY_MS);
  const x = (point: WeightTrendPoint) => left + ((point.monday.getTime() - firstTime) / span) * plotWidth;
  const y = (value: number) => top + ((high - value) / (high - low)) * (H - top - bottom);
  const segments: WeightTrendPoint[][] = [];
  points.forEach(point => {
    const current = segments[segments.length - 1];
    if (!current || point.monday.getTime() - current[current.length - 1].monday.getTime() > DAY_MS * 8) {
      segments.push([point]);
    } else {
      current.push(point);
    }
  });
  const paths = segments.filter(segment => segment.length > 1).map(segment => {
    const linePath = segment.map((point, index) =>
      `${index === 0 ? 'M' : 'L'}${x(point).toFixed(1)} ${y(point.average).toFixed(1)}`,
    ).join(' ');
    const areaPath = `${linePath} L${x(segment[segment.length - 1]).toFixed(1)} ${H - bottom} L${x(segment[0]).toFixed(1)} ${H - bottom} Z`;
    return { linePath, areaPath };
  });

  return (
    <View pointerEvents="none">
      <Svg width={width} height={H}>
        {[0, 0.5, 1].map(fraction => {
          const lineY = top + fraction * (H - top - bottom);
          return <Line key={fraction} x1={left} x2={left + plotWidth} y1={lineY} y2={lineY} stroke={GRID} strokeWidth={1} />;
        })}
        {paths.map(({ areaPath }, index) => (
          <Path key={`area-${index}`} d={areaPath} fill={EAT} fillOpacity={0.07} />
        ))}
        {paths.map(({ linePath }, index) => (
          <Path key={`line-${index}`} d={linePath} stroke={EAT} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" fill="none" />
        ))}
        {points.map((point, index) => (
          <React.Fragment key={point.monday.getTime()}>
            <Circle cx={x(point)} cy={y(point.average)} r={index === points.length - 1 ? 5 : 4} fill={EAT} stroke={BG} strokeWidth={2} />
            {(index === 0 || index === points.length - 1) && (
              <SvgText
                x={x(point)}
                y={H - 7}
                fontSize={10}
                fill={index === points.length - 1 ? EAT : AX}
                textAnchor={index === 0 ? 'start' : 'end'}
              >
                {shortDate(point.monday)}
              </SvgText>
            )}
            <SvgText
              x={x(point)}
              y={y(point.average) - 9}
              fontSize={11}
              fontWeight="700"
              fill={EAT}
              textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
            >
              {point.average.toFixed(1)}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
};

type BalanceChartProps = {
  bal: Vals;
  target: number | null;
  slots: EnergyModel['slots'];
  width: number;
  sel?: number | null;
  onSelect?: (i: number | null) => void;
};

export const BalanceChart = ({ bal, target, slots, width, sel = null, onSelect }: BalanceChartProps) => {
  const n = bal.length;
  const H = 176;
  const top = 18;
  const bot = 24;
  const gut = 52;
  const pw = width - gut - LP;
  const gap = n > 12 ? 3 : 5;
  const brk = slots.map((s, i) => i > 0 && Math.round((s.monday.getTime() - slots[i - 1].monday.getTime()) / DAY_MS) > 8);
  const nb = brk.filter(Boolean).length;
  const lab = new Set<number>();
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
  const vals = bal.filter((v): v is number => v != null);
  const lo = Math.min(0, ...vals, target ?? 0);
  const hi = Math.max(0, ...vals, target ?? 0);
  const pad = Math.max(hi - lo, 200) * 0.1;
  const y = (v: number) => top + (base - top) * (1 - (v - (lo - pad)) / (hi - lo + 2 * pad));
  const y0 = y(0);
  const li = lastIdx(bal);
  const active = sel != null && bal[sel] != null ? sel : li;
  const ty = target != null ? y(target) : null;

  const onPress = (e: GestureResponderEvent) => {
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
              <Line x1={-LP} x2={pw} y1={ty} y2={ty} stroke={PLAN} strokeOpacity={0.75} strokeWidth={1.5} strokeDasharray="4 4" />
              <SvgText x={width - LP} y={ty - 3} fontSize={10} fill={AX} textAnchor="end">target</SvgText>
              <SvgText x={width - LP} y={ty + 10} fontSize={10} fontWeight="700" fill={PLAN} textAnchor="end">{kfmt(target)}</SvgText>
            </>
          )}
          </G>
        </Svg>
      </View>
    </Pressable>
  );
};

type StrengthChartProps = {
  strength: Vals;
  weight: Vals;
  slots: StrengthModel['slots'];
  width: number;
};

export const StrengthChart = ({ strength, weight, slots, width }: StrengthChartProps) => {
  const n = strength.length;
  const H = 176;
  const top = 8;
  const bot = 24;
  const gut = 54;
  const pw = width - gut;
  const all = [...strength, ...weight, 0].filter((v): v is number => v != null);
  const lo = Math.floor(Math.min(...all) - 1);
  const hi = Math.ceil(Math.max(...all) + 1);
  const y = (v: number) => top + (H - top - bot) * (1 - (v - lo) / (hi - lo));
  const x = (i: number) => 2 + (pw - 2) * (n === 1 ? 0 : i / (n - 1));
  const si = lastIdx(strength);
  const wi = lastIdx(weight);
  const sv = strength[si] as number;
  const wv = weight[wi] as number;
  let ys = si >= 0 ? y(sv) : 0;
  let yw = wi >= 0 ? y(wv) : 0;
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
      {wi >= 0 && <Circle cx={x(wi)} cy={y(wv)} r={4.5} fill={WEIGHT} stroke={BG} strokeWidth={2} />}
      {si >= 0 && <Circle cx={x(si)} cy={y(sv)} r={4.5} fill={STRENGTH} stroke={BG} strokeWidth={2} />}
      {si >= 0 && <SvgText x={pw + 8} y={ys + 4} fontSize={12} fontWeight="700" fill={STRENGTH}>{`${sg(sv, 1)}%`}</SvgText>}
      {wi >= 0 && <SvgText x={pw + 8} y={yw + 4} fontSize={12} fontWeight="700" fill={WEIGHT}>{`${sg(wv, 1)}%`}</SvgText>}
      {labels.map(l => (
        <SvgText key={l.key} x={x(l.i)} y={l.y} fontSize={10} fill={l.hot ? EAT : AX} textAnchor={l.anchor}>{l.text}</SvgText>
      ))}
    </Svg>
  );
};