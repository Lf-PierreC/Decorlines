export function Footer() {
  return (
    <footer className="mt-32 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-3">
        <div>
          <p className="font-serif text-2xl">Decorlines</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Peças decorativas impressas em 3D, feitas com cuidado e pensadas para
            deixar a casa mais bonita.
          </p>
        </div>
        <div className="text-sm text-muted">
          <p className="eyebrow mb-3">Atendimento</p>
          <p>contato@decorlines.com.br</p>
          <p>WhatsApp: (00) 00000-0000</p>
        </div>
        <div className="text-sm text-muted">
          <p className="eyebrow mb-3">Pagamento e envio</p>
          <p>Pix com 5% de desconto</p>
          <p>Cartão em até 3x sem juros</p>
          <p>Envio para todo o Brasil</p>
        </div>
      </div>
      <p className="border-t border-line py-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} Decorlines. Todos os direitos reservados.
      </p>
    </footer>
  );
}
