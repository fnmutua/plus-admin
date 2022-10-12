--
-- PostgreSQL database dump
--

-- Dumped from database version 14.3
-- Dumped by pg_dump version 14.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: beneficiary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.beneficiary (
    id integer NOT NULL,
    name character varying(255),
    national_id character varying(255),
    kra_pin character varying(255),
    hh_id integer,
    photo bytea,
    address character varying(255),
    intervention_id integer,
    settlement_id integer
);


ALTER TABLE public.beneficiary OWNER TO postgres;

--
-- Name: beneficiary_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.beneficiary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.beneficiary_id_seq OWNER TO postgres;

--
-- Name: beneficiary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.beneficiary_id_seq OWNED BY public.beneficiary.id;


--
-- Name: beneficiary_parcel; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.beneficiary_parcel (
    beneficiary_id integer NOT NULL,
    parcel_id integer NOT NULL,
    id integer NOT NULL,
    settlement_id integer
);


ALTER TABLE public.beneficiary_parcel OWNER TO postgres;

--
-- Name: beneficiary_parcel_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.beneficiary_parcel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.beneficiary_parcel_id_seq OWNER TO postgres;

--
-- Name: beneficiary_parcel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.beneficiary_parcel_id_seq OWNED BY public.beneficiary_parcel.id;


--
-- Name: cluster; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cluster (
    id integer NOT NULL,
    lot_id integer NOT NULL,
    cluster_no integer NOT NULL,
    contract character varying(255) NOT NULL,
    consultant character varying(255) NOT NULL,
    description character varying(255)
);


ALTER TABLE public.cluster OWNER TO postgres;

--
-- Name: cluster_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cluster_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cluster_id_seq OWNER TO postgres;

--
-- Name: cluster_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cluster_id_seq OWNED BY public.cluster.id;


--
-- Name: county; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.county (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(255) NOT NULL,
    geom public.geometry(Polygon,4326)
);


ALTER TABLE public.county OWNER TO postgres;

--
-- Name: county_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.county_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.county_id_seq OWNER TO postgres;

--
-- Name: county_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.county_id_seq OWNED BY public.county.id;


--
-- Name: crime_spot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.crime_spot (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    settlement_id integer NOT NULL,
    type character varying(255) NOT NULL,
    ownership character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    geom public.geometry(Point,4326)
);


ALTER TABLE public.crime_spot OWNER TO postgres;

--
-- Name: crime_spot_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.crime_spot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.crime_spot_id_seq OWNER TO postgres;

--
-- Name: crime_spot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.crime_spot_id_seq OWNED BY public.crime_spot.id;


--
-- Name: disaster_zone; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.disaster_zone (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    settlement_id integer NOT NULL,
    type_disaster character varying(255) NOT NULL,
    no_affected integer NOT NULL,
    frequency character varying(255) NOT NULL,
    nature character varying(255) NOT NULL,
    geom public.geometry(Polygon,4326)
);


ALTER TABLE public.disaster_zone OWNER TO postgres;

--
-- Name: disaster_zone_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.disaster_zone_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.disaster_zone_id_seq OWNER TO postgres;

--
-- Name: disaster_zone_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.disaster_zone_id_seq OWNED BY public.disaster_zone.id;


--
-- Name: dumping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dumping (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    settlement_id integer NOT NULL,
    type_waste character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    geom public.geometry(Point,4326)
);


ALTER TABLE public.dumping OWNER TO postgres;

--
-- Name: dumping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dumping_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.dumping_id_seq OWNER TO postgres;

--
-- Name: dumping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dumping_id_seq OWNED BY public.dumping.id;


--
-- Name: education_facility; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.education_facility (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    facility_type character varying(255) NOT NULL,
    settlement_id integer NOT NULL,
    enrollment_male integer NOT NULL,
    enrollment_female integer NOT NULL,
    no_teachers integer NOT NULL,
    no_other_staff integer NOT NULL,
    no_toilets_male integer NOT NULL,
    no_toilets_female integer NOT NULL,
    owner character varying(255) NOT NULL,
    reg_status character varying(255) NOT NULL,
    geom public.geometry(Point,4326),
    ownership character varying
);


ALTER TABLE public.education_facility OWNER TO postgres;

--
-- Name: education_facility_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.education_facility_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.education_facility_id_seq OWNER TO postgres;

--
-- Name: education_facility_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.education_facility_id_seq OWNED BY public.education_facility.id;


--
-- Name: electricity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.electricity (
    id integer NOT NULL,
    width double precision NOT NULL,
    settlement_id integer NOT NULL,
    geom public.geometry(LineString,4326)
);


ALTER TABLE public.electricity OWNER TO postgres;

--
-- Name: electricity_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.electricity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.electricity_id_seq OWNER TO postgres;

--
-- Name: electricity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.electricity_id_seq OWNED BY public.electricity.id;


--
-- Name: facility_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.facility_type (
    id integer NOT NULL,
    type character varying(255) NOT NULL
);


ALTER TABLE public.facility_type OWNER TO postgres;

--
-- Name: facility_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.facility_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.facility_type_id_seq OWNER TO postgres;

--
-- Name: facility_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.facility_type_id_seq OWNED BY public.facility_type.id;


--
-- Name: flood_light; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flood_light (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    facility_type integer NOT NULL,
    settlement_id integer NOT NULL,
    rating character varying(255) NOT NULL,
    height integer NOT NULL,
    date_installed timestamp with time zone NOT NULL,
    owner character varying(255) NOT NULL,
    ownership integer NOT NULL,
    geom public.geometry(Point,4326)
);


ALTER TABLE public.flood_light OWNER TO postgres;

--
-- Name: flood_light_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.flood_light_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.flood_light_id_seq OWNER TO postgres;

--
-- Name: flood_light_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.flood_light_id_seq OWNED BY public.flood_light.id;


--
-- Name: health_facility; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.health_facility (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    facility_type character varying(255) NOT NULL,
    settlement_id integer NOT NULL,
    avg_daily_inpatient integer NOT NULL,
    avg_daily_outpatients integer NOT NULL,
    no_medical_staff integer NOT NULL,
    no_other_staff integer NOT NULL,
    no_toilets_male integer NOT NULL,
    no_toilets_female integer NOT NULL,
    ownership integer NOT NULL,
    owner character varying(255) NOT NULL,
    reg_status character varying(255) NOT NULL,
    geom public.geometry(Point,4326)
);


ALTER TABLE public.health_facility OWNER TO postgres;

--
-- Name: health_facility_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.health_facility_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.health_facility_id_seq OWNER TO postgres;

--
-- Name: health_facility_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.health_facility_id_seq OWNED BY public.health_facility.id;


--
-- Name: households; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.households (
    id integer NOT NULL,
    settlement_id integer,
    name character varying(255),
    gender character varying(255),
    national_id character varying(255) NOT NULL,
    kra_pin character varying(255),
    marital_status character varying(255),
    education_level character varying(255),
    residence_type character varying(255),
    length_stay character varying(255),
    ownership_status character varying(255),
    photo bytea,
    hh_size_03 integer,
    hh_size_414 integer,
    hh_size_1520 integer,
    hh_size_2125 integer,
    hh_size_2655 integer,
    hh_size_gt55 integer,
    over_80 integer,
    terminally_ill integer,
    ph_disabled integer,
    orphans integer,
    ment_disabled integer,
    hearing_disabled integer,
    visual_disabled integer,
    emp_status character varying(255),
    income_level character varying(255),
    type_structure character varying(255),
    struct_owner character varying(255),
    rent_payable character varying(255),
    address character varying(255)
);


ALTER TABLE public.households OWNER TO postgres;

--
-- Name: households_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.households_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.households_id_seq OWNER TO postgres;

--
-- Name: households_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.households_id_seq OWNED BY public.households.id;


--
-- Name: intervention_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.intervention_type (
    id integer NOT NULL,
    type character varying(255) NOT NULL
);


ALTER TABLE public.intervention_type OWNER TO postgres;

--
-- Name: intervention_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.intervention_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.intervention_type_id_seq OWNER TO postgres;

--
-- Name: intervention_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.intervention_type_id_seq OWNED BY public.intervention_type.id;


--
-- Name: interventions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interventions (
    id integer NOT NULL,
    intervention_type integer NOT NULL,
    year integer NOT NULL,
    intervention_phase integer NOT NULL,
    settlement_id integer NOT NULL,
    cluster_id integer NOT NULL
);


ALTER TABLE public.interventions OWNER TO postgres;

--
-- Name: interventions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.interventions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.interventions_id_seq OWNER TO postgres;

--
-- Name: interventions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.interventions_id_seq OWNED BY public.interventions.id;


--
-- Name: landuse_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.landuse_type (
    id integer NOT NULL,
    use character varying(255) NOT NULL
);


ALTER TABLE public.landuse_type OWNER TO postgres;

--
-- Name: landuse_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.landuse_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.landuse_type_id_seq OWNER TO postgres;

--
-- Name: landuse_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.landuse_type_id_seq OWNED BY public.landuse_type.id;


--
-- Name: lot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lot (
    id integer NOT NULL,
    description character varying(255) NOT NULL
);


ALTER TABLE public.lot OWNER TO postgres;

--
-- Name: lot_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.lot_id_seq OWNER TO postgres;

--
-- Name: lot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lot_id_seq OWNED BY public.lot.id;


--
-- Name: ownership_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ownership_type (
    id integer NOT NULL,
    ownership character varying(255) NOT NULL
);


ALTER TABLE public.ownership_type OWNER TO postgres;

--
-- Name: ownership_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ownership_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ownership_type_id_seq OWNER TO postgres;

--
-- Name: ownership_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ownership_type_id_seq OWNED BY public.ownership_type.id;


--
-- Name: parcel; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parcel (
    id integer NOT NULL,
    area_ha double precision NOT NULL,
    description character varying(255),
    settlement_id integer,
    parcel_no character varying(255),
    lpdp_no character varying(255),
    code character varying(255) NOT NULL,
    landuse_id integer,
    geom public.geometry
);


ALTER TABLE public.parcel OWNER TO postgres;

--
-- Name: parcel_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.parcel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.parcel_id_seq OWNER TO postgres;

--
-- Name: parcel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.parcel_id_seq OWNED BY public.parcel.id;


--
-- Name: path; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.path (
    id integer NOT NULL,
    width double precision NOT NULL,
    settlement_id integer NOT NULL,
    geom public.geometry(LineString,4326)
);


ALTER TABLE public.path OWNER TO postgres;

--
-- Name: path_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.path_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.path_id_seq OWNER TO postgres;

--
-- Name: path_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.path_id_seq OWNED BY public.path.id;


--
-- Name: piped_water; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.piped_water (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    settlement_id integer NOT NULL,
    no_connections integer NOT NULL,
    no_persons_served integer NOT NULL,
    cost_per_cubic integer NOT NULL,
    owner character varying(255) NOT NULL,
    ownership integer NOT NULL,
    geom public.geometry(LineString,4326)
);


ALTER TABLE public.piped_water OWNER TO postgres;

--
-- Name: piped_water_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.piped_water_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.piped_water_id_seq OWNER TO postgres;

--
-- Name: piped_water_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.piped_water_id_seq OWNED BY public.piped_water.id;


--
-- Name: public_facility; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.public_facility (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    facility_type integer NOT NULL,
    settlement_id integer NOT NULL,
    owner character varying(255) NOT NULL,
    ownership integer NOT NULL,
    geom public.geometry(Point,4326)
);


ALTER TABLE public.public_facility OWNER TO postgres;

--
-- Name: public_facility_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.public_facility_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.public_facility_id_seq OWNER TO postgres;

--
-- Name: public_facility_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.public_facility_id_seq OWNED BY public.public_facility.id;


--
-- Name: railway; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.railway (
    id integer NOT NULL,
    width double precision NOT NULL,
    settlement_id integer NOT NULL,
    geom public.geometry(LineString,4326)
);


ALTER TABLE public.railway OWNER TO postgres;

--
-- Name: railway_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.railway_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.railway_id_seq OWNER TO postgres;

--
-- Name: railway_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.railway_id_seq OWNED BY public.railway.id;


--
-- Name: river; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.river (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    settlement_id integer NOT NULL,
    status character varying(255) NOT NULL,
    geom public.geometry(LineString,4326)
);


ALTER TABLE public.river OWNER TO postgres;

--
-- Name: river_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.river_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.river_id_seq OWNER TO postgres;

--
-- Name: river_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.river_id_seq OWNED BY public.river.id;


--
-- Name: road; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.road (
    id integer NOT NULL,
    width double precision NOT NULL,
    settlement_id integer NOT NULL,
    geom public.geometry(LineString,4326)
);


ALTER TABLE public.road OWNER TO postgres;

--
-- Name: road_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.road_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.road_id_seq OWNER TO postgres;

--
-- Name: road_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.road_id_seq OWNED BY public.road.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(255)
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: sanitation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sanitation (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    facility_type integer NOT NULL,
    settlement_id integer NOT NULL,
    cost_per_use integer NOT NULL,
    owner character varying(255) NOT NULL,
    ownership integer NOT NULL,
    geom character varying(255) NOT NULL
);


ALTER TABLE public.sanitation OWNER TO postgres;

--
-- Name: sanitation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sanitation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sanitation_id_seq OWNER TO postgres;

--
-- Name: sanitation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sanitation_id_seq OWNED BY public.sanitation.id;


--
-- Name: security_actor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.security_actor (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    settlement_id integer NOT NULL,
    type character varying(255) NOT NULL,
    number_officers integer NOT NULL,
    number_vehicle integer NOT NULL,
    geom public.geometry(Point,4326)
);


ALTER TABLE public.security_actor OWNER TO postgres;

--
-- Name: security_actor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.security_actor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.security_actor_id_seq OWNER TO postgres;

--
-- Name: security_actor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.security_actor_id_seq OWNED BY public.security_actor.id;


--
-- Name: settlement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settlement (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    county_id integer NOT NULL,
    settlement_type integer NOT NULL,
    area double precision,
    population integer,
    code character varying(255) NOT NULL,
    geom public.geometry
);


ALTER TABLE public.settlement OWNER TO postgres;

--
-- Name: settlement_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settlement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.settlement_id_seq OWNER TO postgres;

--
-- Name: settlement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settlement_id_seq OWNED BY public.settlement.id;


--
-- Name: settlement_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settlement_type (
    id integer NOT NULL,
    type character varying(255) NOT NULL
);


ALTER TABLE public.settlement_type OWNER TO postgres;

--
-- Name: settlement_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settlement_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.settlement_type_id_seq OWNER TO postgres;

--
-- Name: settlement_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settlement_type_id_seq OWNED BY public.settlement_type.id;


--
-- Name: settlement_uploads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settlement_uploads (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    file_path character varying(255) NOT NULL,
    settlement_id integer NOT NULL,
    "group" character varying(255) NOT NULL
);


ALTER TABLE public.settlement_uploads OWNER TO postgres;

--
-- Name: settlement_uploads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settlement_uploads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.settlement_uploads_id_seq OWNER TO postgres;

--
-- Name: settlement_uploads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settlement_uploads_id_seq OWNED BY public.settlement_uploads.id;


--
-- Name: sewer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sewer (
    id integer NOT NULL,
    settlement_id integer NOT NULL,
    no_connections integer NOT NULL,
    no_persons_served integer NOT NULL,
    ownership integer NOT NULL,
    geom public.geometry(LineString,4326)
);


ALTER TABLE public.sewer OWNER TO postgres;

--
-- Name: sewer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sewer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sewer_id_seq OWNER TO postgres;

--
-- Name: sewer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sewer_id_seq OWNED BY public.sewer.id;


--
-- Name: status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.status (
    id integer NOT NULL,
    status character varying(255) NOT NULL
);


ALTER TABLE public.status OWNER TO postgres;

--
-- Name: status_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.status_id_seq OWNER TO postgres;

--
-- Name: status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.status_id_seq OWNED BY public.status.id;


--
-- Name: stream; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stream (
    id integer NOT NULL,
    width double precision NOT NULL,
    settlement_id integer NOT NULL,
    geom character varying(255) NOT NULL
);


ALTER TABLE public.stream OWNER TO postgres;

--
-- Name: stream_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stream_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.stream_id_seq OWNER TO postgres;

--
-- Name: stream_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stream_id_seq OWNED BY public.stream.id;


--
-- Name: structure_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.structure_type (
    id integer NOT NULL,
    description character varying(255) NOT NULL
);


ALTER TABLE public.structure_type OWNER TO postgres;

--
-- Name: structure_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.structure_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.structure_type_id_seq OWNER TO postgres;

--
-- Name: structure_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.structure_type_id_seq OWNED BY public.structure_type.id;


--
-- Name: structures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.structures (
    id integer NOT NULL,
    description character varying(255)[] NOT NULL,
    settlement_id integer NOT NULL,
    type_id integer NOT NULL,
    struct_use character varying(255) NOT NULL,
    struct_typology character varying(255) NOT NULL,
    owner_id integer NOT NULL,
    struct_ownership character varying(255) NOT NULL,
    geom character varying(255) NOT NULL
);


ALTER TABLE public.structures OWNER TO postgres;

--
-- Name: structures_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.structures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.structures_id_seq OWNER TO postgres;

--
-- Name: structures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.structures_id_seq OWNED BY public.structures.id;


--
-- Name: telcom; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.telcom (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    facility_type integer NOT NULL,
    settlement_id integer NOT NULL,
    owner character varying(255) NOT NULL,
    geom public.geometry(Point,4326)
);


ALTER TABLE public.telcom OWNER TO postgres;

--
-- Name: telcom_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.telcom_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.telcom_id_seq OWNER TO postgres;

--
-- Name: telcom_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.telcom_id_seq OWNED BY public.telcom.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    roleid integer NOT NULL,
    userid integer NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(255),
    name character varying(255),
    email character varying(255),
    county_id integer,
    password character varying(255),
    isactive boolean DEFAULT false,
    phone bigint,
    "resetPasswordToken" character varying(255) DEFAULT true,
    "resetPasswordExpires" timestamp with time zone,
    avatar character varying(255)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: water_point; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.water_point (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    facility_type character varying(255) NOT NULL,
    settlement_id integer NOT NULL,
    capacity integer NOT NULL,
    cost_20l_jerrican integer NOT NULL,
    owner character varying(255) NOT NULL,
    ownership integer NOT NULL,
    geom public.geometry(Point,4326)
);


ALTER TABLE public.water_point OWNER TO postgres;

--
-- Name: water_point_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.water_point_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.water_point_id_seq OWNER TO postgres;

--
-- Name: water_point_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.water_point_id_seq OWNED BY public.water_point.id;


--
-- Name: wetland; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wetland (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    settlement_id integer NOT NULL,
    status character varying(255) NOT NULL,
    geom public.geometry(Polygon,4326)
);


ALTER TABLE public.wetland OWNER TO postgres;

--
-- Name: wetland_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wetland_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.wetland_id_seq OWNER TO postgres;

--
-- Name: wetland_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wetland_id_seq OWNED BY public.wetland.id;


--
-- Name: beneficiary id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary ALTER COLUMN id SET DEFAULT nextval('public.beneficiary_id_seq'::regclass);


--
-- Name: beneficiary_parcel id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary_parcel ALTER COLUMN id SET DEFAULT nextval('public.beneficiary_parcel_id_seq'::regclass);


--
-- Name: cluster id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cluster ALTER COLUMN id SET DEFAULT nextval('public.cluster_id_seq'::regclass);


--
-- Name: county id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.county ALTER COLUMN id SET DEFAULT nextval('public.county_id_seq'::regclass);


--
-- Name: crime_spot id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crime_spot ALTER COLUMN id SET DEFAULT nextval('public.crime_spot_id_seq'::regclass);


--
-- Name: disaster_zone id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disaster_zone ALTER COLUMN id SET DEFAULT nextval('public.disaster_zone_id_seq'::regclass);


--
-- Name: dumping id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dumping ALTER COLUMN id SET DEFAULT nextval('public.dumping_id_seq'::regclass);


--
-- Name: education_facility id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.education_facility ALTER COLUMN id SET DEFAULT nextval('public.education_facility_id_seq'::regclass);


--
-- Name: electricity id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.electricity ALTER COLUMN id SET DEFAULT nextval('public.electricity_id_seq'::regclass);


--
-- Name: facility_type id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_type ALTER COLUMN id SET DEFAULT nextval('public.facility_type_id_seq'::regclass);


--
-- Name: flood_light id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flood_light ALTER COLUMN id SET DEFAULT nextval('public.flood_light_id_seq'::regclass);


--
-- Name: health_facility id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.health_facility ALTER COLUMN id SET DEFAULT nextval('public.health_facility_id_seq'::regclass);


--
-- Name: households id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.households ALTER COLUMN id SET DEFAULT nextval('public.households_id_seq'::regclass);


--
-- Name: intervention_type id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervention_type ALTER COLUMN id SET DEFAULT nextval('public.intervention_type_id_seq'::regclass);


--
-- Name: interventions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interventions ALTER COLUMN id SET DEFAULT nextval('public.interventions_id_seq'::regclass);


--
-- Name: landuse_type id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.landuse_type ALTER COLUMN id SET DEFAULT nextval('public.landuse_type_id_seq'::regclass);


--
-- Name: lot id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lot ALTER COLUMN id SET DEFAULT nextval('public.lot_id_seq'::regclass);


--
-- Name: ownership_type id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ownership_type ALTER COLUMN id SET DEFAULT nextval('public.ownership_type_id_seq'::regclass);


--
-- Name: parcel id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcel ALTER COLUMN id SET DEFAULT nextval('public.parcel_id_seq'::regclass);


--
-- Name: path id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.path ALTER COLUMN id SET DEFAULT nextval('public.path_id_seq'::regclass);


--
-- Name: piped_water id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.piped_water ALTER COLUMN id SET DEFAULT nextval('public.piped_water_id_seq'::regclass);


--
-- Name: public_facility id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_facility ALTER COLUMN id SET DEFAULT nextval('public.public_facility_id_seq'::regclass);


--
-- Name: railway id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.railway ALTER COLUMN id SET DEFAULT nextval('public.railway_id_seq'::regclass);


--
-- Name: river id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.river ALTER COLUMN id SET DEFAULT nextval('public.river_id_seq'::regclass);


--
-- Name: road id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.road ALTER COLUMN id SET DEFAULT nextval('public.road_id_seq'::regclass);


--
-- Name: sanitation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sanitation ALTER COLUMN id SET DEFAULT nextval('public.sanitation_id_seq'::regclass);


--
-- Name: security_actor id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_actor ALTER COLUMN id SET DEFAULT nextval('public.security_actor_id_seq'::regclass);


--
-- Name: settlement id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement ALTER COLUMN id SET DEFAULT nextval('public.settlement_id_seq'::regclass);


--
-- Name: settlement_type id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement_type ALTER COLUMN id SET DEFAULT nextval('public.settlement_type_id_seq'::regclass);


--
-- Name: settlement_uploads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement_uploads ALTER COLUMN id SET DEFAULT nextval('public.settlement_uploads_id_seq'::regclass);


--
-- Name: sewer id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sewer ALTER COLUMN id SET DEFAULT nextval('public.sewer_id_seq'::regclass);


--
-- Name: status id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.status ALTER COLUMN id SET DEFAULT nextval('public.status_id_seq'::regclass);


--
-- Name: stream id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream ALTER COLUMN id SET DEFAULT nextval('public.stream_id_seq'::regclass);


--
-- Name: structure_type id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.structure_type ALTER COLUMN id SET DEFAULT nextval('public.structure_type_id_seq'::regclass);


--
-- Name: structures id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.structures ALTER COLUMN id SET DEFAULT nextval('public.structures_id_seq'::regclass);


