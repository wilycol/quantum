import Tip from "../ui/Tip";
import { GLOSS } from "../../content/glossary";

export default function SLHelp() {
  return <Tip label={GLOSS.sl}><InfoDot /></Tip>;
}

function InfoDot(){ 
  return <span className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-bold">i</span>; 
}
