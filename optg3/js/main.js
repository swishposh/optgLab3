// Ссылка на элемент веб страницы в котором будет отображаться графика 
var container; 
 
// Переменные "камера", "сцена" и "отрисовщик" 
var camera, scene, renderer;
var imagedata;
var geometry;

var clock = new THREE.Clock();

var N = 256;

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
    camera.position.set(N/2, N/2, N*1.5);          
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
    //position
    spotlight.position.set(N, N*2, N/2);


    var targetObject = new THREE.Object3D();
    targetObject.position.set( N, 0, N );
    scene.add(targetObject);

    spotlight.target = targetObject;
   
    // направление освещения
    //spotlight.target.position.set( 0, 0, 0 );
    //scene.add(spotlight.target);

    // включение расчёта теней
    spotlight.castShadow = true;
    // параметры области расчёта теней
    spotlight.shadow.camera.near = 500;
    spotlight.shadow.camera.far = 4000;
    spotlight.shadow.camera.fov = 45;

    //spotlight.shadow = new THREE.LightShadow( 
        //new THREE.PerspectiveCamera( 50, 1, 1200, 2500 ) );
        //spotlight.shadow.bias = 0.0001;


    // размер карты теней
    spotlight.shadow.mapSize.width = 2048;
    spotlight.shadow.mapSize.height = 2048;

    //add
    scene.add(spotlight);

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

        loadAnimatedModel( 'models/animated/Parrot.glb' );
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

    //tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    //tex.repeat.set(2, 2);
        
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

    mixer.update( delta );

    //for ( var i = 0; i < morphs.length; i ++ )
    //{
        //var morph = morphs[ i ];
    //}

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


function loadAnimatedModel(path) //где path – путь и название модели
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
        morphs.push( mesh );
    } );
}
