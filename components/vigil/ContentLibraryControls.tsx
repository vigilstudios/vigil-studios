'use client';
import {LayoutGrid,Table2,Search,Archive,FilePenLine} from 'lucide-react';
import './content-library.css';
import {inputClass} from './ui';
export type LibraryFilter='all'|'drafts'|'trash';
export type LibraryLayout='table'|'feed';
/** Shared collection controls: the same words and placement for every module. */
export function ContentLibraryControls({filter,onFilter,drafts,trash,search,onSearch,layout,onLayout,entryLabel='post',entriesLabel='posts'}:{filter:LibraryFilter;onFilter:(filter:LibraryFilter)=>void;drafts:number;trash:number;search:string;onSearch:(search:string)=>void;layout:LibraryLayout;onLayout:(layout:LibraryLayout)=>void;entryLabel?:string;entriesLabel?:string}){
 const article=/^[aeiou]/i.test(entryLabel)?'an':'a';
 return <div className="library-controls"><div className="library-filters" role="group" aria-label={`${entriesLabel} collection`}>{(['all','drafts','trash'] as const).map(value=><button type="button" key={value} aria-pressed={filter===value} onClick={()=>onFilter(value)}>{value==='drafts'?<FilePenLine size={14}/>:value==='trash'?<Archive size={14}/>:null}{value==='all'?`All ${entriesLabel}`:value==='drafts'?`Drafts (${drafts})`:`Trash (${trash})`}</button>)}</div>
 <div className="library-search-layout"><label className="library-search"><Search size={16} aria-hidden/><span className="sr-only">Find {article} {entryLabel}</span><input type="search" className={inputClass.replace('text-[13px]','text-base')} placeholder={`Find ${article} ${entryLabel}…`} value={search} onChange={e=>onSearch(e.target.value)}/></label><div className="library-layout" role="group" aria-label="Collection layout">{(['table','feed'] as const).map(mode=><button type="button" key={mode} aria-pressed={layout===mode} onClick={()=>onLayout(mode)}>{mode==='table'?<Table2 size={16} aria-hidden/>:<LayoutGrid size={16} aria-hidden/>}{mode==='table'?'Table':`${entryLabel[0].toUpperCase()+entryLabel.slice(1)} feed`}</button>)}</div></div></div>;
}
