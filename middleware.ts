import { NextResponse, type NextRequest } from "next/server";

// Protezione perimetrale: Basic Auth su tutte le route (pagine + API).
// Sostituisce il Basic Auth di Caddy del path VM: su Vercel l'app è pubblica,
// quindi l'auth deve stare nell'app. Credenziali da env (vedi .env.example).
//
// Fail-closed in produzione: se le credenziali non sono configurate, blocca
// tutto invece di esporre l'app senza protezione. In sviluppo locale, se non
// configurate, lascia passare (comodità).

export const config = {
  // Tutto tranne gli asset statici di Next e la favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

function unauthorized(message: string) {
  return new NextResponse(message, {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="RecuperaBene", charset="UTF-8"',
    },
  });
}

export function middleware(req: NextRequest) {
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPass = process.env.BASIC_AUTH_PASSWORD;

  if (!expectedUser || !expectedPass) {
    // In dev non blocchiamo; in produzione fail-closed.
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return new NextResponse(
      "Autenticazione non configurata (BASIC_AUTH_USER / BASIC_AUTH_PASSWORD).",
      { status: 503 },
    );
  }

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = atob(header.slice("Basic ".length));
    const sep = decoded.indexOf(":");
    const user = decoded.slice(0, sep);
    const pass = decoded.slice(sep + 1);
    if (user === expectedUser && pass === expectedPass) {
      return NextResponse.next();
    }
  }

  return unauthorized("Credenziali non valide.");
}
