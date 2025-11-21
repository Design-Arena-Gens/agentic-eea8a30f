import NoticesForm from "@/components/NoticesForm";

export default function Page() {
  return (
    <main>
      <div className="header no-print">
        <div className="brand">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l7 4v6c0 5-3 8-7 10C8 20 5 17 5 12V6l7-4z" fill="#6de9c3"/>
            <circle cx="12" cy="10" r="2" fill="#0b1020"/>
          </svg>
          <div>
            <h1>Notices ERP</h1>
            <small>France ? S?curit? incendie & Accessibilit?</small>
          </div>
        </div>
      </div>
      <NoticesForm />
    </main>
  );
}

