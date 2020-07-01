// Ссылка на элемент веб страницы в котором будет отображаться графика 
var container; 

var keyboard = new THREEx.KeyboardState(); 
 
// Переменные "камера", "сцена" и "отрисовщик" 
var camera, scene, renderer;
var imagedata;
var geometry;

var clock = new THREE.Clock();

var N = 256;

var parrotPath;
var flamingoPath;

var T = 10.0;
var t = 0.0;
var followParrot = false;

var followFlamingo = false;

var flamingo;
var axisY = new THREE.Vector3(0, 1, 0);

//var parrot;

//var spotlight = new THREE.DirectionalLight(0xffff00);
var pspotlight = new THREE.PointLight(0xffff00, 1, 100, 1);

//глобальные служебные переменные для хранения списка анимаций
var mixer, morphs = [];

// Функция инициализации камеры, отрисовщика, объектов сцены и т.д. 
init(); 
 
// Обновление данных по таймеру браузера 
animate(); 

// В этой функции можно добавлять объекты и выполнять их первичную настройку 
function init()  
{     
    // Получение ссылки на элемент html страницы     
    container = document.getElementById( 'container' );     
    // Создание "сцены"     
    scene = new THREE.Scene(); 
 
    // Установка параметров камеры     
    // 45 - угол обзора     
    // window.innerWidth / window.innerHeight - соотношение сторон     // 1 - 4000 - ближняя и дальняя плоскости отсечения     
    camera = new THREE.PerspectiveCamera(                                  
        45, window.innerWidth / window.innerHeight, 1, 4000 );     
 
    // Установка позиции камеры     
    camera.position.set(N/2, N*1.5, N/2);          
    // Установка точки, на которую камера будет смотреть     
    camera.lookAt(new THREE.Vector3( N/2,  0.0, N/2));   
 
    // Создание отрисовщика     
    renderer = new THREE.WebGLRenderer( { antialias: false } );     
    renderer.setSize( window.innerWidth, window.innerHeight );     
    // Закрашивание экрана синим цветом, заданным в 16ричной системе     
    renderer.setClearColor( 0x444444, 1); 

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
 
    container.appendChild( renderer.domElement ); 
 
    // Добавление функции обработки события изменения размеров окна     
    window.addEventListener( 'resize', onWindowResize, false );
    
    //свет
    var spotlight = new THREE.DirectionalLight(0xffff00);
    //var spotlight = new THREE.PointLight(0xffff00);
    //position
    spotlight.position.set(N, N*2, N/2);


    //var targetObject = new THREE.Object3D();
    spotlight.target = new THREE.Object3D();
    spotlight.target.position.set( N/2, 0, N/2 );
    scene.add(spotlight.target);

    //spotlight.target = targetObject;
   
    // направление освещения
    //spotlight.target.position.set( 0, 0, 0 );
    //scene.add(spotlight.target);

    // включение расчёта теней
    spotlight.castShadow = true;
    // параметры области расчёта теней
    ////spotlight.shadow.camera.near = 500;
    ////spotlight.shadow.camera.far = 4000;
    ////spotlight.shadow.camera.fov = 45;

    spotlight.shadow = new THREE.LightShadow( 
        new THREE.PerspectiveCamera( 60, 1, 10, 1000 ) );
        spotlight.shadow.bias = 0.0001;


    // размер карты теней
    spotlight.shadow.mapSize.width = 4096;
    spotlight.shadow.mapSize.height = 4096;

    //add
    scene.add(spotlight);
    scene.add(pspotlight);

    var helper = new THREE.CameraHelper(spotlight.shadow.camera);
    scene.add( helper );

    
    //создание списка анимаций в функции Init
    mixer = new THREE.AnimationMixer( scene );




    var canvas = document.createElement('canvas'); 
    var context = canvas.getContext('2d'); 
    var img = new Image();
    img.onload = function() 
    {     
        canvas.width = img.width;     
        canvas.height = img.height;     
        context.drawImage(img, 0, 0 );     
        imagedata = context.getImageData(0, 0, img.width, img.height);
        
        // Пользовательская функция генерации ландшафта     
        terrainGen(); 
        
        // вызов функции загрузки модели (в функции Init)
        loadModel('models/static/', "Palma001.obj", "Palma001.mtl");

        loadAnimatedModel( 'models/animated/Parrot.glb', false );
        flamingo = loadAnimatedModel( 'models/animated/Flamingo.glb', false );

        parrotPath = addT();

        flamingoPath = addT2();
    }
    // Загрузка изображения с картой высот 
    img.src = 'pics/plateau.jpg';
}