--
-- Name: telcom id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.telcom ALTER COLUMN id SET DEFAULT nextval('public.telcom_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: water_point id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.water_point ALTER COLUMN id SET DEFAULT nextval('public.water_point_id_seq'::regclass);


--
-- Name: wetland id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wetland ALTER COLUMN id SET DEFAULT nextval('public.wetland_id_seq'::regclass);


--
-- Data for Name: beneficiary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.beneficiary (id, name, national_id, kra_pin, hh_id, photo, address, intervention_id, settlement_id) FROM stdin;
1	Abdi Ali Isaak	4389049	NA	1	\\x4e41	NA	69	69
2	Abdikadir Shiekh Mohamed	5071335	NA	2	\\x4e41	NA	69	69
3	Abdullah Hassan Haji Hussein	5964784	NA	3	\\x4e41	NA	69	69
4	Abraham K. Chesire	4125821	NA	4	\\x4e41	NA	69	69
6	Achilles Kimurgor Ngeny	5932469	NA	6	\\x4e41	NA	69	69
7	Aden Ali Dika	1232826	NA	7	\\x4e41	NA	69	69
8	Agnes Wanini Kaniu	2338898	NA	8	\\x4e41	NA	69	69
9	Alfred Matundura Mochere	25065871	NA	9	\\x4e41	NA	69	69
10	Ali Adan Osman	1232667	NA	10	\\x4e41	NA	69	69
11	Ali Ahmed Warsama	134906	NA	11	\\x4e41	NA	69	69
12	Ali Hassan Isack	27671099	NA	12	\\x4e41	NA	69	69
13	Anastasia Jepngetich Masai	11605041	NA	13	\\x4e41	NA	69	69
14	Anjalina Kanda Rotich	3138704	NA	14	\\x4e41	NA	69	69
15	Anorld Maswai Ngeywo	1156124	NA	15	\\x4e41	NA	69	69
16	Bahati P. Ag. Elijah	BAHATI P. AG. ELIJAH	NA	16	\\x4e41	NA	69	69
17	Bernard Kipkoech Langat	24172010	NA	17	\\x4e41	NA	69	69
18	Berry Auma Yuaya	5981073	NA	18	\\x4e41	NA	69	69
19	Bishar Omar Mohamed	20935326	NA	19	\\x4e41	NA	69	69
20	Boniface Pepela Matofari	10747462	NA	20	\\x4e41	NA	69	69
21	Catherine Ipaliopagala	4384977	NA	21	\\x4e41	NA	69	69
22	Charles Chonjo Makokha	22575998	NA	22	\\x4e41	NA	69	69
23	Charles K. A. Ruto	12553722	NA	23	\\x4e41	NA	69	69
24	Christine Chepketer Barno	8762878	NA	24	\\x4e41	NA	69	69
25	Clement Kharunda Siahi	10659532	NA	25	\\x4e41	NA	69	69
26	Clement Kibirgen Serem	723044	NA	26	\\x4e41	NA	69	69
27	Daniel Kipchirchir Koros	1226151	NA	27	\\x4e41	NA	69	69
28	Daniel Liyula Muliru	DANIEL LIYULA MULIRU	NA	28	\\x4e41	NA	69	69
29	Daniel Ngetich	877620	NA	29	\\x4e41	NA	69	69
30	Daniel Tiliareng’ Kibowen	336891	NA	30	\\x4e41	NA	69	69
31	David Berech Kebenei	6578457	NA	31	\\x4e41	NA	69	69
32	David Karanja	847843	NA	32	\\x4e41	NA	69	69
33	David Kipkoech Cherus	9604644	NA	33	\\x4e41	NA	69	69
34	David Kiplangat Kipsang	1448838	NA	34	\\x4e41	NA	69	69
35	David Kunusia	13613215	NA	35	\\x4e41	NA	69	69
36	Dennis Simeon Odinga	10840510	NA	36	\\x4e41	NA	69	69
37	Dinah Chebet	10937286	NA	37	\\x4e41	NA	69	69
38	Dinah Chemase	20960766	NA	38	\\x4e41	NA	69	69
39	Dominic Andole Mwimani	14552392	NA	39	\\x4e41	NA	69	69
40	Dorcas Akou Munyes	12424194	NA	40	\\x4e41	NA	69	69
41	Dorcas Masese Isrita	300709	NA	41	\\x4e41	NA	69	69
42	Edward K. Chesingil	20043374	NA	42	\\x4e41	NA	69	69
43	Edward Kemboi Chesingil	20043374	NA	43	\\x4e41	NA	69	69
44	Elijah Kipkoech Sugut	20697153	NA	44	\\x4e41	NA	69	69
45	Eliud Kipchumba Keen	27917947	NA	45	\\x4e41	NA	69	69
46	Eliud Kipkoech Lagat	13202352	NA	46	\\x4e41	NA	69	69
47	Elizabeth Chepkemboi	563405	NA	47	\\x4e41	NA	69	69
48	Elizabeth Matsitsa Mwangi	13205654	NA	48	\\x4e41	NA	69	69
49	Elphas Kipkemboi Ngelechei	7444365	NA	49	\\x4e41	NA	69	69
50	Emily Jepkemboi Misoi	3264274	NA	50	\\x4e41	NA	69	69
51	Eric Morara Orina	12898637	NA	51	\\x4e41	NA	69	69
52	Ernest Kibet	1221030	NA	52	\\x4e41	NA	69	69
53	Esther Kalunda	22548355	NA	53	\\x4e41	NA	69	69
54	Esther Ngelel	5602280	NA	54	\\x4e41	NA	69	69
55	Eunice Njambi Gitau	1230027	NA	55	\\x4e41	NA	69	69
56	Eunice Wandia Kavinya	20655808	NA	56	\\x4e41	NA	69	69
57	Eunice Wangoi	8627569	NA	57	\\x4e41	NA	69	69
58	Fatuma Adan Ali	21301442	NA	58	\\x4e41	NA	69	69
59	Francis Anari Nyanumba	1634687	NA	59	\\x4e41	NA	69	69
60	Francis Karanja Kianda	320245	NA	60	\\x4e41	NA	69	69
61	Francis Kibagendi Mogute	2980079	NA	61	\\x4e41	NA	69	69
62	Fred Welch Muleshe	9871955	NA	62	\\x4e41	NA	69	69
63	Getrude Mutoro Wanyonyi	23955645	NA	63	\\x4e41	NA	69	69
64	Gidion A. Maiyo	3265936	NA	64	\\x4e41	NA	69	69
65	Gladys Moraa Nyachieo	12877095	NA	65	\\x4e41	NA	69	69
66	Go For Restoration Of Truth	CHURCH	NA	66	\\x4e41	NA	69	69
67	Goretty Akinyi Ochieng	13206168	NA	67	\\x4e41	NA	69	69
68	Grace Colleta	6086699	NA	68	\\x4e41	NA	69	69
69	Haron Luvisia Makokha	13434856	NA	69	\\x4e41	NA	69	69
70	Hassan Owgiro Wissack	HASSAN OWGIRO WISSACK	NA	70	\\x4e41	NA	69	69
71	Hellen Chepkoech Chepkwony	5452746	NA	71	\\x4e41	NA	69	69
72	Hellen Chepkoechchepkwony	5452746	NA	72	\\x4e41	NA	69	69
73	Hellenathulumutanda	1899914	NA	73	\\x4e41	NA	69	69
74	Hellenzipporah Willey	997310	NA	74	\\x4e41	NA	69	69
75	Henry Kirwa Sambai	1449808	NA	75	\\x4e41	NA	69	69
76	Hilda Ayuma Samwel	726175	NA	76	\\x4e41	NA	69	69
77	Hussein Mohamed Muhamud	23875691	NA	77	\\x4e41	NA	69	69
78	Ibrahim Adanbatelo	3253487	NA	78	\\x4e41	NA	69	69
79	Ibrahim Aden Ali Dika	23510780	NA	79	\\x4e41	NA	69	69
80	Ibrahim Edin Konre	1449338	NA	80	\\x4e41	NA	69	69
81	Ibrahim Hussein Farah	11651948	NA	81	\\x4e41	NA	69	69
82	Ibrahim Ibrenrobow	9567956	NA	82	\\x4e41	NA	69	69
83	Ibrahim Wafula Khatete	2086220	NA	83	\\x4e41	NA	69	69
84	Isaac Adan	838101	NA	84	\\x4e41	NA	69	69
85	Isaac Kiptepis Chemrokok	5791478	NA	85	\\x4e41	NA	69	69
86	Isaac N. Njuguna Kimengi	3463082	NA	86	\\x4e41	NA	69	69
87	Ismael Issak Ibren	12755957	NA	87	\\x4e41	NA	69	69
88	Issack Hussein Abdula	ISSACK HUSSEIN ABDULA	NA	88	\\x4e41	NA	69	69
89	Jacob Kipsang Arap Yego	21341278	NA	89	\\x4e41	NA	69	69
90	James Michori Maina	846866	NA	90	\\x4e41	NA	69	69
91	James Wathika Gituro	1446766	NA	91	\\x4e41	NA	69	69
92	Jane Maru	3444018	NA	92	\\x4e41	NA	69	69
93	Jane Njeri Kaniaru	9252376	NA	93	\\x4e41	NA	69	69
94	Japheth Kittur Chemaiyo	5303326	NA	94	\\x4e41	NA	69	69
95	Jaqueline Mukungu Maina	20939812	NA	95	\\x4e41	NA	69	69
96	Jeniffer Toiyoi Toroitich	3541848	NA	96	\\x4e41	NA	69	69
97	Jepkurgat Birgen	5300202	NA	97	\\x4e41	NA	69	69
98	Joel K. Kotutwo	3322434	NA	98	\\x4e41	NA	69	69
99	Joel Rotich Chirchir	9570345	NA	99	\\x4e41	NA	69	69
100	John Alex Bore	235238	NA	100	\\x4e41	NA	69	69
101	John Kimathi Muriuki	11490396	NA	101	\\x4e41	NA	69	69
102	John Makau Ofisi	977607	NA	102	\\x4e41	NA	69	69
103	John Masisa Olwanyi	1444297	NA	103	\\x4e41	NA	69	69
104	John Ogola Okumu	433424/63	NA	104	\\x4e41	NA	69	69
105	Joseph Chesire Chemuna	4342878	NA	105	\\x4e41	NA	69	69
106	Joseph Kamau Toro	16064310	NA	106	\\x4e41	NA	69	69
107	Joseph Kipchumba Kigen	10704708	NA	107	\\x4e41	NA	69	69
108	Joseph Kiptoo Ruto	8626254	NA	108	\\x4e41	NA	69	69
109	Joseph Ngetich Langat	6424953	NA	109	\\x4e41	NA	69	69
110	Joseph Wafula	12878478	NA	110	\\x4e41	NA	69	69
111	Josephat Kiptarbei Kirwa	253278	NA	111	\\x4e41	NA	69	69
112	Joshua Kipsang Kibiego	4901812	NA	112	\\x4e41	NA	69	69
113	Josiah Nyamohanga Kerario	2827045	NA	113	\\x4e41	NA	69	69
114	Josphine Kerubo	303108	NA	114	\\x4e41	NA	69	69
115	Joyce Jeruto Kipkore	9865394	NA	115	\\x4e41	NA	69	69
116	Judith Nabwile Nyongesa	11328244	NA	116	\\x4e41	NA	69	69
117	Julius Kadima Lanya	6877189	NA	117	\\x4e41	NA	69	69
118	Julius Kiprop Mosbei	23997064	NA	118	\\x4e41	NA	69	69
119	Julius Maina Mathenge	723426	NA	119	\\x4e41	NA	69	69
120	Julius Mwangi Njuguna	726825	NA	120	\\x4e41	NA	69	69
121	Justus Muriuki Marimi	1234420	NA	121	\\x4e41	NA	69	69
122	Kalist Ouma Wasike	1226785	NA	122	\\x4e41	NA	69	69
123	Kennedy Josephat Okonda	10840544	NA	123	\\x4e41	NA	69	69
124	Khadija Adan Abdi	11193974	NA	124	\\x4e41	NA	69	69
125	Kimuikey Jonathan Magut	1811331	NA	125	\\x4e41	NA	69	69
126	Kipkering Arap Keino	1251715	NA	126	\\x4e41	NA	69	69
127	Kipkosgei Murei	1228408	NA	127	\\x4e41	NA	69	69
128	Kiprop Philemon Kandie	10376643	NA	128	\\x4e41	NA	69	69
129	Kiprotich Bitock	1228142	NA	129	\\x4e41	NA	69	69
130	Kipserem Mutai	1451739	NA	130	\\x4e41	NA	69	69
131	Leah Jepkemoi Chumo	1279781	NA	131	\\x4e41	NA	69	69
132	Lucas Barasa	585690	NA	132	\\x4e41	NA	69	69
133	Lucy Wanjiro	6861967/69	NA	133	\\x4e41	NA	69	69
134	Luka Kipkoech Bitok	9991259	NA	134	\\x4e41	NA	69	69
135	Luka Leiyeyo Ole Roimen	10403958	NA	135	\\x4e41	NA	69	69
136	Maimuna Kakenyankinangaei	9252409	NA	136	\\x4e41	NA	69	69
137	Marcella Jebatia Kibet	9839874	NA	137	\\x4e41	NA	69	69
138	Marcella Jebutia Kibet	9839874	NA	138	\\x4e41	NA	69	69
139	Margaret Njeri Gaithuya	5783344	NA	139	\\x4e41	NA	69	69
140	Margaret Wambui	839018	NA	140	\\x4e41	NA	69	69
141	Margaret Wambui Michori	839018	NA	141	\\x4e41	NA	69	69
142	Margaret Wanjiku Nyuri	1934526	NA	142	\\x4e41	NA	69	69
143	Mariam Barkale	24009107	NA	143	\\x4e41	NA	69	69
144	Mary Anyango Mukele	261498	NA	144	\\x4e41	NA	69	69
145	Mary Chepchirchir Choge	839527	NA	145	\\x4e41	NA	69	69
146	Mary Nanjala Kayanda	4144676	NA	146	\\x4e41	NA	69	69
147	Mary Nasmiyu Simiyu	5737822	NA	147	\\x4e41	NA	69	69
148	Mary Wanjiku	1446626	NA	148	\\x4e41	NA	69	69
149	Mathew Kibet Kimurua	287818	NA	149	\\x4e41	NA	69	69
150	Maxwell Misoga	20005587	NA	150	\\x4e41	NA	69	69
151	Milca Ogolla	1232405	NA	151	\\x4e41	NA	69	69
152	Milka Toroitich Lutia	283556	NA	152	\\x4e41	NA	69	69
153	Mohamed Abdi Osman	13004986	NA	153	\\x4e41	NA	69	69
154	Mohamed Ali Ego	16078279	NA	154	\\x4e41	NA	69	69
155	Mohamed Alioido	1450336	NA	155	\\x4e41	NA	69	69
156	Moses Arap Yego	3937265	NA	156	\\x4e41	NA	69	69
157	Moses Kamau Wangari	25282290	NA	157	\\x4e41	NA	69	69
158	Moses Kemboi Kiprono	1785730	NA	158	\\x4e41	NA	69	69
159	Moses Kemboin Kiprono	1785730	NA	159	\\x4e41	NA	69	69
160	Moses Kipsang Murei	448736	NA	160	\\x4e41	NA	69	69
161	Mwangi Njoroge Bahati P. Ag. Elijah	725677	NA	161	\\x4e41	NA	69	69
162	Nahashon Kiptum Samoei	22455986	NA	162	\\x4e41	NA	69	69
163	Nasambu Rose Wilfrida Ogola	258223	NA	163	\\x4e41	NA	69	69
164	Nelley Chepchirchir Kebenei	23666910	NA	164	\\x4e41	NA	69	69
165	Nelly Chepchirchir Kebenei	23666910	NA	165	\\x4e41	NA	69	69
166	Nelson Adeya Kisali	11167521	NA	166	\\x4e41	NA	69	69
167	Oliver James Guto	11792847	NA	167	\\x4e41	NA	69	69
168	Pamellah Toto Papai	4213176	NA	168	\\x4e41	NA	69	69
169	Patrick Wachira Gitura	12473272	NA	169	\\x4e41	NA	69	69
170	Paul Kipyego Kosgei	1230441	NA	170	\\x4e41	NA	69	69
171	Paul Kivisi Musanga	1170732	NA	171	\\x4e41	NA	69	69
172	Paul Kosgei Kutto	6846836	NA	172	\\x4e41	NA	69	69
173	Paul Ronoh Kurgat	8333364	NA	173	\\x4e41	NA	69	69
174	Peter Kirwa Kebenei	1108234	NA	174	\\x4e41	NA	69	69
175	Peter Wabwire Okuku	10121546	NA	175	\\x4e41	NA	69	69
176	Philip K. Kosgey	21617017	NA	176	\\x4e41	NA	69	69
177	Philip Kipkemei Murei	1233584	NA	177	\\x4e41	NA	69	69
178	Philip Kipketer Kosgei	21617017	NA	178	\\x4e41	NA	69	69
179	Philip Mulogosi	7968673	NA	179	\\x4e41	NA	69	69
180	Pius Wamalwa Munialo	976253	NA	180	\\x4e41	NA	69	69
181	Rachel Muthoni Gacheru	12948021	NA	181	\\x4e41	NA	69	69
182	Regina Jerotich Kemboi	12878784	NA	182	\\x4e41	NA	69	69
183	Robert Tinega Zakayo	407460	NA	183	\\x4e41	NA	69	69
184	Ronald Kipkech Kipterei	13069317	NA	184	\\x4e41	NA	69	69
185	Sadia Hussein Ali	1182928	NA	185	\\x4e41	NA	69	69
186	Saine Kimeli John	10761914	NA	186	\\x4e41	NA	69	69
187	Salima Mohamed Hassan	25953310	NA	187	\\x4e41	NA	69	69
188	Sammy Mirikau Mukolwe	1228691	NA	188	\\x4e41	NA	69	69
189	Sammy Ndiema Kalinjonya	27815172	NA	189	\\x4e41	NA	69	69
190	Samson Kipkosgei Tuwei	3295383	NA	190	\\x4e41	NA	69	69
191	Samuel Kiplel Kirwa	11121582	NA	191	\\x4e41	NA	69	69
192	Samwelwaruguwanyoike	10183470	NA	192	\\x4e41	NA	69	69
193	Sarah Cherono Cheruiyot	1237386	NA	193	\\x4e41	NA	69	69
194	Sarah Imbogo	9169424	NA	194	\\x4e41	NA	69	69
195	Sarah Jeruto Sammy	6860030	NA	195	\\x4e41	NA	69	69
196	Sefania Salambo	8715817	NA	196	\\x4e41	NA	69	69
197	Shadrack Kingetich	20337474	NA	197	\\x4e41	NA	69	69
198	Shaphan Lunani Makunda	8837489	NA	198	\\x4e41	NA	69	69
199	Simeon Agwata Nyamagwa	304333	NA	199	\\x4e41	NA	69	69
200	Simon Kipkemboi	4638347	NA	200	\\x4e41	NA	69	69
201	Simon Kitum Chemweno	1225750	NA	201	\\x4e41	NA	69	69
202	Sofia Anyango Ogutu	14453703	NA	202	\\x4e41	NA	69	69
203	Solomon Ihachi Chibelenje	57670882	NA	203	\\x4e41	NA	69	69
204	Stephen Angwenyi Nyamweya	10013600	NA	204	\\x4e41	NA	69	69
205	Stephen Koech	13206399	NA	205	\\x4e41	NA	69	69
206	Susan Arua Chuma	12642986	NA	206	\\x4e41	NA	69	69
207	Susana Jelamai Mutai	8327224	NA	207	\\x4e41	NA	69	69
208	Teresa Chemenjo Lelei	3999338	NA	208	\\x4e41	NA	69	69
209	William Kiprop Ronoh	11604311	NA	209	\\x4e41	NA	69	69
210	William Ndinya Omollo	1097291	NA	210	\\x4e41	NA	69	69
211	William Omweri	6117612	NA	211	\\x4e41	NA	69	69
212	William Wanjohi Mureithi	7456816	NA	212	\\x4e41	NA	69	69
213	Willymina Ngaira Magotsi	5632689	NA	213	\\x4e41	NA	69	69
214	Wilson K  C  Chelimo	6597192	NA	214	\\x4e41	NA	69	69
215	Wilson K. Rono	12464743	NA	215	\\x4e41	NA	69	69
216	Wilson Kimosibei Ngisirei	6857261	NA	216	\\x4e41	NA	69	69
217	Wilson Kiptanui Ronoh	12464743	NA	217	\\x4e41	NA	69	69
218	Yegon Dominic Kipngetich	22415513	NA	218	\\x4e41	NA	69	69
219	Zacchaus Omai Juma	22767364	NA	219	\\x4e41	NA	69	69
5	Hassan Adanabdi	10760454	NA	5	\\x4e41	NA	69	69
\.


--
-- Data for Name: beneficiary_parcel; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.beneficiary_parcel (beneficiary_id, parcel_id, id, settlement_id) FROM stdin;
1	227	1	69
2	219	2	69
3	222	3	69
4	224	4	69
4	225	5	69
7	117	8	69
8	50	9	69
9	36	10	69
10	158	11	69
11	214	12	69
12	205	13	69
13	45	14	69
14	62	15	69
15	134	16	69
16	84	17	69
17	30	18	69
18	181	19	69
19	189	20	69
20	201	21	69
21	187	22	69
22	39	23	69
22	49	24	69
23	120	25	69
24	16	26	69
25	27	27	69
26	146	28	69
27	113	29	69
28	21	30	69
29	29	31	69
30	92	32	69
32	198	33	69
33	59	34	69
34	88	35	69
35	105	36	69
36	67	37	69
37	6	38	69
38	37	39	69
39	175	40	69
40	221	41	69
41	73	42	69
42	77	43	69
43	132	44	69
44	167	45	69
46	194	46	69
47	56	47	69
48	32	48	69
49	118	49	69
50	5	50	69
51	208	51	69
52	145	52	69
53	220	53	69
54	11	54	69
55	116	55	69
56	173	56	69
57	125	57	69
57	215	58	69
59	54	59	69
60	86	60	69
61	35	61	69
62	97	62	69
63	69	63	69
64	28	64	69
65	164	65	69
65	165	66	69
66	195	67	69
67	183	68	69
68	199	69	69
69	42	70	69
70	119	71	69
71	130	72	69
72	129	73	69
74	188	74	69
75	89	75	69
76	46	76	69
77	216	77	69
78	141	78	69
79	2	79	69
80	160	80	69
81	212	81	69
82	174	82	69
83	24	83	69
84	10	84	69
85	23	85	69
86	112	86	69
87	192	87	69
88	119	88	69
89	203	89	69
90	63	90	69
91	20	91	69
92	186	92	69
93	166	93	69
94	94	94	69
94	95	95	69
94	96	96	69
95	184	97	69
96	131	98	69
97	178	99	69
98	47	100	69
99	93	101	69
100	22	102	69
101	118	103	69
102	153	104	69
103	25	105	69
104	72	106	69
105	156	107	69
106	102	108	69
107	8	109	69
107	197	110	69
108	78	111	69
109	56	112	69
110	57	113	69
111	71	114	69
112	100	115	69
113	226	116	69
114	209	117	69
115	85	118	69
116	90	119	69
117	18	120	69
117	19	121	69
119	48	122	69
120	3	123	69
121	191	124	69
122	154	125	69
122	155	126	69
122	190	127	69
123	80	128	69
124	217	129	69
125	66	130	69
126	124	131	69
127	114	132	69
128	149	133	69
129	98	134	69
129	138	135	69
130	128	136	69
130	135	137	69
131	101	138	69
132	65	139	69
133	60	140	69
134	44	141	69
135	108	142	69
136	127	143	69
137	159	144	69
138	107	145	69
139	68	146	69
140	170	147	69
141	169	148	69
142	41	149	69
144	51	150	69
146	12	151	69
147	213	152	69
148	99	153	69
149	202	154	69
150	182	155	69
151	85	156	69
152	127	157	69
153	139	158	69
154	13	159	69
155	207	160	69
156	121	161	69
157	58	162	69
158	151	163	69
159	150	164	69
160	79	165	69
161	84	166	69
162	126	167	69
163	126	168	69
164	82	169	69
165	52	170	69
166	70	171	69
167	140	172	69
168	33	173	69
168	34	174	69
169	136	175	69
170	172	176	69
171	9	177	69
172	83	178	69
173	87	179	69
174	99	180	69
175	58	181	69
176	77	182	69
177	109	183	69
178	76	184	69
179	90	185	69
180	91	186	69
181	223	187	69
182	40	188	69
183	200	189	69
184	64	190	69
185	218	191	69
186	61	192	69
187	179	193	69
188	14	194	69
189	163	195	69
190	123	196	69
190	161	197	69
191	144	198	69
192	43	199	69
193	103	200	69
194	133	201	69
195	147	202	69
196	204	203	69
197	61	204	69
198	31	205	69
199	17	206	69
200	191	207	69
201	1	208	69
202	15	209	69
203	111	210	69
204	26	211	69
205	120	212	69
206	15	213	69
207	142	214	69
207	143	215	69
208	193	216	69
209	81	217	69
210	106	218	69
211	53	219	69
212	4	220	69
212	7	221	69
213	177	222	69
214	152	223	69
215	224	224	69
216	38	225	69
217	75	226	69
218	104	227	69
219	228	228	69
5	180	6	69
6	180	7	69
\.


--
-- Data for Name: cluster; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cluster (id, lot_id, cluster_no, contract, consultant, description) FROM stdin;
7	4	1	MLHUD/KISIP/CS/002/2015-2016-Kisumu-Uasin-Gishu	NA	Consultancy Services for Planning and Surveying of Selected Informal Settlements in Kisumu, and Uasin Gishu Counties. (lot 4 cluster 1)
8	4	2	MLHUD/KISIP/CS/002/2015-2016-Kilifi-Mombasa	NA	Consultancy services for Planning & Survey of selected 5 settlements in Kilifi and Mombasa Counties under Lot4 cluster2 ).\n
9	4	3	MLHUD/KISIP/CS/002/2015-2016-Nakuru\n	NA	Consultancy services for Planning & Survey of selected 5 settlements in Nakuru County under Lot4 cluster 3).
10	4	4	MLHUD/KISIP/CS/002/2015-2016-Garissa	NA	Consultancy services for planning and Surveying of Selected informal settlements in Garissa County Phase II) –Lot 4 Cluster 4\n
11	4	5	MLHUD/KISIP/CS/002/2015-2016-Nyeri\n	NA	Consultancy services for Planning & Survey of selected 5 settlements in Nyeri County under Lot4 cluster 5).
17	8	1	Tenure 2022	NA	NA
18	9	1	Infrastructure 2022	NA	NA
19	10	1	Inclusion 2022	NA	NA
1	1	1	MH/KISIP/CS/002/2010-2011	NA	Consultancy Services for Planning and Surveying of Selected Informal Settlements In  Embu, Nyeri, Kakamega and Kilifi Counties
2	2	1	MH/KISIP/CS/005/2012-2013	NA	Consultancy Services for Planning and Surveying of Selected Informal Settlements in Embu, Kiambu (Thika), Mombasa and Nairobi Counties
3	3	1	MLHUD/KISIP/CS/005A/2013-2014	NA	Consultancy services for planning and surveying of selected informal settlements in Kisumu, Kericho, Kakamega and Nairobi.\n
4	3	2	MLHUD/KISIP/CS/005B/2013-2014 \n	NA	Consultancy services for Planning & Survey of selected 8 settlements in Kilifi County under Lot3).
5	3	3	MLHUD/KISIP/CS/005C/2013-2014\n	NA	Consultancy services for Planning & Survey of selected 5 settlements in Garissa and 1 settlement in Kitui county under Lot3).
6	3	4	MLHUD/KISIP/CS/005D/2013-2014 \n	NA	Consultancy services for Planning & Survey of selected 8 settlements in Nyeri under Lot3).
12	5	1	RAP Consultancy\n	NA	RAP Consultancy
13	6	1	MLHUD/KISIP/SS/001/2015-2016 	NA	Consultancy for development of resettlement action plans (RAPS) for newly planned and surveyed informal settlements in Kilifi, Kakamega and Embu Counties done under lot 1\n
15	7	3	E&G consult\n	E&G consult\n	E&G consult
14	7	4	MTHHUD/KISIP/CS/9D-08/2018-2019	LER consult\n	Consultancy services for Planning, Survey  and preparation of RAPS in Nairobi and Mombasa Counties cluster 4
16	7	2	MTHUD/KISIP/CS/9A/2018-2019	Two EMS\n	Consultancy services for Planning, Survey  and preparation of RAPS in Kilifi, Nairobi and Mombasa Counties cluster 2
\.


--
-- Data for Name: county; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.county (id, name, code, geom) FROM stdin;
1	Mombasa	Mombasa	\N
2	Kwale	Kwale	\N
3	Kilifi	Kilifi	\N
4	Tana River	Tana River	\N
5	Lamu	Lamu	\N
6	Taita Taveta	Taita Taveta	\N
7	Garissa	Garissa	\N
8	Wajir	Wajir	\N
9	Mandera	Mandera	\N
10	Marsabit	Marsabit	\N
11	Isiolo	Isiolo	\N
12	Meru	Meru	\N
13	Tharaka-Nithi	Tharaka-Nithi	\N
14	Embu	Embu	\N
15	Kitui	Kitui	\N
16	Machakos	Machakos	\N
17	Makueni	Makueni	\N
18	Nyandarua	Nyandarua	\N
19	Nyeri	Nyeri	\N
20	Kirinyaga	Kirinyaga	\N
21	Murang'a	Muranga	\N
22	Kiambu	Kiambu	\N
23	Turkana	Turkana	\N
24	West Pokot	West Pokot	\N
25	Samburu	Samburu	\N
26	Trans Nzoia	Trans-Nzoia	\N
27	Uasin Gishu	Uasin Gishu	\N
28	Elgeyo-Marakwet	Elgeyo-Marakwet	\N
29	Nandi	Nandi	\N
30	Baringo	Baringo	\N
31	Laikipia	Laikipia	\N
32	Nakuru	Nakuru	\N
33	Narok	Narok	\N
34	Kajiado	Kajiado	\N
35	Kericho	Kericho	\N
36	Bomet	Bomet	\N
37	Kakamega	Kakamega	\N
38	Vihiga	Vihiga	\N
39	Bungoma	Bungoma	\N
40	Busia	Busia	\N
41	Siaya	Siaya	\N
42	Kisumu	Kisumu	\N
43	Homa Bay	Homa Bay	\N
44	Migori	Migori	\N
45	Kisii	Kisii	\N
46	Nyamira	Nyamira	\N
47	Nairobi	Nairobi	\N
\.


--
-- Data for Name: crime_spot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.crime_spot (id, name, settlement_id, type, ownership, owner, geom) FROM stdin;
\.


--
-- Data for Name: disaster_zone; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.disaster_zone (id, name, settlement_id, type_disaster, no_affected, frequency, nature, geom) FROM stdin;
\.


--
-- Data for Name: dumping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dumping (id, name, settlement_id, type_waste, status, geom) FROM stdin;
\.


--
-- Data for Name: education_facility; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.education_facility (id, name, facility_type, settlement_id, enrollment_male, enrollment_female, no_teachers, no_other_staff, no_toilets_male, no_toilets_female, owner, reg_status, geom, ownership) FROM stdin;
1	Test	ECD	1	1	1	1	1	1	1	asas	registered	\N	public
2	test	ECD	2	1	1	2	1	2	1	ownersh	unregistered	\N	public
\.


--
-- Data for Name: electricity; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.electricity (id, width, settlement_id, geom) FROM stdin;
\.


--
-- Data for Name: facility_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.facility_type (id, type) FROM stdin;
\.


--
-- Data for Name: flood_light; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flood_light (id, name, facility_type, settlement_id, rating, height, date_installed, owner, ownership, geom) FROM stdin;
\.


--
-- Data for Name: health_facility; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.health_facility (id, name, facility_type, settlement_id, avg_daily_inpatient, avg_daily_outpatients, no_medical_staff, no_other_staff, no_toilets_male, no_toilets_female, ownership, owner, reg_status, geom) FROM stdin;
\.


