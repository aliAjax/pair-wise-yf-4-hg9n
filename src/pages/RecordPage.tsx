import { useState, useEffect } from 'react'
import { Bus, MapPin, Armchair, Clock, CloudSun, Signpost, TreePine, Users, FileText, Send, History, X, AlertCircle } from 'lucide-react'
import { useSceneStore } from '@/store/useSceneStore'
import { getWeatherIcon, getTreeIcon, getPedestrianIcon, formatTimestamp, getLatestSceneByRoute, hasContinuationChange } from '@/utils/sceneHelpers'
import type { SceneFormData, Weather, TreeDensity, PedestrianStatus, SeatDirection, WindowScene } from '@/types'

const WEATHERS: Weather[] = ['晴', '多云', '阴', '小雨', '大雨', '雪', '雾']
const TREES: TreeDensity[] = ['稀疏', '适中', '茂密']
const PEDESTRIANS: PedestrianStatus[] = ['稀少', '零星', '密集']

const initialForm: SceneFormData = {
  routeName: '',
  segment: '',
  seatDirection: '左',
  weather: '晴',
  signText: '',
  treeDensity: '适中',
  pedestrianStatus: '稀少',
  note: '',
}

/** 从来源记录带入线路、朝向和窗景字段（不含编号、采样时刻、区间与笔记） */
function formFromScene(source: WindowScene): SceneFormData {
  return {
    routeName: source.routeName,
    segment: '',
    seatDirection: source.seatDirection,
    weather: source.weather,
    signText: source.signText,
    treeDensity: source.treeDensity,
    pedestrianStatus: source.pedestrianStatus,
    note: '',
  }
}

