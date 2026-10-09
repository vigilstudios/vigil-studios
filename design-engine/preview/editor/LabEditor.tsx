"use client";
import "./toolbar.css";

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export type LabEditorTab = { id: string; label: string; content: ReactNode };

/** Internal chrome only. Scaling the artboard preserves its authored container width. */
export function LabEditor({ title, toolbar, viewportControl, workspaceSwitch, tabs, activeTab, onTabChange, canvasWidth, resetKey, inspectorTabs, inspectorTab = "design", onInspectorTabChange, children }: {
  title: string; toolbar?: ReactNode; viewportControl?: ReactNode; workspaceSwitch?: ReactNode; tabs: LabEditorTab[]; activeTab: string;
  inspectorTabs?: LabEditorTab[]; inspectorTab?: string; onInspectorTabChange?: (id: string) => void;
  onTabChange: (id: string) => void; canvasWidth: number; resetKey?: string; children: ReactNode;
}) {
  const [visible, setVisible] = useState(true);
  const [fullPreview, setFullPreview] = useState(false);
  const [exitPosition, setExitPosition] = useState({ x: 24, y: 24 });
  const previewPosition = useRef({ top: 0, left: 0 });
  const fullButton = useRef<HTMLButtonElement>(null);
  const exitDrag = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const [width, setWidth] = useState(340);
  const [density, setDensity] = useState("compact");
  const [zoom, setZoom] = useState("fit");
  const [measure, setMeasure] = useState({ canvas: 1440, height: 900, viewport: 900 });
  const canvas = useRef<HTMLDivElement>(null), artboard = useRef<HTMLDivElement>(null);
  const showButton = useRef<HTMLButtonElement>(null);
  const dragging = useRef<{ x: number; width: number } | null>(null);
  const panelId = useId();
  const zoomScale = useRef(1);
  const zoomAnchor = useRef<{ x: number; y: number; localX: number; localY: number } | null>(null);

  useEffect(() => { canvas.current?.scrollTo({ top: 0, left: 0 }); }, [resetKey]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const next = { canvas: canvas.current?.clientWidth ?? 1440, height: artboard.current?.offsetHeight ?? 900, viewport: canvas.current?.clientHeight ?? 900 };
      setMeasure(previous => previous.canvas === next.canvas && previous.height === next.height && previous.viewport === next.viewport ? previous : next);
    });
    if (canvas.current) observer.observe(canvas.current);
    if (artboard.current) observer.observe(artboard.current);
    return () => observer.disconnect();
  }, []);

  const rightSpace = !fullPreview && visible && measure.canvas > 720 ? Math.min(width, measure.canvas - 48) + 24 : 0;
  const leftSpace = !fullPreview && visible && inspectorTabs ? 288 : 0;
  const stageWidth = fullPreview ? measure.canvas : canvasWidth;
  const scale = fullPreview ? 1 : zoom === "fit" ? Math.min(1, Math.max(160, measure.canvas - rightSpace - leftSpace - 48) / stageWidth) : Number(zoom);
  useLayoutEffect(() => {
    zoomScale.current = scale;
    const anchor = zoomAnchor.current;
    if (anchor && canvas.current && artboard.current) {
      const rect = artboard.current.getBoundingClientRect();
      canvas.current.scrollLeft += rect.left + anchor.localX * scale - anchor.x;
      canvas.current.scrollTop += rect.top + anchor.localY * scale - anchor.y;
      zoomAnchor.current = null;
    }
  }, [scale]);

  useEffect(() => {
    const surface = canvas.current;
    if (!surface) return;
    let gestureScale: number | null = null;
    function zoomAt(value: number, x: number, y: number) {
      const rect = artboard.current?.getBoundingClientRect();
      if (!rect) return;
      const next = Math.max(.1, Math.min(3, value));
      if (next === zoomScale.current) return;
      zoomAnchor.current = { x, y, localX: (x - rect.left) / zoomScale.current, localY: (y - rect.top) / zoomScale.current };
      zoomScale.current = next;
      setZoom(String(next));
    }
    const wheel = (event: WheelEvent) => {
      // Trackpad pinch is emitted as ctrl+wheel by Chromium/Firefox.
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      if (gestureScale !== null) return;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? surface!.clientHeight : 1);
      zoomAt(zoomScale.current * Math.exp(-Math.max(-120, Math.min(120, delta)) * .005), event.clientX, event.clientY);
    };
    const start = (event: Event) => { event.preventDefault(); gestureScale = zoomScale.current; };
    const change = (event: Event) => {
      event.preventDefault();
      const gesture = event as Event & { scale: number; clientX: number; clientY: number };
      if (gestureScale === null || !Number.isFinite(gesture.scale)) return;
      const rect = surface.getBoundingClientRect();
      zoomAt(gestureScale * gesture.scale, Number.isFinite(gesture.clientX) ? gesture.clientX : rect.left + rect.width / 2, Number.isFinite(gesture.clientY) ? gesture.clientY : rect.top + rect.height / 2);
    };
    const end = (event: Event) => { event.preventDefault(); gestureScale = null; };
    surface.addEventListener("wheel", wheel, { passive: false });
    surface.addEventListener("gesturestart", start, { passive: false });
    surface.addEventListener("gesturechange", change, { passive: false });
    surface.addEventListener("gestureend", end, { passive: false });
    return () => {
      surface.removeEventListener("wheel", wheel);
      surface.removeEventListener("gesturestart", start);
      surface.removeEventListener("gesturechange", change);
      surface.removeEventListener("gestureend", end);
    };
  }, []);
  function enterPreview() {
    previewPosition.current = { top: canvas.current?.scrollTop ?? 0, left: canvas.current?.scrollLeft ?? 0 };
    setFullPreview(true);
  }
  function leavePreview() { setFullPreview(false); }
  useLayoutEffect(() => {
    if (fullPreview) { canvas.current?.scrollTo({ top: 0, left: 0 }); canvas.current?.focus(); }
    else {
      const frame = requestAnimationFrame(() => { canvas.current?.scrollTo(previewPosition.current); fullButton.current?.focus(); });
      return () => cancelAnimationFrame(frame);
    }
  }, [fullPreview]);
  useEffect(() => {
    if (!fullPreview) return;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && !document.querySelector("dialog[open]")) { event.preventDefault(); setFullPreview(false); } };
    const resize = () => setExitPosition(previous => ({ x: Math.max(8,Math.min(previous.x,window.innerWidth-180)), y:Math.max(8,Math.min(previous.y,window.innerHeight-52)) }));
    window.addEventListener("keydown",escape); window.addEventListener("resize",resize);
    return () => { window.removeEventListener("keydown",escape); window.removeEventListener("resize",resize); };
  }, [fullPreview]);
  const resize = (value: number) => setWidth(Math.max(260, Math.min(560, value)));
  const changeVisibility = () => { setVisible(value => !value); showButton.current?.focus(); };

  return <section className="lab-editor" aria-label={`${title} editor`} data-density={density} data-controls={visible ? "visible" : "hidden"} data-full-preview={fullPreview}
    style={{ "--lab-panel-width": `${width}px`, "--lab-right-space": `${rightSpace}px`, "--lab-left-space": `${leftSpace}px`, "--lab-stage-width": `${stageWidth * scale}px` } as CSSProperties}>
    <header className="lab-editor-toolbar" hidden={fullPreview}>
      <div className="lab-editor-title"><span className="lab-editor-mark" aria-hidden="true">◈</span><h1>Lab</h1>{workspaceSwitch}</div>
      <div className="lab-editor-tools">{toolbar}</div>
      <div className="lab-editor-view">
        {viewportControl && <div className="lab-editor-viewport">{viewportControl}</div>}
        <label title="Pinch or Ctrl/Cmd + mouse wheel over the canvas to zoom">Zoom<select aria-label="Preview zoom" value={zoom} onChange={event => setZoom(event.target.value)}><option value="fit">Fit</option>{!["fit", ".5", "0.5", "0.67", "0.75", "1", "1.25", "1.5"].includes(zoom) && <option value={zoom}>{Math.round(scale * 100)}%</option>}{[.5, .67, .75, 1, 1.25, 1.5].map(value => <option key={value} value={value}>{Math.round(value * 100)}%</option>)}</select></label>
        <button type="button" ref={fullButton} onClick={enterPreview}>Full preview</button>
        <button ref={showButton} type="button" aria-expanded={visible} aria-controls={panelId} onClick={changeVisibility}>{visible ? "Hide controls" : "Show controls"}</button>
        <a href="/admin" className="lab-editor-exit" title="Return to admin">Exit ↗</a>
      </div>
    </header>
    <div ref={canvas} className="lab-editor-canvas" tabIndex={0} aria-label={fullPreview ? "Full browser site preview" : "Preview canvas"}>
      <div className="lab-canvas-area">
        <div className="lab-artboard-size" style={{ width: stageWidth * scale, height: measure.height * scale }}>
          <div ref={artboard} className="lab-artboard" style={{ width: stageWidth, zoom: scale, "--de-viewport-height": `${measure.viewport}px` } as CSSProperties}>{children}</div>
        </div>
        <p className="lab-canvas-measure">{canvasWidth}px artboard · {Math.round(scale * 100)}% · Pinch to zoom · Scroll to pan</p>
      </div>
    </div>
    <aside id={panelId} className={`lab-control-panel ${inspectorTabs ? "lab-control-panel--left" : ""}`} aria-label={inspectorTabs ? "Site, pages and sections" : "Lab controls"} hidden={!visible || fullPreview}>
      <div className="lab-panel-resize" role="separator" aria-label="Resize control panel" aria-orientation="vertical" aria-valuemin={260} aria-valuemax={560} aria-valuenow={width} tabIndex={0}
        onPointerDown={event => { event.preventDefault(); event.currentTarget.focus(); dragging.current = { x: event.clientX, width }; event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerMove={event => { if (dragging.current) resize(dragging.current.width + dragging.current.x - event.clientX); }}
        onPointerUp={() => { dragging.current = null; }} onPointerCancel={() => { dragging.current = null; }}
        onKeyDown={event => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) { event.preventDefault(); resize(event.key === "Home" ? 260 : event.key === "End" ? 560 : width + (event.key === "ArrowLeft" ? 20 : -20)); } }}><span /></div>
      <div className="lab-panel-heading"><span>{inspectorTabs ? "Site editor" : "Editor"}</span><button type="button" aria-label="Hide control panel" onClick={changeVisibility}>×</button></div>
      <div className="lab-panel-tabs" role="tablist" aria-label="Control groups">{tabs.map(tab => <button key={tab.id} id={`${panelId}-${tab.id}-tab`} type="button" role="tab" aria-selected={activeTab === tab.id} aria-controls={`${panelId}-${tab.id}`} tabIndex={activeTab === tab.id ? 0 : -1}
        onClick={() => onTabChange(tab.id)} onKeyDown={event => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault(); const index = tabs.findIndex(item => item.id === tab.id);
          const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
          onTabChange(tabs[next].id); document.getElementById(`${panelId}-${tabs[next].id}-tab`)?.focus();
        }}>{tab.label}</button>)}</div>
      <div className="lab-panel-content">{tabs.map(tab => <div key={tab.id} id={`${panelId}-${tab.id}`} role="tabpanel" aria-labelledby={`${panelId}-${tab.id}-tab`} hidden={activeTab !== tab.id}>{tab.content}</div>)}</div>
      <footer className="lab-panel-footer"><label>Control size<select aria-label="Control size" value={density} onChange={event => setDensity(event.target.value)}><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="large">Large</option></select></label><span>Drag edge to resize</span></footer>
    </aside>
    {inspectorTabs && <aside className="lab-control-panel lab-control-panel--right" aria-label="Selected section editor" hidden={!visible || fullPreview}>
      <div className="lab-panel-resize" role="separator" aria-label="Resize section editor" aria-orientation="vertical" aria-valuemin={260} aria-valuemax={560} aria-valuenow={width} tabIndex={0} onPointerDown={event=>{event.preventDefault();dragging.current={x:event.clientX,width};event.currentTarget.setPointerCapture(event.pointerId);}} onPointerMove={event=>{if(dragging.current)resize(dragging.current.width+dragging.current.x-event.clientX);}} onPointerUp={()=>{dragging.current=null;}} onPointerCancel={()=>{dragging.current=null;}} onKeyDown={event=>{if(event.key==="ArrowLeft"||event.key==="ArrowRight"){event.preventDefault();resize(width+(event.key==="ArrowLeft"?20:-20));}}}><span/></div>
      <div className="lab-panel-heading"><span>Section editor</span></div>
      <div className="lab-panel-tabs" role="tablist" aria-label="Section controls">{inspectorTabs.map((tab, index) => <button key={tab.id} id={`${panelId}-inspector-${tab.id}-tab`} role="tab" type="button" aria-selected={inspectorTab === tab.id} tabIndex={inspectorTab === tab.id ? 0 : -1} aria-controls={`${panelId}-inspector-${tab.id}`} onClick={() => onInspectorTabChange?.(tab.id)} onKeyDown={event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? inspectorTabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + inspectorTabs.length) % inspectorTabs.length;
        onInspectorTabChange?.(inspectorTabs[next].id); document.getElementById(`${panelId}-inspector-${inspectorTabs[next].id}-tab`)?.focus();
      }}>{tab.label}</button>)}</div>
      <div className="lab-panel-content">{inspectorTabs.map(tab => <div key={tab.id} id={`${panelId}-inspector-${tab.id}`} role="tabpanel" aria-labelledby={`${panelId}-inspector-${tab.id}-tab`} hidden={inspectorTab !== tab.id}>{tab.content}</div>)}</div>
    </aside>}
    {fullPreview && <div className="lab-preview-return" style={{ left: exitPosition.x, top: exitPosition.y }}>
      <button type="button" aria-label="Move preview exit control" title="Drag to move; arrow keys reposition" className="lab-preview-grip" onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); exitDrag.current={x:event.clientX,y:event.clientY,originX:exitPosition.x,originY:exitPosition.y}; }} onPointerMove={event => { if (!exitDrag.current) return; const drag=exitDrag.current; setExitPosition({x:Math.max(8,Math.min(window.innerWidth-180,drag.originX+event.clientX-drag.x)),y:Math.max(8,Math.min(window.innerHeight-52,drag.originY+event.clientY-drag.y))}); }} onPointerUp={() => {exitDrag.current=null;}} onPointerCancel={() => {exitDrag.current=null;}} onKeyDown={event => { if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key))return;event.preventDefault();setExitPosition(previous=>({x:Math.max(8,Math.min(window.innerWidth-180,previous.x+(event.key==="ArrowLeft"?-20:event.key==="ArrowRight"?20:0))),y:Math.max(8,Math.min(window.innerHeight-52,previous.y+(event.key==="ArrowUp"?-20:event.key==="ArrowDown"?20:0)))})); }}>⠿</button>
      <button type="button" onClick={leavePreview}>Exit preview <span>Esc</span></button>
    </div>}
  </section>;
}
