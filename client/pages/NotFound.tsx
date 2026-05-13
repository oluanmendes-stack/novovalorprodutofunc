import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8 sm:p-12 text-center">
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-destructive/10 rounded-full">
              <AlertTriangle className="w-12 h-12 text-destructive" />
            </div>
          </div>
          <h1 className="text-5xl font-800 text-foreground mb-2">404</h1>
          <p className="text-lg text-muted-foreground">Página não encontrada</p>
        </div>

        <p className="text-muted-foreground mb-8">
          Desculpe, a página que você está procurando não existe ou foi movida.
        </p>

        <Link to="/">
          <Button className="gap-2 mx-auto">
            <Home className="w-4 h-4" />
            Voltar ao Dashboard
          </Button>
        </Link>

        <p className="text-xs text-muted-foreground mt-8">
          Se este for um erro, por favor contate o suporte técnico.
        </p>
      </Card>
    </div>
  );
}
