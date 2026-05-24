import { useState } from "react";
import { Calculator, Sparkles, RefreshCw, Compass } from "lucide-react";

interface FormulaConfig {
  id: string;
  name: string;
  expression: string;
  description: string;
  variables: { symbol: string; name: string; unit: string; placeholder: string }[];
  calculate: (inputs: { [key: string]: number }) => { steps: string[]; value: number; unit: string };
}

const FORMULAS_PRESETS: FormulaConfig[] = [
  {
    id: "speed",
    name: "速度与运动公式 (v = s/t)",
    expression: "v = s / t",
    description: "描述物体运动快慢的物理量。路程除以时间即为速度。",
    variables: [
      { symbol: "s", name: "路程 (Distance)", unit: "米 (m)", placeholder: "例如: 100" },
      { symbol: "t", name: "时间 (Time)", unit: "秒 (s)", placeholder: "例如: 10" },
    ],
    calculate: (inputs) => {
      const s = inputs["s"] || 0;
      const t = inputs["t"] || 1;
      const val = s / t;
      return {
        steps: [
          `1. 根据速度公式：速度(v) = 路程(s) ÷ 时间(t)`,
          `2. 代入数值：v = ${s} m ÷ ${t} s`,
          `3. 计算得出速度的值。`,
        ],
        value: parseFloat(val.toFixed(2)),
        unit: "m/s (米每秒)",
      };
    },
  },
  {
    id: "density",
    name: "物质密度公式 (ρ = m/V)",
    expression: "ρ = m / V",
    description: "表示单位体积某种物质的质量，是物质的一种特性。",
    variables: [
      { symbol: "m", name: "质量 (Mass)", unit: "克 (g) 或 千克 (kg)", placeholder: "例如: 270" },
      { symbol: "V", name: "体积 (Volume)", unit: "厘米³ (cm³) 或 物理立方米 (m³)", placeholder: "例如: 100" },
    ],
    calculate: (inputs) => {
      const m = inputs["m"] || 0;
      const V = inputs["V"] || 1;
      const val = m / V;
      return {
        steps: [
          `1. 根据密度公式：密度(ρ) = 质量(m) ÷ 体积(V)`,
          `2. 代入数值：ρ = ${m} g ÷ ${V} cm³`,
          `3. 计算得出密度，若容器中是水（常温常压），密度常为 1.0 g/cm³。`,
        ],
        value: parseFloat(val.toFixed(2)),
        unit: "g/cm³ (克每立方厘米)",
      };
    },
  },
  {
    id: "gravity",
    name: "重力与质量公式 (G = mg)",
    expression: "G = m · g",
    description: "地球附近的物体由于地球的吸引而受到的力。常数g在地球表面约取9.8 N/kg。",
    variables: [
      { symbol: "m", name: "质量 (Mass)", unit: "千克 (kg)", placeholder: "例如: 50" },
      { symbol: "g", name: "重力加速度系数", unit: "牛/千克 (N/kg)", placeholder: "9.8" },
    ],
    calculate: (inputs) => {
      const m = inputs["m"] || 0;
      const g = inputs["g"] || 9.8;
      const val = m * g;
      return {
        steps: [
          `1. 根据重力公式：G = 质量(m) × 重力加速度常数(g)`,
          `2. 代入已知数：G = ${m} kg × ${g} N/kg`,
          `3. 计算得到地球对该物体的引力（重力）。`,
        ],
        value: parseFloat(val.toFixed(2)),
        unit: "N (牛顿)",
      };
    },
  },
  {
    id: "pressure",
    name: "固体压强公式 (p = F/S)",
    expression: "p = F / S",
    description: "物体所受压力的大小与受力面积之比，反映压力的作用效果。",
    variables: [
      { symbol: "F", name: "垂直压力 (Force)", unit: "牛顿 (N)", placeholder: "例如: 200" },
      { symbol: "S", name: "受力面积 (Area)", unit: "平方米 (m²)", placeholder: "例如: 0.5" },
    ],
    calculate: (inputs) => {
      const F = inputs["F"] || 0;
      const S = inputs["S"] || 1;
      const val = F / S;
      return {
        steps: [
          `1. 根据固体压强：帕斯卡压强(p) = 垂直压力(F) ÷ 受力面积(S)`,
          `2. 代入数值：p = ${F} N ÷ ${S} m²`,
          `3. 计算获得压强值，1帕斯卡代表每平方米承重1牛顿。`,
        ],
        value: parseFloat(val.toFixed(1)),
        unit: "Pa (帕斯卡)",
      };
    },
  },
  {
    id: "ohm",
    name: "欧姆定律公式 (I = U/R)",
    expression: "I = U / R",
    description: "在同一电路中，通过某段导体的电流跟它两端的电压成正比，跟导体的电阻成反比。",
    variables: [
      { symbol: "U", name: "导体两端电压 (Voltage)", unit: "伏特 (V)", placeholder: "例如: 220" },
      { symbol: "R", name: "导体的电阻 (Resistance)", unit: "欧姆 (Ω)", placeholder: "例如: 44" },
    ],
    calculate: (inputs) => {
      const U = inputs["U"] || 0;
      const R = inputs["R"] || 1;
      const val = U / R;
      return {
        steps: [
          `1. 根据欧姆定律：电流(I) = 电压(U) ÷ 电阻(R)`,
          `2. 代入数值：I = ${U} V ÷ ${R} Ω`,
          `3. 计算得出流经电阻的电流大小。`,
        ],
        value: parseFloat(val.toFixed(2)),
        unit: "A (安培)",
      };
    },
  },
  {
    id: "solutions",
    name: "化学溶质质量分数 [溶液浓度]",
    expression: "w = m(溶质) / m(溶液) × 100%",
    description: "溶液中溶质的质量分数是溶质质量与溶液（溶质 + 溶剂）质量之比。用来衡量溶液的浓度。",
    variables: [
      { symbol: "m1", name: "溶质质量 (无水食盐等)", unit: "克 (g)", placeholder: "例如: 20" },
      { symbol: "m2", name: "溶剂质量 (常温纯水等)", unit: "克 (g)", placeholder: "例如: 80" },
    ],
    calculate: (inputs) => {
      const m1 = inputs["m1"] || 0;
      const m2 = inputs["m2"] || 1;
      const total = m1 + m2;
      const val = (m1 / total) * 100;
      return {
        steps: [
          `1. 计算溶液总质量：m(溶液) = 溶质质量(${m1}g) + 溶剂质量(${m2}g) = ${total}g`,
          `2. 计算百分比浓度：w = 溶质质量 ÷ 溶液总质量 × 100%`,
          `3. 代入数据计算得出质量分数：w = ${m1}g / ${total}g × 100%`,
        ],
        value: parseFloat(val.toFixed(2)),
        unit: "% (质量百分比)",
      };
    },
  },
  {
    id: "pythagoras",
    name: "数学直角勾股定理 (a² + b² = c²)",
    expression: "c = √(a² + b²)",
    description: "直角三角形中，两直角边平方和等于斜边平方。本计算器将根据直角边a、b自动求解斜边c。",
    variables: [
      { symbol: "a", name: "直角边 a 长度", unit: "米 (m)", placeholder: "例如: 3" },
      { symbol: "b", name: "直角边 b 长度", unit: "米 (m)", placeholder: "例如: 4" },
    ],
    calculate: (inputs) => {
      const a = inputs["a"] || 0;
      const b = inputs["b"] || 0;
      const val = Math.sqrt(a * a + b * b);
      return {
        steps: [
          `1. 勾股定理公式：斜边平方(c²) = 直角边a平方(a²) + 直角边b平方(b²)`,
          `2. 计算两边平方和：c² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${a * a + b * b}`,
          `3. 开算术平方根得出斜边边长：c = √(${a * a + b * b})`,
        ],
        value: parseFloat(val.toFixed(2)),
        unit: "m (米)",
      };
    },
  },
];

