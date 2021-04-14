function mainSmartEditor2D(){
	// Assegnazione variabili
	// Input da/verso processo
	var input_NumeroTreni = document.getElementById("RDVAR_NumeroTreni");
	var input_LunghezzaTreni = document.getElementById("RDVAR_LunghezzaTreni");
	var input_ProfonditaTreni = document.getElementById("RDVAR_ProfonditaTreni");
	var input_HSpalle = document.getElementById("RDVAR_HSpalle");
	var input_NumLivCampata = document.getElementById("RDVAR_NumLivCampata");
	var input_CampatePerTreno = document.getElementById("RDVAR_CampatePerTreno");
	var input_SpallaDoppia = document.getElementById("RDVAR_SpallaDoppia");
	var input_UserData = document.getElementById("RDVAR_UserData");
	var input_HPiano = document.getElementById("RDVAR_HPiano");
	var input_LPiano = document.getElementById("RDVAR_LPiano");
	// Variabili Smart Editor
	var SmartEditorCanvas = document.getElementById("SmartEditorCanvas");
	SmartEditorCanvas.innerWidth = 0.8*window.innerWidth;
	SmartEditorCanvas.innerHeight = window.innerHeight;
	var GUICanvas = document.getElementById("GUICanvas");
	GUICanvas.innerWidth = 0.2*window.innerWidth;
	GUICanvas.innerHeight = window.innerHeight;
	var scene, camera, renderer, controls, stats, gui;
	var floor;
	var height = parseInt(input_HPiano.value);
	var width = parseInt(input_LPiano.value);
	var settings = {
		Larghezza: width,
		Altezza: height,
		Treni: parseInt(input_NumeroTreni.value),
		CampatexTreno: parseInt(input_CampatePerTreno.value),
		LunghezzaTreni: parseInt(input_LunghezzaTreni.value),
		ProfonditaTreni: parseInt(input_ProfonditaTreni.value),
		DoppiaSpalla: (input_SpallaDoppia.value.toLowerCase() == 'true'),
		AltezzaSpalle: parseInt(input_HSpalle.value),
		showNames:false,
		LivellixCampata: parseInt(input_NumLivCampata.value)
	}
	var trains_folder, all_trains_folder, draw_trains_mode, trains, train_portapallet, info_train, train_selected, campata_selected, dragging_train;
	var all_campate = [];
	var all_trains = [];
	var duplication_mode, liv_folder, info_campata; 
	var duplicating_train = false;
	var floor_name = "Floor";
	var train_name = "Treno";
	var campata_name = "Campata";
	var point_material = new THREE.LineBasicMaterial({
		color: 0x000000
	});
	
	// Avvio delle funzioni principali
	Start();		
	buildGui();	
	Update();
	
	
	// Elimina gui se presente
	function clearGui() {
		if ( gui ) gui.destroy();
		gui = new dat.GUI( { autoPlace: true, width:300,  font:120 } );
		GUICanvas.appendChild(gui.domElement);
		gui.domElement.id = 'gui';
		gui.open();
		
	}
	
	// Crea gui
	function buildGui() {
		
		clearGui();
		// Controlli per la gestione del pavimento
		var dimensions = gui.addFolder("Dimensioni Pavimento");
		dimensions.add(settings, "Larghezza").min(1000).step(100).onChange(function(newVal){
			width = newVal;
			drawFloor();
			input_LPiano.value = newVal;
			
		});
		dimensions.add(settings, "Altezza").min(1000).step(100).onChange(function(newVal){
			height = newVal;
			drawFloor();
			input_HPiano.value = newVal;
		});
		// Controlli per la gestione dei treni
		trains_folder = gui.addFolder("Treni");
		all_trains_folder = trains_folder.addFolder("Tutti i Treni");
		all_trains_folder.add(settings, "Treni").min(0).step(1).name("Numero Treni").onChange(function(newVal){
			input_NumeroTreni.value = newVal;
			drawTrains(newVal, this.object.LunghezzaTreni, this.object.ProfonditaTreni, this.object.AltezzaSpalle, this.object.CampatexTreno, this.object.DoppiaSpalla,  this.object.showNames,  this.object.LivellixCampata );
		});
		all_trains_folder.add(settings, "LunghezzaTreni").min(1000).step(100).name("Lunghezza Treni").onChange(function(newVal){
			input_LunghezzaTreni.value = newVal;
			drawTrains(this.object.Treni, newVal, this.object.ProfonditaTreni, this.object.AltezzaSpalle, this.object.CampatexTreno, this.object.DoppiaSpalla,  this.object.showNames,  this.object.LivellixCampata );
		});
		all_trains_folder.add(settings, "ProfonditaTreni").min(500).step(10).name("Profondit&agrave; Treni").onChange(function(newVal){
			input_ProfonditaTreni.value = newVal;
			drawTrains(this.object.Treni,  this.object.LunghezzaTreni, newVal, this.object.AltezzaSpalle, this.object.CampatexTreno, this.object.DoppiaSpalla,  this.object.showNames,  this.object.LivellixCampata );
		});
		all_trains_folder.add(settings, "AltezzaSpalle").min(1000).step(100).name("Altezza Spalle").onChange(function(newVal){
			input_HSpalle.value = newVal;
			scene.traverse(child => {
				if(child.name.startsWith(train_name)){
					child.userData.Altezza = newVal;					child.children.forEach(c=>{						if(c.name!="Helper"){							c.userData.Altezza=newVal;							c.userData.AltezzeLivelli = evaluate_altezze_livelli(c.userData.Altezza, c.userData.Livelli);						}					});
				}
			});
		});
		all_trains_folder.add(settings, "LivellixCampata").min(1).step(1).name("Livelli x Campata").onChange(function(newVal){
			input_NumLivCampata.value = newVal;
			scene.traverse(child => {
				if(child.name.startsWith(train_name)){
					child.userData.Livelli = newVal;					child.children.forEach(c=>{						if(c.name!="Helper"){							c.userData.Livelli=newVal;							c.userData.AltezzeLivelli = evaluate_altezze_livelli(c.userData.Altezza, c.userData.Livelli);						}					});
				}
			});
		});
		all_trains_folder.add(settings, "CampatexTreno").min(1).step(1).name("Campate x Treno").onChange(function(newVal){
			input_CampatePerTreno.value = newVal;
			drawTrains(this.object.Treni,  this.object.LunghezzaTreni, this.object.ProfonditaTreni, this.object.AltezzaSpalle, newVal,   this.object.DoppiaSpalla,  this.object.showNames,  this.object.LivellixCampata );
		});
		all_trains_folder.add(settings, "DoppiaSpalla").name("Doppia Spalla").onChange(function(newVal){
			input_SpallaDoppia.value = newVal;
			drawTrains(this.object.Treni,  this.object.LunghezzaTreni, this.object.ProfonditaTreni, this.object.AltezzaSpalle, this.object.CampatexTreno, newVal,  this.object.showNames,  this.object.LivellixCampata  );
		});		all_trains_folder.add(settings, "showNames").name("Mostra Nomi").onChange(function(newVal){
			scene.traverse(child =>{
				if(child.name=="Testo"){
					child.parent.parent.userData.showNames = newVal;
					child.visible = newVal;
				}
			});
		});
		info_train = trains_folder.addFolder("Info Treno");
		info_train.__ul.setAttribute("style", "display: none");		var utils_f = {			Accoppia: function(){				var object_gui = gui.__folders["Treni"].__folders["Tutti i Treni"].__controllers[0].object;				var treni = object_gui.Treni;				var lunghezza=object_gui.LunghezzaTreni;				var profondita=object_gui.ProfonditaTreni;				var altezzaSpalle=object_gui.AltezzaSpalle;				var campate=object_gui.CampatexTreno;				var doppiaspalla=object_gui.DoppiaSpalla;				var showNames=object_gui.showNames;				var livellixCampata = object_gui.LivellixCampata;				var toRemove = [];				scene.traverse(child =>{					if(child.name.startsWith(train_name) || child.name=="Helper"){						toRemove.push(child);					}				});				train_selected = undefined;				campata_selected = undefined;				if (info_train !== undefined){ info_train.__ul.setAttribute("style", "display: none")}				all_campate = [];				toRemove.forEach(el => {scene.remove(el);});				var interval_z = (height-(profondita*treni))/(1+Math.round(treni/2));				var interval_x = (width - lunghezza)/2;				var start_p = new THREE.Vector3(interval_x, altezzaSpalle, interval_z);				var mod = Math.floor(treni/27);				for(var t = 1; t<=treni; t++){					var remainder = (t-1) % 26;					var t_name = String.fromCharCode(97+remainder).toUpperCase();					if (mod>0){						var idx_name = Math.floor((t-1)/26)+1;						t_name += idx_name;					}					draw2Dtrain( 						t_name, 						start_p, 						lunghezza, 						profondita, 						altezzaSpalle, 						campate, 						doppiaspalla, 						showNames, 						livellixCampata,						[]					);					if (( t % 2 ) == 1){						start_p.z += profondita+1;					} else {						start_p.z += interval_z+profondita;					}				}				get_trains();			}		}		all_trains_folder.add(utils_f, "Accoppia");
		setGuiSize();
	}

	// Funzione che setta il font della dat.gui
	function setGuiSize(){
		var elements = document.getElementsByClassName("dg");
		for(var el of elements){
			el.style.fontSize = "16px";
		}
	}
	
	// Funzione per modificare la visualizzazione quando lo SmartEditorCanvas viene ridimensionato
	function onResize() {
		SmartEditorCanvas.innerWidth = 0.8*window.innerWidth;
		SmartEditorCanvas.innerHeight = window.innerHeight;
		renderer.setSize( SmartEditorCanvas.innerWidth, SmartEditorCanvas.innerHeight );
		camera.left = SmartEditorCanvas.innerWidth / - 2;
		camera.right = SmartEditorCanvas.innerWidth / 2;
		camera.top = SmartEditorCanvas.innerHeight / 2;
		camera.bottom = SmartEditorCanvas.innerHeight / -2;
		camera.updateProjectionMatrix();
		GUICanvas.innerWidth = 0.2*window.innerWidth;
		GUICanvas.innerHeight = window.innerHeight;	
		gui.width = GUICanvas.innerWidth-20;
	}	

	// Funzione che genera la scena all'apertura della pagina web
	function Start() {
		// Scena
		scene = new THREE.Scene();
		scene.name= "Scene";
		// Camera
		camera = new THREE.OrthographicCamera(100* SmartEditorCanvas.innerWidth  / - 2, 100*SmartEditorCanvas.innerWidth  / 2, 100*SmartEditorCanvas.innerHeight / 2,100* SmartEditorCanvas.innerHeight / - 2, 0, 9999999999999999999  );
		camera.position.set(75000, 100000, 75000);
		camera.zoom=0.004;
		camera.updateProjectionMatrix();
		camera.name = "Camera";
		scene.add(camera);
		// Render	
		renderer = new THREE.WebGLRenderer( {antialias: true} );
		renderer.setSize( SmartEditorCanvas.innerWidth, SmartEditorCanvas.innerHeight );
		renderer.setClearColor( 0x252850 );
		renderer.setPixelRatio( SmartEditorCanvas.devicePixelRatio );
		SmartEditorCanvas.appendChild( renderer.domElement );
		// Controllo dei moviementi della camera
		controls = new THREE.OrbitControls( camera, renderer.domElement  );
		controls.addEventListener( 'change', Render );
		controls.target.set(75000, 0, 75000);
		controls.update();
		// Statistiche fps in alto a sinistra del canvas
		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		SmartEditorCanvas.appendChild( stats.domElement );
		// Chiama onResize() quando viene modificata la dimensione della pagina
		window.addEventListener( 'resize', onResize, false );
		// Chiamata a funzioni che disegnano il pavimento e rigenenera la scena
		drawFloor();	
		restoreScene();	
		removeElFromScene("Helper");
		train_selected = undefined;
		campata_selected = undefined;				
	}

	// Funzioni per l'aggiornamento e il render della pagina
	function Update() {
		camera.position.setX(controls.target.x);
		camera.position.setZ(controls.target.z);
		controls.update();
		stats.update();
		evaluate_userData();
		// Setta la grandezza della sprite con la scritta all'interno delle campate in base allo zoom		var scaleFactor = 10;		var min_scale = Infinity;		if( all_campate.length>0 ){			all_campate.forEach( camp =>{				camp.children.forEach(obj =>{					if(obj.name=="Testo") {							var scaleVector = new THREE.Vector3();						var scale = scaleVector.subVectors(camp.position, camera.position).length() / scaleFactor;						if (scale<min_scale){							min_scale = scale;						}					}				});			});			all_campate.forEach( camp =>{				camp.children.forEach(obj =>{					if(obj.name=="Testo") {							obj.scale.set(min_scale, min_scale, 1);						obj.position.set(0, 0, 4000);					}				});			});		}
		Render();
		requestAnimationFrame( Update );
	}

	// Funzione per effettuare il render della pagina
	function Render(){
		renderer.render(scene, camera);
	}
	

	// Funzione che disegna il pavimento
	function drawFloor(){
		removeElFromScene(floor_name);
		if (height>0 && width>0){
			var geometry = new THREE.BoxGeometry( width, 1, height );
			var material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
			floor = new THREE.Mesh( geometry, material );
			floor.position.set(width/2, 0, height/2);
			floor.name=floor_name;
			scene.add( floor );
		} 
	}
	
	// Funzione che rigenera la scena dal valore di "input_UserData"
	function restoreScene(){
		if (input_UserData.value.length>0){
			var str_val = input_UserData.value;			var trains_data = JSON.parse(str_val);			trains_data.forEach(t_data =>{
				var id = t_data.userData.id;
				var start_p = t_data.userData.start_p;
				var lunghezza = t_data.userData.Lunghezza;
				var profondita = t_data.userData.Profondita;
				var altezza = t_data.userData.Altezza;
				var campate = t_data.userData.Campate;
				var doppiaspalla = t_data.userData.DoppiaSpalla;
				var showNames = t_data.userData.ShowNames;
				var livellixCampata = t_data.userData.Livelli;
				var rotazione = t_data.userData.Rotazione;				var campate_data = t_data.userData.CampateData;				if (campate_data==undefined){					campate_data = [];					t_data.children.forEach(c=>{						campate_data.push(c.userData);					});				}
				draw2Dtrain( id, start_p, lunghezza, profondita, altezza, campate, doppiaspalla, showNames, livellixCampata, campate_data);
				scene.children.forEach(c=>{
					if(c.name==train_name+"-"+id){
						train_selected = c;
					}
				});
				restore_rotation(rotazione);
				t_data.children.forEach(c => {
					train_selected.children.forEach(c_s =>{
						if(c.name==c_s.name){							var old_data = c.userData.AltezzeLivelli;							old_data.sort(function(a, b){return a - b});							var new_data = {};							for(var i = 0;  i<old_data.length; i++){								new_data[(i+1).toString()] = old_data[i];
							}							c.userData.AltezzeLivelli = new_data;
							c_s.userData = c.userData;
						}
					});
				});
			});
			get_trains();
		} 
	}

	// Funzione per rimuovere dalla scena 2D tutti elementi che hanno l'attributo name="name"
	function removeElFromScene(name){
		var toRemove = [];
		scene.traverse(child =>{
			if(child.name===name){
				toRemove.push(child);
			}
		});
		toRemove.forEach(el => {
			el.parent.remove(el);
		});
		all_campate = [];
		get_trains();
	}

	// Funzione che aggiorna gli array all_trains e all_campate;
	function get_trains(){
		all_trains = [];
		scene.children.forEach(child =>{
			if (child.name.startsWith(train_name)){
				all_trains.push(child);
			}
		});
		all_campate = [];
		all_trains.forEach(t=>{
			t.children.forEach(child => {
				if (child.name !="Helper") { 
					all_campate.push(child)
				}
			});
		});
	}

	// Elimina (se ci sono) e disegna tutti treni in 2D con spazio in mezzo
	function drawTrains(treni, lunghezza, profondita, altezza, campate, doppiaspalla, showNames, livellixCampata ){
		var toRemove = [];
		scene.traverse(child =>{
			if(child.name.startsWith(train_name) || child.name=="Helper"){
				toRemove.push(child);
			}
		});
		train_selected = undefined;
		campata_selected = undefined;
		if (info_train !== undefined){ info_train.__ul.setAttribute("style", "display: none")}
		all_campate = [];
		toRemove.forEach(el => {scene.remove(el);});
		var interval_z = height/(treni+1);
		var interval_x = (width - lunghezza)/2;		var mod = Math.floor(treni/27);
		for(var t = 1; t<=treni; t++){			var remainder = (t-1) % 26;			var t_name = String.fromCharCode(97+remainder).toUpperCase();			if (mod>0){				var idx_name = Math.floor((t-1)/26)+1;				t_name += idx_name;			}
			var start_p = new THREE.Vector3(interval_x, altezza, t*interval_z-(profondita/2));
			draw2Dtrain( 				t_name, 				start_p, 				lunghezza, 				profondita, 				altezza, 				campate, 				doppiaspalla, 				showNames, 				livellixCampata,				[]			);
		}
		get_trains();
	}
	
	// Disegna singolo treno in 2D
	function draw2Dtrain(id_train, start_p, lunghezza, profondita, altezza, campate, doppiaspalla, showNames, livelli, campate_data){
		var dist_doppia_spalla = 100;
		var train_points = [];
		var campate_treno = [];		if (campate_data==undefined || campate_data.length != campate){			var interval = lunghezza/campate;
			for (var c = 0; c<campate; c++){				var _start_p = new THREE.Vector3(start_p.x+(interval*c), altezza, start_p.z);				if (doppiaspalla){					var p1 = new THREE.Vector3(_start_p.x, altezza, _start_p.z);					var p2 = new THREE.Vector3(p1.x+interval, altezza, p1.z);					if (c>0){						p1.x += (dist_doppia_spalla/2);					}					var p3 = new THREE.Vector3(p2.x, altezza, p2.z+profondita);					var p4 = new THREE.Vector3(p1.x, altezza, p3.z);					if((c+1)<campate){						p2.x -= (dist_doppia_spalla/2);						p3.x -= (dist_doppia_spalla/2);						train_points.push(p1, p2, p3, p4, p1);						var p5 = new THREE.Vector3(p2.x+dist_doppia_spalla, altezza, p2.z);						var p6 = new THREE.Vector3(p5.x, altezza, p3.z);						train_points.push(p5, p6, p3, p2);					} else {						train_points.push(p1, p2, p3, p4, p1);					}									}				else{					var p1 = _start_p;					var p2 = new THREE.Vector3(p1.x+interval, altezza, p1.z);					var p3 = new THREE.Vector3(p2.x, altezza, p2.z+profondita);					var p4 = new THREE.Vector3(p1.x, altezza, p3.z);					train_points.push(p1, p2, p3, p4, p1);				}								var min = p1;				var max = p3;				var box3 = new THREE.Box3(					min,					max				);
				var box = new THREE.OBB().fromBox3(box3);
				var c_name = id_train+"-"+(c+1);
				var center = box.center;
				var campata = new THREE.Object3D();
				campata.position.set(center.x, center.y, center.z);
				campata.boundingBox = box;
				campata.name = c_name;
				var sprite = createSprite(c_name);
				sprite.visible = showNames; 
				campata.add(sprite);								var u_d = {					"start_p": _start_p,					"Altezza": altezza,					"Profondita": profondita,					"Lunghezza": interval,					"Livelli": livelli,					"AltezzeLivelli": evaluate_altezze_livelli(altezza, livelli)									}				campata.userData = u_d;				campate_treno.push(campata);
			}					} else {			var id_c = 1;			for (_data of campate_data){				var lung_c = _data["Lunghezza"];				var prof_c = _data["Profondita"];				var _start_p = new THREE.Vector3(_data["start_p"].x, altezza, _data["start_p"].z);				if (doppiaspalla){					var p1 = new THREE.Vector3(_start_p.x, altezza, _start_p.z);					var p2 = new THREE.Vector3(p1.x+lung_c, altezza, p1.z);					if (id_c>1){						p1.x += (dist_doppia_spalla/2);					}					var p3 = new THREE.Vector3(p2.x, altezza, p2.z+prof_c);					var p4 = new THREE.Vector3(p1.x, altezza, p3.z);										if(id_c<campate_data.length){						p2.x -= (dist_doppia_spalla/2);						p3.x -= (dist_doppia_spalla/2);						train_points.push(p1, p2, p3, p4, p1);						var p5 = new THREE.Vector3(p2.x+dist_doppia_spalla, altezza, p2.z);						var p6 = new THREE.Vector3(p5.x, altezza, p3.z);						train_points.push(p5, p6, p3, p2);					} else {						train_points.push(p1, p2, p3, p4, p1);					}									}				else{					var p1 = _start_p;					var p2 = new THREE.Vector3(p1.x+lung_c, altezza, p1.z);					var p3 = new THREE.Vector3(p2.x, altezza, p2.z+prof_c);					var p4 = new THREE.Vector3(p1.x, altezza, p3.z);					train_points.push(p1, p2, p3, p4, p1);				}				var min = p1;				var max = p3;				var box3 = new THREE.Box3(					min,					max				);				var box = new THREE.OBB().fromBox3(box3);				var c_name = id_train+"-"+id_c;				var center = box.center;				var campata = new THREE.Object3D();				campata.position.set(center.x, center.y, center.z);				campata.boundingBox = box;				campata.name = c_name;				var sprite = createSprite(c_name);				sprite.visible = showNames; 				campata.add(sprite);				if (Array.isArray(_data["AltezzeLivelli"])){					var al_sorted = _data["AltezzeLivelli"].sort(function(a, b){return a - b});					var AltezzeLivelli = {};					var idx = 1;					for (var el of al_sorted){						AltezzeLivelli[idx.toString()] = el;						idx += 1;					}						} else {					var AltezzeLivelli = _data["AltezzeLivelli"];				}				var u_d = {					"start_p": _start_p,					"Altezza": _data["Altezza"],					"Profondita": prof_c,					"Lunghezza": lung_c,					"Livelli": _data["Livelli"],					"AltezzeLivelli": AltezzeLivelli				}				campata.userData = u_d;				campate_treno.push(campata);				id_c += 1;			}		}		var train_geom = new THREE.BufferGeometry().setFromPoints(train_points);		var train_mesh = new THREE.Line( train_geom, point_material);
		train_mesh.name = train_name+"-"+id_train;
		train_mesh.geometry.computeBoundingBox();
		campate_treno.forEach(camp => train_mesh.add(camp));
		var u_data = {
			id: id_train,
			start_p: new THREE.Vector3(start_p.x, start_p.y, start_p.z),
			Lunghezza: lunghezza,
			profondita: profondita,
			Altezza: altezza,
			Campate: campate,
			DoppiaSpalla: doppiaspalla,
			showNames: showNames,
			Livelli: livelli,
			Rotazione: 0
		}
		train_mesh.userData = u_data;
		train_mesh.renderOrder = 1;
		scene.add(train_mesh);
		all_campate = all_campate.concat(campate_treno);	
	}

	// Crea testo
	function createSprite(name){		var canvas = document.createElement('canvas');		canvas.width = 256;		canvas.height = 256;		var ctx = canvas.getContext("2d");		ctx.font = "44pt Arial";		ctx.fillStyle = "Black";		ctx.textAlign = "center";		ctx.fillText(name, 128, 44);		var tex = new THREE.Texture(canvas);		tex.needsUpdate = true;		var spriteMat = new THREE.SpriteMaterial({map: tex});		var sprite = new THREE.Sprite(spriteMat);		sprite.name = "Testo";		sprite.renderOrder=3;		return sprite;
	}

	// Genera una geometria a partire da un OBB (Oriented Bounding Box https://threejs.org/docs/#examples/en/math/OBB )
	function geom_from_obb(obb){
		var y = obb.center.y;
		var p1 = new THREE.Vector3(
			obb.center.x-obb.halfSize.x,
			y,
			obb.center.z-obb.halfSize.z
		).applyMatrix3(obb.rotation);
		var p2 = new THREE.Vector3(
			obb.center.x-obb.halfSize.x,
			y,
			obb.center.z+obb.halfSize.z
		).applyMatrix3(obb.rotation);
		var p3 = new THREE.Vector3(
			obb.center.x+obb.halfSize.x,
			y,
			obb.center.z+obb.halfSize.z
		).applyMatrix3(obb.rotation);
		var p4 = new THREE.Vector3(
			obb.center.x+obb.halfSize.x,
			y,
			obb.center.z-obb.halfSize.z
		).applyMatrix3(obb.rotation);
		var delta_x = (p1.x+p3.x)/2 - obb.center.x;
		var delta_z = (p1.z+p3.z)/2 - obb.center.z;
		p1.x -= delta_x;
		p1.z -= delta_z;
		p2.x -= delta_x;
		p2.z -= delta_z;
		p3.x -= delta_x;
		p3.z -= delta_z;
		p4.x -= delta_x;
		p4.z -= delta_z;
		var g = new THREE.BufferGeometry().setFromPoints([
			p1,
			p2,
			p3,
			p4,
			p1
		]);
		return g;
	}
	
	// Mostra il treno selezionato con in grigio e, se presente, la campata selezionata in rosso 
	function showTrainSelection(){
		removeElFromScene("Helper");
		train_selected.children.forEach(child => {
			var draw = false;
			if(campata_selected == undefined ){
				draw = true;
			} else {
				if (child.name !== campata_selected.name){
					draw = true;
				}
			}
			if (draw==true){
				var geom = geom_from_obb(child.boundingBox);
				var helper = new THREE.Line(geom, new THREE.LineBasicMaterial({color: 0x808080}));
				helper.name = "Helper";
				helper.renderOrder=2;
				train_selected.add(helper);
			}
		});
		if (campata_selected !== undefined){
			var geom = geom_from_obb(campata_selected.boundingBox);
			var helper = new THREE.Line(geom, new THREE.LineBasicMaterial({color: 0xff0000}));
			helper.name = "Helper";
			helper.renderOrder=2;
			train_selected.add(helper);
		}
	}

	// Funzione che popola i controlli della folder contenente le informazioni del treno selezionato
	function buildInfoTrain_folder(){
		var to_remove = [];
		info_train.__controllers.forEach(c => to_remove.push(c));
		if(Object.keys(info_train.__folders).length>0){
			var folder_to_remove = info_train.__folders["Info Campata"];
			folder_to_remove.close();			if (folder_to_remove.domElement.parentNode.parentNode != null) {
				info_train.__ul.removeChild(info_train.__folders["Info Campata"].domElement.parentNode);
				delete info_train.__folders["Info Campata"];			}
		}
		to_remove.forEach(c => info_train.remove(c));
		var info = {
			name: train_selected.name.substring(train_selected.name.indexOf("-") + 1)
		}
		var utils_f = {
			Delete: function(){
				scene.remove(train_selected);
				train_selected = undefined;
				campata_selected = undefined;
				info_train.__ul.setAttribute("style", "display: none");
				settings.Treni-=1;
				all_trains_folder.__controllers.forEach(c=> {
					if(c.property=="Treni"){
						c.updateDisplay();
					}
				});

			},
			Duplica: function(){
				duplicating_train = true;
			}
		}
		
		info_train.add(info, "name").name("Nome").onFinishChange(function(newVal){
			train_selected.name = train_name+"-"+newVal;
			train_selected.userData.id = newVal;
			train_selected.children.forEach(child =>{
				if (child.name != "Helper"){
					var old_name = child.name;
					var new_name = newVal+"-"+old_name.substring(old_name.indexOf("-") + 1);
					child.name = new_name;
					if (child.children.length>0){
						child.children[0].text = new_name;
					}
				}
			});
			
		}); 
	
		info_train.add(train_selected.userData, "Lunghezza").min(100).step(10).onChange(function(newVal){
			var old_rot = train_selected.userData.Rotazione;
			restore_rotation(-old_rot);
			train_selected.geometry.computeBoundingSphere();
			train_selected.userData.start_p = train_selected.geometry.boundingSphere.center;
			train_selected.userData.start_p.x -= newVal/2;
			train_selected.userData.start_p.z -= train_selected.userData.profondita/2;
			removeElFromScene(train_selected.name);
			draw2Dtrain(
				train_selected.userData.id, 
				train_selected.userData.start_p, 
				newVal,
				train_selected.userData.profondita, 
				train_selected.userData.Altezza, 
				train_selected.userData.Campate, 
				train_selected.userData.DoppiaSpalla, 
				train_selected.userData.showNames, 
				train_selected.userData.Livelli, 				[]
			);
			restore_selection();
			restore_rotation(old_rot);			for (c of this.__gui.__folders["Info Campata"].__controllers){				if (c.property=="Lunghezza"){					c.initialValue = campata_selected.userData.Lunghezza;					c.object.Lunghezza = campata_selected.userData.Lunghezza					c.updateDisplay();				}			}
		});
		
		info_train.add(train_selected.userData, "profondita").name("Profondit&agrave").min(5).step(100).onChange(function(newVal){
			var old_rot = train_selected.userData.Rotazione;
			restore_rotation(-old_rot);
			train_selected.geometry.computeBoundingSphere();
			train_selected.userData.start_p = train_selected.geometry.boundingSphere.center;
			train_selected.userData.start_p.x -= train_selected.userData.Lunghezza/2;
			train_selected.userData.start_p.z -= newVal/2;			delta = newVal - this.initialValue;			var campate_data = evaluate_campate_data(0, delta);			
			removeElFromScene(train_selected.name);
			draw2Dtrain(
				train_selected.userData.id, 
				train_selected.userData.start_p,
				train_selected.userData.Lunghezza, 					
				newVal,
				train_selected.userData.Altezza, 
				train_selected.userData.Campate, 
				train_selected.userData.DoppiaSpalla, 
				train_selected.userData.showNames, 
				train_selected.userData.Livelli, 				campate_data
			);
			restore_selection();
			restore_rotation(old_rot);			this.initialValue = newVal;			for (c of this.__gui.__folders["Info Campata"].__controllers){				if (c.property=="Profondita"){					c.setValue(campata_selected.userData.Profondita);					c.updateDisplay();				}			}
		});
		
		info_train.add(train_selected.userData, "Campate").min(1).step(1).onChange(function(newVal){
			var old_rot = train_selected.userData.Rotazione;
			restore_rotation(-old_rot);
			train_selected.geometry.computeBoundingSphere();
			train_selected.userData.start_p = train_selected.geometry.boundingSphere.center;
			train_selected.userData.start_p.x -= train_selected.userData.Lunghezza/2;
			train_selected.userData.start_p.z -= train_selected.userData.profondita/2;
			
			removeElFromScene(train_selected.name);
			draw2Dtrain(
				train_selected.userData.id, 
				train_selected.userData.start_p,
				train_selected.userData.Lunghezza, 					
				train_selected.userData.profondita, 
				train_selected.userData.Altezza, 
				newVal, 
				train_selected.userData.DoppiaSpalla, 
				train_selected.userData.showNames, 
				train_selected.userData.Livelli, 				[] // cambiare numero di campate mi resetta le info campata
			);
			restore_selection();			
			restore_rotation(old_rot);						if(campata_selected!=undefined){				buildInfoCampataFolder();			}
		});
		
		info_train.add(train_selected.userData, "Altezza").min(1000).step(100).onChange(function(newVal){
			train_selected.children.forEach(child =>{
				child.userData.Altezza=newVal;
			});			for (c of this.__gui.__folders["Info Campata"].__controllers){				if (c.property=="Altezza"){					c.setValue(newVal);				}			}
			showTrainSelection();			train_selected.userData.Altezza = newValue;
		});
		
		info_train.add(train_selected.userData, "Livelli").min(1).step(1).onChange(function(newVal){
			train_selected.children.forEach(child =>{				if(child.name!="Helper"){
					var altezza = child.userData.Altezza;					child.userData.Livelli = newVal;					child.userData.AltezzeLivelli = evaluate_altezze_livelli(altezza, newVal);				}
			});			for (c of this.__gui.__folders["Info Campata"].__controllers){				if (c.property=="Livelli"){					c.setValue(newVal);				}			}
			showTrainSelection();			train_selected.userData.Livelli = newVal;
		});
		
		info_train.add(train_selected.userData, "Rotazione").min(0).max(360).step(1).onChange(function(newVal){			var alpha = (newVal-this.initialValue)*Math.PI/180;
			var alpha1 = newVal*Math.PI/180;
			this.initialValue = newVal;
			/* Parte commentanta è rotazione con pivot su centro campata => più difficile da gestire 			if (campata_selected !== undefined){
				var xc = campata_selected.boundingBox.center.x;
				var zc = campata_selected.boundingBox.center.z;
			} else {
				train_selected.geometry.computeBoundingSphere();
				var xc = train_selected.geometry.boundingSphere.center.x;
				var zc = train_selected.geometry.boundingSphere.center.z;
			}*/			train_selected.geometry.computeBoundingSphere();			var xc = train_selected.geometry.boundingSphere.center.x;			var zc = train_selected.geometry.boundingSphere.center.z;
			train_selected.geometry.rotateY(alpha);
			train_selected.geometry.computeBoundingSphere();
			var x = train_selected.userData.start_p.x;
			var z = train_selected.userData.start_p.z;
			train_selected.userData.start_p.x = (x-xc)*Math.cos(-alpha)-(z-zc)*Math.sin(-alpha)+xc;
			train_selected.userData.start_p.z = (x-xc)*Math.sin(-alpha)+(z-zc)*Math.cos(-alpha)+zc;			var delta_x = train_selected.userData.start_p.x-train_selected.geometry.attributes.position.array[0];			var delta_z = train_selected.userData.start_p.z-train_selected.geometry.attributes.position.array[2];
			train_selected.geometry.translate(
				delta_x,
				0,
				delta_z
			);
			
			train_selected.children.forEach(child =>{
				if (child.name !== "Helper"){
					var x = child.position.x;
					var z = child.position.z;
					child.boundingBox.rotation = new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationY(alpha1));
					child.position.x = (x-xc)*Math.cos(-alpha)-(z-zc)*Math.sin(-alpha) + xc;
					child.position.z = (x-xc)*Math.sin(-alpha)+(z-zc)*Math.cos(-alpha) + zc;
					child.boundingBox.center.x = child.position.x;
					child.boundingBox.center.z = child.position.z;
					child.children.forEach(c=>{
						if(c.name!="Testo"){
							c.rotation.y += alpha;
						}
					});
				}
			});
			restore_selection();			train_selected.userData.Rotazione = newVal;
		});
		
		info_train.add(train_selected.userData, "DoppiaSpalla").name("Doppia Spalla").onChange(function(newVal){			var n_c = 0;			train_selected.children.forEach(c=>{				if(c.name!="Helper"){					n_c += 1;				}			});			if(n_c>1){
				var old_rot = train_selected.userData.Rotazione;
				restore_rotation(-old_rot);
				train_selected.geometry.computeBoundingSphere();
				train_selected.userData.start_p = train_selected.geometry.boundingSphere.center;
				train_selected.userData.start_p.x -= train_selected.userData.Lunghezza/2;
				train_selected.userData.start_p.z -= train_selected.userData.profondita/2;
				removeElFromScene(train_selected.name);				campate_data = evaluate_campate_data(0, 0);
				draw2Dtrain(
					train_selected.userData.id, 
					train_selected.userData.start_p,
					train_selected.userData.Lunghezza,
					train_selected.userData.profondita, 					
					train_selected.userData.Altezza, 
					train_selected.userData.Campate, 
					newVal, 
					train_selected.userData.showNames, 
					train_selected.userData.Livelli, 					campate_data
				);
				restore_selection();
				restore_rotation(old_rot);			}			train_selected.userData.DoppiaSpalla = newVal;
		});
		
		info_train.add(train_selected.userData, "showNames").name("Mostra Nomi").onChange(function(newVal){
			train_selected.userData.showNames = newVal;
			train_selected.children.forEach( child =>{
				if (child.name!=="Helper" && child.children.length>0){
					var c = child.children[0];
					if(c.name=="Testo"){
						c.visible = newVal;
					}	
				}
			});
		});
		info_train.add(utils_f, "Duplica");
		info_train.add(utils_f, "Delete").name("Elimina Treno");
				buildInfoCampataFolder();	}		// Fuzione che costruisce la folder "Info Campata"		function buildInfoCampataFolder(){		if (Object.keys(info_train.__folders).length>0){			info_train.__ul.removeChild(info_campata.domElement.parentNode);			delete gui.__folders["Treni"].__folders["Info Treno"].__folders["Info Campata"];		}
		info_campata = info_train.addFolder("Info Campata");
		info_campata.add(campata_selected.userData, "Altezza").min(1000).step(10).onChange(function(newVal){			campata_selected.userData.Altezza = newVal;			campata_selected.userData.AltezzeLivelli = evaluate_altezze_livelli(newVal, campata_selected.userData.Livelli);			var to_remove = [];
			liv_folder.__controllers.forEach(c =>{				to_remove.push(c);
			});			to_remove.forEach(c=>{				liv_folder.remove(c);			});			editLivFolder();
		});		var max_l = campata_selected.userData["Lunghezza"];		var id_c = campata_selected.name.split("-")[1];				var n_c = 0;				train_selected.children.forEach(c=>{			if(c.name!="Helper"){				n_c += 1;			}		});		var last = (n_c==id_c);		var value_to_add = -600;		if(last){			if (n_c==1){				value_to_add += 600;			} else {				value_to_add += train_selected.children[id_c-2].userData.Lunghezza;			}		} else {			value_to_add += train_selected.children[id_c].userData.Lunghezza;		}		max_l += value_to_add;		var info_c_lung = info_campata.add(campata_selected.userData, "Lunghezza").min(500).max(max_l).step(10).onChange(function(newVal){				if (n_c>1){				var old_length = this.initialValue;					var delta_l = newVal-old_length;				var old_rot = train_selected.userData.Rotazione;				restore_rotation(-old_rot);				train_selected.geometry.computeBoundingSphere();				train_selected.userData.start_p = train_selected.geometry.boundingSphere.center;				train_selected.userData.start_p.x -= train_selected.userData.Lunghezza/2;				train_selected.userData.start_p.z -= train_selected.userData.profondita/2;				campata_selected.userData.Lunghezza = newVal;				campate_data = evaluate_campate_data(delta_l, 0);				removeElFromScene(train_selected.name);				draw2Dtrain(					train_selected.userData.id, 					train_selected.userData.start_p,					train_selected.userData.Lunghezza,					train_selected.userData.profondita, 										train_selected.userData.Altezza, 					train_selected.userData.Campate, 					train_selected.userData.DoppiaSpalla, 					train_selected.userData.showNames, 					train_selected.userData.Livelli, 					campate_data				);				restore_selection();				restore_rotation(old_rot);				train_selected.userData.Rotazione=old_rot;				this.initialValue = newVal;			} 		});		if (n_c==1){			info_c_lung.domElement.style.pointerEvents = "none"			info_c_lung.domElement.style.opacity=0.5;		}		var info_c_prof = info_campata.add(campata_selected.userData, "Profondita").name("Profondit&agrave").min(5).step(100);		info_c_prof.__input.disabled=true;		info_c_prof.__input.style.opacity=0.5;
		info_campata.add(campata_selected.userData, "Livelli").min(1).step(1).onChange(function(newVal){
			var to_remove = [];
			liv_folder.__controllers.forEach(c =>{
				to_remove.push(c);
			});
			to_remove.forEach(c =>{
				liv_folder.remove(c);
			});			altezza = campata_selected.userData.Altezza;			if(altezza==undefined){				altezza = train_selected.userData.Altezza;			}			campata_selected.userData.Livelli = newVal;
			campata_selected.userData.AltezzeLivelli = evaluate_altezze_livelli(altezza, newVal);
			editLivFolder();
		});
		liv_folder = info_campata.addFolder("Livelli");
		editLivFolder();

		info_train.open();
		all_trains_folder.close();
		setGuiSize();
	}		function blockEvent(event) {	  event.stopPropagation();	}	// Funzione per valorizzare gli userdate delle campate del treno selezionato	function evaluate_campate_data(delta_l, delta_p){		var campate_data = [];		if (campata_selected!=undefined){			var id_campata_selected = parseInt(campata_selected.name.split("-")[1]);			var last_c = id_campata_selected == (train_selected.children.length/2);			train_selected.children.forEach(c =>{				if(c.name!="Helper") {					c.userData.Profondita += delta_p;					c.userData.start_p.z -= (delta_p/2);					campate_data.push(c.userData);				}			});			if(last_c){				campate_data[id_campata_selected-2].Lunghezza -= delta_l;				campate_data[id_campata_selected-1].start_p.x -= delta_l;			} else {				campate_data[id_campata_selected].Lunghezza -= delta_l;				campate_data[id_campata_selected].start_p.x += delta_l;			}		}		return campate_data;	}
	
	// Funzione che popola la folder dei livelli
	function editLivFolder(){
		for (var key in campata_selected.userData.AltezzeLivelli){
			if(key==1){
				var min = 0;
			} else {
				var min = campata_selected.userData.AltezzeLivelli[key-1];
			}
			if(key==campata_selected.userData.Livelli){
				var max = campata_selected.userData.Altezza;
			} else {
				var max = campata_selected.userData.AltezzeLivelli[parseInt(key)+1];
			}
			liv_folder.add(campata_selected.userData.AltezzeLivelli, key).min(min+50).max(max).onChange(function(newVal){
				if (this.property=="1" && campata_selected.userData.Livelli>1){
					liv_folder.__controllers["1"].__min = newVal; 
				} else if (parseInt(this.property) == campata_selected.userData.Livelli && campata_selected.userData.Livelli >1 ){
					liv_folder.__controllers[parseInt(this.property)-2].__max = newVal; 
				} else {
					liv_folder.__controllers[this.property].__min = newVal;
					liv_folder.__controllers[parseInt(this.property)-2].__max = newVal; 
				}
			});
		}
		setGuiSize();
	}

	// Funzione per settare gli UsedData della campata
	function evaluate_altezze_livelli(altezza, livelli){
		var AltezzeLivelli = {};
		var interval = altezza/livelli;
		for(var n = 1; n<=livelli; n++){
			AltezzeLivelli[n.toString()] = interval*n -5;
		}
		return AltezzeLivelli;
	}
	
	// Funzione che ripristina la rotazione del treno
	function restore_rotation(val){
		var alpha = val*Math.PI/180;
		train_selected.userData.Rotazione = val;
		/* Parte commentanta è rotazione con pivot su centro campata => più difficile da gestire 		if (campata_selected !== undefined){
			var xc = campata_selected.boundingBox.center.x;
			var zc = campata_selected.boundingBox.center.z;
		} else {
			train_selected.geometry.computeBoundingSphere();
			var xc = train_selected.geometry.boundingSphere.center.x;
			var zc = train_selected.geometry.boundingSphere.center.z;
		}*/		train_selected.geometry.computeBoundingSphere();		var xc = train_selected.geometry.boundingSphere.center.x;		var zc = train_selected.geometry.boundingSphere.center.z;
		train_selected.geometry.rotateY(alpha);
		train_selected.geometry.computeBoundingSphere();
		var x = train_selected.userData.start_p.x;
		var z = train_selected.userData.start_p.z;	
		train_selected.userData.start_p.x = (x-xc)*Math.cos(-alpha)-(z-zc)*Math.sin(-alpha)+xc;
		train_selected.userData.start_p.z = (x-xc)*Math.sin(-alpha)+(z-zc)*Math.cos(-alpha)+zc;
		train_selected.geometry.translate(
			train_selected.userData.start_p.x-train_selected.geometry.attributes.position.array[0],
			0,
			train_selected.userData.start_p.z-train_selected.geometry.attributes.position.array[2]
		);		var delta_x = train_selected.children[0].userData.start_p.x-train_selected.userData.start_p.x;		var delta_z = train_selected.children[0].userData.start_p.z-train_selected.userData.start_p.z;
		train_selected.children.forEach(child =>{
			if (child.name !== "Helper"){
				var x = child.position.x;
				var z = child.position.z;
				child.boundingBox.rotation = new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationY(alpha));
				child.position.x = (x-xc)*Math.cos(-alpha)-(z-zc)*Math.sin(-alpha)+xc;
				child.position.z = (x-xc)*Math.sin(-alpha)+(z-zc)*Math.cos(-alpha)+zc;
				child.boundingBox.center.x = child.position.x;
				child.boundingBox.center.z = child.position.z;
				child.children.forEach(c=>{
					if(c.name!="Testo"){
						c.rotation.y= alpha;
					}
				});
			}
		});
		restore_selection();
	}
	
	// Funzione che ripristina la selezione del treno e della campata
	function restore_selection(){
		var changed = false;
		scene.traverse(child=>{
			if(child.name==train_selected.name){
				train_selected=child;
			} else if(campata_selected!== undefined){
				if(child.name==campata_selected.name){
					campata_selected = child;
					changed = true;
				}
			} 
		});
		if (changed==false) {
			campata_selected = undefined;			if (gui!=undefined){				var info_c_folder = gui.__folders["Treni"].__folders["Info Treno"].__folders["Info Campata"];				if (info_c_folder != undefined){					if (info_c_folder.domElement.parentNode.parentNode != null){						gui.__folders["Treni"].__folders["Info Treno"].__ul.removeChild(info_c_folder.domElement.parentNode);						delete gui.__folders["Treni"].__folders["Info Treno"].__folders["Info Campata"];					}				}			}
		}
		showTrainSelection();
	}
	
	// Funzione che valorizza gli userdata da resituire al processo
	function evaluate_userData(){
		get_trains();
		var user_data = [];
		all_trains.forEach(train =>{
			var geometry_array = train.geometry.attributes.position.array;
			var my_arr_geom = [];
			for (var i = 0; i < geometry_array.length; i++){
				var my_data = {
					"key": i,
					"value": geometry_array[i]
				};
				my_arr_geom.push(my_data);
			}
			var my_data = {
				"name": train.name,
				"userData": train.userData,
				"geometry": my_arr_geom,
				"children": []
			}
			train.children.forEach(c=>{				if (c.name != "Helper"){
					var old_data = c.userData.AltezzeLivelli;					if(old_data!=undefined){
						var new_data = Object.keys(old_data).map(function (key) {return Math.round(old_data[key]);});
						var my_c_data={
							"name":c.name,
							"userData": {
								"Altezza": c.userData.Altezza,								"Lunghezza": c.userData.Lunghezza,								"Profondita": c.userData.Profondita,
								"Livelli": c.userData.Livelli,
								"AltezzeLivelli": new_data,								"start_p": c.userData.start_p
							}						}
					}
					my_data.children.push(my_c_data);				}
			});
			user_data.push(my_data);
		});
		input_UserData.value = JSON.stringify(user_data);
	}
	

	// Gestione eventi mouse
	// Variabili
	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2();
	var start_pos;
	 

	// Eventi
	// Movimento del puntatore
	SmartEditorCanvas.addEventListener("pointermove", event => {
		mouse.x = ( (event.clientX-(window.innerWidth*0.2)) / SmartEditorCanvas.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / SmartEditorCanvas.innerHeight ) * 2 + 1;
		raycaster.setFromCamera(mouse, camera);
		if (dragging_train==true){
			var intersects = raycaster.intersectObjects([floor]);
			if (intersects.length > 0) {
				var x_interval = intersects[0].point.x-start_pos.x;
				var z_interval = intersects[0].point.z-start_pos.z;
				train_selected.position.set(x_interval, train_selected.position.y, z_interval);
				train_selected.updateMatrix();
			}
		}
	});

	// Pressione click mouse
	SmartEditorCanvas.addEventListener("pointerdown", () => { 
		get_trains();
		var obj = [];
		all_campate.forEach(c=>{
			if(c.boundingBox.intersectsRay(raycaster.ray)){
				campata_selected = c;
				start_pos = new THREE.Vector3(raycaster.ray.origin.x, campata_selected.boundingBox.center.y, raycaster.ray.origin.z);
				dragging_train = true;
				controls.enabled = false;
				train_selected = campata_selected.parent;
				info_train.__ul.setAttribute("style", "display: ");
				buildInfoTrain_folder();
				showTrainSelection();
			}
		});
		if (train_selected !== undefined && dragging_train==false && duplicating_train==false){
			var intersects = raycaster.intersectObjects([floor]);
			if (intersects.length > 0) {
				removeElFromScene("Helper");
				train_selected = undefined;
				campata_selected = undefined;
				info_train.__ul.setAttribute("style", "display: none");
			}
		}
	} );
	
	// Rilascio click mouse
	SmartEditorCanvas.addEventListener("pointerup", () => {
		if(dragging_train==true) {
			dragging_train =false;
			controls.enabled = true;
			start_pos=undefined;			var delta_x = train_selected.position.x;			var delta_z = train_selected.position.z;
			train_selected.userData.start_p.x += delta_x;
			train_selected.userData.start_p.z += delta_z;
			train_selected.geometry.translate(delta_x, 0, delta_z);
			train_selected.geometry.computeBoundingBox();
			removeElFromScene("Helper");
			train_selected.children.forEach(child =>{
				child.boundingBox.center.x +=  delta_x;
				child.boundingBox.center.y +=  1;
				child.boundingBox.center.z +=  delta_z;				child.userData.start_p.x += delta_x;				child.userData.start_p.z += delta_z;
				if(child.name !== campata_selected.name){
					var geom = geom_from_obb(child.boundingBox);
					var helper = new THREE.Line(geom, new THREE.LineBasicMaterial({color: 0x808080}));
					helper.name = "Helper";
					helper.renderOrder = 2;
					train_selected.add(helper);
				}
				var to_remove;
				child.children.forEach(c=>{
					if(c.name=="Testo"){
						to_remove=c;
					}
				});
				child.remove(to_remove);	
				var sprite = createSprite(child.name);
				sprite.visible = train_selected.userData.showNames; 
				child.position.x += train_selected.position.x;
				child.position.z += train_selected.position.z;
				child.add(sprite);
			});
			var geom = geom_from_obb(campata_selected.boundingBox);
			var helper = new THREE.Line(geom, new THREE.LineBasicMaterial({color: 0xff0000}));
			helper.name = "Helper";
			helper.renderOrder = 2;
			train_selected.add(helper);
			train_selected.position.set(0,0, 0);
		} else if (duplicating_train==true){
			var intersects = raycaster.intersectObjects([floor]);
			if (intersects.length > 0) {
				start_pos = intersects[0].point;
				start_pos.y = train_selected.userData.Altezza;
			}
			duplicating_train=false;
			var old_rot = train_selected.userData.Rotazione;
			var old_campata_selected = campata_selected;			var campate_data = evaluate_campate_data(0, 0);			var d_x = start_pos.x-campate_data[0].start_p.x;			var d_z = start_pos.z-campate_data[0].start_p.z;			campate_data.forEach(c=>{				c.start_p.x += d_x;				c.start_p.z += d_z;			});
			draw2Dtrain(
				String.fromCharCode(97+settings.Treni).toUpperCase(), 
				start_pos,
				train_selected.userData.Lunghezza, 					
				train_selected.userData.profondita,
				train_selected.userData.Altezza, 
				train_selected.userData.Campate, 
				train_selected.userData.DoppiaSpalla, 
				train_selected.userData.showNames, 
				train_selected.userData.Livelli, 				campate_data
			);
			get_trains();
			var new_c_name =  String.fromCharCode(97+settings.Treni).toUpperCase() +"-"+ campata_selected.name.substring(campata_selected.name.indexOf("-") + 1);
			all_trains.forEach(t=>{
				t.children.forEach(c => {
					if (c.name == new_c_name){
						campata_selected = c;
						train_selected = c.parent;
					}
				});
			});
			restore_rotation(old_rot);
			campata_selected = old_campata_selected;
			train_selected = campata_selected.parent;
			showTrainSelection();
			settings.Treni+=1;
			all_trains_folder.__controllers.forEach(c=> {
				if(c.property=="Treni"){
					c.updateDisplay();
				}
			});	
		}
	} );

}