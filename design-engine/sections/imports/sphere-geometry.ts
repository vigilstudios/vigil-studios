/** Deterministic equal-area distribution; no pairwise collision pass or repeated filler. */
export function spherePoint(index:number,count:number,xRotation:number,yRotation:number) {
 const y=1-2*(index+.5)/count,ring=Math.sqrt(Math.max(0,1-y*y)),angle=index*Math.PI*(3-Math.sqrt(5));
 const x=ring*Math.cos(angle),z=ring*Math.sin(angle);
 const xx=x*Math.cos(yRotation)+z*Math.sin(yRotation),zz=-x*Math.sin(yRotation)+z*Math.cos(yRotation);
 return {x:xx,y:y*Math.cos(xRotation)-zz*Math.sin(xRotation),z:y*Math.sin(xRotation)+zz*Math.cos(xRotation)};
}