--
-- Data for Name: households; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.households (id, settlement_id, name, gender, national_id, kra_pin, marital_status, education_level, residence_type, length_stay, ownership_status, photo, hh_size_03, hh_size_414, hh_size_1520, hh_size_2125, hh_size_2655, hh_size_gt55, over_80, terminally_ill, ph_disabled, orphans, ment_disabled, hearing_disabled, visual_disabled, emp_status, income_level, type_structure, struct_owner, rent_payable, address) FROM stdin;
1	55	Julia Wanjeri Wandimi 	Female	3183390	A011267269A 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2	55	Evah Wangui Kimamo 	Male	24531050	A006198147X 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3	55	Samwel Mwaniki Ndegea 	Male	11806101	A003044320X 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4	55	Susan Muthoni Kahumbi 	Female	3183635	A011267218K 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5	55	Joseph Gikonyo Mwangi 	Male	5510321	A001860914M 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6	55	Boniface Ndugo Mathenge 	Male	2338096	A001479604V 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7	55	Esther Wambui Chenuka 	Female	5507565	A003290915E 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8	55	Caroline Waruguru Chenuka	Female	NA	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9	55	Jerioth Mumbi Chenuka	Female	NA	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
10	55	Samuel Ndegwa Chenuka	Male	NA	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
11	55	County Government Of Nyeri Reserved For Cattle Dip 	N/A	NA	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
12	55	Miriam Watetu Ndigirigi 	Female	3183647	A011265844R 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
13	55	Christopher Muthui Mathenge 	Male	76370	A001533033G 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
14	55	Charles Kariuki Wachira 	Male	11806081	A003296252V 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
15	55	Stanley Waweru Wairimu 	Male	23175869	A011262313U 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
16	55	Grace Wanjiru Mbuti 	Female	3183177	A010096109H 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
17	55	Grace Wangui Rukwaro 	Female	3182488	A010648450A 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
18	55	Mary Njeri Mwangi 	Female	9994003	A011274250I 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
19	55	Archdiocese Of Nyeri Trustees-Njogu-Ini 	N/A	NA	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
20	55	County Government Of Nyeri Reserved For  Cementery 	N/A	NA	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
21	55	County Government Of Nyeri Reserved For Water Tank 	N/A	NA	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
22	55	Jedida Wanjiru Wandimi 	Female	5519264	A0092518Q 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
23	55	Benjamin Muchemi Wanjiru	Male	NA	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
24	55	James Kariuki Muhuhu	Male	NA	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
25	55	Loise Wanjiru Ndiritu	Female	NA	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
26	55	Irene Wanjira Muthungu 	Female	3182915	A005705117P 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
27	55	John Wambugu Nderitu 	Male	24001561	A011270160B 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
28	55	Samuel Wangombe Ndirangu 	Male	35862810	A011271159H 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
29	55	Naftaly Muhoro Gituru 	Male	23334530	A005541316D 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
30	55	Susan Wairimu Wanyiri 	Female	5519495	A008237348Z 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
31	55	County Government Of Nyeri Reserved For Slaughter House 	N/A	NA	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
32	55	Home Economic Women  Group 	N/A	B/833 	P051655789D 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
33	55	Tea Buying Centre 	N/A	NA	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
34	55	Kina-Ini Women Group 	N/A	NA	P051656125H 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
35	55	Miriam Nyawira Muchemi 	Female	229710	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
36	55	Njoguini Primary School	N/A	NA	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
37	55	P.C.E.A Church	N/A	NA	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
38	55	Aipca Church	N/A	NA	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
39	55	Dispensary	N/A	NA	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
40	55	Njoguini Secondary School	N/A	NA	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
41	1	George Ngatia Jackson	Male	4673002	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
42	1	Hannah Wariara Thiong’O	Female	1807616	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
43	1	Joyce Mutinda Mwololo	Male	5716794	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
44	1	Emmah Wangui Munene	Male	10379926	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
45	1	Justin Irungu	Male	1810583	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
46	1	Alice Wambui Karanja	Male	5742702	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
47	1	Lawrence Muchoki Irungu	Male	24805038	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
48	1	Joseph Njoroge Mutugi	Male	11074706	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
49	1	Nahashon Maina Ngatho	Male	841907	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
50	1	Philip Kyaula Mbova	Male	5061692	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
51	1	Cecilia Gaceri Mugambi	Male	8611475	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
52	1	John Njue Njogu	Male	24884886	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
53	1	Gilbert M Munyao	Male	8861058	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
54	1	Richard Muendo Kimani	Male	351344	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
55	1	Japheth Wambua Kyengo	Male	989673	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
56	1	David Mwoya Gakure	Male	16105894	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
57	1	Hannah Nyambura Maina	Male	13275028	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
58	1	David Kamau Wanyoike	Male	10608401	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
59	1	Julius Oduor Okoth	Male	7839179	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
60	1	1. Miriam Awuor Odhiambo	Male	7839179	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
61	1	2. Hellen Adhiambo Odhiambo	Male	7839179	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
62	1	3. Natasha Akinyi Odhiambo	Male	7839179	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
63	1	Robert Kangogo Kulei	Male	11427798	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
64	1	Kerani  Kilisha Gwandoho	Male	6979986	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
65	1	Zacheus Musungu Kangu	Male	23468534	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
66	1	Peterson Ombego Nyakego	Male	6547025	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67	1	Tatu Nuthoni Ali	Male	(NOT VERIFIED)	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
68	1	Melisa Atsulu Oluoch	Male	1807594	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
69	1	Rosemary Njambi Karugu	Male	7441545	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
70	1	Muruthi Titus Thuo	Male	253326	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
71	1	Collins Kiprop Cheruiyot	Male	12850337	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
72	1	Beatrice Junga Ondigu	Male	12966452	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
73	1	Francis Muchira Kithece	Male	1884240	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
74	1	Annah Omwari	Male	(NOT VERIFIED)	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
75	1	Gabriel Karaya Murage	Male	1339769	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
76	1	Fridah Igoji Mrimunya	Male	5099106	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
77	1	James Kyalo Ndumo	Male	14522189	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
78	1	Michael Oganda Okumu	Male	12834844	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
79	1	Patrick Karanja Kamuyu	Male	13796975	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
80	1	Janet Jepkoech Kosgey	Male	 31874739	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
81	1	Jafred Imeli Atsiaya	Male	20743643	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
82	1	Alex Omollo	Male	(NOT VERIFIED)	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
83	1	Reuben Ngarihiu Ngathia	Male	13464444	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
84	1	Gerald Kamotho Muturi	Male	5509207	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
85	1	Roselyne Korongo Kagai	Male	9660543	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
86	1	Mary Mutindi Kimulu	Male	5090539	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
87	1	 Florence Ndunge	Male	4858059	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
88	1	Samuel Mwangi Mugo	Male	(NOT VERIFIED)	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
89	1	Boniface Kasanga Mutua 	Male	21347672	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
90	1	Christiner Mueni Musau	Male	28419579	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
91	1	Moses Awino Okeyo	Male	107932269	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
92	1	Cyprian Aritho Kithuri	Male	8307778	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
93	1	Julius Kyalo Wanjau	Male	11047749	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
94	1	Gibson Mwangi Warui	Male	5149172	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
95	1	Richard Chepto Chemweno	Male	11063398	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
96	1	Teresia Waithira Karioki	Male	372955	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
97	1	Richard - Nyarago	Male	20107822	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
98	1	Moses Kiptanui Siele	Male	1806757	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99	1	Benard Kyangu Peter Musango	Male	1807429	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
100	1	Jacinta Syombua 	Male	960825	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
101	1	Millicent Njoki Ndungu	Male	24132495	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
102	1	Paul Mbuuri 	Male	(NOT VERIFIED)	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
103	1	Angelina Kanini   Mutunga	Male	12941150	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
104	1	Agnes Wambui Wang’Ombe	Male	7064677	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
105	1	Jane Karimi Kangethe	Male	8537623	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
106	1	Julius Omukonyi Lolo	Male	11416941	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
107	1	Thomas Muia Mutua	Male	20224248	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
108	1	Boniface  Kasanga Mutua	Male	21347672	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
109	1	Sabina Mongina Keriga	Male	23025963	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
110	1	Mutua Inani	Male	6818988	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
111	1	Fancy Jebet Rotich	Male	21347642	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
112	1	Joshua Koech Kipkurui	Male	10080076	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
113	1	Addy Ngombe Wafula	Male	5280942	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
114	1	Emily Wangari Kahuria	Male	3481479	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
115	1	Rose Ndungwa Mutinda	Male	6144893	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
116	1	Mary Nkirote Mbobua	Male	190494	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
117	1	Moses Eloloi	Male	3328399	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
118	1	Alice Mogendi	Male	3228399	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
119	1	Abdi Omar Shelkh	Male	(NOT VERIFIED)	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
120	1	Joseph Maina Githau	Male	8335906	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
121	1	Anthony Ngugi Kamau	Male	21973661	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
122	1	Margaret Mbithe Muthoka	Male	20040131	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
123	1	Emma Daniel Kalii	Male	8684596	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
124	1	Justus Nzioka Mutwiwa	Male	20053887	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
125	1	Titus Keen Mwangi	Male	4419893	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
126	1	Mary Muthoni Kamau	Male	3560555	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
127	1	Michael Odhiambo Muhare	Male	13786446	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
128	1	Maluki Kimotho Mumbo	Male	3359515	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
129	1	Albert Karani Murithi	Male	10649705	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
130	1	Joseph Ndungu Gacugu	Male	10228491	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
131	1	Maina Kagiri Kibubu	Male	2047425	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
132	1	Jackline Ngina Muthoka	Male	20389295	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
133	1	Samuel Ngugi Mwaura	Male	1137382	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
134	1	Joseph Munene Muria	Male	841069	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
135	1	Isaac Njeru Mwangangi	Male	14644810	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
136	1	John Gitau Kamanji	Male	3329704	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
137	1	Christine Munyiva Mutua	Male	583863	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
138	1	Naomi Kwamboka Aruya	Male	4849714	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
139	1	Florence Auma  Ochieno	Male	1810258	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
140	1	Stephen Ngei Musyoka	Male	18115479	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
141	1	Lydia Odoli Waburiri	Male	6984233	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
142	1	Jeniffer Mantu Kimuge	Male	4012249	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
143	1	William Mwangi Karimi	Male	363270	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
144	1	Dorcas Wairimu  Mungai	Male	9575095	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
145	1	Margaret Muthoni Mwangi	Male	75555320	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
146	1	Johnston Mutuku Mwanza	Male	403657	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
147	1	Florence Mueni Munywoki	Male	9616436	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
148	1	Josephine Muthoni Muhia	Male	351047	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
149	1	Mwendwa Muvengei	Male	2446201	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
150	1	Kithinji Edwin Muthuri	Male	14412942	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
151	1	Ann Waruguru Gitau	Male	20699195	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
152	1	Dinah Jebet Sang	Male	1237669	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
153	1	Ngele Mwazighe	Male	5034926	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
154	1	Alexander Musembi	Male	11342057	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
155	1	Stephen Warui Njagatha	Male	9333409	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
156	1	Ngele Mwazige	Male	5034926	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
157	1	Caroline J Kiprotich	Male	4124350	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
158	1	Lucy Wanjiku Chege	Male	7917063	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
159	1	Agnes Ndululu Tuta	Male	12768596	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
160	1	Peter Maina Wanene	Male	20755393	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
161	1	Samwel Oyioka Kebati	Male	667037	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
162	1	Jennifer Mueni Nzuki	Male	32327292	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
163	1	Daniel Mule Anthony	Male	14654475	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
164	1	Patrick Kimatu Kioko	Male	7350279	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
165	1	Nicholas Muia Wambua	Male	16115284	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
166	1	Charles Odhiambo Onongo	Male	16115284	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
167	1	Cornelius Kiio Somba	Male	 13615324	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
168	1	Stanely Mulige Musyoka	Male	13615324	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
169	1	Gideon  Muregwa Muriithi	Male	1124141	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
170	1	Catherine Wanjiku Kamiri	Male	23951731	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
171	1	Stanely Gatura Njima	Male	2046615	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
172	1	Charles Murigi M	Male	8587447	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
173	1	Evanson Kingori Ndiragu	Male	2964074	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
174	1	Cheruiyot Kiplangat Alfred	Male	20336513	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
175	1	David Mbithi Kilimbui	Male	1806349	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
176	1	Mary Wanjiku	Male	(NOT VERIFIED)	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
177	1	Eluid Kipkosgei Cherop	Male	11842448	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
178	1	Joan Kigen	Male	12418698	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
179	1	Moses Kibet Chelugui	Male	2005706	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
180	1	Silvester Kibiwott Kinyor	Male	21713824	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
181	1	George Odiwuor Awuonda	Male	8579005	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
182	1	Simon Musyoki Ndambuki	Male	1821477	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
183	1	Rael Kamulu Ngumbi	Male	1472841	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
184	1	Mohammed Salimu Mwalonya	Male	6733189	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
185	1	Monicah Nyawira Thiro	Male	6668283	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
186	1	Virginia Wanjiku Munene	Male	13428327	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
187	1	Micheal Nganga Thiru	Male	11767535	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
188	1	Peter Njenga Thiru	Male	13690639	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
189	1	Paul Kimani Ngarama	Male	6061557	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
190	1	Joseph Njogu Thiru	Male	7869724	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
191	1	Dorothy Syombua Muthee	Male	9035967	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
192	1	Angelina Itaya Otieno	Male	1810164	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
193	1	Samuel  Wanjohi Muchiri	Male	20882345	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
194	1	Elizabeth Wawira Kariithi	Male	22177555	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
195	1	Francis Orata Muntendo	Male	11043869	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
196	1	Musyoka Mutunga Musyoki	Male	6035563	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
197	1	David Mbithi Kilimbua	Male	1806349	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
198	1	Samuel Ntholi Muoki	Male	14616855	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
199	1	Gilbert Munyao	Male	 8861058	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
200	1	Wanyoike Kinuthia	Male	4849173	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
201	1	Njeri Ngochi Bernadette	Male	8473586	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
202	1	Mutua Ndeme	Male	4849173	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
203	1	Shadrack Gitonga Njeru	Male	21873912	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
204	1	Francis Mwangi	Male	8923422	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
205	1	Mutua Ndeme	Male	8721233	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
206	1	Muthoni Mary Kariuki	Male	3338059	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
207	1	Mary Mueni Masilia	Male	89234221	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
208	1	Margaret Muthoni	Male	516161	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
209	1	Joseph Kilonzo Mbumbu	Male	4809476	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
210	1	Joshua Kioko Mutungi	Male	22184799	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
211	1	Zipporah Mwongeli Muteti	Male	7268238	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
212	1	Benjamin Ratemo	Male	3420843	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
213	1	Chrisantus Nyabuto Oigo	Male	8533072	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
214	1	Josephine Nzula Muange	Male	23676462	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
215	1	Erick Gordon Obare Aloo	Male	22285555	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
216	1	Charles Agachi	Male	11420849	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
217	1	Joseph Ruriga Munyi	Male	11420849	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
218	1	Lucy Wanjike Chegwe	Male	23676462	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
219	1	Alice Njeri Ngochi	Male	4300648	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
220	1	Jane Wairimu Gikonyo	Male	10136468	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
221	1	Martin Masya Musango	Male	11624308	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
222	1	George Wambua Mutwiwa	Male	1809784	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
223	1	Jane Nyambura Gachigo	Male	4858281	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
224	1	Moses Awino Okeyo	Male	10793269	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
225	1	Samuel Kimani Nzuki	Male	4857244	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
226	1	Berita Wanza Kioko	Male	4849747	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
227	1	Jacinta Wairimu Njoroge	Male	527744	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
228	1	Daniel Ogechi Kinara	Male	30440055	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
229	1	Jane Muthoni Kamuyu	Male	7980794	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
230	1	Caroline Mbula Makenzi	Male	22222059	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
231	1	Hellen  Adhiambo Onunda	Male	3479105	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
232	1	David Okeyo Nyagowa	Male	13397669	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
233	1	Stanley Kamau Gaicuru	Male	10750158	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
234	1	Simon Mungai Mwaura	Male	667650	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
235	1	Annastasia Kemunto Magaki	Male	667650	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
236	1	Philemona Namoni Toywa	Male	23186963	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
237	1	Matayo Oluoch	Male	6692618	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
238	1	Festus Rubara Mukiri	Male	7764327	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
239	1	Olivia Aoko Omollo	Male	32808329	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
240	1	Rosemary Achando Oluchina	Male	21717410	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
241	1	Selvestas Juma Omadwa	Male	1181220	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
242	1	Nancy Wairimu Kamuri	Male	8106782	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
243	1	Monicah Mwendo Ndululu	Male	14627674	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
244	1	Ruth  Mbula Josphat Mweu	Male	7265229	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
245	1	Emmanuel Mutisya Joel	Male	22654490	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
246	1	Fanuel Jauko Owino	Male	13491989	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
247	1	Arther Onyango	Male	13827701	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
248	1	Julius Okora Ondieki	Male	13327785	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
249	1	Janeth Nyaboke Masita	Male	10784486	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
250	1	Abraham Kirwa Ngetich	Male	5600459	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
251	1	Geoffrey Gatuna Kungu	Male	13549682	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
252	1	David Mbogo Mwangangi	Male	1919513	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
253	1	Martha Kanini Mwau	Male	1010513	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
254	1	Agnes N’Salambi Mbuthye Mbondo	Male	564793	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
255	1	Shadrack Gitonga Njeru	Male	 21873912	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
256	1	Paul Mutala Kavita	Male	13702312	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
257	1	James Mwaniki Njuguna	Male	13452682	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
258	1	George Oluoch Onyango	Male	14619379	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
259	1	Leonora Odera Akongo	Male	14680852	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
260	1	Helen Kemunto Obwocha	Male	22880068	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
261	1	Elizabeth Atieno Awuor	Male	13601066	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
262	1	Idah Crispus Tito	Male	25113080	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
263	1	Paul Kisilu Musili	Male	3491815	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
264	1	Lilian Bosibori Ochwangi	Male	23700250	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
265	1	Nanies Kinanu Daniel	Male	7465426	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
266	1	Jane Moraa Richard	Male	26590777	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
267	1	Robert Kebande Morema	Male	13568039	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
268	1	Joseph Gatundu Kiiru	Male	1389526	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
269	1	Lydia Wanja Irungu	Male	756892	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
270	1	Anyona Rosemary	Male	1807748	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
271	1	Francis Mwangi Waichari	Male	13543121	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
272	1	Francis Kamenwa Chege	Male	7662427	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
273	1	Rose Nyaura	Male	 (NOT VERIFIED)	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
274	1	Linet Apiyo Oginga	Male	20271289	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
275	1	Elizabeth Wakagio	Male	1010583	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
276	1	Lucy Waithera	Male	22714092	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
277	1	Emily Kahuria Wangari	Male	3481479	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
278	1	Benjamin Safari Kisilu	Male	9346527	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
279	1	Linet Mmbone Agesa	Male	13367735	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
280	1	Chrispus Muthoka Ndunda	Male	20046238	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
281	1	Boniface Kingoku Ndunda	Male	1810305	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
282	1	Peter Thiora M’Inoti	Male	3747234	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
283	1	Vicky Jeptoo Changwony	Male	22133694	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
284	1	Annah Kanini Maingi	Male	 10924481	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
285	1	Florence Kanini Musyoki	Male	95599	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
286	1	Daniel Mule Anthony	Male	4806476	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
287	8	Juma Ali Juma 	Female	8375919	A002538294K	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
288	8	Mohamed Tajiri Mwakangaja	Female	5333012	A002966228F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
289	8	Catherine Amojong Jakaiti	Female	13170752	A002587735F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
290	8	Ahmed Juma Zaoro	Female	5459155	A001253189T	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
291	8	Kassim Salim Ramadhan	Female	25069132	A004638604Y	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
292	8	Bintirashid Pakia Nyale	Female	14695515	A010981921P	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
293	8	Jarumani Bakari Mwamzandi	Female	5329005	A001543561S	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
294	8	Ali Swalehe Mwaviiri	Female	2204751	A001298768K	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
295	8	Hamisi Hamisi Viiri	Female	26665256	A006585332Y	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
296	8	Hamisi S Mambeya	Female	3418017	A001886899B	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
297	8	Asha Sheikh Athman	Female	8620750	A006182416Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
298	8	Vincent Hezron Mwawaza Madedo	Female	9983018	A002756996V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
299	8	Mariam Juma Mohamed	Female	21859416	A003068750V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
300	8	Christine Uchi Mchombo	Female	24836218	A003760071R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
301	8	Mwamtenzi Ali Mwatsakatsa	Female	4604052	A001339981H	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
302	8	Mwanaharusi Omar Mwadzengo	Female	20002794	A011795892Q	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
303	8	Mariam Njira Salim	Female	33445015	A009761634V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
304	8	Fatuma Abushiri Selemani	Female	5462859	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
305	8	Feisal Awadh Islam Khambari	Female	5384577	A001149971Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
306	8	David Mose Gekara	Female	379379	A001222166H	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
307	8	Nusura Hamad Mtenzi	Female	26917905	A006260380M	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
308	8	Hamisi Swalehe Mwangazi	Female	14492301	A003250524A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
309	8	John Wana Mwatika	Female	668104	A001147522G	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
310	8	Sefu Ali Mwakimwaga	Female	13417683	A003369970J	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
311	8	Abubakar Ali Fau	Female	2251112	A005361941J	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
312	8	Abubakar Ali Fau	Female	2251112	A005361941J	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
313	8	John Wana Mwatika	Female	668104	A001147522G	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
314	8	Akida Kassimu Akida	Female	2257593	A001101553U	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
315	8	Hadida Mkandi Hadida	Female	4617335	A002049324M	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
316	8	Ali Khamis Ali	Female	1013978	A001482917L	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
317	8	Ali Mwachalume Rashid	Female	6733101	A002251889U	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
318	8	Rashid Mohamed Pakiya	Female	333627	A003228005H	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
319	8	Shadrack Nyanje Oda	Female	22976760	A004461496W	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
320	8	Mariamu Juma Rumweha	Female	3167492	-	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
321	8	Tumu Abdulla Msingori	Female	20123723	A011827557J	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
322	8	Mwanasha Mwinyi Ali	Female	25848154	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
323	8	Mwanaisha Salim Jumaa	Female	5328478	A004586573L	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
324	8	Zaina Ali Khamis	Female	27504380	-	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
325	8	Mutengwa Mkai Ndulu	Female	11228453	A007875118B	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
326	8	Nyae Ndoro Kidunga	Female	6734423	A007545339C	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
327	8	Feisal Awadh Islam Khambari	Female	5384577	A001149971Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
328	8	Hanifa Awadh Said 	Female	5323558	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
329	8	Abdalla Abubakar Miraj	Female	1164229	A002627240T	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
330	8	Nassoro Abdalla Mwalibuwa	Female	22622812	A003370492R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
331	8	Ali Abdallah Mazuri	Female	23918364	A004672063V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
332	8	Dafalla Ibrahim Dafalla	Female	8453199	A00198640R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
333	8	Nyota Mwakilingo Zaunga Fatuma Omari Dzuya	Female	1012982 20264294	A001362369S- A011795531Y	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
334	8	Mwanarusi Kassim Mwagauri	Female	1168073	A011794447B	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
335	8	Athumani Mwendo Mwamnyasa	Female	469117	A002037016E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
336	8	Abdalla Jiti Mwatsenga	Female	8395653	A001753858F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
337	8	Omar Salim Mwamangaro	Female	3913695	A001472389Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
338	8	Mdoe Kuto Muhindi	Female	33457276	A011857968T	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
339	8	Hamisi Omari Masare	Female	1805889	A001698027C	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
340	8	Mwanasha Juma Mwabale	Female	4604308	A011795342Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
341	8	Maurice Musyoka Kitongu	Female	436174	A001322850I	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
342	8	Asha Suleman Abdallah	Female	4605123	A006130694N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
343	8	Alex Kyalo Kisili	Female	23152497	A005492238R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
344	8	Simon Macharia Gichuhi	Female	1075235	A001387261X	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
345	8	Khalfan Abdalla Mwamkari	Female	5385738	A011795327A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
346	8	Bakari Kombo Mwachizayo	Female	4604744	A002760669	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
347	8	Fikirini Shee Saidi	Female	28682179	A010274513A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
348	8	Mwanaisha Suleiman Kea Mwanajuma Suleman Mwavunga Asha Suleman Mwavunga	Female	1015055 1015054 1014842	N/A- A011857780N- A011857772N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
349	8	Asmaa Abdillahi Amani	Female	11458634	A011830651P	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
350	8	Alex Kyalo Kisili	Female	23152497	A005492238R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
351	8	Makarani Ibrahim	Female	21832251	A002795139E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
352	8	Asha Ali Sefu	Female	8460511	A001194697Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
353	8	Josephine Mutola Shiramba	Female	1175736	A001415183T	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
354	8	Salim Abdalla Gibeno	Female	3912464	A001298179H	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
355	8	Suleiman Saidi Eliangiring'a	Female	5332622	A000173735F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
356	8	Mwinyi Madzumba Abdallah	Female	14157157	A001241310L	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
357	8	Jabu Salim Mohamed 	Female	503870	A001553795F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
358	8	Fatuma Mohamed Mwatsytsu	Female	2197946	A003600249L	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
359	8	Sarah Mueni Nathan	Female	2220741	A001603203B	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
360	8	Abdallah Mwinyi	Female	3913165	A001129647S	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
361	8	Idd Shakombo Hamisi	Female	30155197	A006853024S	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
362	8	Mesalimu Bakari Mwambuja	Female	1017820	A011794271B	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
363	8	Khamis Abdalla Yesi	Female	5520676	A004907235C	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
364	8	Mwatime Maku Hamisi	Female	4615686	A011795137A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
365	8	Mohamed Juma Chiphandulo	Female	5418398	A001313522A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
366	8	Athuman Ali Kabanga	Female	1016658	A001901423G	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
367	8	Jabu Salim Mohamed 	Female	503870	A001553795F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
368	8	Mwanajuma Hamisi Mwaviri	Female	5387242	A004050152Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
369	8	Salim Salim Athmani	Female	-	A004421367M	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
370	8	Mohamed Jamanda Mohamed	Female	23264046	A010608277F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
371	8	Mohamed Hamisi Mwapesa	Female	5329040	A002883817Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
372	8	Kassim Juma Guta	Female	469878	A001525065V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
373	8	Mwanasiti Faki M'beki	Female	5418960	A006821960X	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
374	8	Mwakwina Kassim Hamisi	Female	35115271	A011846931B	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
375	8	Jared Mwangeka Mwangoo	Female	11310339	A002543848X	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
376	8	Suleiman Ali Mwazuzu	Female	8427692	A002091268J	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
377	8	Mohamed Bakari Mwajoji	Female	29455206	A009092754U	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
378	8	Mwalimu Ali Gogo	Female	11243048	A002571823K	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
379	8	Mariam Alfan Mwayuya	Female	22443301	A010634587D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
380	8	Hamisi Abdalla Mwataraza Albert Mabinda Ambila	Female	5385503 5779438	A002076432K- A002055791W	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
381	8	Mwanaisha Mohamed Nzai	Female	5328636	A007689143K	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
382	8	Rehema Rashid Juma	Female	24672292	A004182071H	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
383	8	Said Mwinyi Yusuf	Female	13358524	A003076756Y	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
384	8	Fatuma Rashid Salim Chidundu	Female	24623228	A002071822X	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
385	8	Mwanajuma Ali Magadi	Female	5384869	A00159790D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
386	8	Juma Jamanda Gonda	Female	8534133	A011796799Y	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
387	8	Amina Jambia Mohamed	Female	23373554	A008601905K	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
388	8	Omar Jamanda Mohamed	Female	24753616	A005925569Q	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
389	8	Athuman Salim Mwatsaka	Female	12489903	A003392021C	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
390	8	Suleyman Swaleh Chuo	Female	34508562	A010281705X	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
391	8	Shaban Salim Ireri	Female	1300294	A001135528H	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
392	8	Hamadi Mohamed Hamisi	Female	10957573	A004361045D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
393	8	Juma Khamisi Mohamed	Female	14492943	A003038683A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
394	8	Mwalungo Nyae Mwandurya	Female	12897661	A003301202N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
395	8	Mwalim Mohamed Nasoro	Female	8534125	A001749933I	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
396	8	Mwanasiti Ali Mwashifu	Female	1017898	A011795970L	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
397	8	Omar Ali Magogo	Female	5386078	A001379249C	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
398	8	Omari Matano Manyama	Female	3913273	-	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
399	8	Rabia Bakari Mbiza	Female	13358819	A005223952P	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
400	8	Eisha Mohamed Juma	Female	35923980	A011588233Y	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
401	8	Peu Rai Peu	Female	20863207	A004672255X	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
402	8	Grace Wangui Kamau	Female	2267114	A001323767S	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
403	8	Mwanajuma Rajabu Mwakaneno	Female	3912793	A011795075H	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
404	8	Mwanatumu Mohamed Kiingu	Female	764608	A009392309P	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
405	8	Athuman Hassan Jumba	Female	6741886	-	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
406	8	Juma Hamisi Dzosi	Female	1015529	A010277750U	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
407	8	Hassan Ramadhan Hassan	Female	4592268	A001156382R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
408	8	Juma Salim Kitondo	Female	5466037	A002713393A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
409	8	Abdalla Rama Mwakibundo	Female	12770545	A003026618H	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
410	8	Hassan Mohamed Maisha	Female	3960872	A009512436R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
411	8	Mwandaro Mwabakari	Female	1168290	A002092942J	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
412	8	Fatuma Ali Begulu	Female	5329987	-	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
413	8	Moses Mwakisha	Female	11310636	A002990198J	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
414	8	Mwinyihaji Swalehe Mwakituko	Female	10578635	A001441303T	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
415	8	Mwanasiti Mbodze Nyanje	Female	468673	A001387954F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
416	8	Abdallah Ali Mwavyema	Female	402109	A001385669F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
417	8	Juma Mwinyi Mwakorauka	Female	8411431	A002385656E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
418	8	Bakari Rashidi Mwambala	Female	8421334	A005042677R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
419	8	Bakari Kea Saburi	Female	5387940	-	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
420	8	Fatuma Mohamed Athuman	Female	21142901	A011322913Y	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
421	8	Gerald Obiero Ogone	Female	307492	A001438499M	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
422	8	Ninyaa Shabani Chibero	Female	3167729	A011796492Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
423	8	Biasha Baya Hamisi	Female	5386476	A007308632U	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
424	8	Mohamed Ndanimbiri Cheti	Female	10579752	A003658620Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
425	8	Suleiman Ali Mzingiriwa	Female	26028253	A005125767V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
426	8	Zebeda Juma	Female	32245037	A011857617A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
427	8	Onesmus Ogangu Kibisu Elizabeth Wanjiru	Female	12894393 23404265	A002648544E- N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
428	8	Patrick Allen Mbogo	Female	917719	A002232719D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
429	8	Swaleh Omari Abed	Female	8378346	A003868391S	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
430	8	John Mokomba Oboiko	Female	1589446	A003030082B	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
431	8	Wilson Chola Ngai	Female	13269898	A002784718X	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
432	8	Patricia Mbula Mutua	Female	1894505	A002531808H	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
433	8	Gladys Muthoni Wainaina	Female	10044818	A004362806J	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
434	8	Mejumaa Mwinyi Said	Female	24501797	A011826314P	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
435	8	Margaret Wairimu Gachagua	Female	9290506	A002074326F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
436	8	Mwanajuma Abdalla Moyo	Female	14491904	A006374013E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
437	8	Bakari Rashid Bendera	Female	1908867	A001273056L	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
438	8	Athuman Kassim Mwatsuguu	Female	8409709	A002399519Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
439	8	George Mwanzia Mutiokoh	Female	4655014	A000171732V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
440	8	Andrew Mwadime	Female	8522929	A002061592J	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
441	8	Masjid Shafy Waqfu (Mosque)	Female	N/A	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
442	8	Bakari Kea Saburi	Female	5387940	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
443	8	Mwanasiti Mbodze Nyanje	Female	468673	A001387954F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
444	8	Bakari Keya Saburi	Female	5387940	A003691300D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
445	8	Juma Ali Chigulu	Female	16056803	A011820932M	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
446	8	Nchaligani Matano Bintsalim	Female	2222867	A011794777M	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
447	8	Tom Mkoba John	Female	403878	A0013892101	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
448	8	Janet Mawondo Kirigha Allen Wilson Mwenda	Female	13709049 10235458	N/A- A001305534U	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
531	8	Bakari Omari	Female	2190015	A002189524R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
449	8	Haji Mwijaka Mwamtunza Suleiman Issa Hussein	Female	12901008 26770052	A004336800K- A004491070L	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
450	8	Amani Ramadhani Nyamawi Ramadhan Aman Nyamawi	Female	5466188 25252390	N/A- A004808612W	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
451	8	Halima Juma Nkamole	Female	11367080	A005225710E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
452	8	Salim Bakari Kingabwi	Female	5520829	A001470712Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
453	8	Mwanahamisi Jumaa Mwakune	Female	2184905	A011795710S	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
454	8	Athuman Suleiman Mtsomo	Female	10576286	A002604135L	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
455	8	Khamis Suleiman Mwajambo	Female	1014138	A001351741C	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
456	8	Khamis Suleiman	Female	13838227	A0029476271	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
457	8	Chupe Yogwe Chupe	Female	11459708	A008998012F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
458	8	Mariamu Mohamed Mwamtapa	Female	503228	A010885442A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
459	8	Salim Hamis Mwatsakazi	Female	5384316	A001434755T	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
460	8	Josphat Kipkurui Siele	Female	22519296	A004209232N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
461	8	Clemence Mkawajomba Mwakio	Female	22642328	A005305062O	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
462	8	Victor Otieno Cosmas	Female	32009416	A009705409Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
463	8	Bahati Charo Nzai	Female	26901356	A006688384U	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
464	8	Rehema Hamisi Chijoto 	Female	12896733	A006456460A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
465	8	Bidii Omari	Female	22979055	A009090583T	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
466	8	Hamadi Hamisi Hewa	Female	27846101	A009134117B	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
467	8	Asha Abdalla Mwanaduruma Sauda Mwinikai Hamisi	Female	2222009 3170374	A011794870G- N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
468	8	Mwanajuma Ali Mwanyumba	Female	27343742	A009818953T	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
469	8	Domitilla Muthami Mwanthi	Female	3167383	A004348312L	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
470	8	Silvesta Mkongo Maghanga	Female	22480354	A002749358Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
471	8	Danis Oluoch Onuonga	Female	21757147	A003326830Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
472	8	Vijulu Property Managers Limited	Female	N/A	KRA201801563513	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
473	8	Danley Mwakori Kamenya	Female	670279	A001134734D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
474	8	Bidala Ibrahim Karim	Female	5463005	A002915445B	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
475	8	Binti Kaingu Mgandi	Female	29219456	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
476	8	Beatrice Wangeci Kamunyu	Female	561810	A006286108Q	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
477	8	Benjamin Ngugi njoroge	Female	3697943	A001337584C	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
478	8	Rashid Kivyaso Shakombo	Female	346759	A001861355T	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
479	8	Nassoro Salim Mwachizumo	Female	5393603	A001387848E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
480	8	Jane Nyamboga Moseti Abraham Chidanga Nyamawi	Female	23243393 12902781	A005069160V- A002848485S	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
481	8	Jumanne Hamisi Mwatenguri	Female	6732608	A003285772B	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
482	8	Austine Mnyaka Mlekenyi	Female	29560335	A008291110V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
483	8	Joseph Gachuru Gioko	Female	13530947	A002998959C	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
484	8	Madzumba Mwinyi	Female	11789809	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
485	8	Athuman Dzila Mwero	Female	9632530	A003134689V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
486	8	Rama Nyenye Nyanje	Female	20727556	A002854847F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
487	8	Peter Mutisya Kiema	Female	16025503	A001262993W	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
488	8	Abdalla Mwaruwa Chikokopha	Female	35533371	A011572855X	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
489	8	Rophin Mwakio Ndau	Female	166702	A001151713Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
490	8	Ali Omari Chuma Juma Omari Chuma	Female	5386190 11138775	A001352511W- N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
491	8	Juma Bakari Gunda	Female	4617394	A003246497F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
492	8	Christina Kulola Kimori	Female	8457698	A004489511U	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
493	8	Samwel Mwashimba Nyambu	Female	5399895	A004902807S	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
494	8	Wakati Halfani Mwadzoka	Female	12903943	A002578640O	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
495	8	Philip Ngalu Musili	Female	11721012	A005171433Y	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
496	8	Rama Hamisi Mwamporojo	Female	10504011	A002079346V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
497	8	Iddi Chuma Mvugwa	Female	1016538	A001352820D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
498	8	Bakari Omari Mogamuzi	Female	1017523	A009736745L	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
499	8	Danis Oluoch Onuonga	Female	21757147	A003326830Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
500	8	Shabani Rashid Bakari	Female	8387845	A002053363I	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
501	8	Halima Juma Nkamole	Female	11367080	A005225710E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
502	8	Jannet Nyamvula Dzuya	Female	2141694	A001320031R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
503	8	Bakari Omari Mwagamudzi	Female	20184410	A00639020R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
504	8	Margaret Chao Marenge	Female	12546924	A002511515Y	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
505	8	Bakari Mwinyihaji Mwajenjewa	Female	4604495	A001337211D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
506	8	Josphat Kipkurui Siele	Female	22519296	A004209232N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
507	8	Meselemani Amani Ramadhan	Female	27432900	A006448718Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
508	8	Hamisi Swalehe Mwakitunza	Female	11771691	A002507262X	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
509	8	Hamisi Omari Chuma	Female	9986634	A001503121A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
510	8	Dennis Dume	Female	8621565	A001753242P	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
511	8	Kombo Juma Malevi	Female	4605651	A001440653J	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
512	8	Lavendah Achieng Ngode	Female	25722646	A005815660F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
513	8	Abdulrahman Subira Mawazo	Female	13499701	A002673449Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
514	8	Patrick Ilale Mwanjele	Female	844883	A001266790B	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
515	8	Hedline Maghuwa Mwasaru	Female	5332729	A011819682Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
516	8	Peter Wambua Nzioka	Female	2219635	A009131712T	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
517	8	Juma Abdalla Hamza	Female	21698154	A003202106T	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
518	8	Wilfred Masivu Mawioo	Female	8434754	A001751362P	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
519	8	George Oduor Ouma	Female	21903781	A003283263V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
520	8	Saidi Bakari Mwamaphila	Female	10227638	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
521	8	Jackson Gona Konde	Female	10690723	A002403819H	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
522	8	Hassan Said Mwakalima	Female	14695475	A002668659Q	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
523	8	Anthony Kalama Karisa	Female	2149981	A001471286Q	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
524	8	Mwinyihamisi Hamisi Mwayeya	Female	5419400	A011835785M	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
525	8	Mohamed Omar Abdallah	Female	27711679	A009310397V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
526	8	Christopher Mwangemi Mwalalu	Female	4654787	A001343143E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
527	8	Julius Peter Mwacharo Matandi	Female	157532	A001603729Q	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
528	8	Damarice Majala Mwadime	Female	11226959	A001268856E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
529	8	Stanley Nyaga Kithinji	Female	8067364	A002055451L	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
530	8	Fatima Rashid Mwayeya Idd Rashid Juma	Female	12901095 22332399	A006639893X- N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
532	8	Hamisi Juma Mwarahani	Female	11771586	A002529639G	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
533	8	Seif Ali Mwatabu	Female	1168842	A001651057N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
534	8	Hindu Khamis Juma	Female	26098930	A010087566X	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
535	8	Juma Mohamed Juma	Female	11459862	A003869090Q	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
536	8	Mwachaunga Mohamed Chaunga	Female	11244290	A002586610Q	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
537	8	Mashudi Muzungu Chimerah	Female	8427758	A002074684U	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
538	8	Khamis Juma Gonda	Female	2250976	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
539	8	Ramadhan Khamisi Juma	Female	23342996	A003625811Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
540	8	Mwachaunga Mohamed Chaunga	Female	11244290	A002586610Q	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
541	8	Peter Mwinga Mundia	Female	5924651	A001603072Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
542	8	Wilfred Masivu Mawioo	Female	8434754	A001751362P	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
543	8	Samuel Lumenyo Mwandembe	Female	9786919	A001669310S	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
544	8	Muhsin Khamis Juma	Female	27919372	A00766370D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
545	8	Said Hamisi Mkongo	Female	3913779	A002519851F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
546	8	Said Hamisi Mkongo	Female	3913779	A002519851F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
547	8	Mwanaisha Omari Chuma Mwanahamisi Omari Chuma	Female	8620038 11226422	A011835702R- A008426129V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
548	8	Juma Hamisi Bora	Female	10769986	A002056099Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
549	8	Raphael Mdune Nyamawi	Female	24513862	A003361158K	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
550	8	Jane Mary Akinyi Ajwang	Female	1164574	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
551	8	Alice Zighe Mjomba Mwanahamisi Hamisi Said	Female	25338622 21284241	A011835594L- A011836015Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
552	8	Ali Said Nyere	Female	3912375	A011835187I	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
553	8	Noor Siyad Jibril	Female	9565095	A002065679A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
554	8	Jabir Mohamed Juma	Female	28012519	A006341548L	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
555	8	Kibibi Ali Juma	Female	5322785	A011836511P	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
556	8	Riziki Kashi Amani	Female	22773077	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
557	8	Bakari Hamisi Said	Female	10959037	A003541635K	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
558	8	Salim Hamisi	Female	13358170	A006865915E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
559	8	Florence Mghoi Lenjo	Female	2303531	A002936958R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
560	8	Bahatisha Juma Saidi	Female	20197179	A011837130T	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
561	8	Beja Nyamani Mwahui	Female	27263552	AA011794915V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
562	8	Yassim Yunis Juma Saumu Omar Juma	Female	24304306 22745359	N/A- A011830293V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
563	8	Juma Hamisi Bora	Female	10769986	A002056099Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
564	8	Mundalu Dzombo	Female	5992443	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
565	8	Abdalla Kombo Tamjambo	Female	22790723	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
566	8	Mwanamkasi Omar Juma	Female	11789251	A005381024B	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
567	8	Francis Wainaina Njoroge	Female	3929357	A001323168N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
568	8	Said Omar Juma	Female	9989621	A011795785Q	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
569	8	Shallety Emily Wanyika Mwakireti	Female	10754930	A002744469G	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
570	8	Faith Njeri Muriithi	Female	27286354	A009213659W	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
571	8	Mwanajuma Jumaa Rashid	Female	5472474	A011795570H	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
572	8	Abdalla Issa Kuzonga	Female	1014130	A006293896I	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
573	8	Zipporah Wangui Gitahi	Female	758518	A001348700L	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
574	8	Stanley Ndichu Wainaina	Female	5752844	A001179685F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
575	8	Vincent Hezron Mwawaza Madedo	Female	9983018	A002756996V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
576	8	Kassim Keah Kalama	Female	11788626	A001503606G	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
577	8	Langoni Juma Mwazuzu	Female	20481885	A011796091J	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
578	8	Omar M Abdalla Raisi	Female	307328	A001522710A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
579	8	Mohamed Osman Mursal	Female	4302	A001651099X	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
580	8	Hajila Walakisa Nsongomoa	Female	5472144	A001323659R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
581	8	Kahindi George Baya	Female	27496281	A006465054X	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
582	8	Amina Hamisi Rajab	Female	21098739	A010284572R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
583	8	Philip Mulungu Kavua	Female	1015669	A001337113E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
584	8	Biasha Ramadhan Juma	Female	21007232	A009054436N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
585	8	Fatuma Abdalla Iphaipha	Female	5414220	A011317037L	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
586	8	Mariam Mwijuma	Female	20691986	A005555984O	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
587	8	Mesalimu Bakari Mwambuja	Female	1017820	A011794271B	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
588	8	Omari Hamisi Mwiri	Female	1169900	A002075684Y	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
589	8	Fundi Sefu Mwaramuno	Female	26940253	A004872128V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
590	8	Sudi Omari Mwasamuli	Female	8420854	A007291093R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
591	8	Amina Wanjiku Maina	Female	16078199	A002216024E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
592	8	Likoni Primary School 	Female	N/A	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
593	8	Mwahima Stadium	Female	N/A	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
594	8	Mohamed Rama	Female	9629266	A007705424W	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
595	8	Masjid Khadija	Female	N/A	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
596	8	Mohamed Rama	Female	9629266	A007705424W	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
597	8	Awadh Salim Karama	Female	13197354	A010717913S	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
598	8	Mmaka Abbas Mwabundu	Female	27480533	A009187406R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
599	8	Fatuma Rashid Njama	Female	21265706	A003661099A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
600	8	Hanrey Moriasi Osiemo	Female	1658534	A001129193V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
601	8	Zainabu Ngandi Ali Omari Shaffi Juma	Female	10957951 23247999	A002077030G- A006235276Y	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
602	8	Khatib Hassan Ali	Female	32426455	A009002926H	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
603	8	Zaitun Mohamed Salim	Female	23126631	A011318586D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
604	8	Swalehe Shafi Juma	Female	8620615	A003862331Q	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
605	8	Juma Shaffi Mwakuloha	Female	13357375	A003152806A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
606	8	Suleiman Shaffi Mwaronga	Female	9629260	A006551085U	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
607	8	Said Mohammed Said	Female	31948514	A007564524V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
608	8	Mwinyihaji Shaffi Bundu	Female	8383875	A003233571N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
609	8	Shafi Suleman Mwaronga	Female	20357949	A006173086R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
610	8	Zuena Mohamed Mohamed Mahmoud Mohamed	Female	13405983 21108987	A011822632N- A003070363F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
611	8	Suleiman Juma Mwakibundo	Female	22639842	A005229150T	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
612	8	Suleiman Bakari Tabwara	Female	4593829	A001253107Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
613	8	Salim Abdalla Mwachalika	Female	13838758	A004206612E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
614	8	Mwanasiti Saidi Mwaranyuma	Female	5328767	A011794092E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
615	8	Abdalla Salim Bakari	Female	307567	A001487254A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
616	8	Alima Hassan Wapinya 	Female	8111205	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
617	8	Alfani Masudi Chamosi	Female	853871	A003818649M	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
618	8	Bintihamisi Athuman Nimagulu	Female	2195987	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
619	8	Matano Nassoro Chepheo	Female	2223613	A011795034W	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
620	8	Saumu Athumani Ndindiri	Female	1015195	A011792268C	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
621	8	Mejumaa Ali Mwakinangu	Female	469116	A001603164P	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
622	8	Azziza Hassan Mkinga	Female	24575294	A009686154L	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
623	8	Nixon Mwadime Nyange	Female	10397389	A003394641Q	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
624	8	Riziki Hamadi Nimavu	Female	3960115	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
625	8	Feisal Awadh Islam Khambari	Female	5384577	A001149971Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
626	8	Voi Musyimi	Female	6487365	A00268761F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
627	8	Ali Sudi Mwasirima	Female	1015238	A003420011Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
628	8	Samuel Njeru Kaumbuthu	Female	7034330	A002322168L	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
629	8	Sikukuu Athman Bindo	Female	8468481	A001100579F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
630	8	Akida Kassimu Akida	Female	2257593	A001101553U	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
631	8	Kombo Juma Kisuwa Hadia Kisuwa Shekuwe	Female	4595132 25063741	A001102444V- A003483527Q	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
632	8	Norman Ngombo Jefwa	Female	1380700	A001906734B	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
633	8	Mwidini Ali Mwavunga	Female	1016484	A011825862F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
634	8	Sauda Ali Nimwenyewe	Female	652564	A002064347J	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
635	8	Iddi Ali Mwai Iphunga Kassim Juma Guta	Female	0746029 0469878	A001441201Q- A001525065V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
636	8	Biisha Rashid Mwazara	Female	11459704	A005482732P	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
637	8	Momo Rashid Athuman	Female	13456301	A011794194H	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
638	8	Athumani Rashidi Mwazara	Female	9988088	A006224345L	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
639	8	Zaitun Mohamed	Female	11244553	A008803748E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
640	8	Mize Rashid	Female	9774840	A005212593R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
641	8	Agnes Mandi Mwakisaghu	Female	5396862	A002702002Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
642	8	Omar Salim Mwamangaro	Female	3913695	A001472389Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
643	8	Mwanarusi Omari Mwabagizo	Female	2203866	A006511106A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
644	8	Ramadhani Jumaa Mwinyi	Female	10958032	A002311681I	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
645	8	Sharifa Hassan Omar	Female	30625268	A011796153E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
646	8	Salim Kibwana Mtende	Female	22440619	A004473268Y	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
647	8	Ali Mwinyi Pataka	Female	10769369	A001753945Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
648	8	Mwanasha Mwinyikombo Mwashambi	Female	9771620	A004803169B	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
649	8	Colling Godeka Mudachi	Female	7159391	A002092808G	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
650	8	Mohamed Abdalla Mwambui	Female	10576174	A011836296M	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
651	8	Festus Ronald Mshila Mwakitoi	Female	21770911	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
652	8	Hazija Hadula Kase	Female	166676	A001984172F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
653	8	Juma Masudi Choka	Female	8375403	A001164897Y	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
654	8	Ronald Gideon Ngallah Mwagandi	Female	154550	A002413509G	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
655	8	James Kyalo Kinyili	Female	21412692	A003086433N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
656	8	Unyeta Mwidao	Female	8376502	A011857186N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
657	8	Unyeta Mwidao	Female	8376502	A011857186N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
658	8	Mwadebwe Saidi Moyo	Female	764358	A001234000R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
659	8	Hamisi Kibwana Mtende	Female	23576490	A007759397B	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
660	8	Mohamedi Salimu Mwaporojo	Female	5421141	A001526485F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
661	8	Mwandi Monicah Mumbua	Female	7798324	A004124387Q	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
662	8	Alice Wanjiru Ngure	Female	5363206	A002268977L	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
663	8	Abdullah Abdalla Mkullu	Female	8385308	A003570647S	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
664	8	Celestine Atieno Adhola	Female	13682024	A003858485U	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
665	8	Petty Aoko Ombai	Female	13777754	A006397636E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
666	8	Dishon Njumwa Mwasingo	Female	13710837	A004846663M	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
667	8	Clarice Adhiambo Olawe	Female	13811554	A011850300B	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
668	8	William Oyoo Otedo	Female	11500287	A002775689T	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
669	8	Nelson Ooro Otedo	Female	9591954	A002570315D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
670	8	Delton Shada	Female	9318657	A011796252E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
671	8	Said Ramadhan Cheku	Female	13499569	A004412737M	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
672	8	Fatuma Omari Rajabu	Female	5328188	A011795743G	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
673	8	Wajih Juma Mwabindo	Female	22574423	A010409349W	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
674	8	Omar Said Mwakutunza	Female	20841224	A004672240Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
675	8	Susan Mkakisha Mwabili	Female	13710332	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
676	8	James Obam Osamo	Female	10973409	A002280412U	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
677	8	Salim Kibwana Mtende	Female	22440619	A004473268Y	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
678	8	Hanrey Moriasi Osiemo	Female	1658534	A001129193V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
679	8	Peter Maganga Kituri Franklin Hozibi Mwandoto	Female	8470230 20251888	A002060342W- A004044271K	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
680	8	Hanrey Moriasi Osiemo	Female	1658534	A001129193V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
681	8	Daniel Ochieng Odhiambo	Female	4441929	A001102131N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
682	8	Peter Simiyu Wanyonyi	Female	9687041	A002385928Y	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
683	8	Omari Ferunzi Jeffwa	Female	8535920	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
684	8	Florence Mware Mwakandu	Female	5384822	A001602688A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
685	8	James Mutama Njau	Female	11649106	A003007529M	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
686	8	Ronald Gideon Ngallah Mwagandi	Female	154550	A002413509G	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
687	8	Wilson Chola Ngai	Female	13269898	A002784718X	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
688	8	Rose Uhuru Ongoma	Female	3913099	A001241307T	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
689	8	Jerusha Auma Ogwari	Female	11227144	A001652289C	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
690	8	James Kabiru Ngumi	Female	10378191	A001750451Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
691	8	Tajiri Mwakangaja	Female	1169606	A011836300N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
692	8	Omari Hassan	Female	9629441	A003145297W	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
693	8	Mwanaisha Ali Nimutsumi	Female	4615607	A011796012P	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
694	8	Mwanaharusi Omari Nchahoyo Omari Juma Mbalba	Female	8535704 29517063	A011832390X- A008859816N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
695	8	Saidi Ali Abdallah	Female	10305171	A006347897Q	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
696	8	Said Nasoro Muharuma	Female	3167420	A002556916W	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
697	8	Mgeni Rashid Hamad	Female	769604	A006725132U	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
698	8	Lemmy Safari Fondo	Female	21816629	A006550597E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
783	8	Ali Juma Viza	Female	5420886	A004498072G	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
699	8	Nassoro Juma Kassim Omar Ali Magogo	Female	25821957 5386078	A006388936I- A001379249C	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
700	8	Omar Ramadhan Mwakibundo	Female	23127804	A006265315K	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
701	8	Juma Bakari Mwanganzala	Female	1017765	A011794752D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
702	8	Mzamilo Hamisi Bengulu	Female	22523809	A009566725G	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
703	8	Asha Abdalla Salim	Female	10578279	A004905956M	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
704	8	Mwachumba Hamisi Mwachumba	Female	11243254	A011794785M	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
705	8	Masud Abdalla Kidzambo	Female	5386612	A001307517J	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
706	8	Mwasamani Nzao Mwachidofu	Female	12901960	A002621133C	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
707	8	Abdulrahaman Swalehe Kiula	Female	11601537	A001752698J	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
708	8	Mohamed Rajab	Female	11225141	A011857891R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
709	8	Choka Mwinyi Masudi	Female	11649573	A010371207V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
710	8	Bintihamadi Ali Hamisi Mwinyikombo Juma Baishe	Female	9881791 N/A	A011794939G- A011829020T	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
711	8	Omar Bakari Mwahiga	Female	2189284	A002416660U	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
712	8	Juma Ali Mwakibundo Mwanahamisi Ramadhani	Female	8384188 10957722	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
713	8	Juma Masudi Choka	Female	8375403	A001164897Y	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
714	8	Hamisi Suleiman Kombaiko	Female	21417046	A004676216V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
715	8	Grace Munanie Kitheka	Female	23965769	A005888703I	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
716	8	Swaleh Ramadhan Mwakibundo	Female	25146903	A006686528I	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
717	8	Mwanamgeni Hassan Nguwa	Female	9989771	A011795617Y	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
718	8	Fatma Khamis	Female	28363944	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
719	8	Mwanaisha Athumani Mbwagizo	Female	9471619	A009677792Y	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
720	8	Swalehe Rashid Mwawanda	Female	4614523	A009261384S	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
721	8	Saidi Ali Mwamringo	Female	5430508	A001687443D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
722	8	Kadide Chigamba Ngandi	Female	24809316	A006619331A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
723	8	Umi Mohamed Mwamguno	Female	32427637	A011790442Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
724	8	Hamisi Rama Masharubu	Female	5329383	A002069064V	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
725	8	Fatuma Ramadhani	Female	13195754	A006260156K	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
726	8	Biasha Hamisi Mwakibundo	Female	25789750	A006137088Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
727	8	Mifaraji Mohamed Mwakibundo	Female	4605727	A004382227K	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
728	8	Alfani Ali Kibundugo	Female	24188728	A011794788P	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
729	8	Alfani Ali Kibundugo	Female	24188728	A011794788P	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
730	8	Suleiman Mohamed Mwakibundo	Female	5386761	A001857044B	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
731	8	Shaffi Mohamed Jamvi	Female	32222969	A011015086M	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
732	8	Noor Rashid Kuremwa	Female	27033584	A005433782Y	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
733	8	Bakari Jiti Mwatsenga	Female	20837227	A004672200G	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
734	8	Ali Omari Chuma	Female	5386190	A001352511W	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
735	8	Suleiman Rashid Junda	Female	10957586	A004050419W	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
736	8	Mwanamvua Shee Mwanguruwe	Female	33658165	A011835219S	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
737	8	Caroline Achieng Odero	Female	21693064	A006167854A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
738	8	Kassim Salim Mohamed	Female	10226661	A002296230M	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
739	8	Philip Mwaluma Kiwoi	Female	26226938	A005465078E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
740	8	Rama Nyenye Nyanje	Female	20727556	A002854847F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
741	8	Pauline Kalewa Lagho	Female	2196565	A001566402Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
742	8	Mwanatumu Hamadi Suleiman	Female	31264022	A011819123W	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
743	8	Abdalla Mwachai Ali	Female	10956150	A008000752E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
744	8	Juma Omari Chuma	Female	11138775	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
745	8	Hamisi Rajabu Mwakaneno	Female	8535762	A003644886K	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
746	8	Bakari Hamisi Mwabibo	Female	9988108	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
747	8	Khamis Juma Gonda	Female	2250976	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
748	8	Mwanajuma Juma Mwambuja	Female	3913601	A011795209X	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
749	8	Rashid Bakari Bendera	Female	27366664	A005419157D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
750	8	Francis Sunduli Maselo	Female	10006669	A011832151Z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
751	8	Ali Shaffi Juma	Female	9988314	A002019219I	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
752	8	Abdallah Salim Mtende	Female	6731679	A006583885M	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
753	8	Hamisi Athuman Mwabarua	Female	4605612	A005381041C	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
754	8	Asha Ramadhan Juma	Female	11228859	A011793859J	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
755	8	James Mungai Ndung'u	Female	11666595	A010157548P	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
756	8	Michael Tole Mwachandi	Female	5470715	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
757	8	Nzisa Nzyoka	Female	26321078	A009524429X	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
758	8	Juma Amani Gonda	Female	22745442	A011834709U	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
759	8	Omari Juma Ali	Female	5520638	A002064336G	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
760	8	Omari Juma Ali	Female	5520638	A002064336G	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
761	8	Sammy Nzau	Female	14491611	A002586356G	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
762	8	Josphat Kipkurui Siele	Female	22519296	A004209232N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
763	8	Amani Ramadhani Nyamawi	Female	5466188	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
764	8	Rashid Mwinyihaji Mwasafari	Female	22440922	A003054151F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
765	8	Josphat Kipkurui Siele	Female	22519296	A004209232N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
766	8	Hussein Bakari Nyuni	Female	13417913	A002960917S	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
767	8	Evans Omare Onserio	Female	27407962	A005468934F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
768	8	Said Rashid Yeya	Female	1014323	A001687560H	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
769	8	Juma Mwapopho Abdalla	Female	30160706	A009918760S	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
770	8	Cecilia Mbithe Katuthi	Female	464531	A002055715F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
771	8	Chizi Nyanje	Female	27408367	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
772	8	Saidi Omar Mwagamudzi	Female	30896524	A007339587P	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
773	8	Salome Amondi Nundu	Female	20123934	A004888212A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
774	8	Hussein Abdalla Nyuki	Female	658580	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
775	8	Abdallah Hassan Mdzomba	Female	10505601	A002067533N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
776	8	Mealii Hassan Chaki	Female	12488414	A001355479C	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
777	8	Omar Abdi	Female	20657606	A003876624F	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
778	8	Fatuma Sulemani Mwantunza	Female	5328622	A011827439E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
779	8	Omar Bakari Mwarakweli	Female	30909568	A007092756U	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
780	8	Rama Hamisi Mwinyi	Female	27079440	A011835891L	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
781	8	Athuman Said Mtsumi	Female	23194982	A004034872Q	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
782	8	Abdala Salim Mwakiuyu	Female	13628382	A004575688Q	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
784	8	Umazi Nyawa Jefa	Female	10226492	A010274181N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
785	8	Bakari Abdallah Abdush	Female	9987964	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
786	8	Mwanamani Mkinda Ngao	Female	5328027	N/A	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
787	8	Shaibu Ali Jeffah	Female	20085599	A002752758D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
788	8	Hamisi Saidi Mwakinangu	Female	5386776	A002072452G	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
789	8	Musa Juma Mwawari	Female	8417860	A005303095R	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
790	8	Abdalah Mwinyihaji Abdalah	Female	16060621	A002252080I	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
791	8	Kanini Joseph	Female	30771025	A011851650P	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
792	8	Joseph Odinga Oluseno	Female	548721	A005925291L	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: intervention_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.intervention_type (id, type) FROM stdin;
1	Tenure
3	Socio-economic plans
4	Capacity Building
2	Infrastructure
\.