export default function RecordPage() {
  const saveScene = useSceneStore((s) => s.saveScene)
  const loadAll = useSceneStore((s) => s.loadAll)
  const scenes = useSceneStore((s) => s.scenes)
  const [form, setForm] = useState<SceneFormData>(initialForm)
  const [now, setNow] = useState(new Date())
  const [showSuccess, setShowSuccess] = useState(false)
  const [continueSourceId, setContinueSourceId] = useState<string | null>(null)
  const [showNoChangeHint, setShowNoChangeHint] = useState(false)

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  // 续记来源可能已在时间线页被移除：找不到时按无来源（独立记录）处理
  const continueSource = continueSourceId
    ? scenes.find((s) => s.id === continueSourceId) ?? null
    : null

  // 当前表单线路的最近一条记录，用于"照上一条续记"
  const latestForRoute = getLatestSceneByRoute(scenes, form.routeName)

  const update = <K extends keyof SceneFormData>(key: K, val: SceneFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const handleContinueLatest = () => {
    if (!latestForRoute) return
    setForm(formFromScene(latestForRoute))
    setContinueSourceId(latestForRoute.id)
    setShowNoChangeHint(false)
  }

  const handleCancelContinuation = () => {
    setContinueSourceId(null)
    setShowNoChangeHint(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 续记必须相对来源调整过区间/天气/树木/行人/笔记中的至少一项
    if (continueSource && !hasContinuationChange(form, continueSource)) {
      setShowNoChangeHint(true)
      return
    }
    saveScene(form, continueSource?.id)
    setShowNoChangeHint(false)
    setContinueSourceId(null)
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      setForm(initialForm)
    }, 1500)
  }

  return (
    <div className="relative min-h-screen bg-teal-950 p-4 pb-24">
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-bounce flex flex-col items-center gap-2 opacity-0" style={{ animation: 'fadeInUp 1.5s ease forwards' }}>
            <Bus className="w-16 h-16 text-dusk-400" />
            <span className="text-mist-100 font-serif text-lg">记录已保存</span>
          </div>
          <style>{`@keyframes fadeInUp { 0% { opacity:0; transform:translateY(20px) } 40% { opacity:1; transform:translateY(0) } 100% { opacity:0; transform:translateY(-40px) } }`}</style>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Bus className="w-6 h-6 text-dusk-400" />
          <h1 className="text-mist-100 font-serif text-2xl">窗景记录</h1>
        </div>

        {continueSource ? (
          <div className="flex items-start gap-3 rounded-xl border border-dusk-400/40 bg-dusk-400/10 px-3 py-2.5">
            <History className="mt-0.5 w-4 h-4 shrink-0 text-dusk-400" />
            <div className="flex-1 text-xs leading-relaxed">
              <p className="text-dusk-300 font-medium">正在照上一条续记</p>
              <p className="text-mist-300 mt-0.5">
                来源：{continueSource.routeName} · {continueSource.segment} ·{' '}
                {formatTimestamp(continueSource.timestamp)}
              </p>
              <p className="text-mist-400 mt-0.5">
                线路、朝向和窗景已带入，区间与笔记请重新填写；新记录使用独立编号与当前采样时刻。保存前需至少改动区间、天气、树木、行人或笔记中的一项。
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancelContinuation}
              className="shrink-0 text-mist-400 hover:text-mist-100 transition-colors"
              aria-label="取消续记"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleContinueLatest}
            disabled={!latestForRoute}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-dusk-400/30 bg-dusk-400/5 py-2.5 text-sm text-dusk-300 transition hover:bg-dusk-400/15 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-dusk-400/5"
          >
            <History className="w-4 h-4" />
            {latestForRoute
              ? `照上一条续记（${latestForRoute.routeName} · ${formatTimestamp(latestForRoute.timestamp)}）`
              : '照上一条续记（同线路暂无记录）'}
          </button>
        )}

        <section className="space-y-3">
          <h2 className="text-dusk-400 font-serif text-lg flex items-center gap-2">
            <MapPin className="w-4 h-4" />路线信息
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-mist-300 text-xs mb-1 flex items-center gap-1"><Bus className="w-3 h-3" />线路</label>
              <input className="w-full bg-teal-850 text-mist-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-dusk-400" value={form.routeName} onChange={(e) => {
                update('routeName', e.target.value)
                // 线路改到与来源不同后即退出续记，避免跨线路挂来源
                if (continueSource && e.target.value !== continueSource.routeName) {
                  setContinueSourceId(null)
                  setShowNoChangeHint(false)
                }
              }} required />
            </div>
            <div>
              <label className="text-mist-300 text-xs mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" />区间</label>
              <input className="w-full bg-teal-850 text-mist-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-dusk-400" value={form.segment} onChange={(e) => { update('segment', e.target.value); setShowNoChangeHint(false) }} required />
            </div>
          </div>
          <div>
            <label className="text-mist-300 text-xs mb-1 flex items-center gap-1"><Armchair className="w-3 h-3" />座位方向</label>
            <div className="flex gap-2">
              {(['左', '右'] as SeatDirection[]).map((d) => (
                <button key={d} type="button" onClick={() => update('seatDirection', d)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${form.seatDirection === d ? 'bg-dusk-400/20 text-dusk-400 border border-dusk-400' : 'bg-teal-850 text-mist-300 border border-transparent'}`}>
                  {d}侧
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-dusk-400 font-serif text-lg flex items-center gap-2">
            <CloudSun className="w-4 h-4" />窗景信息
          </h2>
          <div>
            <label className="text-mist-300 text-xs mb-1 block">天气</label>
            <div className="grid grid-cols-4 gap-2">
              {WEATHERS.map((w) => (
                <button key={w} type="button" onClick={() => { update('weather', w); setShowNoChangeHint(false) }}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs transition ${form.weather === w ? 'bg-dusk-400/20 border border-dusk-400 text-dusk-400' : 'bg-teal-850 border border-transparent text-mist-300'}`}>
                  {getWeatherIcon(w)}{w}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-mist-300 text-xs mb-1 flex items-center gap-1"><Signpost className="w-3 h-3" />招牌文字</label>
            <input className="w-full bg-teal-850 text-mist-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-dusk-400" value={form.signText} onChange={(e) => update('signText', e.target.value)} />
          </div>
          <div>
            <label className="text-mist-300 text-xs mb-1 flex items-center gap-1"><TreePine className="w-3 h-3" />树木密度</label>
            <div className="grid grid-cols-3 gap-2">
              {TREES.map((t) => (
                <button key={t} type="button" onClick={() => { update('treeDensity', t); setShowNoChangeHint(false) }}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs transition ${form.treeDensity === t ? 'bg-dusk-400/20 border border-dusk-400 text-dusk-400' : 'bg-teal-850 border border-transparent text-mist-300'}`}>
                  {getTreeIcon(t)}{t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-mist-300 text-xs mb-1 flex items-center gap-1"><Users className="w-3 h-3" />行人状态</label>
            <div className="grid grid-cols-3 gap-2">
              {PEDESTRIANS.map((p) => (
                <button key={p} type="button" onClick={() => { update('pedestrianStatus', p); setShowNoChangeHint(false) }}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs transition ${form.pedestrianStatus === p ? 'bg-dusk-400/20 border border-dusk-400 text-dusk-400' : 'bg-teal-850 border border-transparent text-mist-300'}`}>
                  {getPedestrianIcon(p)}{p}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-dusk-400 font-serif text-lg flex items-center gap-2">
            <FileText className="w-4 h-4" />观察笔记
          </h2>
          <textarea className="w-full bg-teal-850 text-mist-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-dusk-400 resize-none h-24" value={form.note} onChange={(e) => { update('note', e.target.value); setShowNoChangeHint(false) }} />
        </section>

        <div className="flex items-center gap-2 text-mist-400 text-xs">
          <Clock className="w-3 h-3" />
          <span>{formatTimestamp(now.toISOString())}</span>
        </div>

        {showNoChangeHint && continueSource && (
          <div className="flex items-start gap-2 rounded-xl border border-red-800/60 bg-red-900/20 px-3 py-2.5 text-xs text-red-300">
            <AlertCircle className="mt-0.5 w-4 h-4 shrink-0" />
            <span>尚未调整：续记需相对上一条至少改动区间、天气、树木、行人或笔记中的一项，内容未变时不会写入存档。</span>
          </div>
        )}

        <button type="submit"
          className="w-full py-3 rounded-xl bg-dusk-400 text-teal-950 font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition">
          <Send className="w-4 h-4" />保存记录
        </button>
      </form>
    </div>
  )
}
