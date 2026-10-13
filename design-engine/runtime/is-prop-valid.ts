// Motion's optional Emotion probe is unnecessary for this renderer's native elements.
export default function isPropValid(name:string){return !name.startsWith('$');}
