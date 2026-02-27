interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="px-6 pt-5 pb-2">
      <h1 className="font-[family-name:var(--font-playfair)] text-[28px] font-medium text-fumi-text m-0 tracking-[-0.02em]">
        {title}
      </h1>
      {subtitle && (
        <p className="font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-text-secondary mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}