function getPixel( imagedata, x, y )
{
    var position = ( x + imagedata.width * y) * 4, data = imagedata.data;
    return data [position];
}

function terrainGen()
{
    geometry = new THREE.Geometry();
 
    for (var i=0; i < N; i++)
    for (var j=0; j < N; j++)
    {
        //color
        var h = getPixel(imagedata, i, j);

        //add coordination in massiv
        geometry.vertices.push(new THREE.Vector3(i, h/10.0, j));
    }

    for (var i = 0; i < (N-1); i++)
        for (var j = 0; j < (N-1); j++)
        {
            //add
            geometry.faces.push(new THREE.Face3(i+j*N, (i+1)+j*N, (i+1)+(j+1)*N));
            geometry.faces.push(new THREE.Face3(i+j*N, (i+1)+(j+1)*N, (i)+(j+1)*N));

            geometry.faceVertexUvs[0].push([
                new THREE.Vector2((i)/(N-1), (j)/(N-1)),
                new THREE.Vector2((i+1)/(N-1), (j)/(N-1)),
                new THREE.Vector2((i+1)/(N-1), (j+1)/(N-1))]);

            geometry.faceVertexUvs[0].push([
                new THREE.Vector2((i)/(N-1), (j)/(N-1)),
                new THREE.Vector2((i+1)/(N-1), (j+1)/(N-1)),
                new THREE.Vector2((i)/(N-1), (j+1)/(N-1))]);
        }
        
    geometry.computeFaceNormals();  
    geometry.computeVertexNormals();    
   
    var loader = new THREE.TextureLoader();
    var tex = loader.load( 'pics/grasstile.jpg' );

    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
        
    var mat = new THREE.MeshLambertMaterial
    ({    
        map: tex,    
        wireframe: false,    
        side: THREE.DoubleSide 
    });
 
    var mesh = new THREE.Mesh(geometry, mat); 
    mesh.position.set(0.0, 0.0, 0.0);


    mesh.receiveShadow = true;

    scene.add(mesh);

    sky();
}

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}



