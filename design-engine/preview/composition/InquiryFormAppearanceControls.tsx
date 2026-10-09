"use client";
import { ContentTextField } from "./ContentFields";
import { inquiryFormDefaults, inquiryFormPresets, type InquiryFormAppearance } from "../../forms/appearance";
import type { ActionPresentation } from "../../actions/schema";
import { coreIconNames } from "../../icons/names";
import { buttonShapes, hoverEffects } from "../../presentation/schema";

export function InquiryFormAppearanceControls({ value, onChange }: { value?: InquiryFormAppearance; onChange: (value?: InquiryFormAppearance) => void }) {
  const design = { ...inquiryFormDefaults, ...value };
  const patch = (key: keyof InquiryFormAppearance, next: unknown) => onChange({ ...value, [key]: next });
  const select = (label: string, current: string, options: readonly string[], change: (next: string) => void) => <label key={label}>{label}<select aria-label={label} value={current} onChange={event => change(event.target.value)}>{options.map(option => <option key={option} value={option}>{option.replace(/-/g," ")}</option>)}</select></label>;
  const number = (label: string, key: keyof InquiryFormAppearance, current: number, min: number, max: number, integer = false) => <ContentTextField key={key} label={label} type="number" value={String(current)} onChange={text => { const next=Number(text);if(text!=="" && Number.isFinite(next) && next>=min && next<=max && (!integer || Number.isInteger(next))) patch(key,next); }}/>;
  const button = (key: keyof ActionPresentation, next: unknown) => patch("submit",{ ...value?.submit, [key]: next === "inherit" ? undefined : next });
  const color = (label: string, key: "background"|"fieldBackground"|"textColor"|"borderColor"|"focusColor") => <div key={key} className="composition-form-color"><ContentTextField label={label} value={value?.[key] ?? ""} onChange={text => { if(text==="" || /^#[0-9a-fA-F]{6}$/.test(text)) patch(key,text || undefined); }}/><button type="button" disabled={!value?.[key]} onClick={() => patch(key,undefined)}>Inherit {label.toLowerCase()}</button></div>;
  return <details open className="composition-content-group"><summary>Form appearance</summary>
    <p>Start with a style, then customize it. Colors inherit the site palette unless you enter a hex color.</p>
    <div className="composition-controls">{Object.entries(inquiryFormPresets).map(([name,preset]) => <button type="button" key={name} onClick={() => onChange(preset)}>{name === "soft" ? "Soft panel" : name === "editorial" ? "Editorial form" : "Minimal form"}</button>)}</div>
    {!value && <p>Current form uses its original appearance. Changing any control enables the editable form style.</p>}
    <details className="composition-content-group" open><summary>Form layout & surface</summary>
      {select("Form treatment",design.treatment,["minimal","outline","panel"],next => patch("treatment",next))}
      {select("Form shape",design.shape,["square","soft","rounded"],next => patch("shape",next))}
      {select("Form placement",design.alignment,["left","center","right"],next => patch("alignment",next))}
      {select("Form heading alignment",design.headingAlignment,["left","center","right"],next => patch("headingAlignment",next))}
      {select("Form columns",String(design.columns),["1","2"],next => patch("columns",Number(next)))}
      <div className="composition-controls">{number("Form maximum width", "maxWidth",design.maxWidth,320,1400)}{number("Form padding","padding",design.padding,0,80)}{number("Form spacing","gap",design.gap,8,56)}</div>
    </details>
    <details className="composition-content-group"><summary>Field styling & type</summary>
      {select("Field style",design.fieldStyle,["underline","outline","filled"],next => patch("fieldStyle",next))}
      {select("Field shape",design.fieldShape,["square","soft","rounded"],next => patch("fieldShape",next))}
      {select("Form label case",design.labelCase,["normal","uppercase"],next => patch("labelCase",next))}
      <div className="composition-controls">{number("Field height","fieldHeight",design.fieldHeight,40,80)}{number("Message rows","textareaRows",design.textareaRows,3,12,true)}{number("Form title size","titleSize",design.titleSize,18,64)}{number("Form label size","labelSize",design.labelSize,10,20)}{number("Form text size","textSize",design.textSize,14,24)}</div>
    </details>
    <details className="composition-content-group"><summary>Form colors</summary>
      {color("Form background","background")}{color("Field background","fieldBackground")}{color("Form text color","textColor")}{color("Field border color","borderColor")}{color("Field focus color","focusColor")}
    </details>
    <details className="composition-content-group"><summary>Form submit button</summary>
      {select("Submit variant",value?.submit?.variant ?? "inherit",["inherit","primary","secondary","outline","ghost","text","underline","inverse"],next => button("variant",next))}
      {select("Submit shape",value?.submit?.shape ?? "inherit",["inherit",...buttonShapes],next => button("shape",next))}
      {select("Submit hover",value?.submit?.hover ?? "inherit",["inherit",...hoverEffects],next => button("hover",next))}
      {select("Submit size",value?.submit?.size ?? "inherit",["inherit","small","medium","large","display"],next => button("size",next))}
      {select("Submit icon",value?.submit?.icon === null ? "none" : value?.submit?.icon ?? "inherit",["inherit","none",...coreIconNames],next => button("icon",next === "none" ? null : next))}
      {select("Submit icon position",value?.submit?.iconPosition ?? "inherit",["inherit","leading","trailing"],next => button("iconPosition",next))}
      {select("Submit width",value?.submit?.width ?? "auto",["auto","full"],next => button("width",next))}
      {select("Submit alignment",value?.submit?.alignment ?? "left",["left","center","right"],next => button("alignment",next))}
      {select("Submit color surface",value?.submit?.surface ?? "inherit",["inherit","light","dark","brand"],next => button("surface",next))}
    </details>
    <button type="button" disabled={!value} onClick={() => onChange(undefined)}>Restore original form appearance</button>
    <p>Edit form wording, fields and delivery in Content → Inquiry form.</p>
  </details>;
}
