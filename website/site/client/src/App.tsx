/**
 * اتجاه الملف: تطبيق مسارات إيقاع الحياة ضمن هوية «الحِرفة التسويقية الداكنة»؛
 * الفحم الدافئ والبرونزي، تنقل عربي مباشر، وصفحات قانونية ظاهرة في بنية الثقة.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import InvoiceAdmin from "./pages/InvoiceAdmin";
import InvoicePayment from "./pages/InvoicePayment";
import BillingLogin from "./pages/BillingLogin";
import StoreAdmin from "./pages/StoreAdmin";
import LegalPage from "./pages/LegalPage";
import ServicesPage from "./pages/ServicesPage";
import ProductsPage from "./pages/ProductsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import { CartProvider } from "./contexts/CartContext";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/services" component={ServicesPage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/terms" component={() => <LegalPage page="terms" />} />
      <Route path="/privacy-refund" component={() => <LegalPage page="privacy" />} />
      <Route path="/admin/invoices" component={InvoiceAdmin} />
      <Route path="/admin" component={BillingLogin} />
      <Route path="/admin/login" component={BillingLogin} />
      <Route path="/admin/store" component={StoreAdmin} />
      <Route path="/pay/:publicId" component={InvoicePayment} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <CartProvider>
            <Router />
          </CartProvider>
          <Toaster richColors position="top-center" />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
