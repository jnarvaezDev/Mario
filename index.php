<!doctype html>
<head>
    <title>HTML5 games workshop: One-screen platformer</title>
    <meta charset="utf-8">
    <script src="https://code.jquery.com/jquery-3.7.0.min.js"
        integrity="sha256-2Pmvv0kuTBOenSvLm6bvfBSSHrUJ+3A7x6P5Ebd07/g=" crossorigin="anonymous"></script>
    <script src="js/phaser.min.js"></script>
    <script src="js/main_completo.js?<?= md5(time()) ?>"></script>

    <style>
        canvas {
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <a href="#" class="btn-game">Iniciar</a>
    <div id="game"><img src="./images/nuevos/background.png"
            style="width:960px;height:770px;margin: 0 auto;display:block;"></div>
</body>
</html>