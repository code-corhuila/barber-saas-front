/** The look of the account screens: the prototype's dark cards and gold accent. */
export const ACCOUNT_STYLES = `
  .page { max-width: 40rem; margin: 0 auto; padding: 24px 16px 32px; }
  .back { color: var(--bs-muted); text-decoration: none; font-size: 14px; }
  h1 { font-size: 22px; font-weight: 700; margin: 12px 0 18px; }
  h2 { font-size: 16px; font-weight: 700; margin: 24px 0 10px; }
  .card { background: var(--bs-card); border: 1px solid var(--bs-border); border-radius: 12px; padding: 16px;
          margin-bottom: 12px; }
  label { display: block; color: var(--bs-muted); font-size: 13px; margin: 12px 0 6px; }
  input { width: 100%; box-sizing: border-box; background: var(--bs-bg); color: var(--bs-text);
          border: 1px solid var(--bs-border); border-radius: 10px; padding: 12px; font: inherit; }
  input:focus { outline: 2px solid var(--bs-gold); border-color: transparent; }
  .primary { width: 100%; margin-top: 18px; background: var(--bs-gold); color: var(--bs-bg); border: 0;
             border-radius: 10px; padding: 14px; font: inherit; font-weight: 700; cursor: pointer; }
  .primary:disabled { opacity: .6; }
  .error { color: var(--bs-danger); font-size: 13px; margin-top: 10px; }
  .ok { color: #8fd18f; font-size: 13px; margin-top: 10px; }
  .muted { color: var(--bs-muted); font-size: 13px; }
  .gold { color: var(--bs-gold); }
  .row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
`;
