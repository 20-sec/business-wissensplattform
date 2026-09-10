import { configured } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export const dynamic = "force-dynamic";
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
 const params = await searchParams;
 return <main className="login-wrap"><section className="login-panel"><p className="eyebrow">MARKUS COENEN · WISSENSPLATTFORM</p><h1>Dein Wissen.<br/>Dein Zugang.</h1><p className="muted">Business-Ideen sammeln, Aussagen prüfen und Erkenntnisse weiterentwickeln.</p>
 {!configured() ? <p role="alert">Der Zugang muss noch eingerichtet werden.</p> : <form action="/api/login" method="post"><label htmlFor="password">Passwort</label><Input id="password" name="password" type="password" autoComplete="current-password" required maxLength={256}/>{params.error && <p role="alert">Das Passwort stimmt nicht. Bitte erneut versuchen.</p>}<Button type="submit">Wissensplattform öffnen</Button></form>}
 <p className="small muted">Privater Recherchebereich</p></section></main>;
}