function animate()
{
    // воспроизведение анимаций (в функции animate)
    var delta = clock.getDelta();

    t += delta;

    mixer.update( delta );

    for ( var i = 0; i < morphs.length; i ++ )
    {
        
        var morph = morphs[ i ];
        console.log(morph);
        var pos = new THREE.Vector3();
        if (t >= T) t = 0.0;
        if (morph.id == 21)
            pos.copy(parrotPath.getPointAt(t/T));
            else
            pos.copy(flamingoPath.getPointAt(t/T));

            morph.position.copy(pos);
            pspotlight.position.copy(pos);    

        if ((t +0.001) >= T) t = 0.0;
        var nextPoint = new THREE.Vector3();
        if (morph.id == 21)
        nextPoint.copy(parrotPath.getPointAt((t+0.001)/T));  
        else
        nextPoint.copy(flamingoPath.getPointAt((t+0.001)/T));

        morph.lookAt(nextPoint);

        

        if (followParrot == true)
        {
            // установка смещения камеры относительно объекта
            var relativeCameraOffset = new THREE.Vector3(0,90,-100);
            var m1 = new THREE.Matrix4();
            var m2 = new THREE.Matrix4();

            // получение поворота объекта
            m1.extractRotation(morph.matrixWorld);
            // получение позиции объекта
            m2.extractPosition(morph.matrixWorld);
            m1.multiplyMatrices(m2, m1);

            // получение смещения позиции камеры относительно объекта
            var cameraOffset = relativeCameraOffset.applyMatrix4(m1);
            // установка позиции и направления взгляда камеры
            camera.position.copy(cameraOffset);
            camera.lookAt(morph.position );
        }


        if (followFlamingo == true)
        {
            // установка смещения камеры относительно объекта
            var relativeCameraOffset = new THREE.Vector3(0,90,-100);
            var m1 = new THREE.Matrix4();
            var m2 = new THREE.Matrix4();

            // получение поворота объекта
            m1.extractRotation(flamingo.matrixWorld);
            // получение позиции объекта
            m2.copyPosition(flamingo.matrixWorld);
            m1.multiplyMatrices(m2, m1);

            // получение смещения позиции камеры относительно объекта
            var cameraOffset = relativeCameraOffset.applyMatrix4(m1);
            // установка позиции и направления взгляда камеры
            camera.position.copy(cameraOffset);
            camera.lookAt(flamingo.position );

            //flamingo.translateZ(50 * delta);

        }
            //if (keyboard.pressed("a")) 
            //{
                //перенос вдоль оси, заданной вектором в локальных координатах 
                //flamingo.rotateOnAxis(axisY, Math.PI/30.0); 
            //}
            //if (keyboard.pressed("d")) 
            //{
                //flamingo.rotateOnAxis(axisY, -Math.PI/30.0); 
            //}
        
    }



    if (keyboard.pressed("1"))
    {
        followParrot = true;
        followFlamingo = false;
    }

    if (keyboard.pressed("2"))
    {
        followParrot = false;
        followFlamingo = true;
    }    

    // Добавление функции на вызов, при перерисовки браузером страницы 
    requestAnimationFrame( animate ); 

    render(); 
}

function render()
{        
    renderer.render( scene, camera );
}

function loadModel(path, oname, mname)
{
    // функция, выполняемая в процессе загрузки модели (выводит процент загрузки)
    var onProgress = function ( xhr ) {
        if ( xhr.lengthComputable ) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log( Math.round(percentComplete, 2) + '% downloaded' );
        }
    };
    // функция, выполняющая обработку ошибок, возникших в процессе загрузки
    var onError = function ( xhr ) { };
    // функция, выполняющая обработку ошибок, возникших в процессе загрузки
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath( path );
    // функция загрузки материала
    mtlLoader.load( mname, function( materials )
    {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials( materials );
        
        objLoader.setPath( path );
 
        // функция загрузки модели
        objLoader.load( oname, function ( object )
        {
            //mesh.receiveShadow = true; //принимает 
            object.castShadow = true; //только отбрасывает
            //console.log(object);

            object.traverse( function ( child )
            {
                if ( child instanceof THREE.Mesh )
                {
                    child.castShadow = true;
                }
            } );

            for (var i=0; i < 100; i++)
            {
                var x = Math.random() * 256;
                var z = Math.random() * 256;
                var y = geometry.vertices[ Math.round(z) + Math.round(x) * N ].y;

                object.position.x = x;
                object.position.y = y;
                object.position.z = z;
    
                //object.scale.set(1, 1, 1);
                //object.scale.set(0.2, 0.2, 0.2);
                var s = (Math.random() * 100) + 30
                s /= 400.0;
                object.scale.set(s, s, s);
    

                //scene.add(object);
                //clone
                scene.add(object.clone());
            }
            

        }, onProgress, onError );
    });
}


