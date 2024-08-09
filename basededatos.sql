-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 09-08-2024 a las 04:19:06
-- Versión del servidor: 10.4.28-MariaDB
-- Versión de PHP: 8.2.4

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
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL,
  `nombre_completo` varchar(250) NOT NULL,
  `telefono` int(250) NOT NULL,
  `email` varchar(250) NOT NULL,
  `direccion` varchar(250) NOT NULL,
  `especificaciones_direccion` varchar(250) NOT NULL,
  `rol_id` int(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id`, `nombre_completo`, `telefono`, `email`, `direccion`, `especificaciones_direccion`, `rol_id`) VALUES
(7, 'andres', 1234567890, 'andy@gmail.com', 'lopez', 'lavanderia', 2),
(44, 'luis', 1234567890, 'luis@gmail.com', 'Andador del músico ', 'dfsfgg', 1),
(46, 'Aquim', 2147483647, '31adbixd31@gmail.com', 'Independencia 32 B', 'Frente al CBTis', 1),
(47, 'Yhair', 2147483647, '31adbixd31@gmail.com', 'Independencia 32 B', '1234', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedido_pizza`
--

CREATE TABLE `pedido_pizza` (
  `id` int(11) NOT NULL,
  `cliente_id` int(11) DEFAULT NULL,
  `fecha_pedido` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pedido_pizza`
--

INSERT INTO `pedido_pizza` (`id`, `cliente_id`, `fecha_pedido`) VALUES
(1, 44, '2024-07-25 19:12:28'),
(2, 46, '2024-07-25 19:13:17'),
(3, 44, '2024-07-25 19:14:21'),
(4, 44, '2024-07-25 19:20:44'),
(5, 47, '2024-07-25 19:22:16'),
(6, 44, '2024-07-25 20:00:38');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedido_pizza_detalle`
--

CREATE TABLE `pedido_pizza_detalle` (
  `id` int(11) NOT NULL,
  `pedido_pizza_id` int(11) DEFAULT NULL,
  `producto_id` int(11) DEFAULT NULL,
  `tamaño` enum('small','medium','large') DEFAULT NULL,
  `cantidad` int(11) DEFAULT NULL,
  `precio` decimal(10,2) DEFAULT NULL,
  `estado` enum('pendiente','atendido','rechazado') DEFAULT 'pendiente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `price_small` decimal(10,2) NOT NULL,
  `price_medium` decimal(10,2) NOT NULL,
  `price_large` decimal(10,2) NOT NULL,
  `cheese_crust_price` decimal(10,2) NOT NULL,
  `url_imagen` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `name`, `description`, `price`, `price_small`, `price_medium`, `price_large`, `cheese_crust_price`, `url_imagen`) VALUES
(13, 'pizza hawayana', 'piña, queso, tomate', 0.00, 900.00, 130.00, 140.00, 12.00, 'http://localhost:3001/uploads/1723169384511.jpg');

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
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `rol_id` (`rol_id`);

--
-- Indices de la tabla `pedido_pizza`
--
ALTER TABLE `pedido_pizza`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cliente_id` (`cliente_id`);

--
-- Indices de la tabla `pedido_pizza_detalle`
--
ALTER TABLE `pedido_pizza_detalle`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pedido_pizza_id` (`pedido_pizza_id`),
  ADD KEY `producto_id` (`producto_id`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
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
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT de la tabla `pedido_pizza`
--
ALTER TABLE `pedido_pizza`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `pedido_pizza_detalle`
--
ALTER TABLE `pedido_pizza_detalle`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

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
-- Filtros para la tabla `pedido_pizza`
--
ALTER TABLE `pedido_pizza`
  ADD CONSTRAINT `pedido_pizza_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`);

--
-- Filtros para la tabla `pedido_pizza_detalle`
--
ALTER TABLE `pedido_pizza_detalle`
  ADD CONSTRAINT `pedido_pizza_detalle_ibfk_1` FOREIGN KEY (`pedido_pizza_id`) REFERENCES `pedido_pizza` (`id`),
  ADD CONSTRAINT `pedido_pizza_detalle_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