--
-- Data for Name: interventions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interventions (id, intervention_type, year, intervention_phase, settlement_id, cluster_id) FROM stdin;
1	1	2018	1	1	2
2	1	2018	1	2	2
3	1	2018	1	3	2
4	1	2018	1	4	16
5	1	2018	1	5	14
6	1	2018	1	6	3
7	1	2018	1	7	2
8	1	2018	1	8	8
9	1	2018	1	9	8
10	1	2018	1	10	8
11	1	2018	1	11	8
12	1	2018	1	12	8
13	1	2018	1	13	2
14	1	2018	1	14	2
15	1	2018	1	15	1
16	1	2018	1	16	1
17	1	2018	1	17	1
18	1	2018	1	18	8
19	1	2018	1	19	4
20	1	2018	1	20	4
21	1	2018	1	21	4
22	1	2018	1	22	4
23	1	2018	1	23	4
24	1	2018	1	24	4
25	1	2018	1	25	4
26	1	2018	1	26	4
27	1	2018	1	27	4
28	1	2018	1	28	5
29	1	2018	1	29	10
30	1	2018	1	30	5
31	1	2018	1	31	10
32	1	2018	1	32	5
33	1	2018	1	33	10
34	1	2018	1	34	5
35	1	2018	1	35	10
36	1	2018	1	36	5
37	1	2018	1	37	10
38	1	2018	1	38	5
39	1	2018	1	39	1
40	1	2018	1	40	2
41	1	2018	1	41	1
42	1	2018	1	42	1
43	1	2018	1	43	1
44	1	2018	1	44	1
45	1	2018	1	45	1
46	1	2018	1	46	6
47	1	2018	1	47	6
48	1	2018	1	48	6
49	1	2018	1	49	6
50	1	2018	1	50	6
51	1	2018	1	51	6
52	1	2018	1	52	6
53	1	2018	1	53	11
54	1	2018	1	54	11
55	1	2018	1	55	11
56	1	2018	1	56	11
57	1	2018	1	57	11
58	1	2018	1	58	6
59	1	2018	1	59	1
60	1	2018	1	60	2
61	1	2018	1	61	9
62	1	2018	1	62	9
63	1	2018	1	63	9
64	1	2018	1	64	9
65	1	2018	1	65	9
66	1	2018	1	66	14
67	1	2018	1	67	14
68	1	2018	1	68	1
69	1	2018	1	69	1
70	1	2018	1	70	7
71	1	2018	1	71	3
72	1	2018	1	72	3
73	1	2018	1	73	7
74	1	2018	1	74	7
75	1	2018	1	75	7
76	1	2018	1	76	7
77	1	2018	1	77	7
78	1	2018	1	78	7
79	1	2018	1	79	3
80	1	2018	1	80	3
81	1	2018	1	81	1
82	1	2018	1	82	6
83	2	2020	2	2	18
84	2	2020	2	3	18
85	2	2020	2	4	18
86	2	2020	2	5	18
87	2	2020	2	6	18
88	2	2020	2	7	18
89	2	2020	2	8	18
90	2	2020	2	9	18
91	2	2020	2	10	18
92	2	2020	2	13	18
93	2	2020	2	14	18
94	2	2020	2	16	18
95	2	2020	2	48	18
96	2	2020	2	49	18
97	2	2020	2	58	18
98	2	2020	2	60	18
99	2	2020	2	69	18
100	2	2020	2	79	18
101	2	2020	2	80	18
102	2	2020	2	81	18
103	2	2020	2	82	18
104	2	2020	2	83	18
105	1	2020	2	84	17
106	2	2020	2	85	18
107	1	2020	2	86	17
108	2	2020	2	87	18
109	2	2020	2	88	18
110	2	2020	2	89	18
111	1	2020	2	90	17
112	1	2020	2	91	17
113	1	2020	2	92	17
114	1	2020	2	93	17
115	1	2020	2	94	17
116	1	2020	2	95	17
117	2	2020	2	96	18
118	2	2020	2	97	18
119	2	2020	2	98	18
120	1	2020	2	99	17
121	1	2020	2	100	17
122	2	2020	2	101	18
123	2	2020	2	102	18
124	2	2020	2	103	18
125	2	2020	2	104	18
126	1	2020	2	105	17
127	1	2020	2	106	17
128	1	2020	2	107	17
129	2	2020	2	108	18
130	1	2020	2	109	17
131	2	2020	2	110	18
132	2	2020	2	111	18
133	2	2020	2	112	18
134	1	2020	2	113	17
135	2	2020	2	114	18
136	1	2020	2	115	17
137	1	2020	2	116	17
138	1	2020	2	117	17
139	2	2020	2	118	18
140	1	2020	2	119	17
141	1	2020	2	120	17
142	1	2020	2	121	17
143	1	2020	2	122	17
144	1	2020	2	123	17
145	1	2020	2	124	17
146	1	2020	2	125	17
147	2	2020	2	126	18
148	1	2020	2	127	17
149	1	2020	2	128	17
150	1	2020	2	129	17
151	1	2020	2	130	17
152	1	2020	2	131	17
153	1	2020	2	132	17
154	1	2020	2	133	17
155	1	2020	2	134	17
156	1	2020	2	135	17
157	2	2020	2	136	18
158	2	2020	2	137	18
159	1	2020	2	138	17
160	2	2020	2	139	18
161	2	2020	2	140	18
162	1	2020	2	141	17
163	1	2020	2	142	17
164	1	2020	2	143	17
165	2	2020	2	144	18
166	1	2020	2	145	17
167	1	2020	2	146	17
168	1	2020	2	147	17
169	2	2020	2	148	18
170	2	2020	2	149	18
171	1	2020	2	150	17
172	2	2020	2	151	18
173	2	2020	2	152	18
174	1	2020	2	153	17
175	1	2020	2	154	17
176	1	2020	2	155	17
177	2	2020	2	156	18
178	1	2020	2	157	17
179	2	2020	2	158	18
180	2	2020	2	159	18
181	2	2020	2	160	18
182	2	2020	2	161	18
183	1	2020	2	162	17
184	2	2020	2	163	18
185	1	2020	2	164	17
186	2	2020	2	165	18
187	2	2020	2	166	18
188	1	2020	2	167	17
189	1	2020	2	168	17
190	1	2020	2	169	17
191	2	2020	2	170	18
192	1	2020	2	171	17
193	2	2020	2	172	18
194	1	2020	2	173	17
195	2	2020	2	174	18
196	1	2020	2	175	17
197	1	2020	2	176	17
198	2	2020	2	177	18
199	1	2020	2	178	17
200	1	2020	2	179	17
201	2	2020	2	180	18
202	1	2020	2	181	17
203	2	2020	2	182	18
204	2	2020	2	183	18
205	2	2020	2	184	18
206	2	2020	2	185	18
207	1	2020	2	186	17
208	2	2020	2	187	18
209	2	2020	2	188	18
210	1	2020	2	189	17
211	1	2020	2	190	17
212	2	2020	2	191	18
213	2	2020	2	192	18
214	2	2020	2	193	18
215	1	2020	2	194	17
216	2	2020	2	195	18
217	2	2020	2	196	18
218	1	2020	2	197	17
219	2	2020	2	198	18
220	2	2020	2	199	18
221	2	2020	2	200	18
222	1	2020	2	201	17
223	1	2020	2	202	17
224	1	2020	2	203	17
225	2	2020	2	204	18
226	1	2020	2	205	17
227	1	2020	2	206	17
228	1	2020	2	207	17
229	1	2020	2	208	17
230	1	2020	2	209	17
231	1	2020	2	210	17
232	1	2020	2	211	17
233	2	2020	2	212	18
234	2	2020	2	213	18
235	1	2020	2	214	17
236	2	2020	2	215	18
237	1	2020	2	216	17
238	2	2020	2	217	18
239	2	2020	2	218	18
240	2	2020	2	219	18
241	1	2020	2	220	17
242	2	2020	2	221	18
243	1	2020	2	222	17
244	2	2020	2	223	18
245	1	2020	2	224	17
246	1	2020	2	225	17
247	2	2020	2	226	18
248	1	2020	2	227	17
249	1	2020	2	228	17
250	1	2020	2	229	17
251	1	2020	2	230	17
252	1	2020	2	231	17
253	2	2020	2	232	18
254	2	2020	2	233	18
255	1	2020	2	234	17
256	2	2020	2	235	18
257	2	2020	2	236	18
258	2	2020	2	237	18
259	3	2020	2	1	19
260	3	2020	2	2	19
261	3	2020	2	3	19
262	3	2020	2	73	19
263	3	2020	2	75	19
264	3	2020	2	77	19
265	3	2020	2	79	19
266	3	2020	2	80	19
267	3	2020	2	81	19
268	3	2020	2	126	19
269	3	2020	2	149	19
270	3	2020	2	89	19
271	3	2020	2	199	19
272	3	2020	2	160	19
273	3	2020	2	16	19
274	3	2020	2	139	19
275	3	2020	2	136	19
276	3	2020	2	165	19
277	3	2020	2	170	19
278	3	2020	2	163	19
279	3	2020	2	87	19
280	3	2020	2	152	19
281	3	2020	2	182	19
282	3	2020	2	183	19
283	3	2020	2	200	19
284	3	2020	2	213	19
285	3	2020	2	172	19
286	3	2020	2	223	19
\.


--
-- Data for Name: landuse_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.landuse_type (id, use) FROM stdin;
0	Residential
1	industrial
2	Educational
3	Recreational
4	Public Purpose
5	Commercial
6	Public Utilities
7	Transportation
8	Undeveloped land
9	Agricultural
\.


--
-- Data for Name: lot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lot (id, description) FROM stdin;
1	Lot 1 tenure 2018
2	Lot 2 tenure 2018
3	Lot 3 tenure 2018
4	Lot 4 tenure 2018
5	Lot 5 tenure 2018\n
6	Lot 6 tenure 2018
7	Lot 2 - Replanning
8	Lot 1 Tenure 2022
9	Lot 1 Infrastructure 2022
10	Lot 1 Inclusion 2022
\.


--
-- Data for Name: ownership_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ownership_type (id, ownership) FROM stdin;
\.


