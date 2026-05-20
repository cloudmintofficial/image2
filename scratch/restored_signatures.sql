--
-- PostgreSQL database dump
--

\restrict WEB1nK2tFbb7CWHp3wrIthq3OsxGUeaxcVcW6QJQ4x0E3yzZV9Aab5aTlup4RFi

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
-- Data for Name: DoctorSignature; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DoctorSignature" (id, label, name, title, "signText", "imageData", status, "createdAt") FROM stdin;
default	Default System Signature	DR. AUTHORIZED SIGNATORY	CONSULTANT RADIOLOGIST	Signature	\N	Active	2026-05-03 05:18:22.379
praveen	DR.M.Praveen Kumar. DMRD,DNB.	DR.M.Praveen Kumar. DMRD,DNB.	CONSULTANT RADIOLOGIST	M.Praveen Kumar	\N	Active	2026-05-03 05:18:22.383
venkateshwar	DR. VENKATESHWAR REDDY Consultant Radiologist	Dr. Venkateshwar Reddy	CONSULTANT RADIOLOGIST	Venkateshwar	\N	Active	2026-05-03 05:18:22.384
surabi	DR SURABI KARTHIK M.D Radiodianosis	DR SURABI KARTHIK	M.D Radiodianosis\nConsultant Radiologist	S.Karthik	\N	Active	2026-05-03 05:18:22.384
dilip	DR.K.Dilip Reddy. MBBS, MDRD	DR.K.Dilip Reddy. MBBS, MDRD	CONSULTANT RADIOLOGIST	K.Dilip	\N	Active	2026-05-03 05:18:22.385
aruna	DR ARUNA JYOTHI	DR ARUNA JYOTHI	CONSULTANT RADIOLOGIST	Aruna Jyothi	\N	Active	2026-05-03 05:18:22.385
\.


--
-- PostgreSQL database dump complete
--

\unrestrict WEB1nK2tFbb7CWHp3wrIthq3OsxGUeaxcVcW6QJQ4x0E3yzZV9Aab5aTlup4RFi

