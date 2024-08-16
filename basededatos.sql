-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 16-08-2024 a las 22:29:15
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `basededatos`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `antojitos`
--

CREATE TABLE `antojitos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `url_imagen` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL,
  `nombre_completo` varchar(250) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(250) NOT NULL,
  `direccion` varchar(250) NOT NULL,
  `especificaciones_direccion` varchar(250) NOT NULL,
  `rol_id` int(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id`, `nombre_completo`, `telefono`, `email`, `direccion`, `especificaciones_direccion`, `rol_id`) VALUES
(7, 'andres', '1234567890', 'andy@gmail.com', 'lopez', 'lavanderia', 2),
(52, 'Aquim', '7298349854', '31adbixd31@gmail.com', 'Universidad Tecnológica de la Sierra Hidalguense, Carretera Pachuca - Tempoal, Colonia los Pinos (El Crucero), Zacualtipán, Zacualtipán de Ángeles, Hidalgo, 43200, México', 'lejos', 1),
(57, 'eduardo', '7712141698', '31adbixd31@gmail.com', 'Carretera Federal México-Tampico, Colonia los Pinos (El Crucero), Zacualtipán, Zacualtipán de Ángeles, Hidalgo, 43200, México', 'lopez', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalles_pedido`
--

CREATE TABLE `detalles_pedido` (
  `id` int(11) NOT NULL,
  `pedido_id` int(11) DEFAULT NULL,
  `producto_id` int(11) DEFAULT NULL,
  `producto_tipo` varchar(50) DEFAULT NULL,
  `tamano` varchar(50) DEFAULT NULL,
  `cantidad` int(11) DEFAULT NULL,
  `precio` decimal(10,2) DEFAULT NULL,
  `nombre` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `detalles_pedido`
--

INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `producto_tipo`, `tamano`, `cantidad`, `precio`, `nombre`) VALUES
(16, 45, 21, 'pizza', 'Mediana', 1, 100.00, 'Pizza Hawayana'),
(17, 46, 12, 'refresco', 'default', 1, 16.00, 'Mirinda'),
(18, 47, 7, 'antojito', 'default', 1, 25.00, 'Alitas BBQ'),
(19, 48, 22, 'pizza', 'Mediana', 1, 95.00, 'Pizza Choriqueso'),
(20, 49, 21, 'pizza', 'Mediana', 1, 100.00, 'Pizza Hawayana'),
(21, 50, 21, 'pizza', 'Mediana', 1, 100.00, 'Pizza Hawayana');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos`
--

CREATE TABLE `pedidos` (
  `id` int(11) NOT NULL,
  `cliente_id` int(11) DEFAULT NULL,
  `fecha` datetime DEFAULT NULL,
  `metodo_pago` varchar(50) DEFAULT NULL,
  `referencia_transferencia` varchar(255) DEFAULT NULL,
  `estado_pedido` enum('en proceso','aceptado','terminado','rechazado','Pedido Entregado') DEFAULT 'en proceso'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pedidos`
--

INSERT INTO `pedidos` (`id`, `cliente_id`, `fecha`, `metodo_pago`, `referencia_transferencia`, `estado_pedido`) VALUES
(45, 52, '2024-08-16 01:41:29', 'Pago al Repartidor', NULL, 'aceptado'),
(46, 52, '2024-08-16 02:22:45', 'Pago al Repartidor', NULL, 'aceptado'),
(47, 52, '2024-08-16 02:54:37', 'Pago al Repartidor', NULL, 'aceptado'),
(48, 52, '2024-08-16 05:28:29', 'Pago al Repartidor', NULL, 'aceptado'),
(49, 52, '2024-08-16 12:07:02', 'Pago al Repartidor', NULL, 'en proceso'),
(50, 52, '2024-08-17 13:29:06', 'Pago al Repartidor', NULL, 'en proceso');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pizzas`
--

CREATE TABLE `pizzas` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `price_small` decimal(10,2) NOT NULL,
  `price_medium` decimal(10,2) NOT NULL,
  `price_large` decimal(10,2) NOT NULL,
  `cheese_crust_price` decimal(10,2) NOT NULL,
  `url_imagen` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pizzas`
--

INSERT INTO `pizzas` (`id`, `nombre`, `descripcion`, `precio`, `price_small`, `price_medium`, `price_large`, `cheese_crust_price`, `url_imagen`) VALUES
(21, 'Pizza Hawayana', 'Queso, Jamon y piña', 0.00, 60.00, 100.00, 135.00, 3.00, 'uploads\\1723657116379-828357710-pizzaha.jpeg');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `refrescos`
--

CREATE TABLE `refrescos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text NOT NULL,
  `tamano` varchar(255) DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `url_imagen` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `nombre`) VALUES
(1, 'usuario'),
(2, 'administrador');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `antojitos`
--
ALTER TABLE `antojitos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `rol_id` (`rol_id`);

--
-- Indices de la tabla `detalles_pedido`
--
ALTER TABLE `detalles_pedido`
  ADD PRIMARY KEY (`id`),
  ADD KEY `detalles_pedido_ibfk_1` (`pedido_id`);

--
-- Indices de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cliente_id` (`cliente_id`);

--
-- Indices de la tabla `pizzas`
--
ALTER TABLE `pizzas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `refrescos`
--
ALTER TABLE `refrescos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `antojitos`
--
ALTER TABLE `antojitos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT de la tabla `detalles_pedido`
--
ALTER TABLE `detalles_pedido`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT de la tabla `pizzas`
--
ALTER TABLE `pizzas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `refrescos`
--
ALTER TABLE `refrescos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD CONSTRAINT `clientes_ibfk_1` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`);

--
-- Filtros para la tabla `detalles_pedido`
--
ALTER TABLE `detalles_pedido`
  ADD CONSTRAINT `detalles_pedido_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
