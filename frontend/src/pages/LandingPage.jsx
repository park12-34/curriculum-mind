import { Link } from 'react-router-dom'
import heroImg from '../assets/hero.png'

const FEATURES = [
  {
    title: 'Learning Gap Analysis',
    description: '시험지 PDF와 O/X 데이터를 교차 분석하여 학생별 취약점을 진단합니다.',
    icon: (
      <svg className="h-8 w-8 text-[var(--color-gold)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 113.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    to: '/analyze',
  },
  {
    title: '학생 관리',
    description: '반과 학생을 등록하고, 개별 학생의 상세 프로필과 성적 추이를 확인합니다.',
    icon: (
      <svg className="h-8 w-8 text-[var(--color-gold)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    to: '/students',
  },
  {
    title: 'AI 분석',
    description: '오답 패턴 분석, 성적 궤적 예측, AI 코칭으로 맞춤형 학습 전략을 제공합니다.',
    icon: (
      <svg className="h-8 w-8 text-[var(--color-gold)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
    to: '/analysis',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] font-[var(--font-body)]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--color-navy)]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,white_0%,transparent_60%)]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[var(--color-gold)] text-sm font-medium tracking-widest uppercase mb-4">
                AI-Powered Education Analytics
              </p>
              <h1 className="text-4xl lg:text-5xl font-[var(--font-heading)] text-white leading-tight">
                가르친 것과 배운 것 사이의
                <span className="block text-[var(--color-gold)] mt-1">간격을 AI가 찾는다</span>
              </h1>
              <p className="text-gray-300 text-lg mt-6 leading-relaxed max-w-lg">
                CurriculumMind는 커리큘럼과 평가 데이터를 AI로 분석하여
                학습 갭을 발견하고, 위험 학생을 예측하며, 최적화된 학습 전략을 제안합니다.
              </p>
              <div className="flex gap-3 mt-8">
                <Link
                  to="/analyze"
                  className="px-6 py-3 bg-[var(--color-gold)] text-[var(--color-navy)] rounded-lg font-semibold text-sm hover:bg-[var(--color-gold-light)] transition-colors"
                >
                  분석 시작하기
                </Link>
                <Link
                  to="/students"
                  className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold text-sm hover:bg-white/20 transition-colors border border-white/20"
                >
                  학생 관리
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              <img
                src={heroImg}
                alt="CurriculumMind"
                className="w-80 h-80 object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-[var(--font-heading)] text-[var(--color-navy)]">핵심 기능</h2>
          <p className="text-gray-500 mt-2">AI 기반 교육 분석 플랫폼</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map(({ title, description, icon, to }) => (
            <Link
              key={to}
              to={to}
              className="group bg-white rounded-2xl border border-[var(--color-card-border)] p-6 hover:shadow-lg hover:shadow-gray-200/50 transition-all"
            >
              <div className="mb-4">{icon}</div>
              <h3 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)] group-hover:text-[var(--color-gold)] transition-colors">
                {title}
              </h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">{description}</p>
              <span className="inline-block mt-4 text-sm font-medium text-[var(--color-gold)]">
                시작하기 &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-card-border)] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm font-[var(--font-heading)] text-[var(--color-navy)]">CurriculumMind</p>
            <p className="text-xs text-gray-500 mt-1">AI-Powered Curriculum Gap Analysis</p>
          </div>
          <div className="text-xs text-gray-400">2026 AI Education Hackathon</div>
        </div>
      </footer>
    </div>
  )
}