function loadAnimatedModel(path, controlled) //где path – путь и название модели
{
    var loader = new THREE.GLTFLoader();

    loader.load( path, function ( gltf ) 
    {
        var mesh = gltf.scene.children[ 0 ];
        var clip = gltf.animations[ 0 ];
 
        //установка параметров анимации (скорость воспроизведения и стартовый фрейм)
        mixer.clipAction( clip, mesh ).setDuration( 1 ).startAt( 0 ).play();
        mesh.position.set( N/2, N/4, N/2 );
        mesh.rotation.y = Math.PI / 8;
        mesh.scale.set( 0.2, 0.2, 0.2 );
        //mesh.scale.set( 2, 2, 2 );

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        scene.add( mesh );
        if (controlled == false)
            morphs.push( mesh );
        else
            flamingo = mesh;  
        //return mesh;    
    } );
}


function addT()
{

    var curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3( 100, 50, 128 ), //P0
        new THREE.Vector3( 100, 50, 28 ), //P1
        new THREE.Vector3( 200, 50, 28 ), //P2
        new THREE.Vector3( 200, 50, 128 ) //P3
       );

    var curve2 = new THREE.CubicBezierCurve3(
        new THREE.Vector3( 200, 50, 128 ), //P3
        new THREE.Vector3( 200, 50, 228 ), //P2
        new THREE.Vector3( 100, 50, 228 ), //P1
        new THREE.Vector3( 100, 50, 128 ) //P0
       );
       
       
       var vertices = [];
       // получение 20-ти точек на заданной кривой
       vertices = curve.getPoints( 20 );
       vertices = vertices.concat(curve2.getPoints( 20 ));


       // создание кривой по списку точек
       var path = new THREE.CatmullRomCurve3(vertices);
       
       // является ли кривая замкнутой (зацикленной)
       path.closed = true;


       vertices = path.getPoints( 500 );

       var geometry = new THREE.Geometry();
       geometry.vertices = vertices;
       var material = new THREE.LineBasicMaterial( { color : 0xffff00 } );
       var curveObject = new THREE.Line( geometry, material );
       scene.add(curveObject);

       return path;
}

function addT2()
{

    var curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3( 100, 150, 128 ), //P0
        new THREE.Vector3( 100, 150, 28 ), //P1
        new THREE.Vector3( 200, 150, 28 ), //P2
        new THREE.Vector3( 200, 150, 128 ) //P3
       );

    var curve2 = new THREE.CubicBezierCurve3(
        new THREE.Vector3( 200, 150, 128 ), //P3
        new THREE.Vector3( 200, 150, 228 ), //P2
        new THREE.Vector3( 100, 150, 228 ), //P1
        new THREE.Vector3( 100, 150, 128 ) //P0
       );
       
       
       var vertices = [];
       // получение 20-ти точек на заданной кривой
       vertices = curve.getPoints( 20 );
       vertices = vertices.concat(curve2.getPoints( 20 ));


       // создание кривой по списку точек
       var path = new THREE.CatmullRomCurve3(vertices);
       
       // является ли кривая замкнутой (зацикленной)
       path.closed = true;


       vertices = path.getPoints( 500 );

       var geometry = new THREE.Geometry();
       geometry.vertices = vertices;
       var material = new THREE.LineBasicMaterial( { color : 0xffffff } );
       var curveObject = new THREE.Line( geometry, material );
       scene.add(curveObject);

       return path;
}


function sky()
{
  // Создание загрузчика текстур
  var loader = new THREE.TextureLoader();
  //создание геометрии сферы
  var geometry = new THREE.SphereGeometry( 600, 32, 32 );
  //загрузка текстуры
  var tex = loader.load( "pics/sky5.jpg" );
  tex.minFilter = THREE.NearestFilter;
  //создание материала
  var material = new THREE.MeshBasicMaterial({
  map: tex,
  side: THREE.DoubleSide
  });
  var sphere = new THREE.Mesh( geometry, material );
  
  sphere.position.set(0, 0, 0);

  //размещение объекта в сцене
  scene.add( sphere );
}