--
-- Data for Name: parcel; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.parcel (id, area_ha, description, settlement_id, parcel_no, lpdp_no, code, landuse_id, geom) FROM stdin;
5	0.052	WRG/MNE/MNE/B/214	69	4511	0	069_005	0	0103000020E61000000100000005000000167C4B3E029E4140FCEED7952110E23F5BFBD99EFE9D4140C55DD6B39B11E23FCD708CE0039E4140FEB1B8356012E23F4BFE6149089E41401FC2103E1A11E23F167C4B3E029E4140FCEED7952110E23F
8	0.039	WRG/MNE/MNE/A/223	69	41301	0	069_008	0	0103000020E61000000100000006000000A943ED04169E414051860CFE3322E23F9B65CA31139E41401AE1EA602F23E23F807B579D189E41406F6F835FF123E23F9C4783AB1A9E414036F95A43DF23E23F5A4A96A11C9E41409FC288475923E23FA943ED04169E414051860CFE3322E23F
10	0.049	WRG/MNE/MNE/A/221	69	4114	0	069_010	0	0103000020E61000000100000005000000F56ED8AB119E41402C1701BBF31FE23FC8E8ACEA0E9E414033806C2C0121E23FA943ED04169E414051860CFE3322E23F051D09DE189E4140428D49173421E23FF56ED8AB119E41402C1701BBF31FE23F
12	0.027	WRG/MNE/MNE/A/220	69	4507	0	069_012	0	0103000020E61000000100000005000000B6B106491A9E414094820FF2431FE23F74D0AD3E169E414016E93A57BF20E23F051D09DE189E4140428D49173421E23F9E06D3051D9E4140150C684AC31FE23FB6B106491A9E414094820FF2431FE23F
15	0.028	WRG/MNE/MNE/D/119	69	4141	0	069_015	0	0103000020E6100000010000000500000096ADB2E20D9E41402E6E9C303323E23F751110B7099E414090F011C9FE24E23FBD5454F50B9E41403EE4A56F5225E23F421740C9109E4140A43670099B23E23F96ADB2E20D9E41402E6E9C303323E23F
17	0.037	WRG/MNE/MNE/D/126	69	4133	0	069_017	0	0103000020E61000000100000006000000012960FE069E414087F7E51A4A22E23FB2A37DE0019E41408AFF520FE323E23F4E9048CA059E41409F5B12ED7124E23F706D96ED099E41402E2C3CB4BC22E23FC7D4F6F1099E4140E369CBE5BA22E23F012960FE069E414087F7E51A4A22E23F
19	0.024	WRG/MNE/MNE/D/128	69	4126	0	069_019	0	0103000020E6100000010000000500000014182B1D019E41408FCABB3F6221E23FA0D0A7CBFC9D414032CF9C952923E23F3EEBDAF9FE9D4140E4E0E5C27723E23FAD13363F039E414028C0F427B921E23F14182B1D019E41408FCABB3F6221E23F
22	0.049	WRG/MNE/MNE/D/136	69	4115	0	069_022	0	0103000020E6100000010000000500000044E50FD4F79D414006297A3E0420E23F94DC3EA5F39D414010948E97D521E23F899F9202F89D41400795552E7522E23F3AD84660FC9D414005F84A0BB220E23F44E50FD4F79D414006297A3E0420E23F
24	0.026	WRG/MNE/MNE/D/117	69	4167	0	069_024	0	0103000020E61000000100000006000000B34C15A80D9E414020EF844F1B26E23F811837AF089E41402321B98F1028E23F956D4CE10A9E4140A55869051528E23F6AB23510109E414031FD633EB326E23F771543E00F9E41403B4593036B26E23FB34C15A80D9E414020EF844F1B26E23F
26	0.061	WRG/MNE/MNE/D/121	69	4163	0	069_026	0	0103000020E61000000100000005000000C9AE3E20069E4140CA2A7E950125E23F3A7EE7B7009E4140ED0710675527E23FC97FF8EF049E414043C72317F127E23F0357B96E0A9E4140A21A6281A425E23FC9AE3E20069E4140CA2A7E950125E23F
29	0.044	WRG/MNE/MNE/D/129	69	4151	0	069_029	0	0103000020E610000001000000050000005803A633FD9D4140FBB058EFB423E23F0ED5F401F79D4140CB7D7FF0EE25E23FFE12ED87FA9D4140870528657126E23F4FE8E9CBFF9D41407BF226A01724E23F5803A633FD9D4140FBB058EFB423E23F
31	0.027	WRG/MNE/MNE/D/131	69	4143	0	069_031	0	0103000020E61000000100000005000000391CF629F99D4140E8B481D02323E23FF0308DD4F39D4140B199584A7525E23F866387ABF59D4140ED2E0EE9B925E23FE5876217FB9D4140EA9768406C23E23F391CF629F99D4140E8B481D02323E23F
33	0.039	WRG/MNE/MNE/D/135	69	4137	0	069_033	0	0103000020E61000000100000005000000DDFB47ACF29D4140E670A9DF3622E23F3A30C575ED9D414042DFCCA08B24E23F73F3AA4CF09D41408A308A26F124E23F2409165CF59D41408664B9639D22E23FDDFB47ACF29D4140E670A9DF3622E23F
36	0.046	WRG/MNE/MNE/B/208	69	4038	0	069_036	0	0103000020E61000000100000005000000E975D6DBF39D41403A11FF07660BE23FE8155B56F19D4140F0C4AB03870CE23F6AB927CAF89D41408414CE855C0DE23FEA38A137FB9D4140085E449F590CE23FE975D6DBF39D41403A11FF07660BE23F
38	0.095	WRG/MNE/MNE/B/210	69	4041	0	069_038	0	0103000020E6100000010000000700000009908C6CFC9D4140F5A440F4E10BE23F8C800403F69D4140720ED6FE720EE23FABA698FAF89D4140A1AD3ACCE60EE23F52445B5BFA9D41400641F2B1D10EE23F4D5D9A81FC9D41405B6848EA250FE23F58394893029E414067D831269A0CE23F09908C6CFC9D4140F5A440F4E10BE23F
41	0.046	WRG/MNE/MNE/B/205	69	4033	0	069_041	0	0103000020E61000000100000006000000CD0C666AEF9D4140609F3F195C08E23FADA0599DEC9D4140C4E3EFB79F09E23F843917FEF29D4140AEF9F140750AE23F2F4EEC0BF59D41401C1C0BED8509E23F5F1819A6F49D414006B4C8111509E23FCD0C666AEF9D4140609F3F195C08E23F
43	0.054	WRG/MNE/MNE/B/203	69	4037	0	069_043	0	0103000020E61000000100000006000000AC179F2AEA9D414055258B3BBE0AE23FA59A69D7E69D41403FF76EFB2C0CE23F398562C9EB9D41402D23A000F30CE23F599EB2A7ED9D4140D10DA359D20CE23FC9D40031F09D414060B9604A9F0BE23FAC179F2AEA9D414055258B3BBE0AE23F
45	0.055	WRG/MNE/MNE/B/227	69	4058	0	069_045	0	0103000020E61000000100000005000000593DEB5BFD9D4140DAB2B94F2B12E23FF2D4870FF89D4140E9748D684D14E23F1ABEBA7CFB9D4140DBF013BFCF14E23FA4C11A2E029E4140AAE241FAE112E23F593DEB5BFD9D4140DAB2B94F2B12E23F
48	0.109	WRG/MNE/MNE/B/213	69	4050	0	069_048	0	0103000020E61000000100000005000000A05D6AAFFE9D41407F19E6E93B0EE23F125378D8F79D4140072152C82211E23FA9BAD599FD9D41408E6AC8520412E23FECC39918059E41409E93E511F20EE23FA05D6AAFFE9D41407F19E6E93B0EE23F
50	0.046	WRG/MNE/MNE/B/195	69	4508	0	069_050	0	0103000020E610000001000000050000002C8CFE01F59D41406AB758FFC012E23FB17B576FF19D4140E2E221965114E23FED00F278F69D414040DE0E50F714E23F76C3ED08FA9D41405B68F2ED8113E23F2C8CFE01F59D41406AB758FFC012E23F
52	0.045	WRG/MNE/MNE/B/179	69	4069	0	069_052	0	0103000020E61000000100000005000000CF8916F3ED9D41405722DC211316E23FC92F0737EA9D4140EA76DAA1C417E23FE17EDC48EE9D414098A298A56218E23FEF856F86F29D4140AE085B4E9D16E23FCF8916F3ED9D41405722DC211316E23F
55	0.059	WRG/MNE/MNE/B/201	69	4043	0	069_055	0	0103000020E6100000010000000500000033763B23E99D4140F165A197550DE23FEDA72160E49D41403608A63E2E0FE23F0CD1B633EA9D4140DD294783DC0FE23FE78F6D29EE9D4140BA843EA2120EE23F33763B23E99D4140F165A197550DE23F
57	0.07	WRG/MNE/MNE/B/186	69	4047	0	069_057	0	0103000020E61000000100000007000000F683799CE09D4140079AA8E6BC0EE23F35A4EE1BDC9D4140507E1FA19910E23FE08022BCE09D4140CECE3C0D3F11E23F1097F6DAE19D4140C3788B9FC310E23F127850DDE39D41407C75C7CE0B11E23F955C9D0EE79D4140A95915737E0FE23FF683799CE09D4140079AA8E6BC0EE23F
60	0.039	WRG/MNE/MNE/B/191	69	4056	0	069_060	0	0103000020E610000001000000070000003C98C565EE9D4140D942BECC6410E23F3A44225CEA9D41409F3B89B85612E23F45762701EE9D41408C435D14E112E23F52347E44F19D414009870498AE11E23F91580830EF9D41402578BC226311E23F77B648B7F09D4140EFB8D8BAA910E23F3C98C565EE9D4140D942BECC6410E23F
63	0.035	WRG/MNE/MNE/B/192	69	4510	0	069_063	0	0103000020E61000000100000005000000598B6562EA9D4140F4C049A65712E23FB387CB8EE69D4140563981D73014E23F15E72375E99D41401B563E6D8E14E23F6FF2B0FEED9D41403250DDB6E012E23F598B6562EA9D4140F4C049A65712E23F
64	0.036	WRG/MNE/MNE/B/189	69	4509	0	069_064	0	0103000020E61000000100000005000000E8AE3548E69D4140372F331B1812E23F1C0C2778E29D4140AFDFAA789F13E23F92582C9DE69D41402AAA80E52914E23F22A00CD9E99D41404FFA9CFE9912E23FE8AE3548E69D4140372F331B1812E23F
67	0.048	WRG/MNE/MNE/B/181	69	4063	0	069_067	0	0103000020E61000000100000005000000CFBDA855E09D4140BB0A1149E914E23F7F6926DADC9D4140667837615A16E23FBF54B354E39D4140A04FA2B1EC16E23F176D856DE69D4140C9A58022BE15E23FCFBDA855E09D4140BB0A1149E914E23F
69	0.056	WRG/MNE/MNE/B/180	69	4065	0	069_069	0	0103000020E6100000010000000500000015E72375E99D41401B563E6D8E14E23F82742158E39D41404C688562EB16E23FDC669C30E89D41407AFBAFEC5817E23FA579A2F7EC9D4140A639B4721415E23F15E72375E99D41401B563E6D8E14E23F
72	0.073	WRG/MNE/MNE/B/183	69	4059	0	069_072	0	0103000020E610000001000000080000008FCCA7E6D69D4140AE5BE677C212E23FB9397C53D39D4140C2387B794D14E23FD354D18ADB9D41403A3DB3E2A415E23F20C989B8DD9D4140824AB20CB414E23FF90EA75EDD9D4140745CB5A63614E23F4BF07B1CDB9D41400CDBE365D713E23F7A8D8891DB9D4140EAC66ABE8B13E23F8FCCA7E6D69D4140AE5BE677C212E23F
74	0.034	WRG/MNE/MNE/B/173	69	4064	0	069_074	0	0103000020E6100000010000000500000051FF3D4FD19D414082F9CF962915E23FAAB425D3CF9D4140C4D7D6D0CF15E23F5E5D8CF6D79D41400CE58B3A2717E23FCFDBF27AD99D41402158F39E7716E23F51FF3D4FD19D414082F9CF962915E23F
76	0.062	WRG/MNE/MNE/B/171	69	40971	0	069_076	0	0103000020E6100000010000000500000098793ED1CD9D41406A5809899B16E23FEF5A4119C69D41404C39B4E7D619E23F3404A24AC99D4140138626B1471AE23F2269FE00D19D41403EC513250317E23F98793ED1CD9D41406A5809899B16E23F
79	0.04	WRG/MNE/MNE/B/166	69	4087	0	069_079	0	0103000020E61000000100000005000000E3D36BD5DF9D41404ACE9E4FD019E23F42A3F26ADA9D4140DF06AE97CB1BE23FC74E307CDD9D41403945C445431CE23F95B101F3E29D414070BFCC02441AE23FE3D36BD5DF9D41404ACE9E4FD019E23F
81	0.041	WRG/MNE/MNE/B/168	69	4085	0	069_081	0	0103000020E610000001000000050000006A765BC8D99D41409F18DE31E418E23FBD607FA2D39D4140574103F0CD1AE23FF5729531D79D41409118F3C6511BE23F30F8E7A0DC9D414085565C945419E23F6A765BC8D99D41409F18DE31E418E23F
3	0.045	WRG/MNE/MNE/B/216	69	4044	0	069_003	0	0103000020E61000000100000005000000A1A3CE08059E414053A9CCB8EF0EE23FD78B41240C9E4140B0F8CC38FE0FE23FAE9489260F9E4140E57601921D0FE23F2FC55C87079E4140203AEA2CF30DE23FA1A3CE08059E414053A9CCB8EF0EE23F
86	0.027	WRG/MNE/MNE/B/161	69	4091	0	069_086	0	0103000020E610000001000000050000005AD302E4CF9D41400ED6E61C471AE23FA9CC987ACE9D4140C042B037D81AE23F5AB59553D59D4140DFEAF294F31BE23F4C363303D79D4140754EAD104B1BE23F5AD302E4CF9D41400ED6E61C471AE23F
89	0.029	WRG/MNE/MNE/B/164	69	4096	0	069_089	0	0103000020E61000000100000006000000C74E307CDD9D41403945C445431CE23F2BFC04E8D79D414055BE297D001EE23FAD0DD954D99D4140E5FA551D321EE23F018A0C57DB9D414007873E7B181EE23FAC0F402AE09D414073B356A8A51CE23FC74E307CDD9D41403945C445431CE23F
91	0.037	WRG/MNE/MNE/C/139	69	4109	0	069_091	0	0103000020E6100000010000000500000002B573D7D89D41405F3F0AE0DE1EE23F21B78EB1D29D41405E2B0F8BB120E23FC369F0E2D59D41408D938CD62421E23FC1F420AFDB9D4140907684A74A1FE23F02B573D7D89D41405F3F0AE0DE1EE23F
93	0.04	WRG/MNE/MNE/C/141	69	4104	0	069_093	0	0103000020E610000001000000050000004E632EDFD19D41408BD858C2EB1DE23F904A4FE4CC9D4140E060ED7EDC1FE23FFAF5CFEDCF9D4140E61B15C34520E23F7FD5907ED59D4140973A1202721EE23F4E632EDFD19D41408BD858C2EB1DE23F
96	0.045	WRG/MNE/MNE/C/144	69	4098	0	069_096	0	0103000020E610000001000000050000004E7F715FC59D4140A1442421301CE23F54462DD2C09D4140566B9450141EE23F56F9BFA3C49D414005596C759C1EE23FED2C3A4EC99D41406DEC0A03C41CE23F4E7F715FC59D4140A1442421301CE23F
98	0.045	WRG/MNE/MNE/C/146	69	40931	0	069_098	0	0103000020E61000000100000005000000AF751646BD9D4140AF18FA620D1BE23F31CB1E8AB99D4140D52C8C95FB1CE23FD2EE193DBD9D41405870C7748A1DE23F303A8881C19D414081791943B01BE23FAF751646BD9D4140AF18FA620D1BE23F
101	0.039	WRG/MNE/MNE/C/150	69	4082	0	069_101	0	0103000020E610000001000000050000007D03F689AD9D414045D6E9C4C118E23F03E3826DAA9D414043212696D91AE23F97FEE992AD9D4140BAF827D73F1BE23F5C006938B19D41400D17B6794719E23F7D03F689AD9D414045D6E9C4C118E23F
103	0.044	WRG/MNE/MNE/C/152	69	4077	0	069_103	0	0103000020E610000001000000050000003F2C55C8A59D4140B8877C13B117E23F43E8116CA29D414013FCA4D5B419E23FABA7EF67A69D414098059CB3441AE23F1C6B3995A99D4140D93BB4713F18E23F3F2C55C8A59D4140B8877C13B117E23F
105	0.037	WRG/MNE/MNE/C/154	69	4072	0	069_105	0	0103000020E61000000100000005000000E590F8E99E9D4140D7F425F4BC16E23F49F1888C9A9D4140184D5CA09E18E23FD774D3D79D9D4140FC270A6A1019E23F556FCF34A29D414090ABCBFA3617E23FE590F8E99E9D4140D7F425F4BC16E23F
107	0.044	WRG/MNE/MNE/C/156	69	4068	0	069_107	0	0103000020E61000000100000005000000A4CFCFC9979D41400B5D544ABA15E23F8E68EAC4929D4140408033E98617E23F173CB1B1969D4140BB574F431118E23F5200028D9B9D41402F06C2BF4616E23FA4CFCFC9979D41400B5D544ABA15E23F
109	0.044	WRG/MNE/MNE/C/158	69	4230	0	069_109	0	0103000020E61000000100000005000000EBF868C08F9D4140583199909D14E23F46F242098B9D414013730D357316E23F51DAE5F58E9D4140BB869CE4F816E23FF0F0498F939D41402C4A78EB2715E23FEBF868C08F9D4140583199909D14E23F
112	0.036	WRG/MNE/MNE/E/113	69	4184	0	069_112	0	0103000020E61000000100000005000000789417BAF89D4140FC3308DAE327E23F8C7FD8FFF29D4140EFD7DF89BF29E23F8D1295CDF59D41400ECA4ADF3B2AE23F6CA73679FB9D4140B4C04C8A4528E23F789417BAF89D4140FC3308DAE327E23F
114	0.021	WRG/MNE/MNE/E/111	69	4245	0	069_114	0	0103000020E610000001000000050000004D3A17D6F39D41407B99F25F2B27E23FBAF6FA1AEF9D4140E51C6A0E0D29E23FCA48CB91F09D41402669BA384B29E23F263B20C5F59D4140ACD00ECF7827E23F4D3A17D6F39D41407B99F25F2B27E23F
116	0.02	WRG/MNE/MNE/E/109	69	4246	0	069_116	0	0103000020E61000000100000005000000E905B669EF9D41401CFA88F38626E23FA97AAB96EA9D4140E199EF9B6028E23F16B1523DEC9D4140D255B9C6A028E23F47DDE72CF19D4140474BF64CCF26E23FE905B669EF9D41401CFA88F38626E23F
119	0.033	WRG/MNE/MNE/E/107	69	4164	0	069_119	0	0103000020E61000000100000005000000A2B7193DE99D4140386D6348A325E23F1C00B0DFE49D4140E2DF87FE9027E23F60298683E79D4140AD27AC3DF127E23F07454947EC9D414043E6ACA31726E23FA2B7193DE99D4140386D6348A325E23F
121	0.036	WRG/MNE/MNE/E/105	69	4156	0	069_121	0	0103000020E61000000100000005000000D9DE51DFE29D4140F81D2571BC24E23F546FD892DE9D414005933425A826E23F31575E9AE19D41403EA4A9301A27E23F590DC4FDE59D4140500EDE7C2F25E23FD9DE51DFE29D4140F81D2571BC24E23F
123	0.02	WRG/MNE/MNE/E/103	69	4506	0	069_123	0	0103000020E61000000100000005000000CDAF045BDE9D41404CEC6AC31524E23F5FBF6A36DA9D41406D09B3BB0726E23F0CEE98DADB9D414066A588554226E23F610A0A3EE09D4140684950075D24E23FCDAF045BDE9D41404CEC6AC31524E23F
125	0.036	WRG/MNE/MNE/E/101	69	4145	0	069_125	0	0103000020E61000000100000005000000E31A0F69D99D41403F5BB3C65923E23F1EDD6C4ED59D41405366C8FF4C25E23F68D0E761D89D414042AAE9C9BD25E23F7C1C8981DC9D4140B89B0158D323E23FE31A0F69D99D41403F5BB3C65923E23F
128	0.035	WRG/MNE/MNE/E/098	69	4130	0	069_128	0	0103000020E61000000100000005000000FF305B18D09D4140105FB6100422E23FA423CFE4CB9D41404D27798BF823E23FD1B655E9CE9D41403910DD926524E23FAE31F208D39D41407E3485966E22E23FFF305B18D09D4140105FB6100422E23F
130	0.032	WRG/MNE/MNE/E/096	69	4123	0	069_130	0	0103000020E610000001000000070000006B0749D3C99D4140CB56DBB51921E23FFB19C795C59D41401DBC00F41123E23FA8AA2492C79D4140B871999F5523E23F7CA91DB3C89D4140181389833C23E23F18A95A51CC9D4140607470ADBC21E23F2DD88101CC9D41400F20CEEE6E21E23F6B0749D3C99D4140CB56DBB51921E23F
133	0.047	WRG/MNE/MNE/E/093	69	4113	0	069_133	0	0103000020E6100000010000000500000088BA5FEFBF9D4140BD0A7BC0A61FE23F3B0C8CE0BA9D414090BF19718821E23FFF5CE750BF9D4140D00B17582622E23F239C7F70C39D4140917257122420E23F88BA5FEFBF9D4140BD0A7BC0A61FE23F
135	0.035	WRG/MNE/MNE/E/091	69	4108	0	069_135	0	0103000020E6100000010000000500000072157DAAB99D4140AEFE459EB31EE23F6FB6431DB59D414001FAAF64B320E23F835E04D7B79D4140A0B5569E0D21E23FF3B895D2BC9D4140C3EEE0692F1FE23F72157DAAB99D4140AEFE459EB31EE23F
137	0.023	WRG/MNE/MNE/E/089	69	4105	0	069_137	0	0103000020E6100000010000000500000011F276CCB49D414008140E23FA1DE23F81FB4C2BB09D4140E391CDE5F41FE23FFBDC8459B29D4140FBB7AF9C4720E23F8BDE3D5FB69D4140AAD51DD03B1EE23F11F276CCB49D414008140E23FA1DE23F
140	0.048	WRG/MNE/MNE/E/086	69	4099	0	069_140	0	0103000020E61000000100000005000000087BCDE6A99D41409FDABD43741CE23FA3F54E57A59D4140903A0BD46F1EE23F99FEEB54A99D4140B7B833CC071FE23F7BDF32D0AD9D414068C13601021DE23F087BCDE6A99D41409FDABD43741CE23F
142	0.044	WRG/MNE/MNE/E/063	69	4199	0	069_142	0	0103000020E610000001000000060000007CDBA319F49D4140CE2693107C2AE23F6B1BF8D3F19D4140A56FE0D4562BE23FA8D5C87DF99D4140177D37BFAB2CE23F1E8FC38BFB9D4140AE5FAB3B1D2CE23FFE57C863FB9D41406E3250FDD02BE23F7CDBA319F49D4140CE2693107C2AE23F
144	0.03	WRG/MNE/MNE/E/064	69	4194	0	069_144	0	0103000020E6100000010000000500000064ECCC6BF19D41404674B1BD032AE23F1BF263E0EC9D4140F8379F218D2BE23F04F88EE8EF9D4140B0108555052CE23F7CDBA319F49D4140CE2693107C2AE23F64ECCC6BF19D41404674B1BD032AE23F
147	0.03	WRG/MNE/MNE/E/083	69	4124	0	069_147	0	0103000020E61000000100000005000000F948EA9BB69D4140C6C197147121E23FB1E739D3B29D414027377714EB22E23FAF9B45EDB59D4140A3F29EB15C23E23F9D1A30E9B99D41406107E757DB21E23FF948EA9BB69D4140C6C197147121E23F
149	0.033	WRG/MNE/MNE/E/081	69	4132	0	069_149	0	0103000020E610000001000000050000000006467BBD9D41404A2077E96922E23FB3DDBDADB99D4140EEAD08ACDF23E23FB09D552FBD9D4140282E68646B24E23F7BB66AFBC09D41407BAF8E0DEC22E23F0006467BBD9D41404A2077E96922E23F
152	0.03	WRG/MNE/MNE/E/066	69	4186	0	069_152	0	0103000020E61000000100000005000000201C0C91EB9D41409484B46B0D29E23FFFC5506CE79D4140945F1E1DAA2AE23F6B25E26BEA9D4140F4502172272BE23F2F4ABE63EE9D4140544B4B747A29E23F201C0C91EB9D41409484B46B0D29E23F
153	0.029	WRG/MNE/MNE/E/067	69	4183	0	069_153	0	0103000020E61000000100000005000000858666AFE89D414044A771229F28E23FD1739F94E49D414007A75B4D342AE23F78E5EA6DE79D41401AEC8D7DA92AE23F46398290EB9D4140030C5AA10D29E23F858666AFE89D414044A771229F28E23F
156	0.031	WRG/MNE/MNE/E/070	69	4177	0	069_156	0	0103000020E61000000100000005000000D614FA6FDF9D4140C8823EC44C27E23FE7FEB9D6DB9D41400A5E4B1CCF28E23F3A1E1517DF9D4140254AEAB45229E23FAE6308B6E29D4140CF12A7E3C627E23FD614FA6FDF9D4140C8823EC44C27E23F
158	0.033	WRG/MNE/MNE/E/072	69	4173	0	069_158	0	0103000020E610000001000000050000001210919AD89D41408DAA591B4D26E23F41B9EA7DD59D4140FC8DE2FEE027E23FABADEC26D99D414088661CDA6A28E23F63AD6D04DC9D414097E44ECFCE26E23F1210919AD89D41408DAA591B4D26E23F
160	0.03	WRG/MNE/MNE/E/075	69	4159	0	069_160	0	0103000020E61000000100000005000000DC76BE46D29D4140B186DF7F6125E23FD0A0F651CF9D4140FAE88B25F926E23F40344F8DD29D41403672B82F6B27E23F39176D89D59D41400A6782F0D925E23FDC76BE46D29D4140B186DF7F6125E23F
1	0.043	WRG/MNE/MNE/B/218	69	4231	0	069_001	0	0103000020E61000000100000007000000AE9489260F9E4140E57601921D0FE23FE34B80D9139E4140941D6803B80DE23FCF264CA0139E414059712F5B4C0DE23FC4F6018D109E4140E0569713E50CE23FEECCA65C0B9E4140475FD5EF860EE23FEECCA65C0B9E4140475FD5EF860EE23FAE9489260F9E4140E57601921D0FE23F
2	0.047	WRG/MNE/MNE/B/217	69	4040	0	069_002	0	0103000020E6100000010000000500000055CFC7940B9E4140620E9F11360CE23F2FC55C87079E4140203AEA2CF30DE23FEECCA65C0B9E4140475FD5EF860EE23FC4F6018D109E4140E0569713E50CE23F55CFC7940B9E4140620E9F11360CE23F
4	0.05	WRG/MNE/MNE/B/215	69	4046	0	069_004	0	0103000020E61000000100000005000000A1A3CE08059E414068AACCB8EF0EE23F167C4B3E029E4140FCEED7952110E23F4BFE6149089E41401FC2103E1A11E23FD78B41240C9E4140F6F8CC38FE0FE23FA1A3CE08059E414068AACCB8EF0EE23F
6	0.071	WRG/MNE/MNE/A/225	69	4116	0	069_006	0	0103000020E610000001000000060000009E06D3051D9E4140150C684AC31FE23F051D09DE189E4140428D49173421E23F108049FE1F9E41405351FD737422E23F39A0ABAE239E414055D11B0E7C21E23F14D3A77E239E4140241C0C2F0821E23F9E06D3051D9E4140150C684AC31FE23F
7	0.047	WRG/MNE/MNE/A/224	69	4125	0	069_007	0	0103000020E61000000100000005000000051D09DE189E4140428D49173421E23FA943ED04169E414051860CFE3322E23F5A4A96A11C9E41409FC288475923E23F108049FE1F9E41405351FD737422E23F051D09DE189E4140428D49173421E23F
9	0.05	WRG/MNE/MNE/A/222	69	4122	0	069_009	0	0103000020E61000000100000006000000C8E8ACEA0E9E414033806C2C0121E23FD01610950C9E414021082773DE21E23F04BDE4FA0C9E41400C26E2505222E23F9B65CA31139E41401AE1EA602F23E23FA943ED04169E414051860CFE3322E23FC8E8ACEA0E9E414033806C2C0121E23F
11	0.046	WRG/MNE/MNE/A/219	69	4110	0	069_011	0	0103000020E6100000010000000600000054A36902159E41407D12AF14AB1EE23FF56ED8AB119E41402C1701BBF31FE23F74D0AD3E169E414016E93A57BF20E23FB6B106491A9E414094820FF2431FE23F362BCBD1169E4140B37066B7951EE23F54A36902159E41407D12AF14AB1EE23F
164	0.017	WRG/MNE/MNE/E/078	69	4144	0	069_164	0	0103000020E61000000100000007000000C0E3D79CC99D4140F5289AB02524E23F7905E96CC89D4140DA68C9463724E23F3234C0B3C59D4140F6C82A0D5E25E23FAED88D0DC69D41409D6B5786A525E23FAFBF9B4AC79D41402B7A0B09CB25E23FA8D1F3B3CA9D414039A4070C4F24E23FC0E3D79CC99D4140F5289AB02524E23F
167	0.041	WRG/MNE/MNE/F/003	69	4227	0	069_167	0	0103000020E61000000100000005000000043486FAD29D4140AE6D0BBED433E23F00517BF7CF9D4140A329BBFCA234E23F8612F3CED59D4140D1C5EF0F1B36E23F81851EAED89D41408F61A6D44F35E23F043486FAD29D4140AE6D0BBED433E23F
169	0.046	WRG/MNE/MNE/F/005	69	4225	0	069_169	0	0103000020E610000001000000050000007F433C60D99D41402F3C47251A32E23F751866E6D59D4140DC7B3A8B0633E23F186FF8E6DB9D4140A2E8DD107D34E23FF824F4FBDE9D414078F1FD52B033E23F7F433C60D99D41402F3C47251A32E23F
171	0.041	WRG/MNE/MNE/F/007	69	4223	0	069_171	0	0103000020E6100000010000000500000002237C42DF9D414080A45BBF9830E23FA03E792DDC9D4140B52F366E5331E23F113BF210E29D4140BA1F209AE932E23F6F5930DEE49D41409C6690E52532E23F02237C42DF9D414080A45BBF9830E23F
174	0.02	WRG/MNE/MNE/F/009	69	4503	0	069_174	0	0103000020E610000001000000050000008B357F65E69D414041286306BD2EE23F2DEEB472E59D4140D1B47C4C0A2FE23F445AF339EB9D41400ADA43567630E23FEC571E18ED9D41401E703CE1F72FE23F8B357F65E69D414041286306BD2EE23F
176	0.034	WRG/MNE/MNE/F/	69	4216	0	069_176	0	0103000020E6100000010000000500000029CDE411EA9D4140B1CB1120C42DE23F09B277C8E79D414021BE7880692EE23F2781FE72EE9D414069B8AFDFA02FE23F09054FFCF09D4140F8302FF1F42EE23F29CDE411EA9D4140B1CB1120C42DE23F
178	0.04	WRG/MNE/MNE/F/013	69	4211	0	069_178	0	0103000020E61000000100000007000000811FC07CEF9D4140E5DBE927C32CE23FCCDF758EED9D414031E54A3ECF2CE23FC5059468EB9D4140A827C9CA672DE23F77A1FC52F29D4140F5FE9098942EE23F1D9AE870F49D4140A563F112042EE23F6E10ED38F49D4140A4E2F8B6932DE23F811FC07CEF9D4140E5DBE927C32CE23F
181	0.045	WRG/MNE/MNE/G/024	69	4238	0	069_181	0	0103000020E61000000100000005000000EE9F0D63AE9D41400060CA571429E23FFDDC8304A99D414027C2D812002BE23F6A1982ADAC9D41407E86C3E57F2BE23F2F5DF91FB29D414043EB20A89129E23FEE9F0D63AE9D41400060CA571429E23F
183	0.047	WRG/MNE/MNE/G/022	69	4240	0	069_183	0	0103000020E61000000100000005000000660DCE0BB69D4140A6AA618C122AE23F3F9C17CEB09D41409F09AFB5FF2BE23FDDF7D4C6B49D4140D2BE04118C2CE23F1F6AA0D5B99D41407864A14F962AE23F660DCE0BB69D4140A6AA618C122AE23F
185	0.049	WRG/MNE/MNE/G/020	69	4204	0	069_185	0	0103000020E61000000100000005000000114BE12CBE9D4140B5E169C1322BE23FFE43B75CB99D41402A45EE9D1F2DE23FF87450AEBC9D414067903CB7902DE23F61A6F02DC39D4140029DAB1ED72BE23F114BE12CBE9D4140B5E169C1322BE23F
188	0.094	WRG/MNE/MNE/G/017	69	4215	0	069_188	0	0103000020E61000000100000005000000EDCF365BCB9D41402B33CCD3EF2CE23F4AB93849C59D41407FD0C86DAE2EE23FE06D8F62CD9D414088234AA1C42FE23F834DB14CD39D4140312D648A082EE23FEDCF365BCB9D41402B33CCD3EF2CE23F
190	0.049	WRG/MNE/MNE/G/015	69	4219	0	069_190	0	0103000020E610000001000000050000006D92CBD7D69D4140A70D2B628D2EE23FC44B376FD19D4140C125BCF34630E23F0539BEA3D59D4140A8005849CE30E23FB9F81070DB9D414039B524E34B2FE23F6D92CBD7D69D4140A70D2B628D2EE23F
192	0.018	WRG/MNE/MNE/G/044	69	4134	0	069_192	0	0103000020E61000000100000005000000097F73DDAF9D41403515754A3F23E23F2A2F1A53AE9D4140F267F1F60224E23F4E28062FB39D41401061F7367524E23FEBF966D1B49D41401624EFC5F923E23F097F73DDAF9D41403515754A3F23E23F
195	0.049	WRG/MNE/MNE/G/047	69	4161	0	069_195	0	0103000020E610000001000000050000007A4AF8AABC9D41408D3071811725E23FE58CE1D4B69D41401E121C551D27E23FF4E9A4C1BA9D41403CFD96A79E27E23FB14CE467C09D4140D8CF9ED29525E23F7A4AF8AABC9D41408D3071811725E23F
197	0.017	WRG/MNE/MNE/G/027	69	4214	0	069_197	0	0103000020E61000000100000005000000236BEC39DD9D41405B128BE2D72DE23FB6FF49C4DA9D41401690B463602EE23F55019A58DF9D4140AA95C8F3302FE23F4BF3D356E19D41406574FFD71E2FE23F236BEC39DD9D41405B128BE2D72DE23F
199	0.029	WRG/MNE/MNE/G/032	69	4207	0	069_199	0	0103000020E61000000100000005000000904116B3D79D414075DF9DDA222CE23F0801A202D39D41401FC238643E2DE23F7C11352DD79D4140C03C6481CE2DE23FCC09E994DA9D4140E3A3B842032DE23F904116B3D79D414075DF9DDA222CE23F
201	0.045	WRG/MNE/MNE/G/035	69	4196	0	069_201	0	0103000020E610000001000000050000005E50D521CF9D41407350FAFA392AE23F3BBCA146C99D4140921719C8EA2BE23F98567026CD9D4140291EA6DA6B2CE23FE09F613BD39D4140A1FE4A60BF2AE23F5E50D521CF9D41407350FAFA392AE23F
204	0.046	WRG/MNE/MNE/G/038	69	4185	0	069_204	0	0103000020E61000000100000005000000BE3ECF03C39D4140B6400D739F28E23F9EFAA21BBD9D4140FAC15F78462AE23FB1A83439C19D4140ECEA6DE0D32AE23FF0D8C523C79D4140F3A0B3082B29E23FBE3ECF03C39D4140B6400D739F28E23F
206	0.042	WRG/MNE/MNE/G/040	69	4179	0	069_206	0	0103000020E61000000100000005000000F4E9A4C1BA9D41403CFD96A79E27E23F61BA2730B59D4140D3CA214B3929E23F62A3CA46B99D41402B0C5025C529E23FBABC3B74BE9D41404BA1E5AB0928E23FF4E9A4C1BA9D41403CFD96A79E27E23F
208	0.04	WRG/MNE/MNE/G/042	69	4171	0	069_208	0	0103000020E61000000100000005000000019F9869B29D4140C779C5929926E23F211E56ABAD9D41402D89CD223528E23F3FFE4C5BB19D4140B58C0DF3B128E23F06E74191B69D4140C6EAF8EA1527E23F019F9869B29D4140C779C5929926E23F
211	0.023	WRG/MNE/MNE/G/029	69	4212	0	069_211	0	0103000020E61000000100000006000000F775B386E09D41407CDF2B5B012DE23F449F5CCBDD9D414033FE817CAE2DE23FF84E0D69E09D41408825E7B3762EE23F25FAD56BE49D41407B15F9D57E2DE23F3B631A34E19D41401E5D5454FE2CE23FF775B386E09D41407CDF2B5B012DE23F
213	0.013	WRG/MNE/MNE/G/	69	42051	0	069_213	0	0103000020E61000000100000005000000C6A311C3D99D4140EBABCB1B9A2BE23F581B735CD89D41404D7B5177FD2BE23F3A86542DDB9D414051FA6D5FDD2CE23FF5D2414DDD9D414062390060542CE23FC6A311C3D99D4140EBABCB1B9A2BE23F
216	0.026	WRG/MNE/MNE/G/059	69	4197	0	069_216	0	0103000020E6100000010000000500000078D1C19FE19D4140C0C1F904872AE23F061C7253DC9D4140EB34C406212CE23F2FD5D350DE9D41400488CEC0822CE23F4DFAD3FFE39D4140E0260EC7E82AE23F78D1C19FE19D4140C0C1F904872AE23F
218	0.023	WRG/MNE/MNE/G/057	69	4193	0	069_218	0	0103000020E61000000100000005000000D3273E57DD9D4140523B9E51DB29E23FB9278CE6D69D4140DABD525F882BE23F581B735CD89D41404D7B5177FD2BE23F3AEBE5FEDE9D4140136D4DFF1E2AE23FD3273E57DD9D4140523B9E51DB29E23F
220	0.035	WRG/MNE/MNE/G/055	69	4187	0	069_220	0	0103000020E61000000100000006000000611C7E1FD89D4140DBB50C870C29E23F9D68BBC5D29D414052D45D12722AE23FB975E3CDD39D4140263C12EC982AE23FA89376B1D59D414057BCF7DA2C2BE23F6334F837DB9D4140821055188629E23F611C7E1FD89D4140DBB50C870C29E23F
222	0.025	WRG/MNE/MNE/G/053	69	4248	0	069_222	0	0103000020E610000001000000050000007EF71E75D29D4140FA5A09F83428E23F0C1BEAB0CD9D414097590E23C529E23F01950DF3CF9D4140699A2353102AE23F0E518F32D59D4140EE0C68D89A28E23F7EF71E75D29D4140FA5A09F83428E23F
225	0.04	WRG/MNE/MNE/G/050	69	4172	0	069_225	0	0103000020E61000000100000005000000D755A9CBC69D41403DC8F3188226E23F76507E0CC29D414041F515A23628E23F3F1084E6C59D41400C6756CCBB28E23F0A6CB865CA9D4140660593F40B27E23FD755A9CBC69D41403DC8F3188226E23F
14	0.045	WRG/MNE/MNE/D/119	69	4147	0	069_014	0	0103000020E61000000100000005000000391C4ECC109E4140CC7069F39923E23FA75044EB0B9E41400CA57B035625E23F8097F3F50F9E4140FEB9E3E2E725E23F1AC9CCDD149E4140D73BBF4D3024E23F391C4ECC109E4140CC7069F39923E23F
16	0.042	WRG/MNE/MNE/D/123	69	4138	0	069_016	0	0103000020E61000000100000006000000C7D4F6F1099E4140E369CBE5BA22E23F4E9048CA059E41409F5B12ED7124E23F751110B7099E414090F011C9FE24E23F96ADB2E20D9E41402E6E9C303323E23F8FB38D660A9E4140D514A15CB322E23FC7D4F6F1099E4140E369CBE5BA22E23F
18	0.036	WRG/MNE/MNE/D/127	69	4128	0	069_018	0	0103000020E61000000100000005000000C5A46746039E4140A554BA37B621E23FB0E8E2F4FE9D414007767ACA7923E23F9494C1E9019E41404DD2C92AE023E23F634F5AFD069E4140C74EA66C4A22E23FC5A46746039E4140A554BA37B621E23F
20	0.028	WRG/MNE/MNE/D/132	69	4121	0	069_020	0	0103000020E610000001000000050000003BA83F92FE9D41400267CC000321E23F4BC2C731FA9D414093D88213C622E23F665464CCFC9D41403CB6F7472923E23FB651BD1B019E41402E4A63D66221E23F3BA83F92FE9D41400267CC000321E23F
21	0.024	WRG/MNE/MNE/D/133	69	4118	0	069_021	0	0103000020E610000001000000050000006537105BFC9D41406FEB054BB120E23FDB2649FDF79D41408D4B836A7422E23F9BF88934FA9D4140B5009C7CC622E23F3BA83F92FE9D41400267CC000321E23F6537105BFC9D41406FEB054BB120E23F
23	0.021	WRG/MNE/MNE/D/136	69	4112	0	069_023	0	0103000020E61000000100000005000000EEFC322EF69D4140E4426A4BBF1FE23F0055F68EF19D4140DE28E0688D21E23F94DC3EA5F39D414010948E97D521E23F44E50FD4F79D414006297A3E0420E23FEEFC322EF69D4140E4426A4BBF1FE23F
25	0.042	WRG/MNE/MNE/D/120	69	4168	0	069_025	0	0103000020E610000001000000060000000357B96E0A9E4140A21A6281A425E23F5AA576EC049E4140551ECD8EF227E23FE901B8D5059E4140B38EB9251528E23F811837AF089E41402321B98F1028E23FB34C15A80D9E414020EF844F1B26E23F0357B96E0A9E4140A21A6281A425E23F
27	0.045	WRG/MNE/MNE/D/124	69	4158	0	069_027	0	0103000020E61000000100000005000000CA286DF9029E414050852C898D24E23F4A5308A0FD9D414076455519E026E23F3A7EE7B7009E4140ED0710675527E23FC9AE3E20069E4140CA2A7E950125E23FCA286DF9029E414050852C898D24E23F
28	0.045	WRG/MNE/MNE/D/125	69	4154	0	069_028	0	0103000020E6100000010000000500000032540AC8FF9D414067DE6E101724E23FEF441387FA9D41400098C2C67126E23F4A5308A0FD9D414076455519E026E23FCA286DF9029E414050852C898D24E23F32540AC8FF9D414067DE6E101724E23F
30	0.024	WRG/MNE/MNE/D/130	69	4146	0	069_030	0	0103000020E61000000100000005000000E5876217FB9D4140EA9768406C23E23F187510A7F59D4140272DA7CEBB25E23FB4D4C304F79D4140409E0AEEED25E23FF2B74727FD9D4140BB968661B923E23FE5876217FB9D4140EA9768406C23E23F
32	0.052	WRG/MNE/MNE/D/134	69	4142	0	069_032	0	0103000020E610000001000000050000002409165CF59D41408664B9639D22E23FA5437845F09D4140B626FD75F424E23FF0308DD4F39D4140B199584A7525E23F6C133728F99D41406271CF922423E23F2409165CF59D41408664B9639D22E23F
34	0.032	WRG/MNE/MNE/D/138	69	4135	0	069_034	0	0103000020E610000001000000050000009F90F0A5F09D4140A9ABA75EEC21E23F3B49DBE7EA9D41405D2EDADF2924E23F3B25F678ED9D414087177B338A24E23F6679F5AEF29D41409B31D5453722E23F9F90F0A5F09D4140A9ABA75EEC21E23F
35	0.034	WRG/MNE/MNE/B/207	69	4250	0	069_035	0	0103000020E61000000100000006000000F59D5A34F99D414034F19BFAB509E23F6216FF61F79D4140A259351FD409E23F398A353DF69D4140F2F747185D0AE23F90FBEADAFD9D41400AA52536550BE23F08F512A1FF9D41402F238D0E990AE23FF59D5A34F99D414034F19BFAB509E23F
37	0.046	WRG/MNE/MNE/B/207	69	4035	0	069_037	0	0103000020E61000000100000005000000398A353DF69D4140F2F747185D0AE23FA7DDB3DBF39D414036E08503660BE23FEA38A137FB9D4140085E449F590CE23F2800A0D8FD9D414091DE72EB540BE23F398A353DF69D4140F2F747185D0AE23F
39	0.045	WRG/MNE/MNE/B/211	69	4036	0	069_039	0	0103000020E61000000100000005000000F0CC3071FC9D41408E11F527E00BE23F58394893029E414067D831269A0CE23F52FB3E7E059E41401A6DC990620BE23F08F512A1FF9D41402F238D0E990AE23FF0CC3071FC9D41408E11F527E00BE23F
40	0.043	WRG/MNE/MNE/B/209	69	4232	0	069_040	0	0103000020E61000000100000006000000E8155B56F19D4140F0C4AB03870CE23F5879F3CBEF9D41403A790992260DE23FD6CABF3DF09D4140E8BC8074A00DE23F8C800403F69D4140720ED6FE720EE23F8D7D4CC1F89D4140233812885B0DE23FE8155B56F19D4140F0C4AB03870CE23F
42	0.044	WRG/MNE/MNE/B/204	69	4034	0	069_042	0	0103000020E61000000100000005000000049AFAA4EC9D41405C3E84469C09E23FBB220318EA9D4140CD4017BDC60AE23FC9D40031F09D414060B9604A9F0BE23F843917FEF29D4140AEF9F140750AE23F049AFAA4EC9D41405C3E84469C09E23F
44	0.018	WRG/MNE/MNE/B/227	69	4053	0	069_044	0	0103000020E61000000100000005000000AE6B5EA6FE9D414084293FA39811E23FD31F2142FD9D4140D897937E2712E23FA4C11A2E029E4140AAE241FAE112E23F8AD730DE039E41403F8394DD5F12E23FAE6B5EA6FE9D414084293FA39811E23F
46	0.048	WRG/MNE/MNE/B/228	69	4073	0	069_046	0	0103000020E610000001000000040000004A250917F89D4140449D02634A14E23FAC9716F5EC9D4140531AA489F018E23FE7064462FB9D4140242676D0CB14E23F4A250917F89D4140449D02634A14E23F
47	0.103	WRG/MNE/MNE/B/212	69	4039	0	069_047	0	0103000020E6100000010000000500000052FB3E7E059E41401A6DC990620BE23FA55D6AAFFE9D41407F19E6E93B0EE23FECC39918059E41406E92E511F20EE23F411395900B9E4140AE17BDDE370CE23F52FB3E7E059E41401A6DC990620BE23F
49	0.053	WRG/MNE/MNE/B/198	69	4054	0	069_049	0	0103000020E6100000010000000700000062AAECEBF79D4140D52253871A11E23FAE743F2BF59D41400277CEC23B12E23FE67ED1BAF59D4140325994E06312E23F64FF9EFBF49D4140BE7D5F35C412E23F79C3ED08FA9D41405A68F2ED8113E23FA9BAD599FD9D41408E6AC8520412E23F62AAECEBF79D4140D52253871A11E23F
51	0.048	WRG/MNE/MNE/B/197	69	4062	0	069_051	0	0103000020E61000000100000005000000B17B576FF19D4140E2E221965114E23F21AA27E3ED9D41405A36ED281B16E23F9D469F91F29D4140408970A29816E23FED00F278F69D414040DE0E50F714E23FB17B576FF19D4140E2E221965114E23F
53	0.042	WRG/MNE/MNE/B/178	69	4076	0	069_053	0	0103000020E610000001000000070000005B8A1C5AEA9D41401EB00DF4C917E23F64873F3BE69D41409643CD449E19E23F1C33F1CAE69D4140C14645A5161AE23FCE9FE718E99D414097748E8C0A1AE23FDD17DF08ED9D41406EB20EDBEA18E23FE17EDC48EE9D414098A298A56218E23F5B8A1C5AEA9D41401EB00DF4C917E23F
54	0.068	WRG/MNE/MNE/B/200	69	4045	0	069_054	0	0103000020E610000001000000050000001A29192FEE9D4140C7599412100EE23FBD15611FEA9D414097ADA0B2E50FE23F7AB648B7F09D4140EFB8D8BAA910E23FAAE14691F49D41403B83D592FA0EE23F1A29192FEE9D4140C7599412100EE23F
56	0.056	WRG/MNE/MNE/B/202	69	4042	0	069_056	0	0103000020E610000001000000050000002D6B88F9E69D4140E43AB651320CE23F098C4697E09D4140D9F731FABE0EE23F8E248370E49D4140C531CFE4270FE23F8BFEE681EA9D4140929147C7BF0CE23F2D6B88F9E69D4140E43AB651320CE23F
58	0.036	WRG/MNE/MNE/B/187	69	4048	0	069_058	0	0103000020E61000000100000005000000955C9D0EE79D4140A95915737E0FE23F23CC48D9E39D41406C4FFE3D0B11E23FC5CD3A9AE79D4140F10D851D8711E23F60FD483AEB9D41403A28E48D0610E23F955C9D0EE79D4140A95915737E0FE23F
59	0.031	WRG/MNE/MNE/B/190	69	4049	0	069_059	0	0103000020E6100000010000000500000060FD483AEB9D41403A28E48D0610E23F2EBDDA95E79D41406589228D8611E23F7A385027EB9D4140DD2AF26F0512E23F3C98C565EE9D4140D942BECC6410E23F60FD483AEB9D41403A28E48D0610E23F
61	0.032	WRG/MNE/MNE/B/194	69	4247	0	069_061	0	0103000020E6100000010000000700000052347E44F19D414009870498AE11E23F5527AD82EC9D4140A5DAF0906B13E23FCFC84A74EF9D41401D7539E7E913E23F86E0EAA0F29D4140BF5ED9926812E23F9E7FF5CBF39D4140825A6BAE9212E23FC24B258FF49D41409B89315B3412E23F52347E44F19D414009870498AE11E23F
62	0.086	WRG/MNE/MNE/B/199	69	4051	0	069_062	0	0103000020E61000000100000007000000EE6ABB4BFA9D41409FBF18A71810E23FCDA6AA1FF89D4140E1B27C8DC70FE23FEE12DEC0F79D41409F0C274D770FE23F0FB10584F49D4140C7D19C5E000FE23F079EB632EF9D41406BD386DD6111E23F851B5312F59D41408C9CC6734612E23FEE6ABB4BFA9D41409FBF18A71810E23F
66	0.048	WRG/MNE/MNE/B/182	69	4060	0	069_066	0	0103000020E61000000100000007000000BC1F8078E29D414074ED49849F13E23FA0C8050CE19D4140288DE8BA3114E23F623D8549E19D4140B05977337714E23FAE638F4EE09D41407CDA449BEC14E23F176D856DE69D4140C9A58022BE15E23F15E72375E99D41401B563E6D8E14E23FBC1F8078E29D414074ED49849F13E23F
68	0.074	WRG/MNE/MNE/B/175	69	4071	0	069_068	0	0103000020E610000001000000060000007F6926DADC9D4140667837615A16E23F3D117FA5D99D41408786D497B717E23F28D9520DDA9D41404889A2F72D18E23F7732DD80DF9D41408E77F47EFA18E23F878CCE63E49D41408DFE38BD0217E23F7F6926DADC9D4140667837615A16E23F
70	0.045	WRG/MNE/MNE/B/177	69	4074	0	069_070	0	0103000020E61000000100000006000000B62E3B63E49D4140093F91F80217E23F6987CB85DF9D4140CB9A9C82F818E23F4A259E42E29D4140343C3FC86719E23F474421E5E39D41409E7FCC9F4319E23FE556B429E89D41406D5B8F505817E23FB62E3B63E49D4140093F91F80217E23F
71	0.023	WRG/MNE/MNE/B/193	69	4233	0	069_071	0	0103000020E6100000010000000600000092762858EF9D41407F9AD12FE513E23FE68331A4EC9D414045EE5C2F7113E23FD9EE6A70E99D414024D157149014E23FCA6A8EF1EC9D414072BE8D6E1715E23F712E0F5FEF9D41406856FE57E613E23F92762858EF9D41407F9AD12FE513E23F
77	0.046	WRG/MNE/MNE/B/159	69	4084	0	069_077	0	0103000020E61000000100000008000000EF5A4119C69D41404C39B4E7D619E23F3CED7BFCC29D414086BD970A1D1BE23F8A61AF9EC79D41403338B5F8C41BE23FCCC3AD60CD9D41402C11DC4C5419E23F94CCFBFCCB9D4140F4BBCB2F2319E23F3404A24AC99D4140138626B1471AE23F13A8F222C69D414085EFC0D8D219E23FEF5A4119C69D41404C39B4E7D619E23F
78	0.065	WRG/MNE/MNE/B/184	69	4055	0	069_078	0	0103000020E61000000100000005000000709C9D24DC9D414064D4A6D79A10E23FF10FC8DDD69D41400442B81DC612E23FFF9AF593DB9D41403E1C61248C13E23FE08022BCE09D4140CECE3C0D3F11E23F709C9D24DC9D414064D4A6D79A10E23F
80	0.041	WRG/MNE/MNE/B/167	69	4235	0	069_080	0	0103000020E61000000100000005000000B16F02A8DC9D4140391DD6FA5119E23FF5729531D79D41409118F3C6511BE23F42A3F26ADA9D4140DF06AE97CB1BE23FE3D36BD5DF9D41404ACE9E4FD019E23FB16F02A8DC9D4140391DD6FA5119E23F
82	0.054	WRG/MNE/MNE/B/169	69	4081	0	069_082	0	0103000020E6100000010000000500000016812A24D59D4140F7E20EC53D18E23F5D3D98DDCF9D41402B80FE99491AE23F7F58A6B3D39D41401574696BD01AE23F6A765BC8D99D41409F18DE31E418E23F16812A24D59D4140F7E20EC53D18E23F
83	0.059	WRG/MNE/MNE/B/170	69	4078	0	069_083	0	0103000020E61000000100000007000000405B28A9CF9D414078E77AD49417E23F94CCFBFCCB9D4140F4BBCB2F2319E23FCCC3AD60CD9D41402C11DC4C5419E23F2FD4D564CC9D4140E0D7BE07BF19E23F5AD302E4CF9D41400ED6E61C471AE23F7047341AD59D41404DD22FA24118E23F405B28A9CF9D414078E77AD49417E23F
85	0.059	WRG/MNE/MNE/B/161	69	4090	0	069_085	0	0103000020E610000001000000050000001CA7715BD59D4140EE2A2CDAF41BE23FA9CC987ACE9D4140C042B037D81AE23FD5D39708CB9D41405C239C553A1CE23FA8D1C322D29D4140A3BEA87B381DE23F1CA7715BD59D4140EE2A2CDAF41BE23F
87	0.024	WRG/MNE/MNE/B/226	69	4094	0	069_087	0	0103000020E61000000100000005000000F94ED809D89D41406D39F2B1711BE23FBE0AA856D69D4140CC9DAE7A231CE23F4C0BAB44DB9D4140B93BD00CF91CE23FC74E307CDD9D41403945C445431CE23FF94ED809D89D41406D39F2B1711BE23F
88	0.036	WRG/MNE/MNE/B/163	69	4093	0	069_088	0	0103000020E610000001000000050000001C4DA45DD69D4140AC8023A0201CE23FA657DF35D39D4140896B100F581DE23F2BFC04E8D79D414055BE297D001EE23F4C0BAB44DB9D4140B93BD00CF91CE23F1C4DA45DD69D4140AC8023A0201CE23F
90	0.039	WRG/MNE/MNE/B/165	69	4088	0	069_090	0	0103000020E61000000100000006000000B9F3DAF6E29D41406A40B19A421AE23FB3E4737ADD9D414041B832E8431CE23FAC0F402AE09D414073B356A8A51CE23F06EDEB88E59D4140F2C79FB5101BE23FF157E55EE59D414063EF5FDBA21AE23FB9F3DAF6E29D41406A40B19A421AE23F
92	0.037	WRG/MNE/MNE/C/140	69	4106	0	069_092	0	0103000020E61000000100000005000000C2822392D59D4140FB460A956B1EE23FFAF5CFEDCF9D4140E61B15C34520E23F5A6D10BAD29D414046EB3BBEB220E23FA6DA46D3D89D414010E7F51CE01EE23FC2822392D59D4140FB460A956B1EE23F
94	0.038	WRG/MNE/MNE/C/142	69	4102	0	069_094	0	0103000020E610000001000000050000000EE5E78FCE9D41405577ABF97A1DE23F9D6AD1D0C99D41402E26822E641FE23F3E3E9AF0CC9D41402066C2B4D71FE23FE9DA5FD6D19D414055A8CB30EF1DE23F0EE5E78FCE9D41405577ABF97A1DE23F
95	0.062	WRG/MNE/MNE/C/143	69	4100	0	069_095	0	0103000020E61000000100000005000000ED2C3A4EC99D41406DEC0A03C41CE23F0DF51599C49D4140254137ADA01EE23F12997ED2C99D4140A036B781631FE23FD54BFB9ACE9D4140F828AB827C1DE23FED2C3A4EC99D41406DEC0A03C41CE23F
97	0.042	WRG/MNE/MNE/C/145	69	4095	0	069_097	0	0103000020E61000000100000005000000D0D88998C19D4140DD1E9446A61BE23FD2EE193DBD9D41405870C7748A1DE23FD98264D7C09D414050F8C425121EE23FA44BA54DC59D4140A65E4F86371CE23FD0D88998C19D4140DD1E9446A61BE23F
99	0.062	WRG/MNE/MNE/C/147	69	4089	0	069_099	0	0103000020E61000000100000007000000B48FCDB7B89D4140FEE4016C5B1AE23F33833629B79D4140FFAEF58E791AE23F43D61D7AB49D41408FDC3E4AE01BE23F0BE6B423B59D414024E4C2A14E1CE23F87AC0A8EB99D414037B9948EF91CE23FAF751646BD9D4140AF18FA620D1BE23FB48FCDB7B89D4140FEE4016C5B1AE23F
100	0.044	WRG/MNE/MNE/C/149	69	4083	0	069_100	0	0103000020E610000001000000070000001E35F92EB19D41403B17C51B4619E23F97FEE992AD9D4140BAF827D73F1BE23F91799F60B09D41409C44AE1DAA1BE23FBC1AFD2EB29D4140FBD7CCF5871BE23F92C446ACB49D4140C71703C72E1AE23FBFAFA00CB49D41402AE3E661B019E23F1E35F92EB19D41403B17C51B4619E23F
102	0.045	WRG/MNE/MNE/C/151	69	4080	0	069_102	0	0103000020E610000001000000050000001C6B3995A99D4140D93BB4713F18E23FA7A9D560A69D41404CD9DD37491AE23F03E3826DAA9D414043212696D91AE23F9C472780AD9D41405B0C075EC818E23F1C6B3995A99D4140D93BB4713F18E23F
104	0.046	WRG/MNE/MNE/C/153	69	4075	0	069_104	0	0103000020E610000001000000050000009AEF4733A29D4140DAE78DC43617E23FD774D3D79D9D4140FC270A6A1019E23F43E8116CA29D414013FCA4D5B419E23F26B4E6C1A59D41403F8A9AEEB417E23F9AEF4733A29D4140DAE78DC43617E23F
106	0.041	WRG/MNE/MNE/C/155	69	4070	0	069_106	0	0103000020E61000000100000005000000ADFFB5929B9D4140A8DC55A54416E23F173CB1B1969D4140BB574F431118E23FEA9111969A9D41406DE452849A18E23FE590F8E99E9D4140D7F425F4BC16E23FADFFB5929B9D4140A8DC55A54416E23F
108	0.046	WRG/MNE/MNE/C/157	69	4066	0	069_108	0	0103000020E61000000100000005000000F0F0498F939D41402C4A78EB2715E23FD04214EA8E9D4140E619798FFD16E23F8E68EAC4929D4140408033E98617E23F60C0D2C4979D41406F0C2414BC15E23FF0F0498F939D41402C4A78EB2715E23F
110	0.022	WRG/MNE/MNE/E/114	69	4243	0	069_110	0	0103000020E610000001000000050000000AAA485EFD9D4140D610B2468A28E23FDE2A6D3CF79D41403C94770B7C2AE23FEDFD618BF89D4140C0351B3ABE2AE23F13DE3E42FF9D4140ECC749B1D528E23F0AAA485EFD9D4140D610B2468A28E23F
111	0.022	WRG/MNE/MNE/E/113	69	4242	0	069_111	0	0103000020E61000000100000005000000E7F7DD6FFB9D41404B83B5184428E23F8D1295CDF59D41400ECA4ADF3B2AE23FA300303EF79D4140308E8B647C2AE23FEE612751FD9D414007A77C708E28E23FE7F7DD6FFB9D41404B83B5184428E23F
113	0.034	WRG/MNE/MNE/E/112	69	4244	0	069_113	0	0103000020E61000000100000005000000E04A8BBCF59D4140757824937727E23FCA48CB91F09D41402669BA384B29E23F25D79007F39D4140FD1CB308BD29E23FB0683BB6F89D41408C8D9E1AE527E23FE04A8BBCF59D4140757824937727E23F
115	0.032	WRG/MNE/MNE/E/110	69	4176	0	069_115	0	0103000020E610000001000000050000002EE03B38F19D414024AFA920CB26E23F16B1523DEC9D4140D255B9C6A028E23FF1546B20EF9D4140D10759F50D29E23F177791D0F39D4140764A3A922D27E23F2EE03B38F19D414024AFA920CB26E23F
117	0.07	WRG/MNE/MNE/E/116	69	4191	0	069_117	0	0103000020E61000000100000007000000975FAC54FF9D414092187B74D028E23FEDFD618BF89D4140C0351B3ABE2AE23F1F522598FC9D414013DFE2C6862BE23F550EE7FEFD9D41401CB091B57C2BE23F6D0D1AE2029E41409073D27F2D2AE23FC4D4345A029E4140206CD3C14429E23F975FAC54FF9D414092187B74D028E23F
118	0.027	WRG/MNE/MNE/E/108	69	4169	0	069_118	0	0103000020E61000000100000005000000B2AF984CEC9D41406C86D9931526E23F60298683E79D4140AD27AC3DF127E23FF94CA0D3E99D4140C945A6F34328E23F3DFBB39CEE9D414038A1544C6B26E23FB2AF984CEC9D41406C86D9931526E23F
120	0.038	WRG/MNE/MNE/E/106	69	4160	0	069_120	0	0103000020E61000000100000005000000590DC4FDE59D4140500EDE7C2F25E23F31575E9AE19D41403EA4A9301A27E23F1C00B0DFE49D4140E2DF87FE9027E23FA2B7193DE99D4140386D6348A325E23F590DC4FDE59D4140500EDE7C2F25E23F
122	0.031	WRG/MNE/MNE/E/104	69	4152	0	069_122	0	0103000020E61000000100000005000000D0277443E09D41402BD089B05A24E23FA7BD18D4DB9D414011936E244526E23F0140189BDE9D4140ABD49F75A426E23FD9DE51DFE29D4140F81D2571BC24E23FD0277443E09D41402BD089B05A24E23F
124	0.021	WRG/MNE/MNE/E/102	69	4149	0	069_124	0	0103000020E610000001000000050000007C1C8981DC9D4140B89B0158D323E23F68D0E761D89D414042AAE9C9BD25E23F1E3EB642DA9D4140D5EFE5F50126E23FCDAF045BDE9D41404CEC6AC31524E23F7C1C8981DC9D4140B89B0158D323E23F
126	0.037	WRG/MNE/MNE/E/100	69	4140	0	069_126	0	0103000020E610000001000000050000001D4E4849D69D41402D77C1A4E522E23F5AE1AA29D29D41405F66021FDA24E23F1EDD6C4ED59D41405366C8FF4C25E23F5B229D67D99D4140494E7F765A23E23F1D4E4849D69D41402D77C1A4E522E23F
127	0.038	WRG/MNE/MNE/E/099	69	4136	0	069_127	0	0103000020E61000000100000005000000AE31F208D39D41407E3485966E22E23FD1B655E9CE9D41403910DD926524E23F080C892DD29D4140C9B98F49D824E23F667BED47D69D41406D203049E622E23FAE31F208D39D41407E3485966E22E23F
129	0.022	WRG/MNE/MNE/E/097	69	4129	0	069_129	0	0103000020E6100000010000000700000091722A1ACF9D414018DFBE36DD21E23F914847E0CD9D41402DE06D53F621E23F58861338CA9D4140D3A3D06A7723E23FB836F182CA9D4140CAA49D6AC623E23FD15F0FEFCB9D4140257759C6F323E23FFF305B18D09D4140105FB6100422E23F91722A1ACF9D414018DFBE36DD21E23F
131	0.04	WRG/MNE/MNE/E/095	69	4120	0	069_131	0	0103000020E610000001000000050000001B42057AC69D41403757EDE09920E23F648B7B46C29D4140A002EAA09422E23F2675AE9FC59D4140A6C5455A0D23E23F6B0749D3C99D4140CB56DBB51921E23F1B42057AC69D41403757EDE09920E23F
132	0.036	WRG/MNE/MNE/E/094	69	4117	0	069_132	0	0103000020E61000000100000005000000239C7F70C39D4140917257122420E23FFF5CE750BF9D4140D00B17582622E23F648B7B46C29D4140A002EAA09422E23FF3474E75C69D4140D8179B199C20E23F239C7F70C39D4140917257122420E23F
196	0.037	WRG/MNE/MNE/G/048	69	4165	0	069_196	0	0103000020E61000000100000005000000B14CE467C09D4140D8CF9ED29525E23FF4E9A4C1BA9D41403CFD96A79E27E23FE40130B3BD9D41404F21CFD5EC27E23F3C666D71C39D41407D2B46281426E23FB14CE467C09D4140D8CF9ED29525E23F
136	0.037	WRG/MNE/MNE/E/090	69	4107	0	069_136	0	0103000020E610000001000000050000009CCE2965B69D41409862FDCC381EE23FFBDC8459B29D4140FBB7AF9C4720E23FDCC50F27B59D4140FDED2017AF20E23FFB0506A8B99D4140549570B3B41EE23F9CCE2965B69D41409862FDCC381EE23F
138	0.028	WRG/MNE/MNE/E/088	69	4103	0	069_138	0	0103000020E61000000100000005000000A6465980B29D4140B965E96CA71DE23FEEBB40CBAD9D414021FD2830A21FE23F81FB4C2BB09D4140E391CDE5F41FE23FD93455C7B49D414030F2CA54FC1DE23FA6465980B29D4140B965E96CA71DE23F
139	0.048	WRG/MNE/MNE/E/085	69	40971	0	069_139	0	0103000020E6100000010000000500000044319A02A69D4140661B8BCBEB1BE23FEF377B51A19D41403912DF88DF1DE23FB6EE3550A59D4140BD54FDE9721EE23F7D0E65E9A99D414039294123731CE23F44319A02A69D4140661B8BCBEB1BE23F
141	0.045	WRG/MNE/MNE/E/087	69	4101	0	069_141	0	0103000020E610000001000000050000007BDF32D0AD9D414068C13601021DE23F99062E59A99D414051CE3EE0051FE23F16FDF0F3AC9D41405EA1AC1B831FE23F3178F1C2B19D4140DF15DCD4841DE23F7BDF32D0AD9D414068C13601021DE23F
143	0.034	WRG/MNE/MNE/E/062	69	4203	0	069_143	0	0103000020E610000001000000060000006B1BF8D3F19D4140A56FE0D4562BE23F8C48F4DDEF9D41401DC3D670032CE23F981CF018F69D41400A3AAD35202DE23F5D322917F89D41405D453A180C2DE23FE638C878F99D41403882ADE0AA2CE23F6B1BF8D3F19D4140A56FE0D4562BE23F
145	0.022	WRG/MNE/MNE/E/065	69	4190	0	069_145	0	0103000020E610000001000000050000001D939D25EF9D41402D70376D9129E23FB679D519EB9D4140132CF8F0442BE23F43D063E3EC9D4140577FFA1D8C2BE23F64ECCC6BF19D41404674B1BD032AE23F1D939D25EF9D41402D70376D9129E23F
146	0.028	WRG/MNE/MNE/E/084	69	4119	0	069_146	0	0103000020E61000000100000005000000A16F7A76B39D4140E89845C1F420E23FBD240C1AB09D41403771B2278A22E23FB77DD3CFB29D4140ECD71D68EC22E23FF948EA9BB69D4140C6C197147121E23FA16F7A76B39D4140E89845C1F420E23F
148	0.034	WRG/MNE/MNE/E/082	69	4127	0	069_148	0	0103000020E610000001000000050000009E5C9BE0B99D4140F453E395DE21E23FA8FD4DF8B59D41409A177F865823E23F0AFE33AAB99D41403B89D107E123E23F2EBF3C86BD9D41408E42E7B36522E23F9E5C9BE0B99D4140F453E395DE21E23F
150	0.031	WRG/MNE/MNE/E/080	69	4139	0	069_150	0	0103000020E610000001000000050000007BB66AFBC09D41407BAF8E0DEC22E23F19E16D3ABD9D41409F6D5A046724E23F586D7FA2C09D414069B597B1E224E23F169C9D64C49D4140654DD45B6423E23F7BB66AFBC09D41407BAF8E0DEC22E23F
151	0.027	WRG/MNE/MNE/E/079	69	4234	0	069_151	0	0103000020E61000000100000007000000169C9D64C49D4140654DD45B6423E23F1377AEA1C09D4140E427F593E224E23F7EFEADDAC29D4140BC75F3E63325E23FEDAA8523C49D4140E55039CD1E25E23F6C0BB6D8C69D4140AC417D4F0224E23FC351DF84C69D414072E0080EB123E23F169C9D64C49D4140654DD45B6423E23F
154	0.031	WRG/MNE/MNE/E/068	69	4181	0	069_154	0	0103000020E610000001000000050000005345146AE59D4140CA6055D32628E23FAEE71590E19D414014D0C1BFBF29E23FD1739F94E49D414007A75B4D342AE23F858666AFE89D414044A771229F28E23F5345146AE59D4140CA6055D32628E23F
155	0.025	WRG/MNE/MNE/E/069	69	4178	0	069_155	0	0103000020E6100000010000000500000054FB47BAE29D41405E493D13C527E23F3A1E1517DF9D4140254AEAB45229E23F65691B97E19D414078CE45D6BC29E23F8AF32861E59D41408DD04C862A28E23F54FB47BAE29D41405E493D13C527E23F
157	0.028	WRG/MNE/MNE/E/071	69	4249	0	069_157	0	0103000020E610000001000000050000008A64C307DC9D414019E0BCEFCC26E23FABADEC26D99D414088661CDA6A28E23FE25D7CD9DB9D414092E6F88BCF28E23F5DCF886FDF9D41401F28BFF34C27E23F8A64C307DC9D414019E0BCEFCC26E23F
159	0.028	WRG/MNE/MNE/E/073	69	4162	0	069_159	0	0103000020E61000000100000005000000C041108CD59D414062B7F88DD825E23F40344F8DD29D41403672B82F6B27E23F9C90DE83D59D4140ED4F52FADD27E23F1210919AD89D41408DAA591B4D26E23FC041108CD59D414062B7F88DD825E23F
161	0.029	WRG/MNE/MNE/E/076	69	4155	0	069_161	0	0103000020E61000000100000005000000B5D9482ECF9D41408B07F237F324E23FA032981BCC9D414066BF1D588326E23F9F981A53CF9D41400E6F4688F826E23FDC76BE46D29D4140B186DF7F6125E23FB5D9482ECF9D41408B07F237F324E23F
162	0.014	WRG/MNE/MNE/E/077	69	4505	0	069_162	0	0103000020E6100000010000000500000060EF69CCCD9D414002A80195BE24E23F62E9F173CA9D414002868A6D4326E23F7D358920CC9D41403907B5D48026E23FB5D9482ECF9D41408B07F237F324E23F60EF69CCCD9D414002A80195BE24E23F
163	0.029	WRG/MNE/MNE/E/078	69	4150	0	069_163	0	0103000020E61000000100000005000000A8D1F3B3CA9D414039A4070C4F24E23F23408A47C79D414098D6CF5ECC25E23FB622C476CA9D4140D5D2A4254226E23F60EF69CCCD9D414002A80195BE24E23FA8D1F3B3CA9D414039A4070C4F24E23F
165	0.066	WRG/MNE/MNE/F/001	69	4229	0	069_165	0	0103000020E61000000100000005000000A9C26400CD9D41404C3E9F386E35E23F44D53519C89D414012164970BF36E23F6531B8E4CD9D4140B83DCB833738E23F534F3678D29D4140ED47BC5AF536E23FA9C26400CD9D41404C3E9F386E35E23F
166	0.043	WRG/MNE/MNE/F/002	69	4228	0	069_166	0	0103000020E610000001000000050000001BF57FF1CF9D41403257A17BA134E23FA9C26400CD9D41404C3E9F386E35E23F534F3678D29D4140ED47BC5AF536E23F6F6EEED4D59D4140469109911C36E23F1BF57FF1CF9D41403257A17BA134E23F
168	0.043	WRG/MNE/MNE/F/004	69	4226	0	069_168	0	0103000020E61000000100000005000000D9F4B3D3D59D4140C827A9FC0133E23FDCD949EFD29D41404F6B6FBFD733E23F81851EAED89D41408F61A6D44F35E23F186FF8E6DB9D4140A2E8DD107D34E23FD9F4B3D3D59D4140C827A9FC0133E23F
170	0.042	WRG/MNE/MNE/F/006	69	4224	0	069_170	0	0103000020E61000000100000005000000A03E792DDC9D4140B52F366E5331E23F7F433C60D99D41402F3C47251A32E23FF824F4FBDE9D414078F1FD52B033E23F113BF210E29D4140BA1F209AE932E23FA03E792DDC9D4140B52F366E5331E23F
173	0.019	WRG/MNE/MNE/F/009	69	4221	0	069_173	0	0103000020E6100000010000000700000033077C66E59D4140FDD5784A072FE23FE1291CBFE49D41407003036B292FE23F310A4DAFE49D41409C81C7B4812FE23F1EE713ECE89D4140F9C0679FBC30E23FB9EE0523EA9D414076029E9CC230E23F445AF339EB9D41400ADA43567630E23F33077C66E59D4140FDD5784A072FE23F
175	0.018	WRG/MNE/MNE/F/010	69	4217	0	069_175	0	0103000020E610000001000000050000006C9F2AC4E79D4140310B92B7682EE23F8B357F65E69D414041286306BD2EE23FEC571E18ED9D41401E703CE1F72FE23F03F1C876EE9D4140A174C090A12FE23F6C9F2AC4E79D4140310B92B7682EE23F
177	0.019	WRG/MNE/MNE/F/012	69	4213	0	069_177	0	0103000020E61000000100000005000000C5059468EB9D4140A827C9CA672DE23F29CDE411EA9D4140B1CB1120C42DE23F09054FFCF09D4140F8302FF1F42EE23F77A1FC52F29D4140F5FE9098942EE23FC5059468EB9D4140A827C9CA672DE23F
179	0.052	WRG/MNE/MNE/G/026	69	4241	0	069_179	0	0103000020E6100000010000000500000055C4518CA59D414041D2EF91E227E23F813229F5A09D414093BB6269F629E23F15302F94A49D41406ADF7ABA732AE23F8CBA6356AA9D4140AA1C19018D28E23F55C4518CA59D414041D2EF91E227E23F
180	0.051	WRG/MNE/MNE/G/025	69	4298	0	069_180	0	0103000020E610000001000000050000002A44C14EAA9D4140574269F18B28E23F3396738CA49D41408CAFDFAE722AE23FFDDC8304A99D414027C2D812002BE23FEE9F0D63AE9D41400060CA571429E23F2A44C14EAA9D4140574269F18B28E23F
182	0.048	WRG/MNE/MNE/G/023	69	4239	0	069_182	0	0103000020E610000001000000050000002F5DF91FB29D414043EB20A89129E23F7DB894BFAC9D4140670EF37D792BE23F3F9C17CEB09D41409F09AFB5FF2BE23F4473BA0EB69D41401DB24C79112AE23F2F5DF91FB29D414043EB20A89129E23F
184	0.053	WRG/MNE/MNE/G/021	69	4201	0	069_184	0	0103000020E610000001000000050000005A75EECAB99D414066C5A2749A2AE23FF0265CDDB49D4140C0692256832CE23FF1A8095FB99D41402C889CEE1F2DE23FFCAA013CBE9D41405B8C8FB02C2BE23F5A75EECAB99D414066C5A2749A2AE23F
186	0.033	WRG/MNE/MNE/G/019	69	4208	0	069_186	0	0103000020E6100000010000000500000061A6F02DC39D4140029DAB1ED72BE23FF87450AEBC9D414067903CB7902DE23F9A92E899BF9D4140D97FD775F22DE23F444CD4BFC59D4140DC634459312CE23F61A6F02DC39D4140029DAB1ED72BE23F
187	0.066	WRG/MNE/MNE/G/018	69	4210	0	069_187	0	0103000020E61000000100000005000000444CD4BFC59D4140DC634459312CE23F9A92E899BF9D4140D97FD775F22DE23F4AB93849C59D41407FD0C86DAE2EE23FEDCF365BCB9D41402B33CCD3EF2CE23F444CD4BFC59D4140DC634459312CE23F
189	0.043	WRG/MNE/MNE/G/016	69	4218	0	069_189	0	0103000020E61000000100000005000000834DB14CD39D4140312D648A082EE23F88D09F7CCD9D4140B2A54DFCBC2FE23FC44B376FD19D4140C125BCF34630E23F6D92CBD7D69D4140A70D2B628D2EE23F834DB14CD39D4140312D648A082EE23F
191	0.031	WRG/MNE/MNE/G/014	69	4220	0	069_191	0	0103000020E610000001000000070000001198E76FDB9D41403831EAED4B2FE23F0539BEA3D59D4140A8005849CE30E23FC7DD1BA0D79D414054ECE4F41131E23F599C3BBAD99D4140782AA754FB30E23FD03C8094DD9D414099B42B7C1430E23F550A6880DD9D4140D8D11F25AB2FE23F1198E76FDB9D41403831EAED4B2FE23F
193	0.062	WRG/MNE/MNE/G/045	69	4153	0	069_193	0	0103000020E61000000100000005000000EBF966D1B49D41401624EFC5F923E23F615F51DCAD9D4140F8224AAD0E26E23F3F52DB3EB39D4140565E3CFEB226E23F263B30BEB89D41400459F1248A24E23FEBF966D1B49D41401624EFC5F923E23F
194	0.049	WRG/MNE/MNE/G/046	69	4157	0	069_194	0	0103000020E61000000100000005000000C1E045B4B89D414045B3D5BA8924E23F7284114CB39D414031F2D9ABAC26E23FBABB22D9B69D414076E537F41E27E23F327939AFBC9D41400B038D201925E23FC1E045B4B89D414045B3D5BA8924E23F
13	0.027	WRG/MNE/MNE/D/118	69	4148	0	069_013	0	0103000020E610000001000000070000000BC8E7EE149E4140D66EF9502A24E23F8097F3F50F9E4140FEB9E3E2E725E23F05210B15119E4140390EB8031826E23F901EBB8D129E41409577CBED0826E23FA3945B03179E41406AF130D7DB24E23FC87571BB169E4140BFE2B8027424E23F0BC8E7EE149E4140D66EF9502A24E23F
65	0.036	WRG/MNE/MNE/B/188	69	4057	0	069_065	0	0103000020E61000000100000009000000D2B89939E69D41406870CBF61D12E23F3413001CE49D414033862DECCE11E23F7306A14FE29D4140EC7E6694F111E23F9253E92EDF9D414015B5FDCC5113E23FF6A9CA88DF9D4140DD5F0FB0CB13E23F56E8AAE9E09D414046AB4CD40114E23FF73CA407E19D41405F67D37C3314E23FBE3BC836E69D41402A2B16181F12E23FD2B89939E69D41406870CBF61D12E23F
73	0.044	WRG/MNE/MNE/B/174	69	4061	0	069_073	0	0103000020E6100000010000000500000094634A55D39D4140BB8800B24C14E23F72A8A043D19D41403A53FDBB2715E23FCFDBF27AD99D41402158F39E7716E23FD354D18ADB9D41403A3DB3E2A415E23F94634A55D39D4140BB8800B24C14E23F
75	0.035	WRG/MNE/MNE/B/172	69	4067	0	069_075	0	0103000020E61000000100000006000000AAB425D3CF9D4140C4D7D6D0CF15E23F59803BCDCD9D4140A85F99069B16E23F8FADFE5AD59D414029F3BAA29017E23FC9DC4C39D79D41400B928BF76A17E23FEA3544FBD79D4140362971182517E23FAAB425D3CF9D4140C4D7D6D0CF15E23F
84	0.042	WRG/MNE/MNE/B/160	69	4086	0	069_084	0	0103000020E610000001000000050000002FD4D564CC9D4140E0D7BE07BF19E23FF2C740A9C79D4140C4262C7EC01BE23FD5D39708CB9D41405C239C553A1CE23F5AD302E4CF9D41400ED6E61C471AE23F2FD4D564CC9D4140E0D7BE07BF19E23F
134	0.037	WRG/MNE/MNE/E/092	69	4111	0	069_134	0	0103000020E61000000100000006000000A6D2E0DBBC9D4140E7D2F6ED2B1FE23F835E04D7B79D4140A0B5569E0D21E23F3B0C8CE0BA9D414090BF19718821E23F88BA5FEFBF9D4140BD0A7BC0A61FE23F7C0A25F6BF9D414025A09BB2A71FE23FA6D2E0DBBC9D4140E7D2F6ED2B1FE23F
172	0.048	WRG/MNE/MNE/F/008	69	4222	0	069_172	0	0103000020E61000000100000007000000218A58A6E39D41406F079F05DB2FE23FF21E646FE29D414010886703CF2FE23F02237C42DF9D414080A45BBF9830E23F6F5930DEE49D41409C6690E52532E23F2FFD63B7E79D4140E949B5306231E23F4E0845B7E79D41406CB4ADEF1331E23F218A58A6E39D41406F079F05DB2FE23F
198	0.019	WRG/MNE/MNE/G/030	69	4209	0	069_198	0	0103000020E61000000100000005000000CC09E994DA9D4140E3A3B842032DE23F7C11352DD79D4140C03C6481CE2DE23F543E63CCDA9D4140FC003AA25E2EE23F236BEC39DD9D41405B128BE2D72DE23FCC09E994DA9D4140E3A3B842032DE23F
200	0.06	WRG/MNE/MNE/G/033	69	4202	0	069_200	0	0103000020E610000001000000050000006DFA703DD39D414094A729CFBE2AE23F98567026CD9D4140291EA6DA6B2CE23F0801A202D39D41401FC238643E2DE23FAF059FADD79D414054B81A25242CE23F6DFA703DD39D414094A729CFBE2AE23F
202	0.045	WRG/MNE/MNE/G/036	69	4192	0	069_202	0	0103000020E61000000100000005000000DE85FE4BCB9D4140E4DC3529BA29E23F01C70921C59D4140980CBC69592BE23F3BBCA146C99D4140921719C8EA2BE23F5E50D521CF9D41407350FAFA392AE23FDE85FE4BCB9D4140E4DC3529BA29E23F
203	0.046	WRG/MNE/MNE/G/037	69	4188	0	069_203	0	0103000020E6100000010000000500000051D66F1CC79D4140BDD9200C2A29E23F6D414732C19D4140B97275D5D52AE23FA581F223C59D4140C68BE0A5582BE23FDE85FE4BCB9D4140E4DC3529BA29E23F51D66F1CC79D4140BDD9200C2A29E23F
205	0.047	WRG/MNE/MNE/G/039	69	4182	0	069_205	0	0103000020E61000000100000005000000E935966FBE9D414050ED41130928E23F62A3CA46B99D41402B0C5025C529E23F9EFAA21BBD9D4140FAC15F78462AE23FDD37670FC39D4140460E61FBA028E23FE935966FBE9D414050ED41130928E23F
207	0.043	WRG/MNE/MNE/G/041	69	4174	0	069_207	0	0103000020E610000001000000050000006600C293B69D4140EB4C42251527E23F3FFE4C5BB19D4140B58C0DF3B128E23F22DEC839B59D4140309300853629E23FF4E9A4C1BA9D41403CFD96A79E27E23F6600C293B69D4140EB4C42251527E23F
209	0.045	WRG/MNE/MNE/G/043	69	4166	0	069_209	0	0103000020E6100000010000000500000035D93AE2AD9D41407E94B0610F26E23F3C2B2DFFA89D41402BB991B99227E23F211E56ABAD9D41402D89CD223528E23F38B3264AB29D41406FF840D39526E23F35D93AE2AD9D41407E94B0610F26E23F
210	0.016	WRG/MNE/MNE/G/028	69	4504	0	069_210	0	0103000020E61000000100000006000000826A7F67E49D414066CC1F2A7E2DE23F66FE6663E09D414092DF7913782EE23F85113AF4E19D414096127F72F62EE23FF03A7FC2E59D4140480D7D85F62DE23FFD19829EE59D4140BFCD5B4AAE2DE23F826A7F67E49D414066CC1F2A7E2DE23F
212	0.017	WRG/MNE/MNE/G/031	69	4205	0	069_212	0	0103000020E61000000100000007000000F5D2414DDD9D414062390060542CE23F3A86542DDB9D414051FA6D5FDD2CE23F0D8650D7DD9D4140489BFD86AB2DE23FABE09B83E09D41405444231F022DE23F62D537DFDF9D414077D95841DD2CE23FECEF1CF7DF9D4140A7F63D34CE2CE23FF5D2414DDD9D414062390060542CE23F
214	0.045	WRG/MNE/MNE/G/061	69	4206	0	069_214	0	0103000020E610000001000000070000008FF1333AE79D4140967CF95E6B2BE23FEF730249E29D41406ED005FF9F2CE23F40834CD7E69D414055F6E777542DE23FB91D2425E89D4140D7F535674A2DE23FD2A11147EB9D414030F90163762CE23FEC67190BEB9D4140FAB8B686052CE23F8FF1333AE79D4140967CF95E6B2BE23F
215	0.032	WRG/MNE/MNE/G/060	69	4200	0	069_215	0	0103000020E610000001000000080000004DFAD3FFE39D4140E0260EC7E82AE23F2FD5D350DE9D41400488CEC0822CE23FECEF1CF7DF9D4140A7F63D34CE2CE23FB8FF88E5DF9D41403BCAB546D92CE23FE842B173E19D4140ECD223AB812CE23FEF730249E29D41406ED005FF9F2CE23F8FF1333AE79D4140967CF95E6B2BE23F4DFAD3FFE39D4140E0260EC7E82AE23F
217	0.029	WRG/MNE/MNE/G/058	69	4195	0	069_217	0	0103000020E610000001000000050000003AEBE5FEDE9D4140136D4DFF1E2AE23F5CF0A8C6D99D414049C9C1D89A2BE23F061C7253DC9D4140EB34C406212CE23F57E8AC9BE19D41402CF7D840882AE23F3AEBE5FEDE9D4140136D4DFF1E2AE23F
219	0.022	WRG/MNE/MNE/G/056	69	4189	0	069_219	0	0103000020E610000001000000050000006334F837DB9D4140821055188629E23FA89376B1D59D414057BCF7DA2C2BE23FB9278CE6D69D4140DABD525F882BE23FD3273E57DD9D4140523B9E51DB29E23F6334F837DB9D4140821055188629E23F
221	0.029	WRG/MNE/MNE/G/054	69	4236	0	069_221	0	0103000020E610000001000000050000006AB4DF33D59D414078F8E47A9A28E23F01950DF3CF9D4140699A2353102AE23F9D68BBC5D29D414052D45D12722AE23F611C7E1FD89D4140DBB50C870C29E23F6AB4DF33D59D414078F8E47A9A28E23F
223	0.04	WRG/MNE/MNE/G/052	69	4180	0	069_223	0	0103000020E61000000100000005000000F283884ACE9D4140DB7A88139C27E23FA207ED07CA9D414051873FD24729E23F0C1BEAB0CD9D414097590E23C529E23FAD841973D29D414087FDBBA13528E23FF283884ACE9D4140DB7A88139C27E23F
224	0.042	WRG/MNE/MNE/G/051	69	4175	0	069_224	0	0103000020E610000001000000050000000A6CB865CA9D4140660593F40B27E23FA9F35CDDC59D4140F1AD4A3BBF28E23FA207ED07CA9D414051873FD24729E23FF283884ACE9D4140DB7A88139C27E23F0A6CB865CA9D4140660593F40B27E23F
226	0.029	WRG/MNE/MNE/G/049	69	4170	0	069_226	0	0103000020E610000001000000050000001892AB57C49D41400CD596DD2726E23FBAC5E620BF9D41408C7C8024D627E23F76507E0CC29D414041F515A23628E23FF40A14C9C69D414015A983068326E23F1892AB57C49D41400CD596DD2726E23F
\.


