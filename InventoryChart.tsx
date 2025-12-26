
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { DailyAggregation, Category } from '../types';
import { CATEGORIES, CATEGORY_COLORS } from '../constants';

interface Props {
  data: any[];
  type?: 'bar' | 'area' | 'line' | 'horizontal-bar';
  dataKey?: string; // Used for horizontal bar chart to specify which field to plot
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-xl">
        <p className="text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm font-medium text-slate-600">{entry.name}</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const InventoryChart: React.FC<Props> = ({ data, type = 'bar' }) => {
  if (type === 'horizontal-bar') {
    return (
      <div className="w-full h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="category" 
              type="category" 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              width={120}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category as Category] || '#cbd5e1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'line' ? (
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold' }} />
            {CATEGORIES.map((cat) => (
              <Line 
                key={cat} 
                type="monotone" 
                dataKey={cat} 
                stroke={CATEGORY_COLORS[cat]} 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        ) : type === 'area' ? (
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <defs>
              {CATEGORIES.map(cat => (
                <linearGradient key={`grad-${cat}`} id={`color${cat.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CATEGORY_COLORS[cat]} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={CATEGORY_COLORS[cat]} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            {CATEGORIES.map((cat) => (
              <Area 
                key={cat} 
                type="monotone" 
                dataKey={cat} 
                stackId="1" 
                stroke={CATEGORY_COLORS[cat]} 
                fill={`url(#color${cat.replace(/\s/g, '')})`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        ) : (
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            {CATEGORIES.map((cat) => (
              <Bar 
                key={cat} 
                dataKey={cat} 
                stackId="a" 
                fill={CATEGORY_COLORS[cat]} 
                radius={[0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
