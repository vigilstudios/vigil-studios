'use client';
import {LayoutList,Table2} from 'lucide-react';
import './content-library.css';
import {inputClass} from './ui';
export type LibraryFilter='all'|'drafts'|'trash';
export type LibraryLayout='table'|'feed';
/** Shared collection controls: the same words and placement for every module. */
export function ContentLibraryControls({filter,onFilter,drafts,trash,search,onSearch,layout,onLayout}:{filter:LibraryFilter;onFilter:(filter:LibraryFilter)=>void;drafts:number;trash:number;search:string;onSearch:(search:string)=>void;layout:LibraryLayout;onLayout:(layout:LibraryLayout)=>void}){
 return <><div className="library-filters" role="group" aria-label="Post collection">{(['all','drafts','trash'] as const).map(value=><button type="button" key={value} aria-pressed={filter===value} onClick={()=>onFilter(value)}>{value==='all'?'All posts':value==='drafts'?`Drafts (${drafts})`:`Trash (${trash})`}</button>)}</div>
 <div className="library-search-layout"><label className="library-search"><span className="sr-only">Find a post</span><input type="search" className={inputClass.replace('text-[13px]','text-base')} placeholder="Find a post…" value={search} onChange={e=>onSearch(e.target.value)}/></label><div className="library-layout" role="group" aria-label="Collection layout">{(['table','feed'] as const).map(mode=><button type="button" key={mode} aria-pressed={layout===mode} onClick={()=>onLayout(mode)}>{mode==='table'?<Table2 size={16} aria-hidden/>:<LayoutList size={16} aria-hidden/>}{mode==='table'?'Table':'Post feed'}</button>)}</div></div></>;
}