--
-- Data for Name: path; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.path (id, width, settlement_id, geom) FROM stdin;
\.


--
-- Data for Name: piped_water; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.piped_water (id, name, settlement_id, no_connections, no_persons_served, cost_per_cubic, owner, ownership, geom) FROM stdin;
\.


--
-- Data for Name: public_facility; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.public_facility (id, name, facility_type, settlement_id, owner, ownership, geom) FROM stdin;
\.


--
-- Data for Name: railway; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.railway (id, width, settlement_id, geom) FROM stdin;
\.


--
-- Data for Name: river; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.river (id, name, settlement_id, status, geom) FROM stdin;
\.


--
-- Data for Name: road; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.road (id, width, settlement_id, geom) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name) FROM stdin;
1	admin
2	moderator
3	editor
4	user
5	county_admin
6	county_mon
7	county_staff
8	settlement_sec
9	senior_staff
10	sud_staff
11	kisip_staff
12	consultant
13	partner_staff
14	public
15	guest
\.


--
-- Data for Name: sanitation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sanitation (id, name, facility_type, settlement_id, cost_per_use, owner, ownership, geom) FROM stdin;
\.


--
-- Data for Name: security_actor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.security_actor (id, name, settlement_id, type, number_officers, number_vehicle, geom) FROM stdin;
\.


