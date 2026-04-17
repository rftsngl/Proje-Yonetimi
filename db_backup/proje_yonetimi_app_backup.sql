-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: proje_yonetimi_app
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auth_sessions`
--

DROP TABLE IF EXISTS `auth_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_sessions` (
  `id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `fk_auth_sessions_user` (`user_id`),
  CONSTRAINT `fk_auth_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_sessions`
--

LOCK TABLES `auth_sessions` WRITE;
/*!40000 ALTER TABLE `auth_sessions` DISABLE KEYS */;
INSERT INTO `auth_sessions` VALUES ('SES-20260416211535188','rifat-admin','ed209fc0be0ea29604bacadefb0a1a4819078f8bffac1576ec363c2f99c5c2fd','2026-04-23 21:15:35','2026-04-16 18:15:35'),('SES-20260416213057149','rifat-admin','b320bea6462e2f25a5f1bba1c3ed00f125afdbe7a4c519be9388c433d515420f','2026-04-23 21:30:57','2026-04-16 18:30:57'),('SES-20260416222049549','rifat-admin','b46bcf15655bb79ace46d2804a5ad52e6130b7431bbe7191c82338e010ca4080','2026-04-23 22:20:50','2026-04-16 19:20:49'),('SES-20260417011250222','rifat-admin','e0c045998ba4874415ebdaa44cc4c43bc15e6c66b029867face6beb66b93877d','2026-04-24 01:12:50','2026-04-16 22:12:50'),('SES-20260417012231128','rifat-admin','9ab9f5ff1580dea32fe98c121fb4b633c91434968a6fe20f6b28a00f557d56f1','2026-04-24 01:22:32','2026-04-16 22:22:31'),('SES-20260417021006944','rifat-admin','50c2944763418425cae2c26b3cdf8016747f89849b0e59a99e16b29bcee07ca8','2026-04-24 02:10:07','2026-04-16 23:10:06'),('SES-20260417024053649','user1','490fce12ed82f2eb10da808785f84e61ac7c0e8ac896e37cd9671310b47f2803','2026-04-23 23:40:53','2026-04-16 23:40:53'),('SES-20260417024423855','rifat-admin','05186f755e82bfae03f19072e5742d96cdcc00738055d35bc65ce4c9fffc79b8','2026-04-23 23:44:24','2026-04-16 23:44:23'),('SES-20260417030800176','rifat-admin','6f49dcdd9c09470d78dd1cf08ab58d80607c5c3e48a3ed24f38764f45e6f92d3','2026-04-24 00:08:00','2026-04-17 00:08:00'),('SES-20260417044740545','rifat-admin','70bff0b4547c3dfe8fc58844975568f8646a819523899f83a8ac02c897731dad','2026-04-24 01:47:41','2026-04-17 01:47:40'),('SES-20260417044814401','rifat-admin','0a4066125a9f27c930e9a163ded1c89235905ea9d59439e51258821062255141','2026-04-24 01:48:15','2026-04-17 01:48:14'),('SES-20260417045739804','rifat-admin','1fab09f92a1b28361918f004705c7c78e5b53caeb24b97a7d862baeaeb44a34b','2026-04-24 01:57:39','2026-04-17 01:57:39'),('SES-20260417054209571','rifat-admin','a9059c70e2d6a84c65a80a52ec45d760fd7df4038a42e1ed2d82228384fffce7','2026-04-24 02:42:10','2026-04-17 02:42:09'),('SES-20260417055342994','rifat-admin','567bef363e1db306344bbc8208f9d856e422286983c213da5a39e045eff077a5','2026-04-24 02:53:43','2026-04-17 02:53:42'),('SES-20260417055355913','rifat-admin','5b7d834feadae7ed67e0dc50db92f14c4e72159731aba150e58066ce9dbafdb7','2026-04-24 02:53:56','2026-04-17 02:53:55'),('SES-20260417055357395','rifat-admin','4d4374738489e545571bdcd97ff8527288b665751005ea5cba58b87f109e4f7c','2026-04-24 02:53:57','2026-04-17 02:53:57'),('SES-20260417055410886','rifat-admin','a6dec4748e8c324e4ff58a2afaa2f568200e2ec60dcb3317a0e1ea0e4832590d','2026-04-24 02:54:10','2026-04-17 02:54:10'),('SES-20260417055419140','rifat-admin','a44b8d666657e98006773e6a6c948c68e51cf3479aa6cd8085b85d12ca81a2a8','2026-04-24 02:54:20','2026-04-17 02:54:19'),('SES-20260417055918422','rifat-admin','389037e72bbc9eb1562c00b032a5631fb935e69da3304b561dd0c61d474a433d','2026-04-24 02:59:19','2026-04-17 02:59:18'),('SES-20260417063649668','rifat-admin','134be67833aa9b7e07e1d33842e09336d8e6a94ccf6f7b67d27238c4111c6009','2026-04-24 03:36:50','2026-04-17 03:36:49');
/*!40000 ALTER TABLE `auth_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calendar_events`
--

DROP TABLE IF EXISTS `calendar_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calendar_events` (
  `id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `color` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reminder_offset` int DEFAULT '0',
  `project_id` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_calendar_project` (`project_id`),
  CONSTRAINT `fk_calendar_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calendar_events`
--

LOCK TABLES `calendar_events` WRITE;
/*!40000 ALTER TABLE `calendar_events` DISABLE KEYS */;
INSERT INTO `calendar_events` VALUES ('EV-20260416213957733','Düzenleme teslim tarihi','2026-05-15','bg-indigo-100 text-indigo-700 border-indigo-200','teslim',0,NULL,'2026-04-16 18:39:57',NULL),('EV-20260417052513921','Celal/Mete Kontrol','2026-04-19','bg-indigo-50 text-indigo-700 border-indigo-100 shadow-indigo-50','tasarim',0,NULL,'2026-04-17 02:25:13',NULL);
/*!40000 ALTER TABLE `calendar_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('task','project','mention','system') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `entity_type` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES ('NTF-20260417024053432','Yeni Görev Oluşturuldu','\"Test Gorevi\" görevi planlandı ve ekibe atandı.','task',0,'2026-04-16 23:40:53','task','TSK-20260417024053187','user1'),('NTF-20260417065619157','Yeni Görev Oluşturuldu','\"ftg\" görevi planlandı ve ekibe atandı.','task',1,'2026-04-17 03:56:19','task','TSK-20260417065619981','rifat-admin');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_members`
--

DROP TABLE IF EXISTS `project_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_members` (
  `project_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`project_id`,`user_id`),
  KEY `fk_project_members_user` (`user_id`),
  CONSTRAINT `fk_project_members_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_members`
--

LOCK TABLES `project_members` WRITE;
/*!40000 ALTER TABLE `project_members` DISABLE KEYS */;
INSERT INTO `project_members` VALUES ('PRJ-001','user1'),('PRJ-005','user1'),('PRJ-001','user4');
/*!40000 ALTER TABLE `project_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `manager_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `progress` int NOT NULL DEFAULT '0',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('Aktif','Tamamlandı') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Aktif',
  `category` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `theme_color` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'bg-indigo-600',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_projects_manager` (`manager_id`),
  CONSTRAINT `fk_projects_manager` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES ('PRJ-001','E-Ticaret Mobil Uygulama','Yeni nesil alışveriş deneyimi için React Native tabanlı mobil uygulama geliştirme süreci.','user1',75,'2026-03-01','2026-04-08','Aktif','Mobil Geliştirme','bg-indigo-600','2026-04-16 17:55:57'),('PRJ-005','Yapay Zeka Destekli Chatbot','Müşteri hizmetleri için GPT tabanlı akıllı destek asistanı geliştirme projesi.','user1',15,'2026-03-20','2026-06-25','Aktif','AI / ML','bg-rose-500','2026-04-16 17:55:57');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_assignees`
--

DROP TABLE IF EXISTS `task_assignees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_assignees` (
  `task_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`task_id`,`user_id`),
  KEY `fk_task_assignees_user` (`user_id`),
  CONSTRAINT `fk_task_assignees_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_task_assignees_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_assignees`
--

LOCK TABLES `task_assignees` WRITE;
/*!40000 ALTER TABLE `task_assignees` DISABLE KEYS */;
INSERT INTO `task_assignees` VALUES ('TSK-001','user1'),('TSK-20260417065619981','user1'),('TSK-005','user4');
/*!40000 ALTER TABLE `task_assignees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_attachments`
--

DROP TABLE IF EXISTS `task_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_attachments` (
  `id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `task_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size_label` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size_bytes` bigint DEFAULT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_task_attachments_task` (`task_id`),
  CONSTRAINT `fk_task_attachments_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_attachments`
--

LOCK TABLES `task_attachments` WRITE;
/*!40000 ALTER TABLE `task_attachments` DISABLE KEYS */;
INSERT INTO `task_attachments` VALUES ('ATT-001','TSK-001','Tasarim_Rehberi.pdf','PDF','2.4 MB',NULL,NULL,NULL,'2026-04-16 17:55:57'),('ATT-002','TSK-001','Arastirma_Notlari.docx','DOC','980 KB',NULL,NULL,NULL,'2026-04-16 17:55:57'),('ATT-003','TSK-002','Logo_Alternatif.png','PNG','1.1 MB',NULL,NULL,NULL,'2026-04-16 17:55:57');
/*!40000 ALTER TABLE `task_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_comments`
--

DROP TABLE IF EXISTS `task_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_comments` (
  `id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `task_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_task_comments_task` (`task_id`),
  KEY `fk_task_comments_user` (`user_id`),
  CONSTRAINT `fk_task_comments_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_task_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_comments`
--

LOCK TABLES `task_comments` WRITE;
/*!40000 ALTER TABLE `task_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_task_id` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priority` enum('Yüksek','Orta','Düşük') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Orta',
  `status` enum('Yapılacak','Devam Ediyor','Tamamlandı','Gecikti') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Yapılacak',
  `start_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `project_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comments_count` int NOT NULL DEFAULT '0',
  `attachments_count` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_tasks_project` (`project_id`),
  KEY `fk_tasks_parent` (`parent_task_id`),
  CONSTRAINT `fk_tasks_parent` FOREIGN KEY (`parent_task_id`) REFERENCES `tasks` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tasks_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES ('TSK-001','Kullanıcı Araştırması','Yeni özellikler için kullanıcı geri bildirimlerini analiz et.',NULL,'Yüksek','Devam Ediyor',NULL,'2026-03-30','PRJ-001',0,2,'2026-04-16 17:55:57'),('TSK-002','Logo Tasarımı','Marka kimliği için alternatif logo çalışmaları yap.',NULL,'Orta','Tamamlandı',NULL,'2026-04-02','PRJ-001',0,1,'2026-04-16 17:55:57'),('TSK-005','Mobil Uygulama Testleri','Mobil uygulama için kapsamlı test senaryoları oluştur.',NULL,'Yüksek','Devam Ediyor',NULL,'2026-03-20','PRJ-001',0,0,'2026-04-16 17:55:57'),('TSK-20260417065619981','ftg','ggnc','TSK-005','Orta','Devam Ediyor',NULL,NULL,'PRJ-001',0,0,'2026-04-17 03:56:19');
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_audit_logs`
--

DROP TABLE IF EXISTS `user_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_audit_logs` (
  `id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_user_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_user_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` enum('role_update','department_update') COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_value` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_value` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_audit_logs`
--

LOCK TABLES `user_audit_logs` WRITE;
/*!40000 ALTER TABLE `user_audit_logs` DISABLE KEYS */;
INSERT INTO `user_audit_logs` VALUES ('AUD-20260417021037864','rifat-admin','user4','department_update','Yazılım','Tasarım','2026-04-16 23:10:37'),('AUD-20260417041323752','rifat-admin','user2','role_update','Senior Developer','Product Manager','2026-04-17 01:13:23'),('AUD-20260417041326545','rifat-admin','user2','role_update','Product Manager','Senior Developer','2026-04-17 01:13:26'),('AUD-20260417050019495','rifat-admin','user4','role_update','QA Engineer','Product Manager','2026-04-17 02:00:19'),('AUD-20260417050025846','rifat-admin','user4','role_update','Product Manager','Admin','2026-04-17 02:00:25'),('AUD-20260417050030792','rifat-admin','user4','role_update','Admin','Senior Developer','2026-04-17 02:00:30'),('AUD-20260417051606983','rifat-admin','user1','department_update','Yönetim','Tasarım','2026-04-17 02:16:06'),('AUD-20260417055931696','rifat-admin','USR-20260417055808667','department_update','Ürün Yönetimi','Tasarım','2026-04-17 02:59:31');
/*!40000 ALTER TABLE `user_audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_settings`
--

DROP TABLE IF EXISTS `user_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_settings` (
  `id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `theme` enum('light','dark','system') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system',
  `language` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tr',
  `notify_task_assigned` tinyint(1) NOT NULL DEFAULT '1',
  `notify_project_updates` tinyint(1) NOT NULL DEFAULT '1',
  `notify_deadline_reminders` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_user_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_settings`
--

LOCK TABLES `user_settings` WRITE;
/*!40000 ALTER TABLE `user_settings` DISABLE KEYS */;
INSERT INTO `user_settings` VALUES ('USET-20260417055833449','USR-20260417055808667','light','tr',1,1,1,'2026-04-17 02:58:33','2026-04-17 02:58:39'),('USET-rifat-admin','rifat-admin','light','tr',1,1,1,'2026-04-16 22:36:14','2026-04-17 03:29:18'),('USET-user1','user1','light','tr',1,1,1,'2026-04-16 22:36:14','2026-04-16 23:20:30'),('USET-user4','user4','light','tr',1,1,1,'2026-04-16 22:36:14','2026-04-17 03:02:00');
/*!40000 ALTER TABLE `user_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('Online','Offline','Busy') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Offline',
  `last_active` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('rifat-admin','Rıfat Sinanoğlu','/uploads/avatars/AVT-20260417024528328.png','Admin','rifat@zodiac.com','Online','Şimdi','Yönetim','7995b3798c09e03e856ff4153f2d6ae4:3775cbffda634b8672c9bc49dde3b44a338e58cfd1dc76db6a017ebfedb8bf705e9f0f4218acacf3eda6cc0aa1e8bfd377aa983150f4a8954d6285db679141d6','2026-04-16 18:14:19'),('user1','Celal Halilov','user1','Admin','celal@zodiac.com','Online','Şimdi','Tasarım','b7200f4c323b32fe1e5b1839bd26efe9:bad41383f14473dc9ad3373000d613c3cbcddebcb0d08ae70fc207b49d431c328b79ddb2b03e51c2e0954bd71307972cda2fdcfdd3053cbe21c1be76923cb9be','2026-04-16 17:55:57'),('user4','Zeynep Ak','user4','Senior Developer','zeynep@zodiac.com','Offline','1 saat önce','Tasarım','b7200f4c323b32fe1e5b1839bd26efe9:bad41383f14473dc9ad3373000d613c3cbcddebcb0d08ae70fc207b49d431c328b79ddb2b03e51c2e0954bd71307972cda2fdcfdd3053cbe21c1be76923cb9be','2026-04-16 17:55:57'),('USR-20260417055808667','Aslı Yanis','user-usr-20260417055808667','Frontend Developer','asli@zodiac.com','Online','Simdi','Tasarım','055e23525af88a00641ab1a9207ce8cb:98c0371451d452083a825d0dde4617e1b27a8a7ebb777e54da9cb083d1892b5d86d4915865a03a00378613be3dbc2f5d1a17acdb191b192f5f2674dad86c4e02','2026-04-17 02:58:08');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'proje_yonetimi_app'
--

--
-- Dumping routines for database 'proje_yonetimi_app'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-17  7:12:39
