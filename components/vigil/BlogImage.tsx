/* eslint-disable @next/next/no-img-element */
import type {BlogImage as Image} from '@/lib/vigil/blog/media-contract';
export function BlogImage({image}:{image:Image}){return <figure className="my-6"><img src={image.url} alt={image.alt} width={image.width} height={image.height} className="mx-auto h-auto max-h-[640px] w-full rounded-xl object-contain"/>{image.caption&&<figcaption className="mt-2 text-center text-sm text-[color:var(--text-secondary)]">{image.caption}</figcaption>}</figure>;}
