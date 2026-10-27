/**
 * Native adaptation of ThreeUI Community's Gallery by Meng To (MIT).
 * Source: MengTo/threeui @ 68802d5428071ada5c20db8094b1649e6bb770ed
 * src/shaders/gallery/Gallery.tsx
 * Adapted curved image panels, scene lifecycle, visibility-aware animation and cleanup.
 * The original screenshots are Ethan's existing, explicitly labelled public evidence.
 * See /public/vendor/threeui/SOURCE.md and LICENSE.
 */
import {
  Scene, PerspectiveCamera, WebGLRenderer, Group, CylinderGeometry,
  BufferGeometry, Float32BufferAttribute, MeshBasicMaterial, Mesh,
  LineBasicMaterial, LineLoop, PointsMaterial, Points, CanvasTexture,
  SRGBColorSpace, DoubleSide, AdditiveBlending, Vector3,
} from '../vendor/threejs/three.module.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max,value));

export function createThreeUIGallery({canvas, pictures, onFrame, onFailure, onContextLost, onContextRestored}) {
  const scene = new Scene();
  const camera = new PerspectiveCamera(36, 1, 0.1, 60);
  const renderer = new WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'low-power'});
  renderer.setClearColor(0x0b100d, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(1);
  const gallery = new Group();
  const ornaments = new Group();
  scene.add(ornaments, gallery);
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const requests = new AbortController();
  const pointer = {x:0,y:0,currentX:0,currentY:0};
  let disposed = false, complete = false, running = false, lost = false, restoreCount = 0;
  let frames = 0, elapsed = 0, previousTime = 0, scrollProgress = 0, currentProgress = 0;
  let bufferWidth = 1, bufferHeight = 1, measuredWidth = 0, measuredHeight = 0, smallScreen = false;
  const panels = [], orbitalNodes = [];
  const keepGeometry = item => { geometries.add(item); return item; };
  const keepMaterial = item => { materials.add(item); return item; };
  const keepTexture = item => { textures.add(item); return item; };

  function loadPicture(src) {
    return new Promise((resolve,reject) => {
      const image = new Image();
      let settled = false;
      const finish = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        requests.signal.removeEventListener('abort',cancel);
        image.onload = image.onerror = null;
        if (error) reject(error);
        else resolve(image);
      };
      const cancel = () => { image.removeAttribute('src'); finish(new Error('Hero disposed')); };
      const timeout = setTimeout(() => finish(new Error('Hero image unavailable')),8000);
      image.onload = () => finish();
      image.onerror = () => finish(new Error('Hero image unavailable'));
      requests.signal.addEventListener('abort',cancel,{once:true});
      image.decoding = 'async';
      image.src = src;
    });
  }

  function cardTexture(image, picture, index) {
    const surface = document.createElement('canvas');
    surface.width = 1024; surface.height = 680;
    const context = surface.getContext('2d');
    if (!context) throw new Error('Hero texture unavailable');
    context.fillStyle = '#172019';
    context.beginPath(); context.roundRect(0,0,1024,680,24); context.fill();
    context.strokeStyle = 'rgba(204,245,164,.32)'; context.lineWidth = 2;
    context.beginPath(); context.roundRect(1,1,1022,678,23); context.stroke();
    context.fillStyle = index === 0 ? '#d7ff71' : '#a4b896';
    context.beginPath(); context.arc(36,37,6,0,Math.PI*2); context.fill();
    context.font = '600 24px ui-monospace, Menlo, Consolas, monospace';
    context.fillStyle = '#edf3e8'; context.fillText(picture.title,59,45);
    context.font = '18px ui-monospace, Menlo, Consolas, monospace';
    context.fillStyle = '#b1bba9'; context.fillText(`0${index+1} / SELECTED WORK`,735,44);
    // Contain the complete screenshot: evidence qualifiers and source notes stay intact.
    const area = {x:22,y:72,width:980,height:550};
    context.fillStyle = index === 2 ? '#222b2a' : '#e9eee8';
    context.fillRect(area.x,area.y,area.width,area.height);
    const scale = Math.min(area.width/image.naturalWidth, area.height/image.naturalHeight);
    const width = image.naturalWidth*scale, height = image.naturalHeight*scale;
    context.drawImage(image,area.x+(area.width-width)/2,area.y+(area.height-height)/2,width,height);
    context.fillStyle = '#aebfa5';
    context.font = '18px ui-monospace, Menlo, Consolas, monospace';
    context.fillText(picture.note,25,655);
    const texture = keepTexture(new CanvasTexture(surface));
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = Math.min(4,renderer.capabilities.getMaxAnisotropy());
    return texture;
  }

  function curvedOutline(radius,height,angle) {
    const points = [];
    for (let i=0;i<=40;i++) {
      const a=-angle/2+i/40*angle;
      points.push(new Vector3(Math.sin(a)*radius,height/2,Math.cos(a)*radius-radius+.015));
    }
    for (let i=40;i>=0;i--) {
      const a=-angle/2+i/40*angle;
      points.push(new Vector3(Math.sin(a)*radius,-height/2,Math.cos(a)*radius-radius+.015));
    }
    return keepGeometry(new BufferGeometry().setFromPoints(points));
  }

  function buildPanels(images) {
    const radius=8, height=3.16, angle=.61;
    // ThreeUI's open CylinderGeometry gives each real screenshot a tangible curved surface.
    const geometry=keepGeometry(new CylinderGeometry(radius,radius,height,40,1,true,-angle/2,angle));
    geometry.translate(0,0,-radius);
    const outline=curvedOutline(radius,height,angle);
    const positions = [
      {x:.0,y:1.2,z:.1,yaw:-.06,roll:-.055,scale:1},
      {x:-1.65,y:-1.0,z:-.6,yaw:.27,roll:.065,scale:.82},
      {x:1.64,y:-1.3,z:1.1,yaw:-.24,roll:-.075,scale:.84},
    ];
    images.forEach((image,index) => {
      const texture=cardTexture(image,pictures[index],index);
      const material=keepMaterial(new MeshBasicMaterial({map:texture,side:DoubleSide,transparent:true,toneMapped:false}));
      const panel=new Group();
      const mesh=new Mesh(geometry,material);
      const borderMaterial=keepMaterial(new LineBasicMaterial({color:index===0?0xd7ff71:0x9fc889,transparent:true,opacity:index===0?.82:.48}));
      panel.add(mesh,new LineLoop(outline,borderMaterial));
      const position=positions[index];
      panel.position.set(position.x,position.y,position.z);
      panel.rotation.set(0,position.yaw,position.roll);
      panel.scale.setScalar(position.scale);
      panels.push({panel,base:position,index});
      gallery.add(panel);
    });
  }

  function buildOrbits() {
    const paths=[
      {rx:4.1,ry:3.0,rz:.2,rotation:.22,opacity:.38},
      {rx:3.72,ry:2.7,rz:1.55,rotation:-.58,opacity:.2},
      {rx:3.9,ry:1.25,rz:2.0,rotation:.30,opacity:.24},
    ];
    paths.forEach((path,index) => {
      const points=Array.from({length:144},(_,i)=>{
        const angle=i/144*Math.PI*2;
        return new Vector3(Math.cos(angle)*path.rx,Math.sin(angle)*path.ry,Math.sin(angle)*path.rz-1.5);
      });
      const geometry=keepGeometry(new BufferGeometry().setFromPoints(points));
      const material=keepMaterial(new LineBasicMaterial({color:0xcfff72,transparent:true,opacity:path.opacity,depthWrite:false}));
      const line=new LineLoop(geometry,material);
      line.rotation.z=path.rotation;
      ornaments.add(line);
      orbitalNodes.push({path,line,index});
    });
    const positions=[];
    // A deterministic, sparse field. No per-frame allocation or thousands of particles.
    for(let i=0;i<46;i++) {
      const angle=i*2.39996323;
      const radius=3.15+(i%7)*.16;
      positions.push(Math.cos(angle)*radius,Math.sin(angle)*radius*.85,-1.9+Math.sin(i*1.7)*.6);
    }
    const geometry=keepGeometry(new BufferGeometry());
    geometry.setAttribute('position',new Float32BufferAttribute(positions,3));
    const material=keepMaterial(new PointsMaterial({color:0xcfff72,size:.027,transparent:true,opacity:.68,depthWrite:false,blending:AdditiveBlending}));
    ornaments.add(new Points(geometry,material));
    const beaconGeometry=keepGeometry(new BufferGeometry());
    beaconGeometry.setAttribute('position',new Float32BufferAttribute([-3.8,.8,-1.5,3.6,1.6,-1.3,1.2,-3,-1.4],3));
    const beaconMaterial=keepMaterial(new PointsMaterial({color:0xe2ffa5,size:.09,transparent:true,opacity:.85,depthWrite:false,blending:AdditiveBlending}));
    ornaments.add(new Points(beaconGeometry,beaconMaterial));
  }

  function publishFrame() {
    onFrame?.(frames,{drawCalls:renderer.info.render.calls,width:bufferWidth,height:bufferHeight});
  }
  function render(time=performance.now()) {
    if (disposed || lost || !complete) return false;
    try {
      if (renderer.getContext().isContextLost()) return false;
      const delta=previousTime ? Math.min((time-previousTime)/1000,.05) : 0;
      previousTime=time;
      elapsed+=delta;
      const damping=1-Math.exp(-Math.max(delta,1/60)*5);
      pointer.currentX+=(pointer.x-pointer.currentX)*damping;
      pointer.currentY+=(pointer.y-pointer.currentY)*damping;
      currentProgress+=(scrollProgress-currentProgress)*damping;
      gallery.rotation.set(-.075-pointer.currentY*.065,-.08+pointer.currentX*.13+currentProgress*.18,-.04);
      gallery.position.y=-currentProgress*.42;
      ornaments.rotation.y=pointer.currentX*.06+Math.sin(elapsed*.15)*.06;
      ornaments.rotation.z=Math.sin(elapsed*.12)*.035;
      panels.forEach(({panel,base,index})=>{
        panel.position.y=base.y+Math.sin(elapsed*.55+index*1.7)*.065;
        panel.rotation.y=base.yaw+Math.sin(elapsed*.35+index)*.025;
      });
      renderer.render(scene,camera);
      frames++;
      publishFrame();
      return true;
    } catch {
      setRunning(false);
      onFailure?.();
      return false;
    }
  }

  function tick(time) {
    if (!running || disposed || lost || !complete) return;
    const interval=1000/(smallScreen?30:60);
    if(previousTime && time-previousTime<interval-1.5) return;
    render(time);
  }
  function setRunning(value) {
    const next=Boolean(value && !disposed && !lost && complete);
    if(next===running) return;
    running=next;
    previousTime=0;
    if (running) {
      if(render() && running && !disposed) renderer.setAnimationLoop(tick);
    } else {
      renderer.setAnimationLoop(null);
      publishFrame();
    }
  }

  function resize(width,height) {
    if(disposed || lost || width<1 || height<1) return;
    smallScreen=width<520;
    const pixelLimit=smallScreen?900000:1500000;
    const ratio=Math.min(devicePixelRatio||1,smallScreen?1.25:1.5);
    const scale=Math.min(1,Math.sqrt(pixelLimit/(width*height*ratio*ratio)));
    const nextWidth=Math.max(1,Math.floor(width*ratio*scale));
    const nextHeight=Math.max(1,Math.floor(height*ratio*scale));
    if(nextWidth===bufferWidth && nextHeight===bufferHeight && width===measuredWidth && height===measuredHeight) return;
    measuredWidth=width;measuredHeight=height;
    if(nextWidth!==bufferWidth || nextHeight!==bufferHeight) {
      bufferWidth=nextWidth;bufferHeight=nextHeight;
      renderer.setSize(bufferWidth,bufferHeight,false);
    }
    camera.aspect=width/height;
    camera.position.set(0,0,Math.max(12.9,8.7/(2*Math.tan(Math.PI/10)*camera.aspect)));
    camera.updateProjectionMatrix();
    // Resize never renders by itself: hidden/offscreen/disabled means zero draw calls.
  }

  function handleLost(event) {
    event.preventDefault();
    lost=true;
    setRunning(false);
    onContextLost?.();
  }
  function handleRestored() {
    if(disposed) return;
    restoreCount++;
    if(restoreCount>1) {onFailure?.();return;}
    // Three.js rebuilds its GL internals before this later-registered event handler.
    lost=false;
    previousTime=0;
    textures.forEach(texture=>{texture.needsUpdate=true;});
    onContextRestored?.();
  }
  canvas.addEventListener('webglcontextlost',handleLost);
  canvas.addEventListener('webglcontextrestored',handleRestored);

  function dispose() {
    if(disposed) return;
    setRunning(false);
    disposed=true;
    requests.abort();
    canvas.removeEventListener('webglcontextlost',handleLost);
    canvas.removeEventListener('webglcontextrestored',handleRestored);
    scene.clear();
    geometries.forEach(item=>item.dispose());
    materials.forEach(item=>item.dispose());
    textures.forEach(item=>item.dispose());
    geometries.clear();materials.clear();textures.clear();
    renderer.dispose();
  }

  const ready=Promise.all(pictures.map(picture=>loadPicture(picture.src))).then(images=>{
    if(disposed) throw new Error('Hero disposed');
    buildPanels(images);
    buildOrbits();
    complete=true;
  });
  return {
    ready, setRunning, resize, dispose,
    setPointer(x,y) {pointer.x=clamp(x,-1,1);pointer.y=clamp(y,-1,1);},
    setProgress(value) {scrollProgress=clamp(value,0,1);},
  };
}