--
-- Data for Name: settlement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settlement (id, name, county_id, settlement_type, area, population, code, geom) FROM stdin;
2	Kahawa Soweto	47	1	8.99	4045	Nairobi_2	\N
3	Kambi Moto	47	1	0.43	698	Nairobi_3	\N
4	Mathare fire victims	47	1	0.78	1950	Nairobi_4	\N
5	Ex-Grogon	47	1	0.41	430	Nairobi_5	\N
6	Mji wa Huruma	47	1	2.78	1500	Nairobi_6	\N
7	Redeemed	47	1	0.47	907	Nairobi_7	\N
13	Chaani	1	1	10.82	3729	Mombasa_6	\N
14	Likoni 203	1	1	27.55	7058	Mombasa_7	\N
15	Kibikoni M17E	3	1	22.26	1364	Kilifi_1	\N
16	Muyeye I	3	1	26	5000	Kilifi_2	\N
17	Kwa Ndomo	3	1	2.5	1500	Kilifi_3	\N
19	Jiwe Leupe	3	1	12.6	1089	Kilifi_5	\N
20	Makaburini	3	1	6.68	4508	Kilifi_6	\N
21	Njoro ya Chini	3	1	7.8	1800	Kilifi_7	\N
22	Shingila	3	1	7	545	Kilifi_8	\N
23	Jacaba	3	1	11.51	3640	Kilifi_9	\N
24	Njoro Takatifu	3	1	25.24	1350	Kilifi_10	\N
25	Dingwini	3	1	3.34	518	Kilifi_11	\N
26	Tabora	3	1	5.88	2408	Kilifi_12	\N
27	Muyeye II	3	1	106.54	14250	Kilifi_13	\N
29	Namu Phase 2	7	1	158.5	4928	Garissa_2	\N
31	Bulla Riig Phase 2	7	1	351.42	13343	Garissa_4	\N
33	Iskadek Phase 2	7	1	203.41	4432	Garissa_6	\N
35	Makhanu Phase 2	7	1	267.73	7648	Garissa_8	\N
37	County Phase 2	7	1	56.31	2517	Garissa_10	\N
39	Kathita	14	1	5	1000	Embu_1	\N
40	Kimangaru	14	1	16.97	398	Embu_2	\N
41	Gatitu	19	1	19.9	1015	Nyeri_1	\N
42	Kihatha	19	1	21.3	250	Nyeri_2	\N
43	Kihuyo	19	1	12.8	220	Nyeri_3	\N
44	Riamukurwe	19	1	12.5	480	Nyeri_4	\N
45	Ithenguri	19	1	6.3	55	Nyeri_5	\N
51	Gikomo/Kiawara	19	1	21.89	911	Nyeri_11	\N
59	Muruguru	19	1	18.2	60	Nyeri_19	\N
60	Umoja	22	1	4.83	1752	Kiambu_1	\N
66	Kong’asis	32	1	21.6	1440	Nakuru_6	\N
67	Crater Lake	32	1	9.48	848	Nakuru_7	\N
68	Hill school	27	1	16.19	4000	Uasin Gishu_1	\N
69	Maili Nne	27	1	9.99	1283	Uasin Gishu_2	\N
81	Amalemba	37	1	3.5	2500	Kakamega_3	\N
83	A thousand street	43	1	4.03	2727	Homa Bay_43	\N
84	Aramaget	24	1	10.5	626	West Pokot_24	\N
85	Aseko/Mlekenyi	6	1	15.18	3070	Taita Taveta_6	\N
86	Awelo	41	1	30	1179	Siaya_41	\N
87	Bandani	42	1	15	9534	Kisumu_42	\N
88	Barwaqo	8	1	29	2242	Wajir_8	\N
89	Bayamangozi	3	1	25.5	0	Kilifi_3	\N
90	Bondeni	30	1	50	500	Baringo_30	\N
91	Bondeni 	32	1	2	0	Nakuru_32	\N
92	Bora Imani	4	1	12	2124	Tana River_4	\N
93	Bura	4	1	27	1726	Tana River_4	\N
94	Canaani	16	1	29	3243	Machakos_16	\N
95	Carlifornia-Lodwar Municipality	23	1	8.2	1769	Turkana_23	\N
96	Chebiemit	28	1	10	323	Elgeyo-Marakwet_28	\N
97	Chelanga	1	1	2.124	3804	Mombasa_1	\N
98	Cheptongei	28	1	11.5	874	Elgeyo-Marakwet_28	\N
99	Chewani	4	1	7	1296	Tana River_4	\N
100	Dagorretti-Ruthimitu	22	1	1.2	361	Kiambu_22	\N
101	Diani Complex	2	1	2.01	2201	Kwale _2	\N
102	Embakasi KCC	47	1	13.2	9616	Nairobi_47	\N
47	Gitero	19	1	6.56	216	Nyeri_7	0103000020E61000000100000005000000825ABFBDCB774240603D318483D8DCBF0A39DC84C6774240E5721F52FEBADCBFF2E4551C387842403F7AE85932C0DCBF950C747E39784240D6F85A509ED6DCBF825ABFBDCB774240603D318483D8DCBF
79	Kambi Somali	37	1	3.4	395	Kakamega_1	0103000020E6100000010000000B00000061F38293855F414045CB9EEFA60CD23F6FC2E777845F4140258DAEE2E70CD23FCA9B79DE715F41405ABF0B14F120D23F3D138334725F4140E2E02BEC8521D23FAB729B728F5F414054F07C3FEE28D23F157C816B915F4140A2D327086E29D23F8D0E28859F5F41402D350270CD2AD23F9DA320ECA95F41407EDDDE051E2BD23F897030CDB75F414071CEDCE8D321D23FCFB99E62B95F41401A2B9498BB15D23F61F38293855F414045CB9EEFA60CD23F
62	Kasarani B	32	1	109.44	17881	Nakuru_2	0103000020E61000000100000008000000F338BF1F55E64140C35117DCDD14D3BFE54DD1147EE54140F0A662B18F03D3BF5B34A845A7E54140D9EE1AEBB5A5D2BF87196F8749E64140BD14EB1B58B4D2BF14C3583053E6414088C89107CBEDD2BFB67154BD56E641402CA4C3551A14D3BF3DFE83A356E641407C46A2ED4114D3BFF338BF1F55E64140C35117DCDD14D3BF
8	Kindunguni	1	1	24	2390	Mombasa_1	0103000020E610000001000000120000002051170D9DD24340482E7C3C676410C0BE6FA7837DD243407DCB0322086410C073832C92FED14340A38D42E9F86110C066ACE13EFED1434054C29E8CF26110C0F187C3B418D2434005988F84645F10C066984CD91AD2434092523D24385F10C0E8EB981E78D243403E734B44DB5D10C01DE704827BD24340BC8E0ABDE35D10C0C3AA198C7FD24340C9CD0868EF5D10C0E6CB4DFED4D24340AA193752936110C0612A6017D5D2434096F3B96C966110C06E1A0EEAC1D24340B1B830668F6210C038E8AF18C1D24340AC77F7FE996210C05B1F0E05B6D243409B830984296310C0795373BBB3D2434064F39527476310C030484086B2D24340FA37CBCD566310C0B40D07AA9DD24340D57503E9646410C02051170D9DD24340482E7C3C676410C0
34	Makhanu Phase 1	7	1	267.73	7648	Garissa_7	0103000020E610000001000000110000000CB9F061DAD4434033205F34649CDCBF94D44485CBD44340C2A0B6E1B89BDCBF2EDCA29CC8D443407B132B8B8B9ADCBFB95AB66E70D44340AC839BA55158DCBF78329E4E69D443403F9D5706CD52DCBF2453B2623BD44340DF6340F47B2DDCBF0622D3973BD44340F4425952092CDCBF57411D4A97D54340E63847720467DBBFF7E07C0F44D64340F095C8BCEB6ADBBF498D54996AD643401647ADBF4082DBBFB8DEFC2870D64340EA2B734DA186DBBF2BDFCC4478D64340865EE72D038DDBBFC9793B18A2D643409714B76C84C1DBBF888B9652A7D64340C75CBDFD84D9DBBFA0DA5DAA4FD643406C95DD758D65DCBF089685A1A5D54340D07CFE0A6980DCBF0CB9F061DAD4434033205F34649CDCBF
82	Mweiga	19	1	19	2500	Nyeri_20	0103000020E61000000100000010000000A99AC7ECD2734240A48A036C41AED4BF7436D6A9CF73424070FB4A4240AED4BFD496ABA6AB7342404125EA0676ACD4BF66B80CB72C734240E4911D0EA88BD4BF19ABAE33127342402DFEC1257F82D4BFC36E5E510E7342405DFDF9AA0781D4BF2B895F201B734240F4ABD17B6668D4BFC64E15D21E7342408BB6C8398565D4BF46A9B03B8773424026193489F450D4BFDCE7D537AA734240222FC0BD9B4AD4BF8D53A536B4734240ABA41188CB48D4BFA15E9B86E5734240F91AFE9747A2D4BF9B1485DBDC734240D64149BE66A9D4BFF7B2C1DDD7734240C9F8F08580ADD4BF9C37EF58D57342409CC54168FFADD4BFA99AC7ECD2734240A48A036C41AED4BF
55	Njoguini	19	1	11.48	90	Nyeri_15	0103000020E610000001000000090000005C006F0FAE6E42402AC2A9AD9DDFD9BF13716106796E4240A62619CA0ACAD9BF6EFCAF68936E4240726A4042DAB3D9BF7E1199E0706F4240E51DFA7CCCC3D9BFE559D27D6D6F42401812CB2042CFD9BF6F5C94EC6C6F4240BCA517690AD1D9BFE4DBB1E46C6F424013DA27FB21D1D9BF4894F7DC686F4240208E91BD2DDDD9BF5C006F0FAE6E42402AC2A9AD9DDFD9BF
71	Swahili Village	35	1	7.7	2338	Kericho_1	0103000020E6100000010000000B000000C19C670D06A34140A1C021CE3D9DD7BF9646C301C7A241404CB887C37E78D7BF783AB43AF7A2414063CEE0941F5DD7BFC3B9EA7800A34140DFCE56501C59D7BFFB24340009A341401F81831FD75CD7BF854F092930A34140F455CBFBC980D7BFA02FCF9129A34140CE651F5DBC88D7BFDB7CB8EA25A341405BA75DD3978BD7BFA0347CF51AA34140BA03772F2A94D7BF8E4DF39D17A3414038BF06A19D95D7BFC19C670D06A34140A1C021CE3D9DD7BF
103	Embakasi Village	47	1	2.28	1613	Nairobi_47	\N
104	Faza village	5	1	20	2849	Lamu_5	\N
105	Gathambi	20	1	5.91	245	Kirinyaga_20	\N
106	Gatugura (Gatundura)	20	1	7.85	333	Kirinyaga_20	\N
107	Getuya	20	1	2.25	231	Kirinyaga_20	\N
108	Gichagi	34	1	4.05	4541	Kajiado_34	\N
109	Githogondo	20	1	7.61	1047	Kirinyaga_20	\N
110	Halane	8	1	30	5509	Wajir_8	\N
111	Hodhan	8	1	24	867	Wajir_8	\N
112	Hodi Hodi	1	1	8.548	500	Mombasa_1	\N
113	Hola Mission	4	1	11	1511	Tana River_4	\N
114	Huruma - Ol Kalou	18	1	30	923	Nyandarua_18	\N
115	Ithareini	20	1	9.22	538	Kirinyaga_20	\N
116	Jam City	16	1	6	1124	Machakos_16	\N
117	Jiw Dendi 	44	1	36.54	0	Migori_44	\N
118	Jogoo	8	1	27	3776	Wajir_8	\N
119	Jua kali	37	1	2.7	0	Kakamega_37	\N
120	Jua Kali	4	1	6	1763	Tana River_4	\N
121	Kabati 	32	1	2	0	Nakuru_32	\N
122	Kabichbich	24	1	7.53	375	West Pokot_24	\N
123	Kagumo	20	1	8.82	1245	Kirinyaga_20	\N
124	Kaitheri	20	1	2.42	396	Kirinyaga_20	\N
125	Kajuka-Lodwar Municipality	23	1	3.5	316	Turkana_23	\N
126	Kalolo	3	1	22	7105	Kilifi_3	\N
127	Kalundu Misuuni	15	1	4.42	1624	Kitui_15	\N
128	Kalundu slaughter	15	1	12.02	1800	Kitui_15	\N
129	Kambi Mawe - Lodwar Municipality	23	1	6.3	638	Turkana_23	\N
130	Kampi Wakulima	30	1	76.4	1500	Baringo_30	\N
131	Kamuiru	20	1	7.9	604	Kirinyaga_20	\N
132	Kamuthanga	20	1	2.8	979	Kirinyaga_20	\N
133	Kanjeru	22	1	1.6	562	Kiambu_22	\N
134	Kapcherop	28	1	9.6	549	Elgeyo-Marakwet_28	\N
135	Kapsowar 	28	1	8.8	935	Elgeyo-Marakwet_28	\N
136	Karagita	32	1	30	20255	Nakuru_32	\N
137	Kathwana	13	1	8	265	Tharaka-Nithi_13	\N
138	Katorongoto	30	1	36	1700	Baringo_30	\N
139	Kayole Soweto	47	1	30	68805	Nairobi_47	\N
140	Keroka Block -B	46	1	6.2	678	Nyamira_46	\N
141	Kiamburi	22	1	2.57	1023	Kiambu_22	\N
142	Kiandutu	22	1	40	20000	Kiambu_22	\N
143	Kiangoma	20	1	7.77	561	Kirinyaga_20	\N
144	Kiangombe	22	1	3.5	1000	Kiambu _22	\N
145	Kiangombe	20	1	7.73	223	Kirinyaga_20	\N
146	Kianjiru	20	1	2.78	359	Kirinyaga_20	\N
147	Kiarukungu	20	1	2.47	926	Kirinyaga_20	\N
148	Kiawara	19	1	6	6011	Nyeri_19	\N
149	Kibaoni	3	1	8.6	0	Kilifi_3	\N
150	Kibirigwi	20	1	8.25	630	Kirinyaga_20	\N
151	Kibokoni M17E	3	1	22.3	1077	Kilifi_3	\N
152	Kibuye	42	1	15	606	Kisumu_42	\N
153	Kibuyu	4	1	13	1799	Tana River_4	\N
154	Kijiji Cha Chewa	6	1	3	2196	Taita Taveta_6	\N
155	Kijijini(kendu Bay Old town)	43	1	3.93	3604	Homa Bay_43	\N
156	Kilimanjaro	1	1	1.6	100	Mombasa_1	\N
157	Kimunye	20	1	7.69	994	Kirinyaga_20	\N
158	Kipkaren  Site & Service	27	1	28.2	17676	Uasin Gishu_27	\N
159	Kipsongo A	26	1	27	2098	Trans Nzoia_26	\N
160	Kisumu Ndogo	3	1	22.6	3153	Kilifi_3	\N
161	Kiunga old town	5	1	25	1468	Lamu_5	\N
162	Kwa Mangeli	16	1	3	2813	Machakos_16	\N
163	Kwa Murogi 	32	1	65.78	46004	Nakuru_32	\N
164	Kwa Nzomo	16	1	3	1042	Machakos_16	\N
165	Lake View	32	1	26.84	16016	Nakuru_32	\N
166	Landi Matope	39	1	5	761	Bungoma_39	\N
167	Landi Matope (muslim school-Webuye DEB-Rail)	39	1	5	761	Bungoma_39	\N
168	Lokichoggio Informal Settlement-Lokichoggio Town	23	1	9.48	1058	Turkana_23	\N
169	Lokori Settlement-Lokori Town	23	1	2.03	1781	Turkana_23	\N
170	London 	32	1	43.3	16083	Nakuru_32	\N
171	Lowarengak Informal Settlement-Lowarengak Centre	23	1	14.88	2355	Turkana_23	\N
172	Lukoye	37	1	10	1133	Kakamega_37	\N
173	M27	3	1	10.7	527	Kilifi_3	\N
174	Maganda	1	1	97	5000	Mombasa_1	\N
175	Maisha Matamu	39	1	1	243	Bungoma_39	\N
176	Majengo	34	1	20	1200	Kajiado_34	\N
177	Majengo	12	1	5	2410	Meru_12	\N
178	Majengo Mapya	6	1	23	1267	Taita Taveta_6	\N
179	Makaburini	4	1	11	2584	Tana River_4	\N
180	Makongeni	43	1	4.134	3970	Homa Bay_43	\N
181	Malindi ya Ngwena	4	1	10	1241	Tana River_4	\N
182	Manyatta A (Kona Mbaya and Migosi)	42	1	24	22474	Kisumu_42	\N
183	Manyatta B 	42	1	25	45150	Kisumu_42	\N
184	Marimanti	13	1	30	1532	Tharaka-Nithi_13	\N
185	Masogo kayoya	43	1	2.716	1201	Homa Bay_43	\N
186	Matharau	22	1	6.22	976	Kiambu_22	\N
187	Matisi	26	1	28	9882	Trans Nzoia_26	\N
188	Matondoni	5	1	12	2974	Lamu_5	\N
189	Mazeras Centre Miwani/Mgumo wa Pasta	3	1	25	3747	Kilifi_3	\N
190	Misongeni	17	1	16.2	1443	Makueni_17	\N
191	Misri	22	1	9.47	2500	Kiambu _22	\N
192	Mitume (Mau Mau)	26	1	20	22888	Trans Nzoia_26	\N
193	Mjini	39	1	7.52	6597	Bungoma_39	\N
194	Mjini	17	1	10.13	3103	Makueni_17	\N
195	Mjini	12	1	4.63	708	Meru_12	\N
196	Mokowe old town	5	1	20	3166	Lamu_5	\N
197	Mororo	4	1	26	6642	Tana River_4	\N
198	Mosoriot	29	1	26.53	785	Nandi_29	\N
199	Mtaani	3	1	28.4	3897	Kilifi_3	\N
200	Muhoroni (Sangoro  Swahili  Shauri Yako  Shauri Moyo & Bondeni)	42	1	20	3320	Kisumu_42	\N
201	Mukinduri	20	1	15	472	Kirinyaga_20	\N
202	Muslim village	13	1	10	329	Tharaka-Nithi_13	\N
203	Mwangaza	4	1	28	4303	Tana River_4	\N
204	Mwanzo Site & Service	27	1	5.8	22112	Uasin Gishu_27	\N
205	Nabute - Lodwar Municipality	23	1	2.6	326	Turkana_23	\N
206	Nangeni	39	1	6	464	Bungoma_39	\N
207	Ndhiwa settlement	43	1	33.8	17885	Homa Bay_43	\N
208	Ndindiruku	20	1	4.23	2317	Kirinyaga_20	\N
209	Nginoka Kim-Lokichar Town	23	1	7	1006	Turkana_23	\N
210	Nubian	30	1	53	2800	Baringo_30	\N
211	Nyamurutu	32	1	100	0	Nakuru_32	\N
212	Nyandiwa	43	1	8.04	4432	Homa Bay_43	\N
213	Nyawita	42	1	13	11564	Kisumu_42	\N
214	Public Works- Lodwar Municipality	23	1	2.4	735	Turkana_23	\N
215	Rusinga Old Town	43	1	1.825	2725	Homa Bay_43	\N
216	Rwambiti	20	1	6.982	1011	Kirinyaga_20	\N
217	Salama	12	1	3	945	Meru_12	\N
218	Shallattey	8	1	23	702	Wajir_8	\N
219	Shanti 	26	1	18	1794	Trans Nzoia_26	\N
220	Shauri (Timboroa Centre)	30	1	44.9	0	Baringo_30	\N
221	Shauri Yako	43	1	7.613	9147	Homa Bay_43	\N
222	Shauri yako	20	1	0.2	292	Kirinyaga_20	\N
223	Shibale	37	1	10	1256	Kakamega_37	\N
224	Shimo la Tewa	26	1	4	549	Trans Nzoia_26	\N
225	Slota	16	1	8	5180	Machakos_16	\N
226	Sofia	43	1	4.3	7793	Homa Bay_43	\N
227	Soko mjinga	17	1	6	727	Makueni_17	\N
228	Soweto-Lodwar Municipality	23	1	12.8	2804	Turkana_23	\N
229	Thiguku	20	1	7.85	743	Kirinyaga_20	\N
230	Tiwi Block 12	2	1	65	2500	Kwale _2	\N
231	Town Chini-Lokichar Town	23	1	13.3	848	Turkana_23	\N
232	Tuwani	26	1	22	16043	Trans Nzoia_26	\N
233	Upper Kariokor	6	1	3	6203	Taita Taveta_6	\N
234	Wachakone	4	1	8	963	Tana River_4	\N
235	Wagberi	8	1	26.5	3823	Wajir_8	\N
236	Witu old town	5	1	15	3698	Lamu_5	\N
237	Wiyoni Village	5	1	20	12099	Lamu_5	\N
48	Chorongi	19	1	4.13	147	Nyeri_8	0103000020E610000001000000110000003CC7707BAD7B4240EE0B864015A6DCBF327894B6AB7B4240EE8F0AABC5A5DCBFA62A55C9997B424055258E184993DCBF7FA99B2D9E7B4240353468C4238BDCBF5C37CA549F7B4240F6165022248ADCBF0B6775B8BB7B42400CD11E098482DCBF9C938003BE7B424052AF1B308D82DCBFBEDA7868C17B42407BBF62F09B83DCBF00488421C37B4240DB9487864384DCBF80FBCDA5C67B4240E8054C9D9985DCBF5B976022CB7B4240661341E48987DCBF85C9657FCE7B4240409BF430AF89DCBFCB5F528EDC7B42402903F0C39399DCBFA36837D8DB7B424097CFEA56979ADCBFE58E37A1BF7B4240D3321FF3ABA1DCBF12677A28B87B424007B371F28BA3DCBF3CC7707BAD7B4240EE0B864015A6DCBF
36	County Phase 1	7	1	56.31	2517	Garissa_9	0103000020E6100000010000001400000045F97E2557D343405FAA55853414DEBFB0982A4F4DD34340B9857C149B0FDEBF8EEC26EB46D34340C980B25EFB01DEBFC1D3A3813BD34340BAC9EB999DE9DDBF30F951803BD3434088146DC09AE9DDBF3BC668BF1DD343400E9AE7D3BCA8DDBF28B9EDE61ED34340C9759FC8BDA7DDBFAFCE27031FD343403CF6EF6DA5A7DDBFE2F32E5FBDD3434019DF25687C9BDDBF64D06FF1BFD3434008EAAAF3FE9BDDBFB1549F9CF5D34340533190F8C1ACDDBF9C188FD8F9D34340E7BA06E75CAEDDBFD4FF3E65FBD343407308DFE2FEAEDDBFC6951D923AD44340FC1F524F19DCDDBFE10FF7CE3CD4434051DD6EFB16DEDDBF8D72AE903FD443401F7F49ACD3E2DDBFDE6F5AEA40D44340D4B134B225E5DDBF2BBEFC264AD4434095CF122CB3FBDDBF70A3F5CC48D4434075861E99AFFCDDBF45F97E2557D343405FAA55853414DEBF
63	Eastleigh	32	1	44.76	5798	Nakuru_3	0103000020E61000000100000011000000A13D5EF942E741400182E844ECF3D3BFC57722439BE64140BEF3959161B9D3BFE426673079E64140CF0B49034589D3BF374793777FE641408411B8232087D3BFE10150B285E6414017AC93310585D3BFDA67139C94E64140FAF1E994FE7FD3BF094EA8A665E741404B3AA8C46757D3BF442CB1D080E74140B8AAB902F968D3BF7E4FD37E87E74140E98EF102696DD3BFF4E8D61988E74140D996B05E60A1D3BF16E5DF9481E741403D437376DBB4D3BFAC1854DC7DE741403592D6D95CB9D3BF6CAD5F3476E74140DA0EF603A2C2D3BFE2004C6675E74140F7502D8E79C3D3BF9290253252E741409DF65CABFEE5D3BFBA518AF647E741406E68229205F0D3BFA13D5EF942E741400182E844ECF3D3BF
46	Gitathini	19	1	18	485	Nyeri_6	0103000020E6100000010000001600000087944E0328774240CAA6E06D8CF6DBBF5667D0502D7642400B5618453FE1DBBF4BC9950B2C7642401EC9FC1F03CADBBFED1874002C764240E83D9323D9C8DBBF58E48A022C764240203439CB00C4DBBF085B70F1837642405850BAF76AC1DBBF1F9760EB85764240F6B50C0E6AC1DBBFC3537D518C764240771BD57AD0C1DBBF78E3B7DF91764240D1BAB26829C2DBBF346736BD117742405E6C1E0270CEDBBFF1D7915E1B774240E6FE8CEF94CFDBBFD3137AAD247742405DC2C28FE2D0DBBF19F8096E2B7742402A9BBE6C5FD2DBBF9BAB32A4327742409F69AEFF2FD4DBBF90AD864A39774240D93352D89BD6DBBF3EE048943C7742409FDD127B01D8DBBF817D5AEE3D77424027A2710CABD8DBBF0F0EF50A40774240120E065DDCD9DBBF40BCD4E2477742404CAA5B34ACDEDBBFC7D727194C774240C763FE666BE1DBBFE13491E73D774240B647FEC5C0E9DBBF87944E0328774240CAA6E06D8CF6DBBF
58	Ihwagi	19	1	5.62	172	Nyeri_18	0103000020E6100000010000000A000000FF0D2BF3D99242406DB69EEE1FA6DCBFD7D8297DC892424000E5B9943DA4DCBF6C0CF8E7B09242404BC8804C10A1DCBF517363C0A29242404A0BA87F9C9BDCBFAF2BC217A2924240A4252FE9B68BDCBF31A88E7BA2924240CB041226128BDCBF5CFCDCD0D4924240FE9EB45FFE72DCBF540E4ACEF5924240F9BFD77C4F76DCBF1D07C9F3FD924240850F77E17C84DCBFFF0D2BF3D99242406DB69EEE1FA6DCBF
32	Iskadek Phase 1	7	1	203.41	4432	Garissa_5	0103000020E6100000010000001D0000004B69EAD9A1D44340D5D24342B53DDEBF579D58DF50D4434088B53CAFFA0CDEBF86A6225CD2D34340C09BE83E29A2DDBFF5D54ADBD7D34340C6A051AF6093DDBF876B7BDBD7D34340CD8B12316093DDBFE974EDB3D8D34340A1BA4F523691DDBFE1322E3FDAD34340AA4DF7D34D8EDDBFEA45849475D4434044B1653F4EBDDCBF74CCF5AA77D443400325AA79BCBADCBF0DD5F37979D44340CE3EC2D8C5B8DCBFA324FF8579D443405E6EA5E8B9B8DCBF2DD37A8B7CD44340D35C6ED071B6DCBFDCB9824682D443409566FB2B93B2DCBF427D07EB98D443400F4E5FC2A0A6DCBF7608D1859DD44340B03E41B845A4DCBF7E9C56C39FD443401ACF19D058A3DCBF0DCEA718A0D4434084F67A5B4DA3DCBFCEC022ABA6D44340F11E150A7CA2DCBFF19EEF3EB5D4434000CBA5B8B2A0DCBFAFBA22E9BDD44340AD9D3AC502A0DCBF5655107CBED443400B0B5B1EF79FDCBFB87AD0A6CBD4434024A5C427309FDCBF7E38CAC703D543401A83EAC7E4CCDCBF5B9064BD04D543402CC9F66AF1CDDCBF05860375D4D54340219C398EBDB5DDBF3C3BA258D4D54340D927A4AA84B7DDBF43C88E0EC5D543407F7490AD25CCDDBFE347C11D7AD54340C4BBA48D132ADEBF4B69EAD9A1D44340D5D24342B53DDEBF
38	Kaango Mosquito	15	1	7	3960	Kitui_1	0103000020E610000001000000110000009A77991EEB004340470B520762F2F5BF3A7E8893DF00434013BFFAFBFFF1F5BFE86F1870D8004340575418BD14F1F5BF382AC02CD5004340779170FF45F0F5BF26856461D0004340DDB3EA3B16EFF5BF4A0675C3CF0043408703B676FBEAF5BF8A4A7FA1100143407136324FF5E6F5BFB8E8F1421F0143409D95AB8C12E6F5BF1B972506600143402B9166CBCCE5F5BF5D82C6C762014340E77B87FC76E6F5BF904CD7323F014340C84FAE0C38EBF5BF4942B49E3B0143402EFADC6FA9EBF5BF7894896322014340C959908233EEF5BFBBB6B401060143409786060ADAF0F5BFC2DC45A7FA0043408BD5BED087F1F5BFA350D4BFF500434036DE83E7D1F1F5BF9A77991EEB004340470B520762F2F5BF
76	Kaloleni	42	1	7.25	3000	Kisumu_4	0103000020E610000001000000160000001AE238B1546241405F11B8C0156DB9BFD2747D9251624140CCEF42D0D66CB9BF6C4B735A30624140818DCB8C2B60B9BF0BE380081B624140306065ADC131B9BFF87502C7FB6141409763FD8416B2B8BF11F0B7FAFC6141409453CE74CBA9B8BF7E563F61026241402BCE74A7BC9FB8BF6B8AB143066241405ACFAFA38098B8BFD579604008624140931DB34CCD94B8BFE74F31140962414037BB64D84293B8BFBF0D86BB2962414052921F85F778B8BF9F3DD8563C6241400F02CF6F6883B8BF36CE48564A62414004E9C5557A95B8BFE1472ADE4B6241407229C9BFD899B8BF6E4190574C6241404FCA173A339BB8BF78FF97CE4E6241403FA8B3473CA2B8BFAF88C3614F624140B32D7256E0A3B8BF7A445B4F57624140FE6A2D50DAC1B8BF52A969987162414025CC02B9A833B9BF968F1ADE70624140A8814D31A538B9BFC62FBA7D5662414055C54FB0BC69B9BF1AE238B1546241405F11B8C0156DB9BF
56	Kanjora	19	1	9.07	184	Nyeri_16	0103000020E6100000010000001100000098731AD0B77042408F374BA6FA51DABFED9552A97D704240B7A35D98F250DABF7E86B1AB7C70424037D90BC49149DABFAB5DF1897A70424013D302B79938DABFFA14A73178704240229E83B91F22DABF4254435778704240EC191A9A091EDABF01A177B97F70424064227178C81CDABF011CFD039170424012162A49F71ADABF91CC1BCF95704240DDA10C1CA01ADABF721E93909F704240D01E43FD201ADABFA84A6622AB7042403C8D598D311ADABFD8BF34E6AF7042404C82F529771ADABF84BBC8E9C3704240118A50A62E23DABF53FC31FDC9704240722748A99C50DABFD0315D9FC9704240284EBA03A650DABF7DA5037CC070424039EC1CA45751DABF98731AD0B77042408F374BA6FA51DABF
65	Keringet	32	1	19.42	1502	Nakuru_5	0103000020E610000001000000130000000EE180760FD941409796B41FFA6EDBBF6F8DEFA8F4D841405FA987D91C6DDBBF1DA62DADAED84140CE651269FF67DBBFE5CADAD088D841409060637B814ADBBF17C1C7AD88D84140F7668734B448DBBF5C54C1FF89D8414044057DB88A43DBBF05887E778AD84140326B6E8AB641DBBF0F6540F18AD8414058DE4F78DA3FDBBFE56003DD8BD841403E15A9A4403CDBBF93FBDF568CD8414073C33C2A643ADBBF6FBAADD58CD841407427375D7438DBBFB2A7655791D841403BFE10337627DBBFEEB4F65592D841401AA7B31A0427DBBF0BA712ABE0D8414037F2426FCE26DBBF9572BF8702D9414097131DB0C826DBBF66B2096B30D94140726B20D06F4DDBBFCF4D936B30D94140CFF3BE6E074EDBBF7AADA05313D941409104FB97226BDBBF0EE180760FD941409796B41FFA6EDBBF
49	Kiamwathi	19	1	12.38	231	Nyeri_9	0103000020E61000000100000015000000796E0C81957A42406F878D962EB2DCBF6AB0FC0E817A424064A02495AC9EDCBF22EF6E58817A4240835AD97E929DDCBFD2EF564D827A424092B556EDE599DCBF2035F45C847A42404B4958A1FB91DCBFB1D5BE97847A4240B3E663D81991DCBF87A1C4DA917A4240AE8670494191DCBF0293F740CC7A424041A7431CD392DCBF43A085B9DB7A4240A5D3C1066B93DCBFA86B00E6DD7A4240A8C898FCDB96DCBF10B8F5BBDE7A424059C33C116D98DCBF57D632A3DF7A4240EE5EE0A1709ADCBF82313150E07A4240F0F27974579CDCBF7BE55A89E07A4240F9329586F89CDCBF2EFFCAFFE07A42400FBEB8B78F9EDCBF7F310217E17A42405763136F059FDCBFCBB2C96BE17A42408781756F11A1DCBF08C2C07BE17A4240340FE77D5EA3DCBFBF545261E17A4240A64184257DA6DCBFD6CA4517E17A4240AE1AAE5C84A9DCBF796E0C81957A42406F878D962EB2DCBF
50	Kiaruhiu/Kariki	19	1	13.71	306	Nyeri_10	0103000020E6100000010000000B000000F467239A47964240678E6B6AC647DCBF429FB414DE95424094DDE26E7A1DDCBF5A2ACD2BEC954240126F599AC80BDCBFFFC88C61B59642408F046E0F2406DCBFD4C7EC11CC964240642713F01612DCBFAE68A651D49642405345F160C71EDCBFD962D642BC964240548F50D6CA32DCBFAE12FFACBA9642400E039C680A34DCBFCA4F8E9148964240BB343F51A947DCBFB9AD53A147964240CCCBBFC1C547DCBFF467239A47964240678E6B6AC647DCBF
9	Kisumu Ndogo	1	1	5.99	3000	Mombasa_2	0103000020E61000000100000010000000EA24FC8F0BD943406DFE84EFE02910C07315021400D943405294E948C92910C02955B0F3FCD843405F2BB9D8C22910C000D057FDF5D84340EC8ADBB5AD2910C055E91FF4F2D84340D956507EA42910C09CBEA72BC8D84340BC929E01C62810C06FD8D10ACAD84340C00331F3642710C03AEB73D9CED8434077C53922DA2610C0D1C9FD87D3D84340E7E3A67CE22610C0D69EA74DD6D84340960FE56EE72610C0FB9F5C7AD9D8434025844C74EF2610C09AE48EC0E3D84340F6BA016A092710C0BBCD1655E7D843403CBC063F252710C0039EE3F7F5D843404E298006972710C09689BB2315D94340E2B5FE4F542910C0EA24FC8F0BD943406DFE84EFE02910C0
78	Kopere	42	1	21.25	1708	Kisumu_6	0103000020E6100000010000000E0000008D233426079741407C3C69D79B1CA5BF94116236DB964140316BF53052F5A2BF57DCA69FD39641401657FE14153AA2BF1A772CAB5897414022126FB49ABAA2BFFFA1025C5E97414060AFA01F58C0A2BF9EAA2792669741407291096DA0C8A2BF8FC99D356797414038DAED2C26C7A3BFDA7B96CB6797414098F7811385BEA4BF2D12F2936797414016BD0CF321CBA4BF632474365D97414022F0881D54D4A4BF34C0D13658974140EE1F97F09BD8A4BFCA89F15055974140E90093F712DBA4BF62A3EF7D42974140258D27B015EBA4BF8D233426079741407C3C69D79B1CA5BF
70	Kuinet	27	1	13.16	700	Uasin Gishu_3	0103000020E610000001000000080000009F78EF7297A74140FA78E4D672CEE33F88F2FEFC96A74140B5982B8E97CEE33FAE37C8C3AEA74140E2E07942D1FFE33F3F19D2D0F6A74140D37E135B4B06E43F2BD9612302A84140B1F0A4E339E6E33FD7712D55C9A74140E5113EBBADD1E33F1D91DB36A3A74140FFCB91DD35CFE33F9F78EF7297A74140FA78E4D672CEE33F
11	Kwa Hakatsa	1	1	20.9	3000	Mombasa_4	0103000020E6100000010000001F0000001A6BA1DEDCCB4340B3B478A3340310C0DCC693ABAECB43401F8C3A945C0210C02D66363CA2CB43402FC0095F220210C0ABFA7FAB5ACB43401DD9F0A783F80FC0BD7F1D3C5CCB43407BDD2E8C39F80FC086B12AA593CB43405099C55620F40FC0F7E35FC694CB4340083732CD0DF40FC099A336AC96CB4340C718DB13F3F30FC0340FA41098CB434012DFC94DE2F30FC017446B2A99CB4340887C4FE6D6F30FC0C4C9E87B9BCB434084EDD850C4F30FC0509BCC259DCB4340AFC81D79BAF30FC0D6CFE2419FCB4340717332F1B2F30FC00B9EA4D4A1CB43404292DF63AEF30FC0C3809790A3CB4340347FC05EAEF30FC0040C8CD2A5CB4340F4451959B2F30FC0D1C8215BA8CB434040704691BBF30FC0F8B8F15AA9CB43401837BD2DC1F30FC0538B1400ACCB4340CBB7A9D4D9F30FC05CE4955EADCB434010D2C7F4E8F30FC012687655AFCB4340161D094902F40FC0528BCF32B0CB4340F6E9823B0FF40FC054F8C449D8CB4340F569EF67AAF60FC0839B952CD9CB434001194D35BCF60FC0F4D5D2740DCC43406A980CFD54FB0FC0EC4F05E90DCC43407E8C88529BFB0FC078AE79B1FACB4340644740BA840110C0C7A839FEE5CB4340AA8A560BBE0210C055302DB9E2CB4340A38B108CE80210C0241AAFFAE0CB43406F02F737FF0210C01A6BA1DEDCCB4340B3B478A3340310C0
72	Majengo Talai	35	1	23.12	772	Kericho_2	0103000020E61000000100000015000000315C4824A7A441404C82AAECD81AD7BFBD6309E264A441407645052A760AD7BF8301812C64A44140765590E1EB09D7BFC93BA6D561A441408334B4B12308D7BF32A49B9D5BA44140BD65260C1703D7BF467B411A7BA44140C40E7B06C3FCD6BF2E872046B9A441408E6819CB7EF1D6BFEEA6C2D568A5414014D5E5986CDCD6BF51DFF0A969A54140E018D7C45ADCD6BF9C5E17546CA541407100CF7321DCD6BF54168AF66DA541405E5E0A4BFEDBD6BF7C1CB9E472A54140FFF9F23D94DBD6BFCCC73DC077A54140951C50C32BDBD6BFFA619DF57CA541403F742DD835DED6BFD01CA324AAA54140D812A7C7F5F8D6BF919CE7C3A9A54140BA4EA3E1B1F9D6BFEA9063667CA54140206E8CF4FC03D7BF9880A05B75A5414061A90EBE4A05D7BFF6F661506EA54140DFE0F49C9806D7BF1FCA9DA850A541402D9178C0150CD7BF315C4824A7A441404C82AAECD81AD7BF
52	Miiri	19	1	3.34	116	Nyeri_12	0103000020E6100000010000000A000000AEF1E4E122954240926F9D613AD6DEBF3C8FF0C90D954240B49B29D6D6CEDEBF5B37E0340F9542406ED6414AD3C8DEBF3F0CD8E70F9542405B73B727DCC5DEBFF3594D121095424015DE78028AC5DEBFDD58F81A11954240F9BDC5058AC3DEBF1C44DAA911954240DC1517A075C2DEBF52ED52383D954240EA69C5C591BFDEBF9B1DC0664295424090950B623CD5DEBFAEF1E4E122954240926F9D613AD6DEBF
10	Misufini	1	1	24.04	1734	Mombasa_3	0103000020E6100000010000000D0000003CD960AB37CA434034477C1CAE0110C068B4546918CA4340CA94C2E4EE0010C0BA628D0603CA434060AE892084FF0FC03D1A2EEBC3C9434049C1BF3FE1F70FC0F8B7C2A114CA4340C964771CA5F10FC0B078A17B29CA43404B65707986F10FC0C9EF5CA531CA434080312DD798F10FC016E9424D32CA43404810F4509AF10FC0CA38D3AD38CA4340B847676151F20FC06078B34C3ECA43406F90F7B9F2F20FC0F7E1B73C50CA4340C7115D4326F50FC0071B2CEB4BCA434093953FADF70010C03CD960AB37CA434034477C1CAE0110C0
73	Bondeni	42	1	13.36	1500	Kisumu_1	0103000020E610000001000000140000002D3E80AD589941408EDBAEA32DCAC3BF6C0E716D34994140CB716ED03AC6C3BFB0B4E3C2249941407079BDE4A6B1C3BF27911C08209941401B7EE26652ABC3BFCE89507D279941406007F930EB99C3BF98CF493859994140D9B713E4EA45C3BF874BA33F6899414013DF8B980B3DC3BF70F5C3F370994140F8FB6E2DBD38C3BFC7FA4A38799941400DB1189C0A3CC3BFE5A1FF0E7E994140B6279EB6D13EC3BFFA6C1728839941408819E0906C42C3BF47187005879941405B7C30E6D745C3BFCA7A6E458A99414026B4D8A73349C3BF3947289793994140C1CC89875155C3BFEB4DCD5FA6994140C84FF6F1F489C3BFDFF88F06AF99414004EAB67133A2C3BF06D40E1081994140D6E0643379C2C3BF9F00E6F079994140F8798DC07AC4C3BFCD4B944966994140D3D1DE29DAC9C3BF2D3E80AD589941408EDBAEA32DCAC3BF
30	Bulla Riig Phase 1	7	1	351.42	13343	Garissa_3	0103000020E6100000010000001D000000AAAD9A0802D443404A7A99F0013BDCBFE52786FD10D2434059E576BEC401DCBF7090A46311D24340A7AE18F381D7DBBF2CD6A0D711D243401DF071E43CD2DBBF669B1C4E12D2434056BE98D0DACCDBBF0C1D6C7712D2434076D5A93C1ACBDBBF76C1F0812DD343409BFE76ACC031DBBF4DA330DB30D343406F5447131A31DBBF5A8BD9B73BD34340907C2FBBFD2EDBBF2FA85215A3D443405C2A610FA1EADABFBB74C89CA8D44340BD4420DDF6E9DABF252DA8EDB0D443402EFFCDE3F6E8DABF01378586B9D44340F207F242EEE7DABF67E5A053C5D4434062A0B10283E6DABFD154395CC9D44340080879DB06E6DABF8D94C43CCAD44340B3465F448BE6DABFA187CBBCCCD44340644A1EB31FE8DABFCA29B81CD0D443409B07509E41EADABF29F447FAF7D443404C0C1DA57203DBBF93070311FFD44340ED5B2766ED07DBBF93EB130506D543402931A942520CDBBF5231CB8E6DD54340C8570D658250DBBF665C518285D54340353B2CD7B561DBBF5A1A8C8185D54340E2CB4C1D0B63DBBFBFB09CC272D54340C4CFF226A06DDBBF5F64EE46BCD44340639F0521FED3DBBF38C43BDD24D443403FE11399D528DCBFF233467204D443401EFD4164FC3ADCBFAAAD9A0802D443404A7A99F0013BDCBF
54	Giakaibei	19	1	16.19	57	Nyeri_14	0103000020E610000001000000100000008789716C29944240CFED5CEC25BFDABF0DF6EA5422944240486908E708BCDABF55A90CD51D944240E4800255DAB9DABF63B023E5069442401E358A2557A9DABFAAEFE2AA2894424058AC7A458888DABF9026656668944240BE29C7AEDC5BDABFBE46F6916894424026FE10B0DC5BDABFA8E9E6F899944240F27008BF5D62DABF6B3BFE299E944240554081AA2463DABF7553B85DB294424064EBEE5BE366DABFD6175A74B4944240C549D7B14B67DABF94CA56BDAC944240D5E8781AF47CDABFA4F46A13AA944240163FAB716E84DABF19DCA9B2A7944240DB07B05D1B8BDABF3E738E888F944240681EF55C1F96DABF8789716C29944240CFED5CEC25BFDABF
61	Kasarani A	32	1	109.44	17881	Nakuru_1	0103000020E610000001000000210000003C74B6F91CE74140C07BA03F0A32D3BF01B05F1056E6414031EA0F651EECD2BF658A115A50E6414000A016CB43D2D2BF607A092450E64140811A9AA715D1D2BF7006CF134CE6414013E41C5336B6D2BF40BB14D975E64140219C7CFE2B76D2BF17633B4277E641408AE3429D6874D2BF2CE1576E78E6414051F596553773D2BF99C7A6917AE6414011C3F2CE2F71D2BF0371A1BE7BE64140842D7F9E4770D2BF2A7666B17DE6414098586DBCEF6ED2BFA49A884C86E64140962B25490E6AD2BF1089280588E64140C743CC6B5969D2BF9AAB8F1C89E6414060C3FB6BF068D2BF60302D348AE641402318F6638868D2BFF72290F88CE641407C3EFD4F8A67D2BF61605E169EE641409707DE19ED63D2BF15F7AB15A8E64140EAF700E54F63D2BFAF719C58AFE64140E0244E70E962D2BFB8E84323B6E641409182C8180863D2BF5C5BC65AC0E641403EACDB2FC663D2BFB3DD5233C3E641403846AC580E64D2BF0EC2B9EDCAE6414037B4835D8C65D2BF96F2A663DAE6414004737D69246BD2BFAC082D71DDE64140C651762B096DD2BF6390DC86E7E64140914CE918AB73D2BF283139A467E7414088D9CECE86DAD2BF30E9E1E968E741406A7FBD3CDBDBD2BF674ADF2A6DE741408FE8C076CFE2D2BF8C540D6C71E741401611553AAAFCD2BF5825731271E741405A68202E8602D3BFB6565D3956E74140BE8F0E208F2FD3BF3C74B6F91CE74140C07BA03F0A32D3BF
80	Mjini	37	1	8.4	1123	Kakamega_2	0103000020E6100000010000000E00000090242BEDCD3E41400E3066B6B024D53F03ABCD1EC93E4140E33BC4F76926D53F95B367B3BC3E4140F8EB187F562BD53F57B6E943BC3E4140CA0AEBFF832BD53FEA655C2B693E41405333A93C9050D53F0B8CA57E703E4140977EF8527A5BD53FE733F0709A3E4140AB07D966085BD53FC187A2839A3E4140DA43D4DB055BD53F3529BECD9A3E41404FC42F1BFB5AD53F5F7D451CF73E4140CF033C7B3E4CD53F9054C9030A3F4140463CC1D96045D53F4DE53EC10A3F4140FD7D7E985243D53FD8F3964EF63E41404601CFBCF932D53F90242BEDCD3E41400E3066B6B024D53F
12	Mwatate	1	1	5.99	2074	Mombasa_5	0103000020E6100000010000001A000000D5E7D6C65ED0434028C4071C972410C088AD03475CD04340D3645B7F962410C0BEC1944F36D04340F4426B5C372410C0C171352704D04340423C981F8B2310C08DEF2DBF02D043408A4C377C852310C0378A668302D043407D1D02536B2310C086A7BF4502D04340C70977C9492310C0DE8A291502D0434091E1305A2F2310C0201D93EC01D0434062BFA663F72210C0FF75ED2A02D0434050F7D8C2F32210C0C956ACF020D04340B930B613ED2110C00D1B926522D04340E0AF0921E92110C0F26CCDF13AD043403454DD01FB2110C0783282583ED0434076CD04D4FD2110C006CD073C3FD0434043B2C090FE2110C0C7BA3E3E3FD0434033CD4A95FE2110C04CD311733FD043402897E001FF2110C0224CF43A46D04340B9D66E73152210C0A58C164347D043407D9EBCEF182210C0D9ABE70848D04340009C028C1B2210C08AC667D148D04340638E5F311E2210C08AA4A7DD4BD043404FBED49E282210C069BBDF5B60D0434006734FBC6E2210C0962E197866D04340DE60F03ED62310C0C639BC2F66D04340BE2034AD582410C0D5E7D6C65ED0434028C4071C972410C0
28	Namu Phase 1	7	1	158.5	4928	Garissa_1	0103000020E61000000100000013000000A0F84E9A88D443405BDAA450C2EFDEBF300AC38786D44340AFCF840794EFDEBFD3AC9DE77DD34340033B0204CD32DEBF6F66D8D57DD343402141B207BF32DEBFEFAF3EF07CD34340F68134550A32DEBFA3D7C4DA71D34340F4DDD02E5129DEBF30E69E9266D3434043AFB4267020DEBF165E77895FD34340EB6BF6CA9B1ADEBFA78B8FC65CD34340421C54953918DEBFC25E23DE59D34340739372FAB615DEBF58CB25985AD3434071E27D309514DEBF586E681571D34340FEA9C94FCB0CDEBF78B9F82CB0D34340DA3D42775608DEBFC31741C202D44340FDF151D0D502DEBF97524DC148D44340B2D14D967BFEDDBF23DA4B084BD44340F968C7B33AFFDDBFFCFAB58183D54340A50D4DAE1466DEBF5AE96A1872D54340654DEE9B5FBADEBFA0F84E9A88D443405BDAA450C2EFDEBF
53	Ngorano	19	1	28.6	128	Nyeri_13	0103000020E6100000010000000C0000001BA1BF5F45894240DCDC0A9573D7DABFC336B8B6B68842408B58EE651C92DABF5DF61E96B08842402457D720958CDABF232FFD8FAE884240AFAEDA1E6688DABF5DFC32400F894240A9F2445AC77CDABF4CB469307D894240810A7AF26485DABFD2522447C5894240FED921F41C96DABF517EEA46C5894240AD5B37D9F297DABF2AF12BC5A18942408F68236E38B8DABFF9AD158FA1894240F759DA9669B8DABF35947D77A1894240A72CA2087FB8DABF1BA1BF5F45894240DCDC0A9573D7DABF
57	Ruruguti	19	1	22.89	535	Nyeri_17	0103000020E610000001000000130000003DE3578887724240941D6F5FC834E2BF2827322E22724240B6E250DD3333E2BF094A0D971E724240BD3AE02D1C33E2BF9B23DABB0B7242401E51A1C99F32E2BFA386C2DCF3714240D0F6A466BD31E2BF4A14A0A89A714240DA12CA01BF21E2BF6223F9A89A7142408493F3D5CD20E2BFBD847F68A1714240D4DD692F9E1DE2BFA07632A958724240ED4CAA8D7600E2BFD4BE8AE089724240C62655960010E2BF4118766BAE7242405930B4B0BC28E2BFB96C516EAD7242406DCA76ED452AE2BF19E71A45A9724240CB1236A5BC30E2BF03EBB839A97242400FA7D453CE30E2BF64DB2D5BA7724240BAB8A4B3B533E2BFC2C7E09B9E724240A4E3FB981534E2BF5F267B548F7242409E200DEBB334E2BF41D1D1238F724240C37F48E3B534E2BF3DE3578887724240941D6F5FC834E2BF
77	Shauri Moyo	42	1	37.75	850	Kisumu_5	0103000020E6100000010000000D000000EBE7EA02829A41400CC956D5C130C4BFABCFD5F5149A41405245EA48AC25C4BF2CD5A7BAFF99414047F910DEA1D1C3BFBB95C986009A41409BA17A40EBCFC3BF47D5CA35189A41406A07044031C7C3BFB9A0D55B3C9A414033BF8449DACAC3BF47D4AE1AA09A41407335CA987AFDC3BFE8653B9E9F9A414022011910E305C4BF1CE89C4E9F9A4140496077E3A90AC4BF6BDA88FF9D9A41407F01DA93C60DC4BF3388C7D59C9A41407969F792E90FC4BF42175C86899A41408A16458B7128C4BFEBE7EA02829A41400CC956D5C130C4BF
75	Shauri yako	42	1	27.73	2500	Kisumu_3	0103000020E61000000100000023000000458A6014049A41403100C9DA3EB9C4BF33826CDB019A4140ADFDE2F095B8C4BFB7753145FA9941406ED26B4D55B6C4BF21CA6ECAE9994140FC7AFAC570B1C4BF5E760B6AE1994140C1D6631DF4AEC4BFE759E5D6DB9941403DD3A0664CADC4BF98535A0DBF9941409641D16AC0A4C4BF7068321AB4994140EE0C432C80A1C4BFE6E5AE268D994140CFA8BEABEF95C4BF39FDF88F639941403AB31EB49689C4BFBE55AFCC52994140068CA9A29C84C4BF69BBAEB62E994140B41F47E7E579C4BF5BF2E4461C9941408EBCEA9C6C74C4BF7B8C3B4EF4984140CAACB5908E68C4BFA9995C5FE498414034EFE88ED363C4BF98164757E6984140A98958147D57C4BF3599B525C4994140F7A45AB4F23DC4BF740FBC58CC9941402E13CB4A1A3DC4BF0B5CC48BD4994140CD9A3EE1413CC4BF7C1A6602DC99414098D6F5E47C3BC4BF4EC1EDECE1994140F497CF5D623BC4BFA1494E46EB99414030DF37FE523BC4BF1FFE004AF79941408B0D0F030D3CC4BF4C2C79ED059A41404A505298063EC4BF904111C10F9A4140240F63470940C4BF4E8B86D31D9A41403461E400CA43C4BF5C0F2B80339A4140324CF19BE74BC4BFA7C3E8E1349A41400F604D4E994CC4BF23DA53703B9A414062FDCB693D50C4BF6D924613519A4140FEC26F306C5CC4BF402D539C4D9A4140483B19A9FE6CC4BF6B9BFFD3399A41401049C7528E84C4BF68DD9CB4319A4140A319D5BE848CC4BF51B58463089A4140F0AB8D7305B5C4BF458A6014049A41403100C9DA3EB9C4BF
74	Swahili	42	1	4.2	1500	Kisumu_2	0103000020E6100000010000000C000000D362DBF5AA994140624F8E02252BC4BF0F335FB9619941408CABDAB2361AC4BF604A74264A9941407F99C11E1DF0C3BF678BB40B5299414019498D280CEAC3BFA2F57992B1994140E37D62F55AE6C3BF58781F92B2994140837C3387CAE6C3BFDC24CE5EB49941404587E8F1DCEBC3BFE50E15A7C7994140C9FFD3436722C4BFD12B1A1FC7994140558000D68723C4BF974FC45AC399414000EC37B18D24C4BF7FE5418EBA99414047BDDB7BEE26C4BFD362DBF5AA994140624F8E02252BC4BF
64	Tarabete	32	1	7.7	1959	Nakuru_4	0103000020E610000001000000100000005DAEB654DD2542400CA9AA53BDCEE6BF0D179138D1254240D33546459CCCE6BFE4D9C4A6CC254240B8EF8DB11CCBE6BFA938D3C5BB254240D44444B67CC5E6BFC09D89C7A4254240E9E6392BB6BDE6BFACC10A2CA02542406587C4E11DBCE6BF09CF5770A02542407DC9B480A2BBE6BF98658718B32542401679B93B95B5E6BF3B8940CFB52542407B5687E4B8B4E6BF62D0129DB82542405ACEFB5ADAB3E6BF6DFF4832C325424046716223C1B0E6BF753EB311C525424051DEE070B5B0E6BF13AADAF9EA2542400BF6D32819BCE6BF1458412CF42542400DED26700DBFE6BF36D4C12305264240E69135D3BEC4E6BF5DAEB654DD2542400CA9AA53BDCEE6BF
1	Embakasi	47	1	2.28	1613	Nairobi_1	0103000020E61000000100000018000000918A0201E0744240935B19FABAE5F4BF361DA120CA7442409EFD075DDDDFF4BF8042B9B3C774424037C29256F3DBF4BF1264BFB3C77442400ADF1743EFDBF4BF38F0D6B8C7744240CFB7943CEBDBF4BFE5CDDFC2C7744240673D695CE7DBF4BFFCBB9AD1C774424037B003BBE3DBF4BF06E0AAE4C7744240249B466FE0DBF4BF8B0F98FBC7744240D198F88DDDDBF4BF80C5D115C8744240DA544129DBDBF4BF56B1B232C874424037213750D9DBF4BFFBC88451C8744240C7DA7F0ED8DBF4BFB2C08571C87442403474016CD7DBF4BF6963AA68C9744240719D7AFFD4DBF4BF09EF2328D07442407802240EC4DBF4BFC4B5C9DCD27442403D0E3843BDDBF4BFC8270F01D3744240707E744EBDDBF4BF212BB824D3744240C9E73124BEDBF4BF017EAF46D374424042D01EBEBFDBF4BFC03C20E6037542407B8EE40D56DEF4BF0B5EA032EB744240905AB49030E5F4BFF462A96EE67442406C7A977D6BE5F4BF78FFDF46E5744240F2B0FFC679E5F4BF918A0201E0744240935B19FABAE5F4BF
18	M26 Kibokoni	3	1	2.227	208	Kilifi_4	0103000020E610000001000000CA00000061375848940F44403D92702DAA6609C02181AFBAA70E4440BE7679D8926409C033978FEFA50E44409D4EDD948E6409C0B6739B18A50E444060FCE18F8C6409C02D05C8B2820E4440A9B7029B1F6409C098C3CC4E710E44406F75FEA9F95F09C00558213D710E4440C17FFDF0CE5F09C02394AE39860E444067B5F627A05E09C081C05A58E80E44407DFA0229C25F09C0F88335DAE90E444096DE8D81CC5F09C0823B35D4EA0E444020A4A335D35F09C0460EC51BFF0E444082478E6A5E6009C01621A1F9FF0E444071809B5D646009C0DB39EADE8D0F4440D2C2BC82336409C0D5C1B9D28F0F44404B5442EE406409C0E4FD2745900F444039C3E700446409C01D50B22B940F444004E7CB75F46409C03A8E802F950F4440A987C449676509C09F340630950F44406082D63B686509C0F2811131950F4440118C19206A6509C066A79C32950F4440FB58F2F56C6509C0C037A033950F4440CB33B9D96E6509C0C8D7A134950F444051DA22BD706509C0DE999F35950F4440C77D6DA0726509C0757D9936950F4440E0097A83746509C044719137950F4440FF754866766509C021878538950F44400BDFF748786509C07FBE7539950F44409330692B7A6509C06217623A950F4440BD6A9C0D7C6509C081CFBE3B950F44406333ABE07E6509C0741D313C950F4440F3B886D17F6509C0F1DB113D950F44409ED53DB3816509C0F04B803D950F44404458FAA3826509C0EFBBEE3D950F4440EDDAB694836509C0AF3C5B3E950F4440E3515485846509C0F9BDC73E950F44402ADD1076856509C07C4F323F950F44404F488F66866509C0E2376C40950F4440DFA30A38896509C06FEBD240950F4440160C6A288A6509C047B03741950F4440EE7CC9188B6509C07B5BFD41950F4440F4464AF98C6509C015316042950F44401BAC8AE98D6509C0150F2043950F44408767CDC98F6509C06C20DA43950F44405E28F1A9916509C01D3A3544950F44406787F399926509C0018FE744950F4440D02DBA79946509C0BECA3E45950F4440A0899D69956509C07B069645950F444099E58059966509C083C13C46950F4440D082EA38986509C04C1F9046950F444093DBAE28996509C0691E2F47950F4440AA72DA079B6509C0C4774C4E950F4440FAE17534C96509C0FAD43A4E950F4440B14B8956CB6509C0FA4E344E950F4440166B850CCC6509C06DC82D4E950F4440057662C2CC6509C095871F4E950F4440E3B75E78CD6509C005580F4E950F444062025B2ECE6509C03839FD4D950F4440104138E4CE6509C06A1AEB4D950F4440E17F159ACF6509C0700DD74D950F44409CDB1150D06509C03711C14D950F4440862BEF05D16509C07514AB4D950F44404667ADBBD16509C08629934D950F4440CCBF8A71D26509C0E24F794D950F444019216827D36509C0B5755F4D950F4440186E26DDD36509C0D0AC434D950F444091C3E492D46509C0BFF5254D950F44401C36C248D56509C0724F064D950F4440D19C80FED56509C023A9E64C950F4440AC033FB4D66509C09613C54C950F4440B65EDE69D76509C0DB8FA14C950F4440D4D69C1FD86509C0200C7E4C950F4440C74E5BD5D86509C02899584C950F444031BBFA8AD96509C0CAD5094C950F4440FDA439F6DA6509C0B096DE4B950F4440442BD9ABDB6509C09657B34B950F444067B17861DC6509C0C729864B950F44404E401817DD6509C0F6FB584B950F444010CFB7CCDD6509C0F6E4F64A950F4440E9FAD737DF6509C033D9C54A950F44409A8658EDDF6509C0D3065C4A950F4440A5C05958E16509C0EC2E254A950F44403366DA0DE26509C05268EC49950F444088145BC3E26509C027FD7649950F4440D76D3D2EE46509C024D7F948950F4440C8E91F99E56509C0DE43BB48950F4440889D814EE66509C07C623648950F4440A62745B9E76509C06014F047950F4440E3FDA66EE86509C043C6A947950F44401CD40824E96509C09D776347950F44400B964BD9E96509C0164C1947950F4440AA7DAD8EEA6509C00520CF46950F4440D750F043EB6509C011178146950F44408F4952F9EB6509C0960D3346950F4440F52D95AEEC6509C0321D9345950F44402F081B19EE6509C0F471EB44950F4440BE04A183EF6509C0A1AD9544950F4440A40BE438F06509C00FFA3D44950F4440DD0608EEF06509C05158E443950F4440031F4BA3F16509C0DD362D43950F44403C4CB20DF36509C076C8CD42950F4440146AD6C2F36509C00C5A6E42950F4440CA87FA77F46509C0EDFC0C42950F44401DAE1E2DF56509C018B1A941950F444010DD42E2F56509C08D764441950F4440A0146797F66509C083237640950F4440B4809001F86509C0D81C0B40950F444024D2B4B6F86509C0A315A03F950F4440480FBA6BF96509C08D31313F950F4440F471DE20FA6509C0EC4CC23E950F444055C0E3D5FA6509C09679513E950F44405217E98AFB6509C07FF56B3D950F444093D6F3F4FC6509C00756F53C950F44406947F9A9FD6509C0DAC77C3C950F4440E8C0FE5EFE6509C0AD39043C950F4440643A0414FF6509C0F3610B3B950F44408C3BF07D006609C0235F653A950F4440D6828068016609C062CF0A3A950F44402D5FDCE7016609C01F978839950F444053EFC29C026609C0B0700439950F4440899CC851036609C0025B7E38950F4440123EAF06046609C09E56F637950F44403AE895BB046609C039526E37950F444061927C70056609C06970E236950F4440C64D6325066609C0E49F5436950F4440CB114ADA066609C0A9E0C435950F444070DE308F076609C06D213535950F444015AB1744086609C097E70D34950F44406452C6AD096609C0E9F2DE32950F44405A1C75170B6609C06643A831950F4440CA0824810C6609C0F30D0931950F4440F605EC350D6609C07FD86930950F44404603B4EA0D6609C059B4C82F950F444038097C9F0E6609C031B17E2E950F444091370C09106609C0E8C0D72D950F44403A57D4BD106609C07E25822C950F444050B96427126609C01469D52B950F4440FDF22CDC126609C0DF34742A950F44405B749E45146609C0C8ABC129950F444095B347FA146609C0D0450B29950F44405C1810AF156609C04FDF5428950F4440D568B963166609C0A48A9C27950F444014D68118176609C00258E026950F44406B402BCD176609C05F252426950F4440C4AAD481186609C0DB156425950F4440A53A9D36196609C0CD05A424950F444014B646EB196609C05418E023950F4440EA42F09F1A6609C01B4A4023950F444071A21E321B6609C0E17BA022950F4440FC014DC41B6609C07CBFFE21950F44406F7E9A561C6609C0D6135B21950F444011EFC8E81C6609C021DF0F20950F4440E0E1250D1E6609C001CDC01E950F4440ECE582311F6609C03B55171E950F44406C70B1C31F6609C04388C01C950F4440F3960EE8206609C01133131C950F4440D6323D7A216609C02BEF631B950F444059D76B0C226609C043ABB41A950F4440B77B9A9E226609C008465219950F4440FBD5F7C2236609C0B4249F18950F4440BA8B2655246609C019043517950F44400BF46479256609C09D06C715950F44400A82C29D266609C02A190E15950F4440A951F12F276609C04C609813950F4440B4ED2F54286609C06D95DB12950F444090CE5EE6286609C08CCA1E12950F44406FAF8D78296609C0D956A110950F4440F46DCC9C2A6609C04106200F950F44402F522AC12B6609C0B86E5D0E950F44409C383A532C6609C001E9980D950F4440CF3B69E52C6609C04963D40C950F44402C3F98772D6609C07A05810A950F4440CD4E062E2F6609C058A2B809950F4440416335C02F6609C01FFE2308950F4440688974E4306609C0037D8B06950F444015D5D208326609C0EB3BBF05950F44407CE6E29A326609C0A80CF104950F4440F414122D336609C0B6D05003950F444020837051346609C033B28002950F4440C4A580E3346609C084A5AE01950F44407AE5AF75356609C06F9D0800950F4440856D0E9A366609C0F0B75EFE940F4440AA066DBE376609C04BCD88FD940F444052437D50386609C07BF4B0FC940F4440E69CACE2386609C0AA1BD9FB940F44407AF6DB74396609C0D94201FB940F44400B500B073A6609C0547B27FA940F44401DB23A993A6609C0CDB34DF9940F444050146A2B3B6609C01A91BAF6940F4440C954F8E13C6609C028ECDCF5940F444016C827743D6609C03547FFF4940F4440873B57063E6609C017B41FF4940F4440E5CBA5983E6609C0C88C60F2940F44400CC404BD3F6609C03906BCEF940F44404566B273416609C08BB311ED940F44408322602A436609C081F446EB940F44408C62DE4E446609C0B89461EA940F44407DF80DE1446609C0C4467AE9940F44405CAB5C73456609C04EAAABE7940F4440C7FCDA97466609C0A56DC2E6940F444043B8292A476609C0C5F3EFE4940F4440CA1AA84E486609C061375848940F44403D92702DAA6609C0
\.


