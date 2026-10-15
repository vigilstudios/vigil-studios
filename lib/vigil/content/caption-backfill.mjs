/** Recover only empty legacy primary-media captions from a reviewed import manifest. */
export function recoverPrimaryCaptions(records, captions) {
 const changes=[];
 const next=records.map(record=>{
  const media=record.data?.media,caption=captions[record.slug];
  if(typeof caption!=='string'||!caption||caption.length>400||!Array.isArray(media)||!media.length||media[0].caption)return record;
  changes.push(record.id);
  return {...record,data:{...record.data,media:media.map((m,i)=>i===0?{...m,caption}:m)}};
 });
 return {records:next,changes};
}
