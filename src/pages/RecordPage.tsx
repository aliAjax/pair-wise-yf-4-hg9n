import { useState, useEffect, useMemo } from 'react'
import { Bus, MapPin, Armchair, Clock, CloudSun, Signpost, TreePine, Users, FileText, Send, CornerDownRight, X } from 'lucide-react'
import { useSceneStore } from '@/store/useSceneStore'
import { getWeatherIcon, getTreeIcon, getPedestrianIcon, formatTimestamp } from '@/utils/sceneHelpers'
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

/** 续记时允许触发保存的字段：区间、天气、树木、行人、笔记（至少改动一项） */
function isAdjustedFrom(form: SceneFormData, source: WindowScene): boolean {
  return (
    form.segment.trim() !== source.segment.trim() ||
    form.weather !== source.weather ||
    form.treeDensity !== source.treeDensity ||
    form.pedestrianStatus !== source.pedestrianStatus ||
    form.note.trim() !== source.note.trim()
  )
}

export default function RecordPage() {
  const saveScene = useSceneStore((s) => s.saveScene)
  const loadAll = useSceneStore((s) => s.loadAll)
  const scenes = useSceneStore((s) => s.scenes)
  const [form, setForm] = useState<SceneFormData>(initialForm)
  const [now, setNow] = useState(new Date())
  const [showSuccess, setShowSuccess] = useState(false)
  const [sourceId, setSourceId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  /** 每条线路最近一条记录，按时间从新到旧，作为「照上一条续记」入口 */
  const latestByRoute = useMemo(() => {
    const latest = new Map<string, WindowScene>()
    for (const scene of scenes) {
      const current = latest.get(scene.routeName)
      if (!current || new Date(scene.timestamp).getTime() > new Date(current.timestamp).getTime()) {
        latest.set(scene.routeName, scene)
      }
    }
    return Array.from(latest.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [scenes])

  const sourceScene = useMemo(
    () => (sourceId ? scenes.find((s) => s.id === sourceId) ?? null : null),
    [sourceId, scenes]
  )

  const update = <K extends keyof SceneFormData>(key: K, val: SceneFormData[K]) => {
    setError('')
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  /** 从同线路最近一条带入线路、朝向和窗景字段；区间与笔记留空待新写 */
  const handleContinue = (source: WindowScene) => {
    setSourceId(source.id)
    setError('')
    setForm({
      routeName: source.routeName,
      segment: '',
      seatDirection: source.seatDirection,
      weather: source.weather,
      signText: source.signText,
      treeDensity: source.treeDensity,
      pedestrianStatus: source.pedestrianStatus,
      note: '',
    })
  }

  const cancelContinue = () => {
    setSourceId(null)
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (sourceScene && !isAdjustedFrom(form, sourceScene)) {
      setError('尚未调整：请至少改动区间、天气、树木、行人或笔记中的一项再保存')
      return
    }
    saveScene(form, sourceScene?.id)
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      setForm(initialForm)
      setSourceId(null)
      setError('')
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

        {latestByRoute.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-dusk-400 font-serif text-lg flex items-center gap-2">
              <CornerDownRight className="w-4 h-4" />照上一条续记
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {latestByRoute.map((scene) => (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => handleContinue(scene)}
                  className={`shrink-0 rounded-xl border px-3 py-2 text-left text-xs transition ${
                    sourceId === scene.id
                      ? 'border-dusk-400 bg-dusk-400/20 text-dusk-300'
                      : 'border-teal-800 bg-teal-900/50 text-mist-300 hover:border-dusk-400/40 hover:text-mist-100'
                  }`}
                >
                  <span className="flex items-center gap-1 font-medium">
                    <Bus className="w-3 h-3" />{scene.routeName}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-mist-500">
                    续 {formatTimestamp(scene.timestamp).split(' ')[1]} · {scene.segment}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {sourceScene && (
          <div className="flex items-start gap-2 rounded-xl border border-dusk-400/30 bg-dusk-400/10 px-3 py-2.5 text-xs text-mist-200">
            <CornerDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dusk-400" />
            <p className="flex-1 leading-relaxed">
              正在续记 <span className="text-dusk-300">{sourceScene.routeName}</span>
              （{formatTimestamp(sourceScene.timestamp)}，{sourceScene.segment}），线路、朝向与窗景已带入。请至少调整一项再保存。
            </p>
            <button
              type="button"
              onClick={cancelContinue}
              className="shrink-0 text-mist-400 hover:text-mist-100 transition-colors"
              aria-label="取消续记"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-dusk-400 font-serif text-lg flex items-center gap-2">
            <MapPin className="w-4 h-4" />路线信息
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-mist-300 text-xs mb-1 flex items-center gap-1"><Bus className="w-3 h-3" />线路</label>
              <input className="w-full bg-teal-850 text-mist-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-dusk-400" value={form.routeName} onChange={(e) => update('routeName', e.target.value)} required />
            </div>
            <div>
              <label className="text-mist-300 text-xs mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" />区间</label>
              <input className="w-full bg-teal-850 text-mist-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-dusk-400" value={form.segment} onChange={(e) => update('segment', e.target.value)} required />
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
                <button key={w} type="button" onClick={() => update('weather', w)}
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
                <button key={t} type="button" onClick={() => update('treeDensity', t)}
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
                <button key={p} type="button" onClick={() => update('pedestrianStatus', p)}
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
          <textarea className="w-full bg-teal-850 text-mist-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-dusk-400 resize-none h-24" value={form.note} onChange={(e) => update('note', e.target.value)} />
        </section>

        <div className="flex items-center gap-2 text-mist-400 text-xs">
          <Clock className="w-3 h-3" />
          <span>{formatTimestamp(now.toISOString())}</span>
        </div>

        {error && (
          <p className="rounded-xl border border-red-900/50 bg-red-900/30 px-3 py-2.5 text-xs text-red-300">
            {error}
          </p>
        )}

        <button type="submit"
          className="w-full py-3 rounded-xl bg-dusk-400 text-teal-950 font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition">
          <Send className="w-4 h-4" />保存记录
        </button>
      </form>
    </div>
  )
}