export default function FormulaHelper() {
  const [selectedId, setSelectedId] = useState(FORMULAS_PRESETS[0].id);
  const [inputs, setInputs] = useState<{ [key: string]: string }>({});
  const [result, setResult] = useState<{ value: number; steps: string[]; unit: string } | null>(null);

  const activeFormula = FORMULAS_PRESETS.find((f) => f.id === selectedId) || FORMULAS_PRESETS[0];

  const handleInputChange = (symbol: string, val: string) => {
    setInputs((prev) => ({ ...prev, [symbol]: val }));
    setResult(null); // Clear previous results
  };

  const handleCalculate = () => {
    const parsedInputs: { [key: string]: number } = {};
    for (const v of activeFormula.variables) {
      const valStr = inputs[v.symbol];
      let num = parseFloat(valStr);
      if (isNaN(num)) {
        // Fallback defaults so app won't crash
        if (v.symbol === "g") num = 9.8;
        else num = 0;
      }
      parsedInputs[v.symbol] = num;
    }

    try {
      const res = activeFormula.calculate(parsedInputs);
      setResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = () => {
    setInputs({});
    setResult(null);
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl p-6 max-w-4xl mx-auto relative z-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/20">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-100 tracking-tight flex items-center gap-1.5 font-sans">
            全科重点数理实验箱
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400/20" />
          </h2>
          <p className="text-sm text-slate-350">输入已知自变量参数，直观理解数理化公式对应推演与检验步骤</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Side: Preset Formula Selector */}
        <div className="md:col-span-4 space-y-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest pl-1">选择公式定律</span>
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {FORMULAS_PRESETS.map((formula) => (
              <button
                key={formula.id}
                id={`formula-btn-${formula.id}`}
                onClick={() => {
                  setSelectedId(formula.id);
                  setInputs({});
                  setResult(null);
                }}
                className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer ${
                  selectedId === formula.id
                    ? "bg-blue-600/60 text-white shadow-xl border border-blue-400/40 backdrop-blur-md"
                    : "bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5"
                }`}
              >
                <div className="font-medium text-sm">{formula.name.split(" ")[0]}</div>
                <div className={`font-mono text-xs mt-1 ${selectedId === formula.id ? "text-blue-200" : "text-slate-450"}`}>
                  {formula.expression}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Inputs & Calculations Canvas */}
        <div className="md:col-span-8 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-100">
                  {activeFormula.name}
                </h3>
                <p className="text-xs text-slate-350 mt-1 leading-relaxed">{activeFormula.description}</p>
              </div>
              <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 font-mono text-xs font-bold">
                {activeFormula.expression}
              </div>
            </div>

            {/* Inputs grid */}
            <div className="space-y-4 my-5">
              {activeFormula.variables.map((variable) => (
                <div key={variable.symbol} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/5 p-3.5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
                  <div>
                    <span className="font-mono text-blue-300 font-bold bg-blue-500/25 px-2.5 py-1 rounded text-xs mr-2 border border-blue-500/30">
                      {variable.symbol}
                    </span>
                    <span className="text-sm font-medium text-slate-200">{variable.name}</span>
                    <span className="text-xs text-slate-450 block sm:inline sm:ml-2">({variable.unit})</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      id={`input-${variable.symbol}`}
                      value={inputs[variable.symbol] || ""}
                      onChange={(e) => handleInputChange(variable.symbol, e.target.value)}
                      placeholder={variable.placeholder}
                      className="w-full sm:w-44 px-3 py-1.5 text-sm bg-slate-900 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-right text-white font-medium placeholder:text-slate-500 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                id="btn-calculate"
                onClick={handleCalculate}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-medium active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Compass className="w-4 h-4 animate-spin-slow" />
                立即计算物理量
              </button>
              <button
                id="btn-reset-formula"
                onClick={handleReset}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 rounded-xl text-sm transition-all flex items-center justify-center cursor-pointer"
                title="重置"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Render Result Dashboard if available */}
          {result && (
            <div className="mt-6 border-t border-white/10 pt-5 space-y-4">
              <div className="bg-blue-950/40 rounded-xl p-4 border border-blue-500/20 flex items-center justify-between">
                <div>
                  <div className="text-xs text-blue-300 font-bold tracking-wide uppercase">计算结语</div>
                  <div className="text-3xl font-extrabold text-blue-200 mt-1 font-mono">
                    {result.value} <span className="text-sm font-sans font-normal text-slate-400">{result.unit}</span>
                  </div>
                </div>
                <div className="p-2.5 bg-blue-500/30 text-blue-300 font-mono text-xl font-black rounded-lg">
                  =
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="text-xs font-semibold text-slate-400 mb-2">孩子可以掌握的推导步骤:</div>
                <div className="space-y-1.5">
                  {result.steps.map((step, idx) => (
                    <p key={idx} className="text-xs font-medium text-slate-300 leading-relaxed flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      {step}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
