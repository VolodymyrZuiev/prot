import { StoreProvider } from "./store";
import { Shell } from "./components/Shell";

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
