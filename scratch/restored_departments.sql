--
-- PostgreSQL database dump
--

\restrict 1ZypFasSxjeZF5iI3j2uZywjNXAF8ahebsm2ZPbCZK5zagp5sfBi9mWhaBgwWTi

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
-- Dumped by pg_dump version 18.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Department" (id, name, status, "leftSignatureImageUrl", "leftSignatureLabel", "signatureImageUrl", "signatureLabel", "printIndividualPages", "labId", "createdAt", "updatedAt") FROM stdin;
3	SEROLOGY	Active	https://res.cloudinary.com/dci6zeb1n/image/upload/v1779184810/lab-management/signatures/lab/depsignatureimages__1__1779184808846-383113119.jpg	LAB INCHARGE	\N	\N	t	1	2026-05-19 08:01:54.14	2026-05-19 10:03:39.741
7	PATHOLOGY	Active	https://res.cloudinary.com/dci6zeb1n/image/upload/v1779185149/lab-management/signatures/lab/depsignatureimages__1__1779185147671-41716747.jpg	LAB INCHARGE	\N	Verified By	f	1	2026-05-19 08:01:56.027	2026-05-19 10:05:51.917
14	2 D ECHOCARDIOGRAM	Active	\N	\N	\N	\N	f	1	2026-05-19 08:01:59.354	2026-05-19 09:00:44.049
15	PACKAGE INCLUSION	Active	\N	\N	\N	\N	f	1	2026-05-19 08:01:59.832	2026-05-19 09:00:44.627
9	X-RAY	Active	https://res.cloudinary.com/dci6zeb1n/image/upload/v1779185272/lab-management/signatures/lab/depsignatureimages_1779185270932-186563893.jpg	DR.P. YASHWANTH. MBBS,MD.                                 CONSULTANT RADIOLOGIST.	\N	\N	f	1	2026-05-19 08:01:56.966	2026-05-19 10:07:54.081
11	ECG	Active	\N	Lab Incharge	\N	Verified By	f	1	2026-05-19 08:01:57.95	2026-05-19 10:08:59.104
10	HISTOPATHOLOGY	Active	https://res.cloudinary.com/dci6zeb1n/image/upload/v1779185299/lab-management/signatures/lab/depsignatureimages__1__1779185298377-650602521.jpg	LAB INCHARGE	\N	Verified By	t	1	2026-05-19 08:01:57.436	2026-05-19 10:09:23.497
12	HORMONES	Active	https://res.cloudinary.com/dci6zeb1n/image/upload/v1779185396/lab-management/signatures/lab/depsignatureimages__1__1779185395011-199776975.jpg	LAB INCHARGE	\N	Verified By	t	1	2026-05-19 08:01:58.419	2026-05-19 10:10:09.944
13	RADIOLOGY	Active	\N	\N	\N	\N	t	1	2026-05-19 08:01:58.888	2026-05-19 10:10:27.803
1	BIO CHEMISTRY	Active	\N	Verified By	\N	LAB INCHARGE	t	1	2026-05-19 08:01:52.737	2026-05-19 09:15:52.525
4	CLINICAL PATHOLOGY	Active	https://res.cloudinary.com/dci6zeb1n/image/upload/v1779184635/lab-management/signatures/lab/depsignatureimages__1__1779184633223-184639537.jpg	Verified By	\N	LAB INCHARGE	t	1	2026-05-19 08:01:54.608	2026-05-19 09:57:38.988
2	IMMUNOLOGY	Active	https://res.cloudinary.com/dci6zeb1n/image/upload/v1779184785/lab-management/signatures/lab/depsignatureimages__1__1779184783957-743059104.jpg	Verified By	\N	LAB INCHARGE	t	1	2026-05-19 08:01:53.439	2026-05-19 09:59:50.864
5	HEMATOLOGY	Active	https://res.cloudinary.com/dci6zeb1n/image/upload/v1779184857/lab-management/signatures/lab/depsignatureimages__1__1779184855114-473482328.jpg	Verified By	\N	LAB INCHARGE	t	1	2026-05-19 08:01:55.077	2026-05-19 10:00:59.779
6	MICRO BIOLOGY	Active	https://res.cloudinary.com/dci6zeb1n/image/upload/v1779184887/lab-management/signatures/lab/depsignatureimages__1__1779184885492-9276044.jpg	Verified By	\N	LAB INCHARGE	t	1	2026-05-19 08:01:55.547	2026-05-19 10:01:30.166
8	CYTOLOGY	Active	https://res.cloudinary.com/dci6zeb1n/image/upload/v1779184973/lab-management/signatures/lab/depsignatureimages__1__1779184971413-469073059.jpg	Verified By	\N	LAB INCHARGE	t	1	2026-05-19 08:01:56.495	2026-05-19 10:02:55.817
\.


--
-- PostgreSQL database dump complete
--

\unrestrict 1ZypFasSxjeZF5iI3j2uZywjNXAF8ahebsm2ZPbCZK5zagp5sfBi9mWhaBgwWTi

