export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-card-border)] bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm font-[var(--font-heading)] text-[var(--color-navy)]">CurriculumMind</p>
            <p className="text-xs text-gray-500 mt-1">
              가르친 것과 배운 것 사이의 간격을 AI가 찾는다
            </p>
          </div>
          <div className="text-xs text-gray-400">
            2026 AI Education Hackathon
          </div>
        </div>
      </div>
    </footer>
  )
}