--
-- Data for Name: settlement_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settlement_type (id, type) FROM stdin;
1	Informal Settlement
2	Slum
\.


--
-- Data for Name: settlement_uploads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settlement_uploads (id, name, type, file_path, settlement_id, "group") FROM stdin;
1	Embakasi_EGE_2414_CAT_II.docx	socio_economic	./public/Embakasi_EGE_2414_CAT_II.docx	1	Report
2	Embakasi_01_introduction.pptx	socio_economic	./public/Embakasi_01_introduction.pptx	1	Report
3	Embakasi_04_GIS_in_NRM.pptx	basemap_report	./public/Embakasi_04_GIS_in_NRM.pptx	1	Report
\.


--
-- Data for Name: sewer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sewer (id, settlement_id, no_connections, no_persons_served, ownership, geom) FROM stdin;
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: status; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.status (id, status) FROM stdin;
\.


--
-- Data for Name: stream; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stream (id, width, settlement_id, geom) FROM stdin;
\.


--
-- Data for Name: structure_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.structure_type (id, description) FROM stdin;
\.


--
-- Data for Name: structures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.structures (id, description, settlement_id, type_id, struct_use, struct_typology, owner_id, struct_ownership, geom) FROM stdin;
\.


--
-- Data for Name: telcom; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.telcom (id, name, facility_type, settlement_id, owner, geom) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (roleid, userid) FROM stdin;
1	16
11	17
1	18
1	19
1	20
1	21
1	22
1	23
1	24
1	25
1	26
1	27
1	28
14	29
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, name, email, county_id, password, isactive, phone, "resetPasswordToken", "resetPasswordExpires", avatar) FROM stdin;
16	felix.mutua@gmail.com	Felix Mutua	felix.mutua@gmail.com	47	$2a$08$xNDcv6hetCGqf2dIKvO6fOVv/xnNVMsKHMQWpw8F7e3Z4krYuhvoO	t	\N	true	2022-08-29 16:47:06.194+03	https://i.pravatar.cc/150?img=3
17	fnmutua@jkuat.ac.ke	Nzive Mutua	fnmutua@jkuat.ac.ke	47	$2a$08$FhhX/X.kC3dsOaUIWl/E0e6hfev0yA5poj/q5MvTWgdidTn9rh8RG	t	\N	true	2022-08-29 16:49:31.414+03	https://i.pravatar.cc/150?img=0
27	felidx.mutua@gmail.com	sdsdsd	felidx.mutua@gmail.com	8	$2a$08$bQLJOiCC0DQtK5lQTOf3A.6ZW89BiOHRvIZx7SIU0y88MufGCEbG6	f	\N	true	2022-09-22 11:06:28.888+03	\N
28	maluini@yahoo.com	maluni	maluini@yahoo.com	1	$2a$08$44wRjx00mRDV8qHyDH043uxnv9mar.zGfaSreKQOAzV/FGcVIPAvu	t	\N	true	2022-09-22 11:09:25.95+03	\N
29	guest@kisip.org	Guest	guest@kisip.org	47	$2a$08$L97nv/Gp6Rw5OJwPWzXjNO/f4Yg3zun1yvksZzS6ZcSBD4xmGVZHS	t	\N	true	2022-09-23 15:53:36.728+03	https://i.pravatar.cc/150?img=9
25	1felix.mudsdsdsededtua@gmail.com	fededed	felix.mudsdsdsededtua@gmail.com	47	$2a$08$h1VhNqaqbsfOkM1wltEBiOt25/q1JzzTPO7w4bpY8bi3W4J1geXVu	f	\N	true	2022-09-20 12:14:04.659+03	\N
24	felix.mudededtua@gmail.com	fededed	felix.mudededtua@gmail.com	47	$2a$08$xWG/PhqgX4N7IQr53DXOHe3wiDKbp5qxbQoTYjFEo/PC5qhBtMxs.	t	\N	true	2022-09-20 12:13:48.941+03	\N
23	doe@gmail.com	Felix	doe@gmail.com	\N	$2a$08$pe7zlIc4W70oWbc.70aZ9u1PKE6cZR/3EaKXZIJfP7iNRCkW4WWw2	t	\N	true	2022-09-20 12:07:10.296+03	\N
22	felix.mudtdua@gmail.com	Felix	felix.mudtdua@gmail.com	\N	$2a$08$BGtEmx5XtNF9Zh0D32wlkep/hqi.Qjbnl.pVEO5KotMRd.y3oRJBy	t	\N	true	2022-09-20 12:06:34.948+03	\N
18	doe@email.com	121212	4545454	1	$2a$08$IpdQSmk2PhMlKD4CRaHZWeu8im3i7t21oLudRUSLiI3tUAmWcINxu	f	\N	true	2022-09-19 15:14:04.866+03	\N
19	jane@email.com	121212	jane@email.com	47	$2a$08$XeGsq08HLhjdbMZs1Zpg0umT3JDsyQw5M95oszoCqkpaixFj6ylyi	f	\N	true	2022-09-19 15:23:18.002+03	\N
20	janxe@email.com	xJane Doe	janxe@email.com	47	$2a$08$MmpWiiYShfjXPWEcyYGzOOBnhQ7oKcBfSFBDiz0uw4vJpLtE9A4mu	f	\N	true	2022-09-19 15:24:07.042+03	\N
21	felix.mutdua@gmail.com	Felix	felix.mutdua@gmail.com	\N	$2a$08$Jx6P3GpxDMZI0G9.v3jFJ.vkDEruz3yvcsDjTJqRO1OiBJOzD0kNW	f	\N	true	2022-09-20 12:04:20.978+03	\N
26	xfelix.mutua@gmail.com	sdsd	xfelix.mutua@gmail.com	47	$2a$08$8jAM6eYlwR6ORcVhj5EFYO5bwCxaYJKU5LNZd1Kw6.8oHv/m0WNku	t	\N	true	2022-09-20 12:21:08.737+03	\N
\.


--
-- Data for Name: water_point; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.water_point (id, name, facility_type, settlement_id, capacity, cost_20l_jerrican, owner, ownership, geom) FROM stdin;
\.


--
-- Data for Name: wetland; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wetland (id, name, settlement_id, status, geom) FROM stdin;
\.


--
-- Name: beneficiary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.beneficiary_id_seq', 1, false);


--
-- Name: beneficiary_parcel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.beneficiary_parcel_id_seq', 1, false);


--
-- Name: cluster_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cluster_id_seq', 3, true);


--
-- Name: county_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.county_id_seq', 1, false);


--
-- Name: crime_spot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.crime_spot_id_seq', 1, false);


--
-- Name: disaster_zone_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.disaster_zone_id_seq', 1, false);


--
-- Name: dumping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dumping_id_seq', 1, false);


--
-- Name: education_facility_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.education_facility_id_seq', 2, true);


--
-- Name: electricity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.electricity_id_seq', 1, false);


--
-- Name: facility_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.facility_type_id_seq', 1, false);


--
-- Name: flood_light_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.flood_light_id_seq', 1, false);


--
-- Name: health_facility_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.health_facility_id_seq', 1, false);


--
-- Name: households_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.households_id_seq', 1, true);


--
-- Name: intervention_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.intervention_type_id_seq', 1, false);


--
-- Name: interventions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.interventions_id_seq', 1, false);


--
-- Name: landuse_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.landuse_type_id_seq', 1, false);


--
-- Name: lot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lot_id_seq', 10, true);


--
-- Name: ownership_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ownership_type_id_seq', 1, false);


--
-- Name: parcel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.parcel_id_seq', 1, false);


--
-- Name: path_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.path_id_seq', 1, false);


--
-- Name: piped_water_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.piped_water_id_seq', 1, false);


--
-- Name: public_facility_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.public_facility_id_seq', 1, false);


--
-- Name: railway_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.railway_id_seq', 1, false);


--
-- Name: river_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.river_id_seq', 1, false);


--
-- Name: road_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.road_id_seq', 1, false);


--
-- Name: sanitation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sanitation_id_seq', 1, false);


--
-- Name: security_actor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.security_actor_id_seq', 1, false);


--
-- Name: settlement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settlement_id_seq', 1, false);


--
-- Name: settlement_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settlement_type_id_seq', 1, false);


--
-- Name: settlement_uploads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settlement_uploads_id_seq', 3, true);


--
-- Name: sewer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sewer_id_seq', 1, false);


--
-- Name: status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.status_id_seq', 1, false);


--
-- Name: stream_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stream_id_seq', 1, false);


--
-- Name: structure_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.structure_type_id_seq', 1, false);


--
-- Name: structures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.structures_id_seq', 1, false);


--
-- Name: telcom_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.telcom_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 29, true);


--
-- Name: water_point_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.water_point_id_seq', 1, false);


--
-- Name: wetland_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wetland_id_seq', 1, false);


--
-- Name: beneficiary_parcel beneficiary_parcel_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary_parcel
    ADD CONSTRAINT beneficiary_parcel_pkey PRIMARY KEY (id);


--
-- Name: beneficiary beneficiary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary
    ADD CONSTRAINT beneficiary_pkey PRIMARY KEY (id);


--
-- Name: cluster cluster_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cluster
    ADD CONSTRAINT cluster_pkey PRIMARY KEY (id);


--
-- Name: county county_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.county
    ADD CONSTRAINT county_pkey PRIMARY KEY (id);


--
-- Name: crime_spot crime_spot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crime_spot
    ADD CONSTRAINT crime_spot_pkey PRIMARY KEY (id);


--
-- Name: disaster_zone disaster_zone_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disaster_zone
    ADD CONSTRAINT disaster_zone_pkey PRIMARY KEY (id);


--
-- Name: dumping dumping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dumping
    ADD CONSTRAINT dumping_pkey PRIMARY KEY (id);


--
-- Name: education_facility education_facility_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.education_facility
    ADD CONSTRAINT education_facility_pkey PRIMARY KEY (id);


--
-- Name: electricity electricity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.electricity
    ADD CONSTRAINT electricity_pkey PRIMARY KEY (id);


--
-- Name: facility_type facility_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_type
    ADD CONSTRAINT facility_type_pkey PRIMARY KEY (id);


--
-- Name: flood_light flood_light_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flood_light
    ADD CONSTRAINT flood_light_pkey PRIMARY KEY (id);


--
-- Name: health_facility health_facility_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.health_facility
    ADD CONSTRAINT health_facility_pkey PRIMARY KEY (id);


--
-- Name: households households_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.households
    ADD CONSTRAINT households_pkey PRIMARY KEY (id);


--
-- Name: intervention_type intervention_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervention_type
    ADD CONSTRAINT intervention_type_pkey PRIMARY KEY (id);


--
-- Name: interventions interventions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interventions
    ADD CONSTRAINT interventions_pkey PRIMARY KEY (id);


--
-- Name: landuse_type landuse_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.landuse_type
    ADD CONSTRAINT landuse_type_pkey PRIMARY KEY (id);


--
-- Name: lot lot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lot
    ADD CONSTRAINT lot_pkey PRIMARY KEY (id);


--
-- Name: ownership_type ownership_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ownership_type
    ADD CONSTRAINT ownership_type_pkey PRIMARY KEY (id);


--
-- Name: parcel parcel_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcel
    ADD CONSTRAINT parcel_code_key UNIQUE (code);


--
-- Name: parcel parcel_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcel
    ADD CONSTRAINT parcel_pkey PRIMARY KEY (id);


--
-- Name: path path_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.path
    ADD CONSTRAINT path_pkey PRIMARY KEY (id);


--
-- Name: piped_water piped_water_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.piped_water
    ADD CONSTRAINT piped_water_pkey PRIMARY KEY (id);


--
-- Name: public_facility public_facility_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_facility
    ADD CONSTRAINT public_facility_pkey PRIMARY KEY (id);


--
-- Name: railway railway_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.railway
    ADD CONSTRAINT railway_pkey PRIMARY KEY (id);


--
-- Name: river river_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.river
    ADD CONSTRAINT river_pkey PRIMARY KEY (id);


--
-- Name: road road_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.road
    ADD CONSTRAINT road_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sanitation sanitation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sanitation
    ADD CONSTRAINT sanitation_pkey PRIMARY KEY (id);


--
-- Name: security_actor security_actor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_actor
    ADD CONSTRAINT security_actor_pkey PRIMARY KEY (id);


--
-- Name: settlement settlement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement
    ADD CONSTRAINT settlement_pkey PRIMARY KEY (id);


--
-- Name: settlement_type settlement_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement_type
    ADD CONSTRAINT settlement_type_pkey PRIMARY KEY (id);


--
-- Name: settlement_uploads settlement_uploads_file_path_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement_uploads
    ADD CONSTRAINT settlement_uploads_file_path_key UNIQUE (file_path);


--
-- Name: settlement_uploads settlement_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement_uploads
    ADD CONSTRAINT settlement_uploads_pkey PRIMARY KEY (id);


--
-- Name: sewer sewer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sewer
    ADD CONSTRAINT sewer_pkey PRIMARY KEY (id);


--
-- Name: status status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.status
    ADD CONSTRAINT status_pkey PRIMARY KEY (id);


--
-- Name: stream stream_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stream
    ADD CONSTRAINT stream_pkey PRIMARY KEY (id);


--
-- Name: structure_type structure_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.structure_type
    ADD CONSTRAINT structure_type_pkey PRIMARY KEY (id);


--
-- Name: structures structures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.structures
    ADD CONSTRAINT structures_pkey PRIMARY KEY (id);


--
-- Name: telcom telcom_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.telcom
    ADD CONSTRAINT telcom_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (roleid, userid);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: water_point water_point_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.water_point
    ADD CONSTRAINT water_point_pkey PRIMARY KEY (id);


--
-- Name: wetland wetland_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wetland
    ADD CONSTRAINT wetland_pkey PRIMARY KEY (id);


--
-- Name: household_pkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX household_pkey ON public.households USING btree (id);


--
-- Name: intervention_pkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX intervention_pkey ON public.interventions USING btree (id);


--
-- Name: cluster cluster_lot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cluster
    ADD CONSTRAINT cluster_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lot(id) ON UPDATE CASCADE;


--
-- Name: interventions interventions_cluster_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interventions
    ADD CONSTRAINT interventions_cluster_id_fkey FOREIGN KEY (cluster_id) REFERENCES public.cluster(id) ON UPDATE CASCADE;


--
-- Name: settlement settlement_county_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement
    ADD CONSTRAINT settlement_county_id_fkey FOREIGN KEY (county_id) REFERENCES public.county(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_roleid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_roleid_fkey FOREIGN KEY (roleid) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

