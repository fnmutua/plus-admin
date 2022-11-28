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
-- Name: btree_gin; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gin WITH SCHEMA public;


--
-- Name: EXTENSION btree_gin; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gin IS 'support for indexing common datatypes in GIN';


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
    hh_id integer,
    settlement_id integer NOT NULL,
    intervention_id integer,
    intervention_phase integer NOT NULL,
    benefit_type_id integer NOT NULL,
    code character varying
);


ALTER TABLE public.beneficiary OWNER TO postgres;

--
-- Name: xbeneficiary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.xbeneficiary (
    id integer NOT NULL,
    name character varying(255),
    national_id character varying(255),
    kra_pin character varying(255),
    hh_id integer,
    photo bytea,
    address character varying(255),
    intervention_id integer,
    settlement_id integer,
    intervention_phase integer,
    benefit_type_id integer
);


ALTER TABLE public.xbeneficiary OWNER TO postgres;

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

ALTER SEQUENCE public.beneficiary_id_seq OWNED BY public.xbeneficiary.id;


--
-- Name: beneficiary_id_seq1; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.beneficiary_id_seq1
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.beneficiary_id_seq1 OWNER TO postgres;

--
-- Name: beneficiary_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.beneficiary_id_seq1 OWNED BY public.beneficiary.id;


--
-- Name: beneficiary_parcel; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.beneficiary_parcel (
    beneficiary_id integer NOT NULL,
    parcel_id integer NOT NULL,
    id integer NOT NULL,
    settlement_id integer NOT NULL,
    intervention_id integer NOT NULL,
    intervention_phase integer NOT NULL,
    code character varying(255) NOT NULL
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
-- Name: benefit_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.benefit_type (
    id integer NOT NULL,
    type character varying(255) NOT NULL
);


ALTER TABLE public.benefit_type OWNER TO postgres;

--
-- Name: benefit_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.benefit_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.benefit_type_id_seq OWNER TO postgres;

--
-- Name: benefit_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.benefit_type_id_seq OWNED BY public.benefit_type.id;


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
    geom public.geometry(Geometry,4326)
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
    school_number character varying(255),
    category character varying(255),
    level character varying(255),
    reg_status character varying(255),
    ownership_type character varying(255),
    owner character varying(255),
    catchment character varying(255),
    male_enrollment integer,
    female_enrollment integer,
    number_teachers integer,
    number_other_staff integer,
    number_classrooms integer,
    number_male_toilets integer,
    number_female_toilets integer,
    avg_fees_term integer,
    number_handwashing_stns integer,
    mhm character varying(255),
    parcel_tenure character varying(255),
    tenancy character varying(255),
    settlement_id integer NOT NULL,
    code character varying(255) NOT NULL,
    geom public.geometry(Geometry,4326)
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
    name character varying(255),
    facility_number character varying(255) NOT NULL,
    level character varying(255),
    reg_status character varying(255),
    ownership_type character varying(255),
    owner character varying(255),
    inpatient boolean,
    patients_per_day integer,
    number_beds integer,
    occupancy integer,
    number_doctors integer,
    number_clinical_officers integer,
    number_pharm integer,
    number_nurses integer,
    parcel_tenure character varying(255),
    tenancy character varying(255),
    settlement_id integer,
    code character varying(255) NOT NULL,
    geom public.geometry(Geometry,4326)
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
    address character varying(255),
    code character varying(255) NOT NULL
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
    intervention_type_id integer NOT NULL,
    year integer NOT NULL,
    intervention_phase integer NOT NULL,
    settlement_id integer NOT NULL,
    cluster_id integer NOT NULL,
    code character varying(255) NOT NULL
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
-- Name: other_facility; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.other_facility (
    id integer NOT NULL,
    type character varying(255) NOT NULL,
    name character varying(255),
    condition character varying(255),
    frequency character varying(255),
    type_waste character varying(255),
    cost_per_use integer,
    number_stances integer,
    number_staff integer,
    number_phases character varying(255),
    size_reserve integer,
    rating character varying(255),
    number_vehicles integer,
    date_install timestamp with time zone,
    height integer,
    ownership_type character varying(255),
    owner character varying(255),
    settlement_id integer,
    geom public.geometry(Geometry,4326)
);


ALTER TABLE public.other_facility OWNER TO postgres;

--
-- Name: other_facility_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.other_facility_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.other_facility_id_seq OWNER TO postgres;

--
-- Name: other_facility_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.other_facility_id_seq OWNED BY public.other_facility.id;


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
    geom public.geometry(Geometry,4326)
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
    name character varying(255) NOT NULL,
    "rdNum" character varying(255),
    "rdClass" character varying(255),
    width double precision,
    "rdReserve" character varying(255),
    "surfaceType" character varying(255),
    "surfaceCondition" character varying(255),
    traffic character varying(255),
    direction character varying(255),
    drainage character varying(255),
    "drainageCondition" character varying(255),
    settlement_id integer NOT NULL,
    geom public.geometry(Geometry,4326)
);


ALTER TABLE public.road OWNER TO postgres;

--
-- Name: road_asset; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.road_asset (
    id integer NOT NULL,
    road_id integer NOT NULL,
    asset_type character varying(255) NOT NULL,
    asset_condition character varying(255),
    geom public.geometry(Geometry,4326)
);


ALTER TABLE public.road_asset OWNER TO postgres;

--
-- Name: road_asset_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.road_asset_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.road_asset_id_seq OWNER TO postgres;

--
-- Name: road_asset_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.road_asset_id_seq OWNED BY public.road_asset.id;


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
    name character varying(255),
    description character varying,
    isactive boolean DEFAULT false
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
    geom public.geometry(Geometry,4326),
    area double precision,
    population integer,
    code character varying(255) NOT NULL,
    description character varying(255)
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
-- Name: settlement_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settlement_status (
    id integer NOT NULL,
    settlement_id integer NOT NULL,
    no_dwelling integer,
    pop_density real,
    ave_hh_size integer,
    ave_room_occupancy integer,
    ave_plot_size real,
    avg_living_area real,
    prop_permanent real,
    prop_semi real,
    prop_temp real,
    avg_cost_perm integer,
    avg_cost_semi integer,
    avg_cost_temp integer,
    prop_avail_piped_water real,
    dist_piped_water integer,
    prop_other_water real,
    prop_conn_elec real,
    prop_conn_other_elec real,
    avg_mon_income integer,
    prop_hh_perm_income real,
    prop_hh_income_home real,
    prop_renting real,
    prop_lpg real,
    prop_firewood real,
    prop_kerosene real,
    prop_biogas real,
    prop_elec real,
    avg_mon_rent integer,
    hiv_prevalence real,
    prop_food_aid real,
    prop_female_hh real,
    prop_child_hh real,
    main_hazard character varying(255),
    hazard_freq character varying(255),
    dist_urban_centre integer,
    survey_status character varying(255),
    encumbrance character varying(255),
    ownership character varying(255),
    land_owner character varying(255),
    occupation_duration character varying(255),
    mode_occupation character varying(255),
    date_report timestamp with time zone
);


ALTER TABLE public.settlement_status OWNER TO postgres;

--
-- Name: settlement_status_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settlement_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.settlement_status_id_seq OWNER TO postgres;

--
-- Name: settlement_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settlement_status_id_seq OWNED BY public.settlement_status.id;


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
    name character varying(255) NOT NULL,
    ownership_type character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    length integer NOT NULL,
    number_connections integer NOT NULL,
    settlement_id integer NOT NULL,
    geom public.geometry(Geometry,4326)
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
    type character varying(255),
    capacity character varying(255),
    depth integer,
    ownership_type character varying(255),
    owner character varying(255),
    catchment character varying(255),
    price integer,
    settlement_id integer NOT NULL,
    code character varying(255) NOT NULL,
    geom public.geometry(Geometry,4326)
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

ALTER TABLE ONLY public.beneficiary ALTER COLUMN id SET DEFAULT nextval('public.beneficiary_id_seq1'::regclass);


--
-- Name: beneficiary_parcel id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary_parcel ALTER COLUMN id SET DEFAULT nextval('public.beneficiary_parcel_id_seq'::regclass);


--
-- Name: benefit_type id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.benefit_type ALTER COLUMN id SET DEFAULT nextval('public.benefit_type_id_seq'::regclass);


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
-- Name: other_facility id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_facility ALTER COLUMN id SET DEFAULT nextval('public.other_facility_id_seq'::regclass);


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
-- Name: road_asset id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.road_asset ALTER COLUMN id SET DEFAULT nextval('public.road_asset_id_seq'::regclass);


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
-- Name: settlement_status id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement_status ALTER COLUMN id SET DEFAULT nextval('public.settlement_status_id_seq'::regclass);


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
-- Name: xbeneficiary id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.xbeneficiary ALTER COLUMN id SET DEFAULT nextval('public.beneficiary_id_seq'::regclass);


--
-- Data for Name: beneficiary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.beneficiary (id, hh_id, settlement_id, intervention_id, intervention_phase, benefit_type_id, code) FROM stdin;
779	2331	2	2	1	1	kahawa_soweto_88_2
780	2332	2	2	1	1	kahawa_soweto_245_2
781	2333	2	2	1	1	kahawa_soweto_310_2
782	2334	2	2	1	1	kahawa_soweto_498_2
783	2335	2	2	1	1	kahawa_soweto_79_2
784	2336	2	2	1	1	kahawa_soweto_603_2
785	2337	2	2	1	1	kahawa_soweto_739_2
786	2338	2	2	1	1	kahawa_soweto_142_2
787	2339	2	2	1	1	kahawa_soweto_269_2
788	2340	2	2	1	1	kahawa_soweto_173_2
789	2341	2	2	1	1	kahawa_soweto_183_2
790	2342	2	2	1	1	kahawa_soweto_369_2
791	2343	2	2	1	1	kahawa_soweto_479_2
792	2344	2	2	1	1	kahawa_soweto_218_2
793	2345	2	2	1	1	kahawa_soweto_13_2
794	2346	2	2	1	1	kahawa_soweto_158_2
795	2347	2	2	1	1	kahawa_soweto_688_2
796	2348	2	2	1	1	kahawa_soweto_77_2
797	2349	2	2	1	1	kahawa_soweto_53_2
798	2350	2	2	1	1	kahawa_soweto_84_2
799	2351	2	2	1	1	kahawa_soweto_9_2
800	2352	2	2	1	1	kahawa_soweto_147_2
801	2353	2	2	1	1	kahawa_soweto_549_2
802	2354	2	2	1	1	kahawa_soweto_702_2
803	2355	2	2	1	1	kahawa_soweto_16_2
804	2356	2	2	1	1	kahawa_soweto_113_2
805	2357	2	2	1	1	kahawa_soweto_341_2
806	2358	2	2	1	1	kahawa_soweto_643_2
807	2359	2	2	1	1	kahawa_soweto_174_2
808	2360	2	2	1	1	kahawa_soweto_425_2
809	2361	2	2	1	1	kahawa_soweto_68_2
810	2362	2	2	1	1	kahawa_soweto_770_2
811	2363	2	2	1	1	kahawa_soweto_198_2
812	2364	2	2	1	1	kahawa_soweto_331_2
813	2365	2	2	1	1	kahawa_soweto_472_2
814	2366	2	2	1	1	kahawa_soweto_565_2
815	2367	2	2	1	1	kahawa_soweto_487_2
816	2368	2	2	1	1	kahawa_soweto_186_2
817	2369	2	2	1	1	kahawa_soweto_720_2
818	2370	2	2	1	1	kahawa_soweto_124_2
819	2371	2	2	1	1	kahawa_soweto_675_2
820	2372	2	2	1	1	kahawa_soweto_375_2
821	2373	2	2	1	1	kahawa_soweto_6_2
822	2374	2	2	1	1	kahawa_soweto_574_2
823	2375	2	2	1	1	kahawa_soweto_539_2
824	2376	2	2	1	1	kahawa_soweto_344_2
825	2377	2	2	1	1	kahawa_soweto_448_2
826	2378	2	2	1	1	kahawa_soweto_704_2
827	2379	2	2	1	1	kahawa_soweto_87_2
828	2380	2	2	1	1	kahawa_soweto_575_2
829	2381	2	2	1	1	kahawa_soweto_501_2
830	2382	2	2	1	1	kahawa_soweto_154_2
831	2383	2	2	1	1	kahawa_soweto_491_2
832	2384	2	2	1	1	kahawa_soweto_486_2
833	2385	2	2	1	1	kahawa_soweto_668_2
834	2386	2	2	1	1	kahawa_soweto_267_2
835	2387	2	2	1	1	kahawa_soweto_137_2
836	2388	2	2	1	1	kahawa_soweto_356_2
837	2389	2	2	1	1	kahawa_soweto_28_2
838	2390	2	2	1	1	kahawa_soweto_586_2
839	2391	2	2	1	1	kahawa_soweto_415_2
840	2392	2	2	1	1	kahawa_soweto_219_2
841	2393	2	2	1	1	kahawa_soweto_167_2
842	2394	2	2	1	1	kahawa_soweto_82_2
843	2395	2	2	1	1	kahawa_soweto_246_2
844	2396	2	2	1	1	kahawa_soweto_235_2
845	2397	2	2	1	1	kahawa_soweto_343_2
846	2398	2	2	1	1	kahawa_soweto_550_2
847	2399	2	2	1	1	kahawa_soweto_306_2
848	2400	2	2	1	1	kahawa_soweto_18_2
849	2401	2	2	1	1	kahawa_soweto_503_2
850	2402	2	2	1	1	kahawa_soweto_210_2
851	2403	2	2	1	1	kahawa_soweto_414_2
852	2404	2	2	1	1	kahawa_soweto_324_2
853	2405	2	2	1	1	kahawa_soweto_562_2
854	2406	2	2	1	1	kahawa_soweto_293_2
855	2407	2	2	1	1	kahawa_soweto_435_2
856	2408	2	2	1	1	kahawa_soweto_117_2
857	2409	2	2	1	1	kahawa_soweto_650_2
858	2410	2	2	1	1	kahawa_soweto_412_2
859	2411	2	2	1	1	kahawa_soweto_347_2
860	2412	2	2	1	1	kahawa_soweto_190_2
861	2413	2	2	1	1	kahawa_soweto_473_2
862	2414	2	2	1	1	kahawa_soweto_327_2
863	2415	2	2	1	1	kahawa_soweto_268_2
864	2416	2	2	1	1	kahawa_soweto_687_2
865	2417	2	2	1	1	kahawa_soweto_610_2
866	2418	2	2	1	1	kahawa_soweto_490_2
867	2419	2	2	1	1	kahawa_soweto_64_2
868	2420	2	2	1	1	kahawa_soweto_478_2
869	2421	2	2	1	1	kahawa_soweto_692_2
870	2422	2	2	1	1	kahawa_soweto_775_2
871	2423	2	2	1	1	kahawa_soweto_300_2
872	2424	2	2	1	1	kahawa_soweto_78_2
873	2425	2	2	1	1	kahawa_soweto_346_2
874	2426	2	2	1	1	kahawa_soweto_221_2
875	2427	2	2	1	1	kahawa_soweto_276_2
876	2428	2	2	1	1	kahawa_soweto_313_2
877	2429	2	2	1	1	kahawa_soweto_605_2
878	2430	2	2	1	1	kahawa_soweto_627_2
879	2431	2	2	1	1	kahawa_soweto_234_2
880	2432	2	2	1	1	kahawa_soweto_231_2
881	2433	2	2	1	1	kahawa_soweto_143_2
882	2434	2	2	1	1	kahawa_soweto_686_2
883	2435	2	2	1	1	kahawa_soweto_95_2
884	2436	2	2	1	1	kahawa_soweto_396_2
885	2437	2	2	1	1	kahawa_soweto_242_2
886	2438	2	2	1	1	kahawa_soweto_237_2
887	2439	2	2	1	1	kahawa_soweto_80_2
888	2440	2	2	1	1	kahawa_soweto_655_2
889	2441	2	2	1	1	kahawa_soweto_326_2
890	2442	2	2	1	1	kahawa_soweto_149_2
891	2443	2	2	1	1	kahawa_soweto_155_2
892	2444	2	2	1	1	kahawa_soweto_301_2
893	2445	2	2	1	1	kahawa_soweto_526_2
894	2446	2	2	1	1	kahawa_soweto_288_2
895	2447	2	2	1	1	kahawa_soweto_12_2
896	2448	2	2	1	1	kahawa_soweto_774_2
897	2449	2	2	1	1	kahawa_soweto_280_2
898	2450	2	2	1	1	kahawa_soweto_454_2
899	2451	2	2	1	1	kahawa_soweto_319_2
900	2452	2	2	1	1	kahawa_soweto_529_2
901	2453	2	2	1	1	kahawa_soweto_576_2
902	2454	2	2	1	1	kahawa_soweto_495_2
903	2455	2	2	1	1	kahawa_soweto_660_2
904	2456	2	2	1	1	kahawa_soweto_146_2
905	2457	2	2	1	1	kahawa_soweto_494_2
906	2458	2	2	1	1	kahawa_soweto_322_2
907	2459	2	2	1	1	kahawa_soweto_116_2
908	2460	2	2	1	1	kahawa_soweto_31_2
909	2461	2	2	1	1	kahawa_soweto_649_2
910	2462	2	2	1	1	kahawa_soweto_669_2
911	2463	2	2	1	1	kahawa_soweto_413_2
912	2464	2	2	1	1	kahawa_soweto_230_2
913	2465	2	2	1	1	kahawa_soweto_514_2
914	2466	2	2	1	1	kahawa_soweto_387_2
915	2467	2	2	1	1	kahawa_soweto_56_2
916	2468	2	2	1	1	kahawa_soweto_140_2
917	2469	2	2	1	1	kahawa_soweto_671_2
918	2470	2	2	1	1	kahawa_soweto_217_2
919	2471	2	2	1	1	kahawa_soweto_544_2
920	2472	2	2	1	1	kahawa_soweto_656_2
921	2473	2	2	1	1	kahawa_soweto_19_2
922	2474	2	2	1	1	kahawa_soweto_648_2
923	2475	2	2	1	1	kahawa_soweto_744_2
924	2476	2	2	1	1	kahawa_soweto_647_2
925	2477	2	2	1	1	kahawa_soweto_583_2
926	2478	2	2	1	1	kahawa_soweto_765_2
927	2479	2	2	1	1	kahawa_soweto_169_2
928	2480	2	2	1	1	kahawa_soweto_676_2
929	2481	2	2	1	1	kahawa_soweto_350_2
930	2482	2	2	1	1	kahawa_soweto_644_2
931	2483	2	2	1	1	kahawa_soweto_360_2
932	2484	2	2	1	1	kahawa_soweto_254_2
933	2485	2	2	1	1	kahawa_soweto_433_2
934	2486	2	2	1	1	kahawa_soweto_378_2
935	2487	2	2	1	1	kahawa_soweto_545_2
936	2488	2	2	1	1	kahawa_soweto_437_2
937	2489	2	2	1	1	kahawa_soweto_750_2
938	2490	2	2	1	1	kahawa_soweto_646_2
939	2491	2	2	1	1	kahawa_soweto_257_2
940	2492	2	2	1	1	kahawa_soweto_51_2
941	2493	2	2	1	1	kahawa_soweto_192_2
942	2494	2	2	1	1	kahawa_soweto_372_2
943	2495	2	2	1	1	kahawa_soweto_358_2
944	2496	2	2	1	1	kahawa_soweto_385_2
945	2497	2	2	1	1	kahawa_soweto_664_2
946	2498	2	2	1	1	kahawa_soweto_159_2
947	2499	2	2	1	1	kahawa_soweto_283_2
948	2500	2	2	1	1	kahawa_soweto_582_2
949	2501	2	2	1	1	kahawa_soweto_24_2
950	2502	2	2	1	1	kahawa_soweto_105_2
951	2503	2	2	1	1	kahawa_soweto_477_2
952	2504	2	2	1	1	kahawa_soweto_601_2
953	2505	2	2	1	1	kahawa_soweto_641_2
954	2506	2	2	1	1	kahawa_soweto_752_2
955	2507	2	2	1	1	kahawa_soweto_81_2
956	2508	2	2	1	1	kahawa_soweto_742_2
957	2509	2	2	1	1	kahawa_soweto_543_2
958	2510	2	2	1	1	kahawa_soweto_441_2
959	2511	2	2	1	1	kahawa_soweto_171_2
960	2512	2	2	1	1	kahawa_soweto_613_2
961	2513	2	2	1	1	kahawa_soweto_616_2
962	2514	2	2	1	1	kahawa_soweto_1_2
963	2515	2	2	1	1	kahawa_soweto_439_2
964	2516	2	2	1	1	kahawa_soweto_732_2
965	2517	2	2	1	1	kahawa_soweto_517_2
966	2518	2	2	1	1	kahawa_soweto_223_2
967	2519	2	2	1	1	kahawa_soweto_60_2
968	2520	2	2	1	1	kahawa_soweto_561_2
969	2521	2	2	1	1	kahawa_soweto_128_2
970	2522	2	2	1	1	kahawa_soweto_238_2
971	2523	2	2	1	1	kahawa_soweto_622_2
972	2524	2	2	1	1	kahawa_soweto_458_2
973	2525	2	2	1	1	kahawa_soweto_270_2
974	2526	2	2	1	1	kahawa_soweto_749_2
975	2527	2	2	1	1	kahawa_soweto_334_2
976	2528	2	2	1	1	kahawa_soweto_161_2
977	2529	2	2	1	1	kahawa_soweto_244_2
978	2530	2	2	1	1	kahawa_soweto_392_2
979	2531	2	2	1	1	kahawa_soweto_262_2
980	2532	2	2	1	1	kahawa_soweto_240_2
981	2533	2	2	1	1	kahawa_soweto_701_2
982	2534	2	2	1	1	kahawa_soweto_548_2
983	2535	2	2	1	1	kahawa_soweto_228_2
984	2536	2	2	1	1	kahawa_soweto_292_2
985	2537	2	2	1	1	kahawa_soweto_761_2
986	2538	2	2	1	1	kahawa_soweto_46_2
987	2539	2	2	1	1	kahawa_soweto_614_2
988	2540	2	2	1	1	kahawa_soweto_496_2
989	2541	2	2	1	1	kahawa_soweto_22_2
990	2542	2	2	1	1	kahawa_soweto_177_2
991	2543	2	2	1	1	kahawa_soweto_762_2
992	2544	2	2	1	1	kahawa_soweto_304_2
993	2545	2	2	1	1	kahawa_soweto_277_2
994	2546	2	2	1	1	kahawa_soweto_760_2
995	2547	2	2	1	1	kahawa_soweto_632_2
996	2548	2	2	1	1	kahawa_soweto_674_2
997	2549	2	2	1	1	kahawa_soweto_577_2
998	2550	2	2	1	1	kahawa_soweto_227_2
999	2551	2	2	1	1	kahawa_soweto_464_2
1000	2552	2	2	1	1	kahawa_soweto_446_2
1001	2553	2	2	1	1	kahawa_soweto_314_2
1002	2554	2	2	1	1	kahawa_soweto_483_2
1003	2555	2	2	1	1	kahawa_soweto_239_2
1004	2556	2	2	1	1	kahawa_soweto_506_2
1005	2557	2	2	1	1	kahawa_soweto_181_2
1006	2558	2	2	1	1	kahawa_soweto_609_2
1007	2559	2	2	1	1	kahawa_soweto_338_2
1008	2560	2	2	1	1	kahawa_soweto_361_2
1009	2561	2	2	1	1	kahawa_soweto_62_2
1010	2562	2	2	1	1	kahawa_soweto_512_2
1011	2563	2	2	1	1	kahawa_soweto_485_2
1012	2564	2	2	1	1	kahawa_soweto_481_2
1013	2565	2	2	1	1	kahawa_soweto_86_2
1014	2566	2	2	1	1	kahawa_soweto_282_2
1015	2567	2	2	1	1	kahawa_soweto_436_2
1016	2568	2	2	1	1	kahawa_soweto_408_2
1017	2569	2	2	1	1	kahawa_soweto_255_2
1018	2570	2	2	1	1	kahawa_soweto_7_2
1019	2571	2	2	1	1	kahawa_soweto_102_2
1020	2572	2	2	1	1	kahawa_soweto_724_2
1021	2573	2	2	1	1	kahawa_soweto_193_2
1022	2574	2	2	1	1	kahawa_soweto_216_2
1023	2575	2	2	1	1	kahawa_soweto_502_2
1024	2576	2	2	1	1	kahawa_soweto_432_2
1025	2577	2	2	1	1	kahawa_soweto_307_2
1026	2578	2	2	1	1	kahawa_soweto_776_2
1027	2579	2	2	1	1	kahawa_soweto_323_2
1028	2580	2	2	1	1	kahawa_soweto_249_2
1029	2581	2	2	1	1	kahawa_soweto_365_2
1030	2582	2	2	1	1	kahawa_soweto_566_2
1031	2583	2	2	1	1	kahawa_soweto_382_2
1032	2584	2	2	1	1	kahawa_soweto_471_2
1033	2585	2	2	1	1	kahawa_soweto_2_2
1034	2586	2	2	1	1	kahawa_soweto_457_2
1035	2587	2	2	1	1	kahawa_soweto_703_2
1036	2588	2	2	1	1	kahawa_soweto_367_2
1037	2589	2	2	1	1	kahawa_soweto_388_2
1038	2590	2	2	1	1	kahawa_soweto_50_2
1039	2591	2	2	1	1	kahawa_soweto_243_2
1040	2592	2	2	1	1	kahawa_soweto_83_2
1041	2593	2	2	1	1	kahawa_soweto_665_2
1042	2594	2	2	1	1	kahawa_soweto_220_2
1043	2595	2	2	1	1	kahawa_soweto_211_2
1044	2596	2	2	1	1	kahawa_soweto_305_2
1045	2597	2	2	1	1	kahawa_soweto_136_2
1046	2598	2	2	1	1	kahawa_soweto_559_2
1047	2599	2	2	1	1	kahawa_soweto_570_2
1048	2600	2	2	1	1	kahawa_soweto_251_2
1049	2601	2	2	1	1	kahawa_soweto_452_2
1050	2602	2	2	1	1	kahawa_soweto_666_2
1051	2603	2	2	1	1	kahawa_soweto_463_2
1052	2604	2	2	1	1	kahawa_soweto_431_2
1053	2605	2	2	1	1	kahawa_soweto_661_2
1054	2606	2	2	1	1	kahawa_soweto_462_2
1055	2607	2	2	1	1	kahawa_soweto_426_2
1056	2608	2	2	1	1	kahawa_soweto_538_2
1057	2609	2	2	1	1	kahawa_soweto_371_2
1058	2610	2	2	1	1	kahawa_soweto_604_2
1059	2611	2	2	1	1	kahawa_soweto_133_2
1060	2612	2	2	1	1	kahawa_soweto_635_2
1061	2613	2	2	1	1	kahawa_soweto_8_2
1062	2614	2	2	1	1	kahawa_soweto_93_2
1063	2615	2	2	1	1	kahawa_soweto_384_2
1064	2616	2	2	1	1	kahawa_soweto_289_2
1065	2617	2	2	1	1	kahawa_soweto_764_2
1066	2618	2	2	1	1	kahawa_soweto_108_2
1067	2619	2	2	1	1	kahawa_soweto_131_2
1068	2620	2	2	1	1	kahawa_soweto_260_2
1069	2621	2	2	1	1	kahawa_soweto_261_2
1070	2622	2	2	1	1	kahawa_soweto_584_2
1071	2623	2	2	1	1	kahawa_soweto_381_2
1072	2624	2	2	1	1	kahawa_soweto_475_2
1073	2625	2	2	1	1	kahawa_soweto_359_2
1074	2626	2	2	1	1	kahawa_soweto_20_2
1075	2627	2	2	1	1	kahawa_soweto_607_2
1076	2628	2	2	1	1	kahawa_soweto_779_2
1077	2629	2	2	1	1	kahawa_soweto_368_2
1078	2630	2	2	1	1	kahawa_soweto_150_2
1079	2631	2	2	1	1	kahawa_soweto_106_2
1080	2632	2	2	1	1	kahawa_soweto_420_2
1081	2633	2	2	1	1	kahawa_soweto_281_2
1082	2634	2	2	1	1	kahawa_soweto_523_2
1083	2635	2	2	1	1	kahawa_soweto_273_2
1084	2636	2	2	1	1	kahawa_soweto_522_2
1085	2637	2	2	1	1	kahawa_soweto_683_2
1086	2638	2	2	1	1	kahawa_soweto_295_2
1087	2639	2	2	1	1	kahawa_soweto_411_2
1088	2640	2	2	1	1	kahawa_soweto_618_2
1089	2641	2	2	1	1	kahawa_soweto_175_2
1090	2642	2	2	1	1	kahawa_soweto_330_2
1091	2643	2	2	1	1	kahawa_soweto_482_2
1092	2644	2	2	1	1	kahawa_soweto_30_2
1093	2645	2	2	1	1	kahawa_soweto_152_2
1094	2646	2	2	1	1	kahawa_soweto_97_2
1095	2647	2	2	1	1	kahawa_soweto_122_2
1096	2648	2	2	1	1	kahawa_soweto_287_2
1097	2649	2	2	1	1	kahawa_soweto_731_2
1098	2650	2	2	1	1	kahawa_soweto_335_2
1099	2651	2	2	1	1	kahawa_soweto_208_2
1100	2652	2	2	1	1	kahawa_soweto_318_2
1101	2653	2	2	1	1	kahawa_soweto_61_2
1102	2654	2	2	1	1	kahawa_soweto_23_2
1103	2655	2	2	1	1	kahawa_soweto_772_2
1104	2656	2	2	1	1	kahawa_soweto_253_2
1105	2657	2	2	1	1	kahawa_soweto_291_2
1106	2658	2	2	1	1	kahawa_soweto_768_2
1107	2659	2	2	1	1	kahawa_soweto_620_2
1108	2660	2	2	1	1	kahawa_soweto_597_2
1109	2661	2	2	1	1	kahawa_soweto_121_2
1110	2662	2	2	1	1	kahawa_soweto_309_2
1111	2663	2	2	1	1	kahawa_soweto_443_2
1112	2664	2	2	1	1	kahawa_soweto_373_2
1113	2665	2	2	1	1	kahawa_soweto_700_2
1114	2666	2	2	1	1	kahawa_soweto_629_2
1115	2667	2	2	1	1	kahawa_soweto_115_2
1116	2668	2	2	1	1	kahawa_soweto_636_2
1117	2669	2	2	1	1	kahawa_soweto_209_2
1118	2670	2	2	1	1	kahawa_soweto_298_2
1119	2671	2	2	1	1	kahawa_soweto_337_2
1120	2672	2	2	1	1	kahawa_soweto_386_2
1121	2673	2	2	1	1	kahawa_soweto_663_2
1122	2674	2	2	1	1	kahawa_soweto_272_2
1123	2675	2	2	1	1	kahawa_soweto_274_2
1124	2676	2	2	1	1	kahawa_soweto_110_2
1125	2677	2	2	1	1	kahawa_soweto_290_2
1126	2678	2	2	1	1	kahawa_soweto_226_2
1127	2679	2	2	1	1	kahawa_soweto_633_2
1128	2680	2	2	1	1	kahawa_soweto_351_2
1129	2681	2	2	1	1	kahawa_soweto_709_2
1130	2682	2	2	1	1	kahawa_soweto_164_2
1131	2683	2	2	1	1	kahawa_soweto_27_2
1132	2684	2	2	1	1	kahawa_soweto_515_2
1133	2685	2	2	1	1	kahawa_soweto_737_2
1134	2686	2	2	1	1	kahawa_soweto_278_2
1135	2687	2	2	1	1	kahawa_soweto_736_2
1136	2688	2	2	1	1	kahawa_soweto_296_2
1137	2689	2	2	1	1	kahawa_soweto_256_2
1138	2690	2	2	1	1	kahawa_soweto_476_2
1139	2691	2	2	1	1	kahawa_soweto_312_2
1140	2692	2	2	1	1	kahawa_soweto_76_2
1141	2693	2	2	1	1	kahawa_soweto_469_2
1142	2694	2	2	1	1	kahawa_soweto_320_2
1143	2695	2	2	1	1	kahawa_soweto_37_2
1144	2696	2	2	1	1	kahawa_soweto_528_2
1145	2697	2	2	1	1	kahawa_soweto_153_2
1146	2698	2	2	1	1	kahawa_soweto_134_2
1147	2699	2	2	1	1	kahawa_soweto_284_2
1148	2700	2	2	1	1	kahawa_soweto_489_2
1149	2701	2	2	1	1	kahawa_soweto_658_2
1150	2702	2	2	1	1	kahawa_soweto_685_2
1151	2703	2	2	1	1	kahawa_soweto_707_2
1152	2704	2	2	1	1	kahawa_soweto_721_2
1153	2705	2	2	1	1	kahawa_soweto_572_2
1154	2706	2	2	1	1	kahawa_soweto_694_2
1155	2707	2	2	1	1	kahawa_soweto_626_2
1156	2708	2	2	1	1	kahawa_soweto_672_2
1157	2709	2	2	1	1	kahawa_soweto_773_2
1158	2710	2	2	1	1	kahawa_soweto_757_2
1159	2711	2	2	1	1	kahawa_soweto_637_2
1160	2712	2	2	1	1	kahawa_soweto_728_2
1161	2713	2	2	1	1	kahawa_soweto_49_2
1162	2714	2	2	1	1	kahawa_soweto_104_2
1163	2715	2	2	1	1	kahawa_soweto_719_2
1164	2716	2	2	1	1	kahawa_soweto_532_2
1165	2717	2	2	1	1	kahawa_soweto_461_2
1166	2718	2	2	1	1	kahawa_soweto_390_2
1167	2719	2	2	1	1	kahawa_soweto_652_2
1168	2720	2	2	1	1	kahawa_soweto_317_2
1169	2721	2	2	1	1	kahawa_soweto_297_2
1170	2722	2	2	1	1	kahawa_soweto_541_2
1171	2723	2	2	1	1	kahawa_soweto_725_2
1172	2724	2	2	1	1	kahawa_soweto_236_2
1173	2725	2	2	1	1	kahawa_soweto_247_2
1174	2726	2	2	1	1	kahawa_soweto_507_2
1175	2727	2	2	1	1	kahawa_soweto_630_2
1176	2728	2	2	1	1	kahawa_soweto_48_2
1177	2729	2	2	1	1	kahawa_soweto_645_2
1178	2730	2	2	1	1	kahawa_soweto_659_2
1179	2731	2	2	1	1	kahawa_soweto_59_2
1180	2732	2	2	1	1	kahawa_soweto_141_2
1181	2733	2	2	1	1	kahawa_soweto_558_2
1182	2734	2	2	1	1	kahawa_soweto_521_2
1183	2735	2	2	1	1	kahawa_soweto_708_2
1184	2736	2	2	1	1	kahawa_soweto_594_2
1185	2737	2	2	1	1	kahawa_soweto_264_2
1186	2738	2	2	1	1	kahawa_soweto_70_2
1187	2739	2	2	1	1	kahawa_soweto_363_2
1188	2740	2	2	1	1	kahawa_soweto_199_2
1189	2741	2	2	1	1	kahawa_soweto_345_2
1190	2742	2	2	1	1	kahawa_soweto_241_2
1191	2743	2	2	1	1	kahawa_soweto_640_2
1192	2744	2	2	1	1	kahawa_soweto_769_2
1193	2745	2	2	1	1	kahawa_soweto_600_2
1194	2746	2	2	1	1	kahawa_soweto_355_2
1195	2747	2	2	1	1	kahawa_soweto_540_2
1196	2748	2	2	1	1	kahawa_soweto_100_2
1197	2749	2	2	1	1	kahawa_soweto_763_2
1198	2750	2	2	1	1	kahawa_soweto_634_2
1199	2751	2	2	1	1	kahawa_soweto_579_2
1200	2752	2	2	1	1	kahawa_soweto_771_2
1201	2753	2	2	1	1	kahawa_soweto_156_2
1202	2754	2	2	1	1	kahawa_soweto_101_2
1203	2755	2	2	1	1	kahawa_soweto_612_2
1204	2756	2	2	1	1	kahawa_soweto_339_2
1205	2757	2	2	1	1	kahawa_soweto_222_2
1206	2758	2	2	1	1	kahawa_soweto_638_2
1207	2759	2	2	1	1	kahawa_soweto_520_2
1208	2760	2	2	1	1	kahawa_soweto_47_2
1209	2761	2	2	1	1	kahawa_soweto_741_2
1210	2762	2	2	1	1	kahawa_soweto_176_2
1211	2763	2	2	1	1	kahawa_soweto_693_2
1212	2764	2	2	1	1	kahawa_soweto_162_2
1213	2765	2	2	1	1	kahawa_soweto_746_2
1214	2766	2	2	1	1	kahawa_soweto_10_2
1215	2767	2	2	1	1	kahawa_soweto_599_2
1216	2768	2	2	1	1	kahawa_soweto_321_2
1217	2769	2	2	1	1	kahawa_soweto_34_2
1218	2770	2	2	1	1	kahawa_soweto_748_2
1219	2771	2	2	1	1	kahawa_soweto_474_2
1220	2772	2	2	1	1	kahawa_soweto_145_2
1221	2773	2	2	1	1	kahawa_soweto_180_2
1222	2774	2	2	1	1	kahawa_soweto_715_2
1223	2775	2	2	1	1	kahawa_soweto_608_2
1224	2776	2	2	1	1	kahawa_soweto_602_2
1225	2777	2	2	1	1	kahawa_soweto_430_2
1226	2778	2	2	1	1	kahawa_soweto_71_2
1227	2779	2	2	1	1	kahawa_soweto_499_2
1228	2780	2	2	1	1	kahawa_soweto_695_2
1229	2781	2	2	1	1	kahawa_soweto_445_2
1230	2782	2	2	1	1	kahawa_soweto_191_2
1231	2783	2	2	1	1	kahawa_soweto_57_2
1232	2784	2	2	1	1	kahawa_soweto_263_2
1233	2785	2	2	1	1	kahawa_soweto_621_2
1234	2786	2	2	1	1	kahawa_soweto_497_2
1235	2787	2	2	1	1	kahawa_soweto_85_2
1236	2788	2	2	1	1	kahawa_soweto_144_2
1237	2789	2	2	1	1	kahawa_soweto_123_2
1238	2790	2	2	1	1	kahawa_soweto_92_2
1239	2791	2	2	1	1	kahawa_soweto_130_2
1240	2792	2	2	1	1	kahawa_soweto_179_2
1241	2793	2	2	1	1	kahawa_soweto_391_2
1242	2794	2	2	1	1	kahawa_soweto_767_2
1243	2795	2	2	1	1	kahawa_soweto_98_2
1244	2796	2	2	1	1	kahawa_soweto_516_2
1245	2797	2	2	1	1	kahawa_soweto_553_2
1246	2798	2	2	1	1	kahawa_soweto_509_2
1247	2799	2	2	1	1	kahawa_soweto_677_2
1248	2800	2	2	1	1	kahawa_soweto_654_2
1249	2801	2	2	1	1	kahawa_soweto_58_2
1250	2802	2	2	1	1	kahawa_soweto_442_2
1251	2803	2	2	1	1	kahawa_soweto_160_2
1252	2804	2	2	1	1	kahawa_soweto_628_2
1253	2805	2	2	1	1	kahawa_soweto_205_2
1254	2806	2	2	1	1	kahawa_soweto_777_2
1255	2807	2	2	1	1	kahawa_soweto_588_2
1256	2808	2	2	1	1	kahawa_soweto_591_2
1257	2809	2	2	1	1	kahawa_soweto_555_2
1258	2810	2	2	1	1	kahawa_soweto_308_2
1259	2811	2	2	1	1	kahawa_soweto_266_2
1260	2812	2	2	1	1	kahawa_soweto_332_2
1261	2813	2	2	1	1	kahawa_soweto_642_2
1262	2814	2	2	1	1	kahawa_soweto_427_2
1263	2815	2	2	1	1	kahawa_soweto_568_2
1264	2816	2	2	1	1	kahawa_soweto_449_2
1265	2817	2	2	1	1	kahawa_soweto_379_2
1266	2818	2	2	1	1	kahawa_soweto_667_2
1267	2819	2	2	1	1	kahawa_soweto_518_2
1268	2820	2	2	1	1	kahawa_soweto_44_2
1269	2821	2	2	1	1	kahawa_soweto_466_2
1270	2822	2	2	1	1	kahawa_soweto_451_2
1271	2823	2	2	1	1	kahawa_soweto_524_2
1272	2824	2	2	1	1	kahawa_soweto_682_2
1273	2825	2	2	1	1	kahawa_soweto_15_2
1274	2826	2	2	1	1	kahawa_soweto_389_2
1275	2827	2	2	1	1	kahawa_soweto_696_2
1276	2828	2	2	1	1	kahawa_soweto_560_2
1277	2829	2	2	1	1	kahawa_soweto_534_2
1278	2830	2	2	1	1	kahawa_soweto_63_2
1279	2831	2	2	1	1	kahawa_soweto_733_2
1280	2832	2	2	1	1	kahawa_soweto_726_2
1281	2833	2	2	1	1	kahawa_soweto_554_2
1282	2834	2	2	1	1	kahawa_soweto_165_2
1283	2835	2	2	1	1	kahawa_soweto_349_2
1284	2836	2	2	1	1	kahawa_soweto_710_2
1285	2837	2	2	1	1	kahawa_soweto_35_2
1286	2838	2	2	1	1	kahawa_soweto_135_2
1287	2839	2	2	1	1	kahawa_soweto_120_2
1288	2840	2	2	1	1	kahawa_soweto_299_2
1289	2841	2	2	1	1	kahawa_soweto_294_2
1290	2842	2	2	1	1	kahawa_soweto_203_2
1291	2843	2	2	1	1	kahawa_soweto_380_2
1292	2844	2	2	1	1	kahawa_soweto_510_2
1293	2845	2	2	1	1	kahawa_soweto_492_2
1294	2846	2	2	1	1	kahawa_soweto_542_2
1295	2847	2	2	1	1	kahawa_soweto_65_2
1296	2848	2	2	1	1	kahawa_soweto_14_2
1297	2849	2	2	1	1	kahawa_soweto_754_2
1298	2850	2	2	1	1	kahawa_soweto_250_2
1299	2851	2	2	1	1	kahawa_soweto_619_2
1300	2852	2	2	1	1	kahawa_soweto_72_2
1301	2853	2	2	1	1	kahawa_soweto_513_2
1302	2854	2	2	1	1	kahawa_soweto_690_2
1303	2855	2	2	1	1	kahawa_soweto_419_2
1304	2856	2	2	1	1	kahawa_soweto_265_2
1305	2857	2	2	1	1	kahawa_soweto_556_2
1306	2858	2	2	1	1	kahawa_soweto_43_2
1307	2859	2	2	1	1	kahawa_soweto_730_2
1308	2860	2	2	1	1	kahawa_soweto_691_2
1309	2861	2	2	1	1	kahawa_soweto_480_2
1310	2862	2	2	1	1	kahawa_soweto_206_2
1311	2863	2	2	1	1	kahawa_soweto_563_2
1312	2864	2	2	1	1	kahawa_soweto_511_2
1313	2865	2	2	1	1	kahawa_soweto_459_2
1314	2866	2	2	1	1	kahawa_soweto_258_2
1315	2867	2	2	1	1	kahawa_soweto_354_2
1316	2868	2	2	1	1	kahawa_soweto_716_2
1317	2869	2	2	1	1	kahawa_soweto_617_2
1318	2870	2	2	1	1	kahawa_soweto_200_2
1319	2871	2	2	1	1	kahawa_soweto_587_2
1320	2872	2	2	1	1	kahawa_soweto_631_2
1321	2873	2	2	1	1	kahawa_soweto_99_2
1322	2874	2	2	1	1	kahawa_soweto_275_2
1323	2875	2	2	1	1	kahawa_soweto_109_2
1324	2876	2	2	1	1	kahawa_soweto_383_2
1325	2877	2	2	1	1	kahawa_soweto_781_2
1326	2878	2	2	1	1	kahawa_soweto_248_2
1327	2879	2	2	1	1	kahawa_soweto_139_2
1328	2880	2	2	1	1	kahawa_soweto_678_2
1329	2881	2	2	1	1	kahawa_soweto_747_2
1330	2882	2	2	1	1	kahawa_soweto_784_2
1331	2883	2	2	1	1	kahawa_soweto_434_2
1332	2884	2	2	1	1	kahawa_soweto_39_2
1333	2885	2	2	1	1	kahawa_soweto_89_2
1334	2886	2	2	1	1	kahawa_soweto_403_2
1335	2887	2	2	1	1	kahawa_soweto_11_2
1336	2888	2	2	1	1	kahawa_soweto_279_2
1337	2889	2	2	1	1	kahawa_soweto_366_2
1338	2890	2	2	1	1	kahawa_soweto_170_2
1339	2891	2	2	1	1	kahawa_soweto_148_2
1340	2892	2	2	1	1	kahawa_soweto_536_2
1341	2893	2	2	1	1	kahawa_soweto_357_2
1342	2894	2	2	1	1	kahawa_soweto_74_2
1343	2895	2	2	1	1	kahawa_soweto_204_2
1344	2896	2	2	1	1	kahawa_soweto_114_2
1345	2897	2	2	1	1	kahawa_soweto_54_2
1346	2898	2	2	1	1	kahawa_soweto_197_2
1347	2899	2	2	1	1	kahawa_soweto_25_2
1348	2900	2	2	1	1	kahawa_soweto_681_2
1349	2901	2	2	1	1	kahawa_soweto_151_2
1350	2902	2	2	1	1	kahawa_soweto_42_2
1351	2903	2	2	1	1	kahawa_soweto_157_2
1352	2904	2	2	1	1	kahawa_soweto_55_2
1353	2905	2	2	1	1	kahawa_soweto_38_2
1354	2906	2	2	1	1	kahawa_soweto_440_2
1355	2907	2	2	1	1	kahawa_soweto_195_2
1356	2908	2	2	1	1	kahawa_soweto_531_2
1357	2909	2	2	1	1	kahawa_soweto_225_2
1358	2910	2	2	1	1	kahawa_soweto_657_2
1359	2911	2	2	1	1	kahawa_soweto_705_2
1360	2912	2	2	1	1	kahawa_soweto_166_2
1361	2913	2	2	1	1	kahawa_soweto_697_2
1362	2914	2	2	1	1	kahawa_soweto_376_2
1363	2915	2	2	1	1	kahawa_soweto_723_2
1364	2916	2	2	1	1	kahawa_soweto_581_2
1365	2917	2	2	1	1	kahawa_soweto_596_2
1366	2918	2	2	1	1	kahawa_soweto_533_2
1367	2919	2	2	1	1	kahawa_soweto_585_2
1368	2920	2	2	1	1	kahawa_soweto_651_2
1369	2921	2	2	1	1	kahawa_soweto_783_2
1370	2922	2	2	1	1	kahawa_soweto_564_2
1371	2923	2	2	1	1	kahawa_soweto_353_2
1372	2924	2	2	1	1	kahawa_soweto_465_2
1373	2925	2	2	1	1	kahawa_soweto_447_2
1374	2926	2	2	1	1	kahawa_soweto_546_2
1375	2927	2	2	1	1	kahawa_soweto_530_2
1376	2928	2	2	1	1	kahawa_soweto_111_2
1377	2929	2	2	1	1	kahawa_soweto_364_2
1378	2930	2	2	1	1	kahawa_soweto_424_2
1379	2931	2	2	1	1	kahawa_soweto_125_2
1380	2932	2	2	1	1	kahawa_soweto_662_2
1381	2933	2	2	1	1	kahawa_soweto_26_2
1382	2934	2	2	1	1	kahawa_soweto_348_2
1383	2935	2	2	1	1	kahawa_soweto_751_2
1384	2936	2	2	1	1	kahawa_soweto_444_2
1385	2937	2	2	1	1	kahawa_soweto_753_2
1386	2938	2	2	1	1	kahawa_soweto_168_2
1387	2939	2	2	1	1	kahawa_soweto_571_2
1388	2940	2	2	1	1	kahawa_soweto_595_2
1389	2941	2	2	1	1	kahawa_soweto_405_2
1390	2942	2	2	1	1	kahawa_soweto_418_2
1391	2943	2	2	1	1	kahawa_soweto_527_2
1392	2944	2	2	1	1	kahawa_soweto_729_2
1393	2945	2	2	1	1	kahawa_soweto_377_2
1394	2946	2	2	1	1	kahawa_soweto_91_2
1395	2947	2	2	1	1	kahawa_soweto_670_2
1396	2948	2	2	1	1	kahawa_soweto_67_2
1397	2949	2	2	1	1	kahawa_soweto_215_2
1398	2950	2	2	1	1	kahawa_soweto_328_2
1399	2951	2	2	1	1	kahawa_soweto_592_2
1400	2952	2	2	1	1	kahawa_soweto_311_2
1401	2953	2	2	1	1	kahawa_soweto_727_2
1402	2954	2	2	1	1	kahawa_soweto_537_2
1403	2955	2	2	1	1	kahawa_soweto_639_2
1404	2956	2	2	1	1	kahawa_soweto_484_2
1405	2957	2	2	1	1	kahawa_soweto_500_2
1406	2958	2	2	1	1	kahawa_soweto_374_2
1407	2959	2	2	1	1	kahawa_soweto_735_2
1408	2960	2	2	1	1	kahawa_soweto_525_2
1409	2961	2	2	1	1	kahawa_soweto_567_2
1410	2962	2	2	1	1	kahawa_soweto_271_2
1411	2963	2	2	1	1	kahawa_soweto_698_2
1412	2964	2	2	1	1	kahawa_soweto_428_2
1413	2965	2	2	1	1	kahawa_soweto_187_2
1414	2966	2	2	1	1	kahawa_soweto_302_2
1415	2967	2	2	1	1	kahawa_soweto_224_2
1416	2968	2	2	1	1	kahawa_soweto_417_2
1417	2969	2	2	1	1	kahawa_soweto_706_2
1418	2970	2	2	1	1	kahawa_soweto_340_2
1419	2971	2	2	1	1	kahawa_soweto_138_2
1420	2972	2	2	1	1	kahawa_soweto_36_2
1421	2973	2	2	1	1	kahawa_soweto_126_2
1422	2974	2	2	1	1	kahawa_soweto_673_2
1423	2975	2	2	1	1	kahawa_soweto_286_2
1424	2976	2	2	1	1	kahawa_soweto_429_2
1425	2977	2	2	1	1	kahawa_soweto_535_2
1426	2978	2	2	1	1	kahawa_soweto_467_2
1427	2979	2	2	1	1	kahawa_soweto_333_2
1428	2980	2	2	1	1	kahawa_soweto_718_2
1429	2981	2	2	1	1	kahawa_soweto_778_2
1430	2982	2	2	1	1	kahawa_soweto_194_2
1431	2983	2	2	1	1	kahawa_soweto_743_2
1432	2984	2	2	1	1	kahawa_soweto_722_2
1433	2985	2	2	1	1	kahawa_soweto_573_2
1434	2986	2	2	1	1	kahawa_soweto_182_2
1435	2987	2	2	1	1	kahawa_soweto_689_2
1436	2988	2	2	1	1	kahawa_soweto_738_2
1437	2989	2	2	1	1	kahawa_soweto_438_2
1438	2990	2	2	1	1	kahawa_soweto_402_2
1439	2991	2	2	1	1	kahawa_soweto_410_2
1440	2992	2	2	1	1	kahawa_soweto_453_2
1441	2993	2	2	1	1	kahawa_soweto_699_2
1442	2994	2	2	1	1	kahawa_soweto_212_2
1443	2995	2	2	1	1	kahawa_soweto_623_2
1444	2996	2	2	1	1	kahawa_soweto_493_2
1445	2997	2	2	1	1	kahawa_soweto_163_2
1446	2998	2	2	1	1	kahawa_soweto_758_2
1447	2999	2	2	1	1	kahawa_soweto_32_2
1448	3000	2	2	1	1	kahawa_soweto_370_2
1449	3001	2	2	1	1	kahawa_soweto_189_2
1450	3002	2	2	1	1	kahawa_soweto_29_2
1451	3003	2	2	1	1	kahawa_soweto_103_2
1452	3004	2	2	1	1	kahawa_soweto_202_2
1453	3005	2	2	1	1	kahawa_soweto_129_2
1454	3006	2	2	1	1	kahawa_soweto_285_2
1455	3007	2	2	1	1	kahawa_soweto_398_2
1456	3008	2	2	1	1	kahawa_soweto_315_2
1457	3009	2	2	1	1	kahawa_soweto_734_2
1458	3010	2	2	1	1	kahawa_soweto_406_2
1459	3011	2	2	1	1	kahawa_soweto_759_2
1460	3012	2	2	1	1	kahawa_soweto_17_2
1461	3013	2	2	1	1	kahawa_soweto_213_2
1462	3014	2	2	1	1	kahawa_soweto_505_2
1463	3015	2	2	1	1	kahawa_soweto_717_2
1464	3016	2	2	1	1	kahawa_soweto_185_2
1465	3017	2	2	1	1	kahawa_soweto_52_2
1466	3018	2	2	1	1	kahawa_soweto_589_2
1467	3019	2	2	1	1	kahawa_soweto_460_2
1468	3020	2	2	1	1	kahawa_soweto_504_2
1469	3021	2	2	1	1	kahawa_soweto_362_2
1470	3022	2	2	1	1	kahawa_soweto_766_2
1471	3023	2	2	1	1	kahawa_soweto_232_2
1472	3024	2	2	1	1	kahawa_soweto_118_2
1473	3025	2	2	1	1	kahawa_soweto_325_2
1474	3026	2	2	1	1	kahawa_soweto_470_2
1475	3027	2	2	1	1	kahawa_soweto_401_2
1476	3028	2	2	1	1	kahawa_soweto_557_2
1477	3029	2	2	1	1	kahawa_soweto_178_2
1478	3030	2	2	1	1	kahawa_soweto_519_2
1479	3031	2	2	1	1	kahawa_soweto_21_2
1480	3032	2	2	1	1	kahawa_soweto_399_2
1481	3033	2	2	1	1	kahawa_soweto_680_2
1482	3034	2	2	1	1	kahawa_soweto_233_2
1483	3035	2	2	1	1	kahawa_soweto_214_2
1484	3036	2	2	1	1	kahawa_soweto_611_2
1485	3037	2	2	1	1	kahawa_soweto_740_2
1486	3038	2	2	1	1	kahawa_soweto_207_2
1487	3039	2	2	1	1	kahawa_soweto_329_2
1488	3040	2	2	1	1	kahawa_soweto_745_2
1489	3041	2	2	1	1	kahawa_soweto_107_2
1490	3042	2	2	1	1	kahawa_soweto_409_2
1491	3043	2	2	1	1	kahawa_soweto_653_2
1492	3044	2	2	1	1	kahawa_soweto_188_2
1493	3045	2	2	1	1	kahawa_soweto_259_2
1494	3046	2	2	1	1	kahawa_soweto_569_2
1495	3047	2	2	1	1	kahawa_soweto_422_2
1496	3048	2	2	1	1	kahawa_soweto_456_2
1497	3049	2	2	1	1	kahawa_soweto_352_2
1498	3050	2	2	1	1	kahawa_soweto_590_2
1499	3051	2	2	1	1	kahawa_soweto_112_2
1500	3052	2	2	1	1	kahawa_soweto_625_2
1501	3053	2	2	1	1	kahawa_soweto_94_2
1502	3054	2	2	1	1	kahawa_soweto_615_2
1503	3055	2	2	1	1	kahawa_soweto_229_2
1504	3056	2	2	1	1	kahawa_soweto_684_2
1505	3057	2	2	1	1	kahawa_soweto_404_2
1506	3058	2	2	1	1	kahawa_soweto_336_2
1507	3059	2	2	1	1	kahawa_soweto_132_2
1508	3060	2	2	1	1	kahawa_soweto_508_2
1509	3061	2	2	1	1	kahawa_soweto_342_2
1510	3062	2	2	1	1	kahawa_soweto_33_2
1511	3063	2	2	1	1	kahawa_soweto_90_2
1512	3064	2	2	1	1	kahawa_soweto_119_2
1513	3065	2	2	1	1	kahawa_soweto_127_2
1514	3066	2	2	1	1	kahawa_soweto_201_2
1515	3067	2	2	1	1	kahawa_soweto_593_2
1516	3068	2	2	1	1	kahawa_soweto_782_2
1517	3069	2	2	1	1	kahawa_soweto_96_2
1518	3070	2	2	1	1	kahawa_soweto_400_2
1519	3071	2	2	1	1	kahawa_soweto_303_2
1520	3072	2	2	1	1	kahawa_soweto_679_2
1521	3073	2	2	1	1	kahawa_soweto_316_2
1522	3074	2	2	1	1	kahawa_soweto_69_2
1523	3075	2	2	1	1	kahawa_soweto_40_2
1524	3076	2	2	1	1	kahawa_soweto_468_2
1525	3077	2	2	1	1	kahawa_soweto_172_2
1526	3078	2	2	1	1	kahawa_soweto_455_2
1527	3079	2	2	1	1	kahawa_soweto_488_2
1528	3080	2	2	1	1	kahawa_soweto_780_2
1529	3081	2	2	1	1	kahawa_soweto_450_2
1530	3082	2	2	1	1	kahawa_soweto_73_2
1531	3083	2	2	1	1	kahawa_soweto_606_2
1532	3084	2	2	1	1	kahawa_soweto_711_2
1533	3085	2	2	1	1	kahawa_soweto_547_2
1534	3086	2	2	1	1	kahawa_soweto_3_2
1535	3087	2	2	1	1	kahawa_soweto_4_2
1536	3088	2	2	1	1	kahawa_soweto_5_2
1537	3089	2	2	1	1	kahawa_soweto_714_2
1538	3090	2	2	1	1	kahawa_soweto_552_2
1539	3091	2	2	1	1	kahawa_soweto_75_2
1540	3092	2	2	1	1	kahawa_soweto_755_2
1541	3093	2	2	1	1	kahawa_soweto_713_2
1542	3094	2	2	1	1	kahawa_soweto_184_2
1543	3095	2	2	1	1	kahawa_soweto_393_2
1544	3096	2	2	1	1	kahawa_soweto_394_2
1545	3097	2	2	1	1	kahawa_soweto_407_2
1546	3098	2	2	1	1	kahawa_soweto_395_2
1547	3099	2	2	1	1	kahawa_soweto_416_2
1548	3100	2	2	1	1	kahawa_soweto_423_2
1549	3101	2	2	1	1	kahawa_soweto_551_2
1550	3102	2	2	1	1	kahawa_soweto_580_2
1551	3103	2	2	1	1	kahawa_soweto_598_2
1552	3104	2	2	1	1	kahawa_soweto_712_2
1553	3105	2	2	1	1	kahawa_soweto_45_2
1554	3106	2	2	1	1	kahawa_soweto_397_2
1555	3107	2	2	1	1	kahawa_soweto_624_2
1556	3108	2	2	1	1	kahawa_soweto_756_2
1557	2	1	1	1	1	beneficiary_Emba2
1558	3	1	1	1	1	beneficiary_Emba3
1559	4	1	1	1	1	beneficiary_Emba4
1560	5	1	1	1	1	beneficiary_Emba5
1561	6	1	1	1	1	beneficiary_Emba6
1562	7	1	1	1	1	beneficiary_Emba7
1563	8	1	1	1	1	beneficiary_Emba8
1564	9	1	1	1	1	beneficiary_Emba9
1565	10	1	1	1	1	beneficiary_Emba10
1566	11	1	1	1	1	beneficiary_Emba11
1567	12	1	1	1	1	beneficiary_Emba12
1568	13	1	1	1	1	beneficiary_Emba13
1569	14	1	1	1	1	beneficiary_Emba14
1570	15	1	1	1	1	beneficiary_Emba15
1571	16	1	1	1	1	beneficiary_Emba16
1572	17	1	1	1	1	beneficiary_Emba17
1573	18	1	1	1	1	beneficiary_Emba18
1574	19	1	1	1	1	beneficiary_Emba19
1575	20	1	1	1	1	beneficiary_Emba20
1576	21	1	1	1	1	beneficiary_Emba21
1577	23	1	1	1	1	beneficiary_Emba23
1578	24	1	1	1	1	beneficiary_Emba24
1579	25	1	1	1	1	beneficiary_Emba25
1580	26	1	1	1	1	beneficiary_Emba26
1581	27	1	1	1	1	beneficiary_Emba27
1582	28	1	1	1	1	beneficiary_Emba28
1583	29	1	1	1	1	beneficiary_Emba29
1584	30	1	1	1	1	beneficiary_Emba30
1585	31	1	1	1	1	beneficiary_Emba31
1586	32	1	1	1	1	beneficiary_Emba32
1587	33	1	1	1	1	beneficiary_Emba33
1588	34	1	1	1	1	beneficiary_Emba34
1589	35	1	1	1	1	beneficiary_Emba35
1590	36	1	1	1	1	beneficiary_Emba36
1591	37	1	1	1	1	beneficiary_Emba37
1592	38	1	1	1	1	beneficiary_Emba38
1593	39	1	1	1	1	beneficiary_Emba39
1594	40	1	1	1	1	beneficiary_Emba40
1595	41	1	1	1	1	beneficiary_Emba41
1596	42	1	1	1	1	beneficiary_Emba42
1597	44	1	1	1	1	beneficiary_Emba44
1598	45	1	1	1	1	beneficiary_Emba45
1599	46	1	1	1	1	beneficiary_Emba46
1600	47	1	1	1	1	beneficiary_Emba47
1601	48	1	1	1	1	beneficiary_Emba48
1602	49	1	1	1	1	beneficiary_Emba49
1603	50	1	1	1	1	beneficiary_Emba50
1604	51	1	1	1	1	beneficiary_Emba51
1605	52	1	1	1	1	beneficiary_Emba52
1606	53	1	1	1	1	beneficiary_Emba53
1607	54	1	1	1	1	beneficiary_Emba54
1608	55	1	1	1	1	beneficiary_Emba55
1609	56	1	1	1	1	beneficiary_Emba56
1610	57	1	1	1	1	beneficiary_Emba57
1611	58	1	1	1	1	beneficiary_Emba58
1612	59	1	1	1	1	beneficiary_Emba59
1613	60	1	1	1	1	beneficiary_Emba60
1614	62	1	1	1	1	beneficiary_Emba62
1615	63	1	1	1	1	beneficiary_Emba63
1616	64	1	1	1	1	beneficiary_Emba64
1617	65	1	1	1	1	beneficiary_Emba65
1618	66	1	1	1	1	beneficiary_Emba66
1619	67	1	1	1	1	beneficiary_Emba67
1620	68	1	1	1	1	beneficiary_Emba68
1621	69	1	1	1	1	beneficiary_Emba69
1622	71	1	1	1	1	beneficiary_Emba71
1623	72	1	1	1	1	beneficiary_Emba72
1624	73	1	1	1	1	beneficiary_Emba73
1625	74	1	1	1	1	beneficiary_Emba74
1626	75	1	1	1	1	beneficiary_Emba75
1627	76	1	1	1	1	beneficiary_Emba76
1628	77	1	1	1	1	beneficiary_Emba77
1629	78	1	1	1	1	beneficiary_Emba78
1630	79	1	1	1	1	beneficiary_Emba79
1631	80	1	1	1	1	beneficiary_Emba80
1632	81	1	1	1	1	beneficiary_Emba81
1633	82	1	1	1	1	beneficiary_Emba82
1634	83	1	1	1	1	beneficiary_Emba83
1635	84	1	1	1	1	beneficiary_Emba84
1636	85	1	1	1	1	beneficiary_Emba85
1637	86	1	1	1	1	beneficiary_Emba86
1638	87	1	1	1	1	beneficiary_Emba87
1639	88	1	1	1	1	beneficiary_Emba88
1640	89	1	1	1	1	beneficiary_Emba89
1641	90	1	1	1	1	beneficiary_Emba90
1642	91	1	1	1	1	beneficiary_Emba91
1643	92	1	1	1	1	beneficiary_Emba92
1644	94	1	1	1	1	beneficiary_Emba94
1645	95	1	1	1	1	beneficiary_Emba95
1646	96	1	1	1	1	beneficiary_Emba96
1647	97	1	1	1	1	beneficiary_Emba97
1648	98	1	1	1	1	beneficiary_Emba98
1649	99	1	1	1	1	beneficiary_Emba99
1650	100	1	1	1	1	beneficiary_Emba100
1651	101	1	1	1	1	beneficiary_Emba101
1652	102	1	1	1	1	beneficiary_Emba102
1653	103	1	1	1	1	beneficiary_Emba103
1654	104	1	1	1	1	beneficiary_Emba104
1655	105	1	1	1	1	beneficiary_Emba105
1656	106	1	1	1	1	beneficiary_Emba106
1657	107	1	1	1	1	beneficiary_Emba107
1658	108	1	1	1	1	beneficiary_Emba108
1659	109	1	1	1	1	beneficiary_Emba109
1660	110	1	1	1	1	beneficiary_Emba110
1661	111	1	1	1	1	beneficiary_Emba111
1662	112	1	1	1	1	beneficiary_Emba112
1663	113	1	1	1	1	beneficiary_Emba113
1664	114	1	1	1	1	beneficiary_Emba114
1665	115	1	1	1	1	beneficiary_Emba115
1666	117	1	1	1	1	beneficiary_Emba117
1667	118	1	1	1	1	beneficiary_Emba118
1668	119	1	1	1	1	beneficiary_Emba119
1669	120	1	1	1	1	beneficiary_Emba120
1670	121	1	1	1	1	beneficiary_Emba121
1671	122	1	1	1	1	beneficiary_Emba122
1672	123	1	1	1	1	beneficiary_Emba123
1673	124	1	1	1	1	beneficiary_Emba124
1674	125	1	1	1	1	beneficiary_Emba125
1675	126	1	1	1	1	beneficiary_Emba126
1676	127	1	1	1	1	beneficiary_Emba127
1677	128	1	1	1	1	beneficiary_Emba128
1678	129	1	1	1	1	beneficiary_Emba129
1679	130	1	1	1	1	beneficiary_Emba130
1680	131	1	1	1	1	beneficiary_Emba131
1681	132	1	1	1	1	beneficiary_Emba132
1682	133	1	1	1	1	beneficiary_Emba133
1683	134	1	1	1	1	beneficiary_Emba134
1684	135	1	1	1	1	beneficiary_Emba135
1685	136	1	1	1	1	beneficiary_Emba136
1686	137	1	1	1	1	beneficiary_Emba137
1687	138	1	1	1	1	beneficiary_Emba138
1688	140	1	1	1	1	beneficiary_Emba140
1689	141	1	1	1	1	beneficiary_Emba141
1690	142	1	1	1	1	beneficiary_Emba142
1691	143	1	1	1	1	beneficiary_Emba143
1692	144	1	1	1	1	beneficiary_Emba144
1693	145	1	1	1	1	beneficiary_Emba145
1694	146	1	1	1	1	beneficiary_Emba146
1695	147	1	1	1	1	beneficiary_Emba147
1696	148	1	1	1	1	beneficiary_Emba148
1697	149	1	1	1	1	beneficiary_Emba149
1698	150	1	1	1	1	beneficiary_Emba150
1699	1	1	1	1	1	beneficiary_Emba1
1700	22	1	1	1	1	beneficiary_Emba22
1701	43	1	1	1	1	beneficiary_Emba43
1702	61	1	1	1	1	beneficiary_Emba61
1703	70	1	1	1	1	beneficiary_Emba70
1704	93	1	1	1	1	beneficiary_Emba93
1705	116	1	1	1	1	beneficiary_Emba116
1706	152	1	1	1	1	beneficiary_Emba152
1707	153	1	1	1	1	beneficiary_Emba153
1708	154	1	1	1	1	beneficiary_Emba154
1709	155	1	1	1	1	beneficiary_Emba155
1710	156	1	1	1	1	beneficiary_Emba156
1711	157	1	1	1	1	beneficiary_Emba157
1712	158	1	1	1	1	beneficiary_Emba158
1713	159	1	1	1	1	beneficiary_Emba159
1714	160	1	1	1	1	beneficiary_Emba160
1715	161	1	1	1	1	beneficiary_Emba161
1716	162	1	1	1	1	beneficiary_Emba162
1717	163	1	1	1	1	beneficiary_Emba163
1718	164	1	1	1	1	beneficiary_Emba164
1719	165	1	1	1	1	beneficiary_Emba165
1720	167	1	1	1	1	beneficiary_Emba167
1721	168	1	1	1	1	beneficiary_Emba168
1722	169	1	1	1	1	beneficiary_Emba169
1723	170	1	1	1	1	beneficiary_Emba170
1724	171	1	1	1	1	beneficiary_Emba171
1725	172	1	1	1	1	beneficiary_Emba172
1726	173	1	1	1	1	beneficiary_Emba173
1727	174	1	1	1	1	beneficiary_Emba174
1728	175	1	1	1	1	beneficiary_Emba175
1729	176	1	1	1	1	beneficiary_Emba176
1730	177	1	1	1	1	beneficiary_Emba177
1731	178	1	1	1	1	beneficiary_Emba178
1732	179	1	1	1	1	beneficiary_Emba179
1733	180	1	1	1	1	beneficiary_Emba180
1734	181	1	1	1	1	beneficiary_Emba181
1735	182	1	1	1	1	beneficiary_Emba182
1736	183	1	1	1	1	beneficiary_Emba183
1737	184	1	1	1	1	beneficiary_Emba184
1738	185	1	1	1	1	beneficiary_Emba185
1739	186	1	1	1	1	beneficiary_Emba186
1740	187	1	1	1	1	beneficiary_Emba187
1741	188	1	1	1	1	beneficiary_Emba188
1742	189	1	1	1	1	beneficiary_Emba189
1743	191	1	1	1	1	beneficiary_Emba191
1744	192	1	1	1	1	beneficiary_Emba192
1745	193	1	1	1	1	beneficiary_Emba193
1746	194	1	1	1	1	beneficiary_Emba194
1747	195	1	1	1	1	beneficiary_Emba195
1748	196	1	1	1	1	beneficiary_Emba196
1749	197	1	1	1	1	beneficiary_Emba197
1750	198	1	1	1	1	beneficiary_Emba198
1751	199	1	1	1	1	beneficiary_Emba199
1752	200	1	1	1	1	beneficiary_Emba200
1753	201	1	1	1	1	beneficiary_Emba201
1754	202	1	1	1	1	beneficiary_Emba202
1755	203	1	1	1	1	beneficiary_Emba203
1756	204	1	1	1	1	beneficiary_Emba204
1757	205	1	1	1	1	beneficiary_Emba205
1758	206	1	1	1	1	beneficiary_Emba206
1759	207	1	1	1	1	beneficiary_Emba207
1760	208	1	1	1	1	beneficiary_Emba208
1761	209	1	1	1	1	beneficiary_Emba209
1762	210	1	1	1	1	beneficiary_Emba210
1763	211	1	1	1	1	beneficiary_Emba211
1764	213	1	1	1	1	beneficiary_Emba213
1765	214	1	1	1	1	beneficiary_Emba214
1766	215	1	1	1	1	beneficiary_Emba215
1767	216	1	1	1	1	beneficiary_Emba216
1768	217	1	1	1	1	beneficiary_Emba217
1769	218	1	1	1	1	beneficiary_Emba218
1770	219	1	1	1	1	beneficiary_Emba219
1771	220	1	1	1	1	beneficiary_Emba220
1772	221	1	1	1	1	beneficiary_Emba221
1773	222	1	1	1	1	beneficiary_Emba222
1774	223	1	1	1	1	beneficiary_Emba223
1775	224	1	1	1	1	beneficiary_Emba224
1776	225	1	1	1	1	beneficiary_Emba225
1777	226	1	1	1	1	beneficiary_Emba226
1778	227	1	1	1	1	beneficiary_Emba227
1779	228	1	1	1	1	beneficiary_Emba228
1780	229	1	1	1	1	beneficiary_Emba229
1781	230	1	1	1	1	beneficiary_Emba230
1782	231	1	1	1	1	beneficiary_Emba231
1783	232	1	1	1	1	beneficiary_Emba232
1784	233	1	1	1	1	beneficiary_Emba233
1785	139	1	1	1	1	beneficiary_Emba139
1786	151	1	1	1	1	beneficiary_Emba151
1787	166	1	1	1	1	beneficiary_Emba166
1788	190	1	1	1	1	beneficiary_Emba190
1789	212	1	1	1	1	beneficiary_Emba212
\.


--
-- Data for Name: beneficiary_parcel; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.beneficiary_parcel (beneficiary_id, parcel_id, id, settlement_id, intervention_id, intervention_phase, code) FROM stdin;
1631	42	1	1	1	1	ben_par_beneficiary_Emba80
1640	41	2	1	1	1	ben_par_beneficiary_Emba89
1640	40	3	1	1	1	ben_par_beneficiary_Emba89
1675	45	4	1	1	1	ben_par_beneficiary_Emba126
1702	44	5	1	1	1	ben_par_beneficiary_Emba61
1680	43	6	1	1	1	ben_par_beneficiary_Emba131
1680	43	7	1	1	1	ben_par_beneficiary_Emba131
1680	43	8	1	1	1	ben_par_beneficiary_Emba131
1669	35	9	1	1	1	ben_par_beneficiary_Emba120
1669	37	10	1	1	1	ben_par_beneficiary_Emba120
1727	36	11	1	1	1	ben_par_beneficiary_Emba174
1727	36	12	1	1	1	ben_par_beneficiary_Emba174
1727	36	13	1	1	1	ben_par_beneficiary_Emba174
1727	36	14	1	1	1	ben_par_beneficiary_Emba174
1669	39	15	1	1	1	ben_par_beneficiary_Emba120
1669	39	16	1	1	1	ben_par_beneficiary_Emba120
1669	39	17	1	1	1	ben_par_beneficiary_Emba120
1657	38	18	1	1	1	ben_par_beneficiary_Emba107
1657	38	19	1	1	1	ben_par_beneficiary_Emba107
1657	38	20	1	1	1	ben_par_beneficiary_Emba107
1657	38	21	1	1	1	ben_par_beneficiary_Emba107
1657	38	22	1	1	1	ben_par_beneficiary_Emba107
1751	33	23	1	1	1	ben_par_beneficiary_Emba199
1682	34	24	1	1	1	ben_par_beneficiary_Emba133
1682	34	25	1	1	1	ben_par_beneficiary_Emba133
1682	34	26	1	1	1	ben_par_beneficiary_Emba133
1682	34	27	1	1	1	ben_par_beneficiary_Emba133
1682	34	28	1	1	1	ben_par_beneficiary_Emba133
1757	100	29	1	1	1	ben_par_beneficiary_Emba205
1721	99	30	1	1	1	ben_par_beneficiary_Emba168
1595	29	31	1	1	1	ben_par_beneficiary_Emba41
1700	25	32	1	1	1	ben_par_beneficiary_Emba22
1700	25	33	1	1	1	ben_par_beneficiary_Emba22
1700	25	34	1	1	1	ben_par_beneficiary_Emba22
1700	25	35	1	1	1	ben_par_beneficiary_Emba22
1700	25	36	1	1	1	ben_par_beneficiary_Emba22
1700	25	37	1	1	1	ben_par_beneficiary_Emba22
1712	32	38	1	1	1	ben_par_beneficiary_Emba158
1735	26	39	1	1	1	ben_par_beneficiary_Emba182
1735	26	40	1	1	1	ben_par_beneficiary_Emba182
1735	26	41	1	1	1	ben_par_beneficiary_Emba182
1735	26	42	1	1	1	ben_par_beneficiary_Emba182
1735	26	43	1	1	1	ben_par_beneficiary_Emba182
1635	31	44	1	1	1	ben_par_beneficiary_Emba84
1635	31	45	1	1	1	ben_par_beneficiary_Emba84
1706	24	46	1	1	1	ben_par_beneficiary_Emba152
1706	24	47	1	1	1	ben_par_beneficiary_Emba152
1706	24	48	1	1	1	ben_par_beneficiary_Emba152
1706	24	49	1	1	1	ben_par_beneficiary_Emba152
1706	24	50	1	1	1	ben_par_beneficiary_Emba152
1706	24	51	1	1	1	ben_par_beneficiary_Emba152
1701	30	52	1	1	1	ben_par_beneficiary_Emba43
1676	23	53	1	1	1	ben_par_beneficiary_Emba127
1676	23	54	1	1	1	ben_par_beneficiary_Emba127
1676	23	55	1	1	1	ben_par_beneficiary_Emba127
1676	23	56	1	1	1	ben_par_beneficiary_Emba127
1676	23	57	1	1	1	ben_par_beneficiary_Emba127
1676	23	58	1	1	1	ben_par_beneficiary_Emba127
1577	28	59	1	1	1	ben_par_beneficiary_Emba23
1644	22	60	1	1	1	ben_par_beneficiary_Emba94
1644	22	61	1	1	1	ben_par_beneficiary_Emba94
1644	22	62	1	1	1	ben_par_beneficiary_Emba94
1644	22	63	1	1	1	ben_par_beneficiary_Emba94
1644	22	64	1	1	1	ben_par_beneficiary_Emba94
1650	27	65	1	1	1	ben_par_beneficiary_Emba100
1650	27	66	1	1	1	ben_par_beneficiary_Emba100
1777	21	67	1	1	1	ben_par_beneficiary_Emba226
1777	21	68	1	1	1	ben_par_beneficiary_Emba226
1777	21	69	1	1	1	ben_par_beneficiary_Emba226
1759	1	70	1	1	1	ben_par_beneficiary_Emba207
1724	2	71	1	1	1	ben_par_beneficiary_Emba171
1617	3	72	1	1	1	ben_par_beneficiary_Emba65
1617	3	73	1	1	1	ben_par_beneficiary_Emba65
1558	4	74	1	1	1	ben_par_beneficiary_Emba3
1612	10	75	1	1	1	ben_par_beneficiary_Emba59
1753	15	76	1	1	1	ben_par_beneficiary_Emba201
1707	9	77	1	1	1	ben_par_beneficiary_Emba153
1707	9	78	1	1	1	ben_par_beneficiary_Emba153
1707	9	79	1	1	1	ben_par_beneficiary_Emba153
1707	9	80	1	1	1	ben_par_beneficiary_Emba153
1707	9	81	1	1	1	ben_par_beneficiary_Emba153
1707	9	82	1	1	1	ben_par_beneficiary_Emba153
1694	13	83	1	1	1	ben_par_beneficiary_Emba146
1694	13	84	1	1	1	ben_par_beneficiary_Emba146
1694	13	85	1	1	1	ben_par_beneficiary_Emba146
1694	13	86	1	1	1	ben_par_beneficiary_Emba146
1786	6	87	1	1	1	ben_par_beneficiary_Emba151
1711	14	88	1	1	1	ben_par_beneficiary_Emba157
1711	14	89	1	1	1	ben_par_beneficiary_Emba157
1711	14	90	1	1	1	ben_par_beneficiary_Emba157
1674	11	91	1	1	1	ben_par_beneficiary_Emba125
1674	11	92	1	1	1	ben_par_beneficiary_Emba125
1667	18	93	1	1	1	ben_par_beneficiary_Emba118
1667	18	94	1	1	1	ben_par_beneficiary_Emba118
1646	8	95	1	1	1	ben_par_beneficiary_Emba96
1646	8	96	1	1	1	ben_par_beneficiary_Emba96
1646	8	97	1	1	1	ben_par_beneficiary_Emba96
1646	8	98	1	1	1	ben_par_beneficiary_Emba96
1661	16	99	1	1	1	ben_par_beneficiary_Emba111
1661	16	100	1	1	1	ben_par_beneficiary_Emba111
1661	16	101	1	1	1	ben_par_beneficiary_Emba111
1661	16	102	1	1	1	ben_par_beneficiary_Emba111
1773	5	103	1	1	1	ben_par_beneficiary_Emba222
1690	12	104	1	1	1	ben_par_beneficiary_Emba142
1690	12	105	1	1	1	ben_par_beneficiary_Emba142
1690	12	106	1	1	1	ben_par_beneficiary_Emba142
1605	7	107	1	1	1	ben_par_beneficiary_Emba52
1605	7	108	1	1	1	ben_par_beneficiary_Emba52
1605	7	109	1	1	1	ben_par_beneficiary_Emba52
1703	17	110	1	1	1	ben_par_beneficiary_Emba70
1703	17	111	1	1	1	ben_par_beneficiary_Emba70
1726	101	112	1	1	1	ben_par_beneficiary_Emba173
1726	101	113	1	1	1	ben_par_beneficiary_Emba173
1703	19	114	1	1	1	ben_par_beneficiary_Emba70
1703	19	115	1	1	1	ben_par_beneficiary_Emba70
1604	102	116	1	1	1	ben_par_beneficiary_Emba51
1604	102	117	1	1	1	ben_par_beneficiary_Emba51
1604	102	118	1	1	1	ben_par_beneficiary_Emba51
1774	20	119	1	1	1	ben_par_beneficiary_Emba223
1774	20	120	1	1	1	ben_par_beneficiary_Emba223
1774	20	121	1	1	1	ben_par_beneficiary_Emba223
1774	20	122	1	1	1	ben_par_beneficiary_Emba223
1774	20	123	1	1	1	ben_par_beneficiary_Emba223
1774	20	124	1	1	1	ben_par_beneficiary_Emba223
1774	20	125	1	1	1	ben_par_beneficiary_Emba223
1774	20	126	1	1	1	ben_par_beneficiary_Emba223
1659	46	127	1	1	1	ben_par_beneficiary_Emba109
1597	47	128	1	1	1	ben_par_beneficiary_Emba44
1736	48	129	1	1	1	ben_par_beneficiary_Emba183
1736	48	130	1	1	1	ben_par_beneficiary_Emba183
1736	48	131	1	1	1	ben_par_beneficiary_Emba183
1596	49	132	1	1	1	ben_par_beneficiary_Emba42
1596	49	133	1	1	1	ben_par_beneficiary_Emba42
1596	49	134	1	1	1	ben_par_beneficiary_Emba42
1596	49	135	1	1	1	ben_par_beneficiary_Emba42
1596	49	136	1	1	1	ben_par_beneficiary_Emba42
1588	50	137	1	1	1	ben_par_beneficiary_Emba34
1588	50	138	1	1	1	ben_par_beneficiary_Emba34
1590	52	139	1	1	1	ben_par_beneficiary_Emba36
1590	52	140	1	1	1	ben_par_beneficiary_Emba36
1590	52	141	1	1	1	ben_par_beneficiary_Emba36
1610	71	142	1	1	1	ben_par_beneficiary_Emba57
1610	71	143	1	1	1	ben_par_beneficiary_Emba57
1787	72	144	1	1	1	ben_par_beneficiary_Emba166
1787	72	145	1	1	1	ben_par_beneficiary_Emba166
1632	73	146	1	1	1	ben_par_beneficiary_Emba81
1632	73	147	1	1	1	ben_par_beneficiary_Emba81
1632	73	148	1	1	1	ben_par_beneficiary_Emba81
1715	74	149	1	1	1	ben_par_beneficiary_Emba161
1715	74	150	1	1	1	ben_par_beneficiary_Emba161
1715	74	151	1	1	1	ben_par_beneficiary_Emba161
1715	74	152	1	1	1	ben_par_beneficiary_Emba161
1715	74	153	1	1	1	ben_par_beneficiary_Emba161
1715	74	154	1	1	1	ben_par_beneficiary_Emba161
1715	74	155	1	1	1	ben_par_beneficiary_Emba161
1606	75	156	1	1	1	ben_par_beneficiary_Emba53
1606	75	157	1	1	1	ben_par_beneficiary_Emba53
1606	75	158	1	1	1	ben_par_beneficiary_Emba53
1606	75	159	1	1	1	ben_par_beneficiary_Emba53
1606	75	160	1	1	1	ben_par_beneficiary_Emba53
1609	76	161	1	1	1	ben_par_beneficiary_Emba56
1722	77	162	1	1	1	ben_par_beneficiary_Emba169
1722	77	163	1	1	1	ben_par_beneficiary_Emba169
1722	77	164	1	1	1	ben_par_beneficiary_Emba169
1722	77	165	1	1	1	ben_par_beneficiary_Emba169
1781	83	166	1	1	1	ben_par_beneficiary_Emba230
1781	83	167	1	1	1	ben_par_beneficiary_Emba230
1781	83	168	1	1	1	ben_par_beneficiary_Emba230
1766	82	169	1	1	1	ben_par_beneficiary_Emba215
1766	82	170	1	1	1	ben_par_beneficiary_Emba215
1725	81	171	1	1	1	ben_par_beneficiary_Emba172
1725	81	172	1	1	1	ben_par_beneficiary_Emba172
1698	80	173	1	1	1	ben_par_beneficiary_Emba150
1669	79	174	1	1	1	ben_par_beneficiary_Emba120
1669	79	175	1	1	1	ben_par_beneficiary_Emba120
1665	78	176	1	1	1	ben_par_beneficiary_Emba115
1673	51	177	1	1	1	ben_par_beneficiary_Emba124
1673	51	178	1	1	1	ben_par_beneficiary_Emba124
1578	53	179	1	1	1	ben_par_beneficiary_Emba24
1591	84	180	1	1	1	ben_par_beneficiary_Emba37
1591	84	181	1	1	1	ben_par_beneficiary_Emba37
1591	84	182	1	1	1	ben_par_beneficiary_Emba37
1587	85	183	1	1	1	ben_par_beneficiary_Emba33
1587	85	184	1	1	1	ben_par_beneficiary_Emba33
1587	85	185	1	1	1	ben_par_beneficiary_Emba33
1587	85	186	1	1	1	ben_par_beneficiary_Emba33
1587	85	187	1	1	1	ben_par_beneficiary_Emba33
1587	85	188	1	1	1	ben_par_beneficiary_Emba33
1654	86	189	1	1	1	ben_par_beneficiary_Emba104
1654	86	190	1	1	1	ben_par_beneficiary_Emba104
1654	86	191	1	1	1	ben_par_beneficiary_Emba104
1654	86	192	1	1	1	ben_par_beneficiary_Emba104
1718	87	193	1	1	1	ben_par_beneficiary_Emba164
1718	87	194	1	1	1	ben_par_beneficiary_Emba164
1580	88	195	1	1	1	ben_par_beneficiary_Emba26
1645	89	196	1	1	1	ben_par_beneficiary_Emba95
1645	89	197	1	1	1	ben_par_beneficiary_Emba95
1652	95	198	1	1	1	ben_par_beneficiary_Emba102
1673	98	199	1	1	1	ben_par_beneficiary_Emba124
1673	98	200	1	1	1	ben_par_beneficiary_Emba124
1673	97	201	1	1	1	ben_par_beneficiary_Emba124
1673	97	202	1	1	1	ben_par_beneficiary_Emba124
1584	54	203	1	1	1	ben_par_beneficiary_Emba30
1584	54	204	1	1	1	ben_par_beneficiary_Emba30
1584	54	205	1	1	1	ben_par_beneficiary_Emba30
1584	54	206	1	1	1	ben_par_beneficiary_Emba30
1584	54	207	1	1	1	ben_par_beneficiary_Emba30
1584	54	208	1	1	1	ben_par_beneficiary_Emba30
1584	54	209	1	1	1	ben_par_beneficiary_Emba30
1744	56	210	1	1	1	ben_par_beneficiary_Emba192
1744	56	211	1	1	1	ben_par_beneficiary_Emba192
1744	56	212	1	1	1	ben_par_beneficiary_Emba192
1744	56	213	1	1	1	ben_par_beneficiary_Emba192
1744	56	214	1	1	1	ben_par_beneficiary_Emba192
1756	58	215	1	1	1	ben_par_beneficiary_Emba204
1756	58	216	1	1	1	ben_par_beneficiary_Emba204
1756	58	217	1	1	1	ben_par_beneficiary_Emba204
1765	60	218	1	1	1	ben_par_beneficiary_Emba214
1765	60	219	1	1	1	ben_par_beneficiary_Emba214
1758	62	220	1	1	1	ben_par_beneficiary_Emba206
1758	62	221	1	1	1	ben_par_beneficiary_Emba206
1618	64	222	1	1	1	ben_par_beneficiary_Emba66
1618	64	223	1	1	1	ben_par_beneficiary_Emba66
1678	66	224	1	1	1	ben_par_beneficiary_Emba129
1656	67	225	1	1	1	ben_par_beneficiary_Emba106
1656	67	226	1	1	1	ben_par_beneficiary_Emba106
1630	94	227	1	1	1	ben_par_beneficiary_Emba79
1630	94	228	1	1	1	ben_par_beneficiary_Emba79
1630	94	229	1	1	1	ben_par_beneficiary_Emba79
1559	96	230	1	1	1	ben_par_beneficiary_Emba4
1559	96	231	1	1	1	ben_par_beneficiary_Emba4
1740	55	232	1	1	1	ben_par_beneficiary_Emba187
1740	55	233	1	1	1	ben_par_beneficiary_Emba187
1740	55	234	1	1	1	ben_par_beneficiary_Emba187
1740	55	235	1	1	1	ben_par_beneficiary_Emba187
1678	57	236	1	1	1	ben_par_beneficiary_Emba129
1678	57	237	1	1	1	ben_par_beneficiary_Emba129
1607	59	238	1	1	1	ben_par_beneficiary_Emba54
1607	59	239	1	1	1	ben_par_beneficiary_Emba54
1738	61	240	1	1	1	ben_par_beneficiary_Emba185
1686	63	241	1	1	1	ben_par_beneficiary_Emba137
1686	63	242	1	1	1	ben_par_beneficiary_Emba137
1686	63	243	1	1	1	ben_par_beneficiary_Emba137
1686	63	244	1	1	1	ben_par_beneficiary_Emba137
1686	63	245	1	1	1	ben_par_beneficiary_Emba137
1691	65	246	1	1	1	ben_par_beneficiary_Emba143
1691	65	247	1	1	1	ben_par_beneficiary_Emba143
1691	65	248	1	1	1	ben_par_beneficiary_Emba143
1623	68	249	1	1	1	ben_par_beneficiary_Emba72
1623	68	250	1	1	1	ben_par_beneficiary_Emba72
1623	68	251	1	1	1	ben_par_beneficiary_Emba72
1680	69	252	1	1	1	ben_par_beneficiary_Emba131
1680	69	253	1	1	1	ben_par_beneficiary_Emba131
1680	69	254	1	1	1	ben_par_beneficiary_Emba131
1611	90	255	1	1	1	ben_par_beneficiary_Emba58
1579	91	256	1	1	1	ben_par_beneficiary_Emba25
1579	91	257	1	1	1	ben_par_beneficiary_Emba25
1592	70	258	1	1	1	ben_par_beneficiary_Emba38
1592	70	259	1	1	1	ben_par_beneficiary_Emba38
1592	70	260	1	1	1	ben_par_beneficiary_Emba38
1779	93	261	1	1	1	ben_par_beneficiary_Emba228
1779	93	262	1	1	1	ben_par_beneficiary_Emba228
1779	93	263	1	1	1	ben_par_beneficiary_Emba228
1665	92	264	1	1	1	ben_par_beneficiary_Emba115
1665	92	265	1	1	1	ben_par_beneficiary_Emba115
1665	92	266	1	1	1	ben_par_beneficiary_Emba115
870	539	267	2	2	1	ben_par_kahawa_soweto_775_2
962	531	268	2	2	1	ben_par_kahawa_soweto_1_2
1033	517	269	2	2	1	ben_par_kahawa_soweto_2_2
1534	523	270	2	2	1	ben_par_kahawa_soweto_3_2
1535	530	271	2	2	1	ben_par_kahawa_soweto_4_2
1536	521	272	2	2	1	ben_par_kahawa_soweto_5_2
821	522	273	2	2	1	ben_par_kahawa_soweto_6_2
1018	526	274	2	2	1	ben_par_kahawa_soweto_7_2
1061	526	275	2	2	1	ben_par_kahawa_soweto_8_2
799	511	276	2	2	1	ben_par_kahawa_soweto_9_2
1214	522	277	2	2	1	ben_par_kahawa_soweto_10_2
1335	526	278	2	2	1	ben_par_kahawa_soweto_11_2
895	513	279	2	2	1	ben_par_kahawa_soweto_12_2
793	539	280	2	2	1	ben_par_kahawa_soweto_13_2
793	521	281	2	2	1	ben_par_kahawa_soweto_13_2
1296	530	282	2	2	1	ben_par_kahawa_soweto_14_2
1273	518	283	2	2	1	ben_par_kahawa_soweto_15_2
803	515	284	2	2	1	ben_par_kahawa_soweto_16_2
1460	522	285	2	2	1	ben_par_kahawa_soweto_17_2
848	517	286	2	2	1	ben_par_kahawa_soweto_18_2
921	516	287	2	2	1	ben_par_kahawa_soweto_19_2
1074	527	288	2	2	1	ben_par_kahawa_soweto_20_2
1479	535	289	2	2	1	ben_par_kahawa_soweto_21_2
989	534	290	2	2	1	ben_par_kahawa_soweto_22_2
1102	518	291	2	2	1	ben_par_kahawa_soweto_23_2
949	532	292	2	2	1	ben_par_kahawa_soweto_24_2
1347	531	293	2	2	1	ben_par_kahawa_soweto_25_2
1381	526	294	2	2	1	ben_par_kahawa_soweto_26_2
1131	524	295	2	2	1	ben_par_kahawa_soweto_27_2
837	513	296	2	2	1	ben_par_kahawa_soweto_28_2
1450	530	297	2	2	1	ben_par_kahawa_soweto_29_2
1092	521	298	2	2	1	ben_par_kahawa_soweto_30_2
908	513	299	2	2	1	ben_par_kahawa_soweto_31_2
1447	522	300	2	2	1	ben_par_kahawa_soweto_32_2
1510	530	301	2	2	1	ben_par_kahawa_soweto_33_2
1217	532	302	2	2	1	ben_par_kahawa_soweto_34_2
1285	526	303	2	2	1	ben_par_kahawa_soweto_35_2
1420	535	304	2	2	1	ben_par_kahawa_soweto_36_2
1143	527	305	2	2	1	ben_par_kahawa_soweto_37_2
1353	524	306	2	2	1	ben_par_kahawa_soweto_38_2
1332	516	307	2	2	1	ben_par_kahawa_soweto_39_2
1523	524	308	2	2	1	ben_par_kahawa_soweto_40_2
1217	535	309	2	2	1	ben_par_kahawa_soweto_34_2
1350	512	310	2	2	1	ben_par_kahawa_soweto_42_2
1306	539	311	2	2	1	ben_par_kahawa_soweto_43_2
1268	515	312	2	2	1	ben_par_kahawa_soweto_44_2
1553	539	313	2	2	1	ben_par_kahawa_soweto_45_2
986	513	314	2	2	1	ben_par_kahawa_soweto_46_2
1208	531	315	2	2	1	ben_par_kahawa_soweto_47_2
1176	526	316	2	2	1	ben_par_kahawa_soweto_48_2
1161	520	317	2	2	1	ben_par_kahawa_soweto_49_2
1038	514	318	2	2	1	ben_par_kahawa_soweto_50_2
940	539	319	2	2	1	ben_par_kahawa_soweto_51_2
1465	531	320	2	2	1	ben_par_kahawa_soweto_52_2
797	517	321	2	2	1	ben_par_kahawa_soweto_53_2
1345	523	322	2	2	1	ben_par_kahawa_soweto_54_2
1352	535	323	2	2	1	ben_par_kahawa_soweto_55_2
915	511	324	2	2	1	ben_par_kahawa_soweto_56_2
1231	521	325	2	2	1	ben_par_kahawa_soweto_57_2
1249	518	326	2	2	1	ben_par_kahawa_soweto_58_2
1179	522	327	2	2	1	ben_par_kahawa_soweto_59_2
967	522	328	2	2	1	ben_par_kahawa_soweto_60_2
1101	532	329	2	2	1	ben_par_kahawa_soweto_61_2
1009	514	330	2	2	1	ben_par_kahawa_soweto_62_2
1278	518	331	2	2	1	ben_par_kahawa_soweto_63_2
867	512	332	2	2	1	ben_par_kahawa_soweto_64_2
1295	526	333	2	2	1	ben_par_kahawa_soweto_65_2
1396	520	334	2	2	1	ben_par_kahawa_soweto_67_2
1396	532	335	2	2	1	ben_par_kahawa_soweto_67_2
809	516	336	2	2	1	ben_par_kahawa_soweto_68_2
1522	535	337	2	2	1	ben_par_kahawa_soweto_69_2
1186	515	338	2	2	1	ben_par_kahawa_soweto_70_2
1226	530	339	2	2	1	ben_par_kahawa_soweto_71_2
1300	521	340	2	2	1	ben_par_kahawa_soweto_72_2
1530	519	341	2	2	1	ben_par_kahawa_soweto_73_2
1342	530	342	2	2	1	ben_par_kahawa_soweto_74_2
1539	521	343	2	2	1	ben_par_kahawa_soweto_75_2
1140	534	344	2	2	1	ben_par_kahawa_soweto_76_2
796	539	345	2	2	1	ben_par_kahawa_soweto_77_2
872	522	346	2	2	1	ben_par_kahawa_soweto_78_2
783	534	347	2	2	1	ben_par_kahawa_soweto_79_2
887	539	348	2	2	1	ben_par_kahawa_soweto_80_2
955	527	349	2	2	1	ben_par_kahawa_soweto_81_2
842	517	350	2	2	1	ben_par_kahawa_soweto_82_2
1040	527	351	2	2	1	ben_par_kahawa_soweto_83_2
798	523	352	2	2	1	ben_par_kahawa_soweto_84_2
1235	527	353	2	2	1	ben_par_kahawa_soweto_85_2
1013	524	354	2	2	1	ben_par_kahawa_soweto_86_2
827	517	355	2	2	1	ben_par_kahawa_soweto_87_2
779	539	356	2	2	1	ben_par_kahawa_soweto_88_2
1333	535	357	2	2	1	ben_par_kahawa_soweto_89_2
1511	515	358	2	2	1	ben_par_kahawa_soweto_90_2
1394	519	359	2	2	1	ben_par_kahawa_soweto_91_2
1238	521	360	2	2	1	ben_par_kahawa_soweto_92_2
1062	527	361	2	2	1	ben_par_kahawa_soweto_93_2
1501	519	362	2	2	1	ben_par_kahawa_soweto_94_2
883	522	363	2	2	1	ben_par_kahawa_soweto_95_2
1517	531	364	2	2	1	ben_par_kahawa_soweto_96_2
1094	514	365	2	2	1	ben_par_kahawa_soweto_97_2
1243	511	366	2	2	1	ben_par_kahawa_soweto_98_2
1321	511	367	2	2	1	ben_par_kahawa_soweto_99_2
1196	526	368	2	2	1	ben_par_kahawa_soweto_100_2
1202	535	369	2	2	1	ben_par_kahawa_soweto_101_2
1019	530	370	2	2	1	ben_par_kahawa_soweto_102_2
1451	539	371	2	2	1	ben_par_kahawa_soweto_103_2
1162	519	372	2	2	1	ben_par_kahawa_soweto_104_2
950	522	373	2	2	1	ben_par_kahawa_soweto_105_2
1079	530	374	2	2	1	ben_par_kahawa_soweto_106_2
1489	513	375	2	2	1	ben_par_kahawa_soweto_107_2
1066	534	376	2	2	1	ben_par_kahawa_soweto_108_2
1323	511	377	2	2	1	ben_par_kahawa_soweto_109_2
1124	534	378	2	2	1	ben_par_kahawa_soweto_110_2
1376	521	379	2	2	1	ben_par_kahawa_soweto_111_2
1499	523	380	2	2	1	ben_par_kahawa_soweto_112_2
804	521	381	2	2	1	ben_par_kahawa_soweto_113_2
1344	520	382	2	2	1	ben_par_kahawa_soweto_114_2
1115	534	383	2	2	1	ben_par_kahawa_soweto_115_2
907	518	384	2	2	1	ben_par_kahawa_soweto_116_2
856	534	385	2	2	1	ben_par_kahawa_soweto_117_2
1472	515	386	2	2	1	ben_par_kahawa_soweto_118_2
1512	522	387	2	2	1	ben_par_kahawa_soweto_119_2
1287	539	388	2	2	1	ben_par_kahawa_soweto_120_2
1109	518	389	2	2	1	ben_par_kahawa_soweto_121_2
1095	515	390	2	2	1	ben_par_kahawa_soweto_122_2
1237	522	391	2	2	1	ben_par_kahawa_soweto_123_2
818	519	392	2	2	1	ben_par_kahawa_soweto_124_2
1379	515	393	2	2	1	ben_par_kahawa_soweto_125_2
1421	514	394	2	2	1	ben_par_kahawa_soweto_126_2
1513	511	395	2	2	1	ben_par_kahawa_soweto_127_2
969	532	396	2	2	1	ben_par_kahawa_soweto_128_2
1453	534	397	2	2	1	ben_par_kahawa_soweto_129_2
1239	530	398	2	2	1	ben_par_kahawa_soweto_130_2
1067	512	399	2	2	1	ben_par_kahawa_soweto_131_2
1507	512	400	2	2	1	ben_par_kahawa_soweto_132_2
1059	531	401	2	2	1	ben_par_kahawa_soweto_133_2
1146	530	402	2	2	1	ben_par_kahawa_soweto_134_2
1286	512	403	2	2	1	ben_par_kahawa_soweto_135_2
1045	522	404	2	2	1	ben_par_kahawa_soweto_136_2
835	527	405	2	2	1	ben_par_kahawa_soweto_137_2
1419	530	406	2	2	1	ben_par_kahawa_soweto_138_2
1327	516	407	2	2	1	ben_par_kahawa_soweto_139_2
916	512	408	2	2	1	ben_par_kahawa_soweto_140_2
1180	524	409	2	2	1	ben_par_kahawa_soweto_141_2
786	520	410	2	2	1	ben_par_kahawa_soweto_142_2
881	532	411	2	2	1	ben_par_kahawa_soweto_143_2
1236	517	412	2	2	1	ben_par_kahawa_soweto_144_2
1220	534	413	2	2	1	ben_par_kahawa_soweto_145_2
904	514	414	2	2	1	ben_par_kahawa_soweto_146_2
800	539	415	2	2	1	ben_par_kahawa_soweto_147_2
1339	512	416	2	2	1	ben_par_kahawa_soweto_148_2
890	522	417	2	2	1	ben_par_kahawa_soweto_149_2
1078	531	418	2	2	1	ben_par_kahawa_soweto_150_2
1349	524	419	2	2	1	ben_par_kahawa_soweto_151_2
1093	512	420	2	2	1	ben_par_kahawa_soweto_152_2
1145	515	421	2	2	1	ben_par_kahawa_soweto_153_2
830	535	422	2	2	1	ben_par_kahawa_soweto_154_2
891	527	423	2	2	1	ben_par_kahawa_soweto_155_2
1201	523	424	2	2	1	ben_par_kahawa_soweto_156_2
1351	531	425	2	2	1	ben_par_kahawa_soweto_157_2
794	514	426	2	2	1	ben_par_kahawa_soweto_158_2
946	523	427	2	2	1	ben_par_kahawa_soweto_159_2
1251	519	428	2	2	1	ben_par_kahawa_soweto_160_2
976	518	429	2	2	1	ben_par_kahawa_soweto_161_2
1212	533	430	2	2	1	ben_par_kahawa_soweto_162_2
1445	534	431	2	2	1	ben_par_kahawa_soweto_163_2
1130	517	432	2	2	1	ben_par_kahawa_soweto_164_2
1282	532	433	2	2	1	ben_par_kahawa_soweto_165_2
1360	539	434	2	2	1	ben_par_kahawa_soweto_166_2
841	520	435	2	2	1	ben_par_kahawa_soweto_167_2
1386	523	436	2	2	1	ben_par_kahawa_soweto_168_2
927	531	437	2	2	1	ben_par_kahawa_soweto_169_2
1338	533	438	2	2	1	ben_par_kahawa_soweto_170_2
959	513	439	2	2	1	ben_par_kahawa_soweto_171_2
1525	530	440	2	2	1	ben_par_kahawa_soweto_172_2
788	539	441	2	2	1	ben_par_kahawa_soweto_173_2
807	516	442	2	2	1	ben_par_kahawa_soweto_174_2
1089	519	443	2	2	1	ben_par_kahawa_soweto_175_2
1210	518	444	2	2	1	ben_par_kahawa_soweto_176_2
990	532	445	2	2	1	ben_par_kahawa_soweto_177_2
1477	519	446	2	2	1	ben_par_kahawa_soweto_178_2
1240	539	447	2	2	1	ben_par_kahawa_soweto_179_2
1221	539	448	2	2	1	ben_par_kahawa_soweto_180_2
1005	520	449	2	2	1	ben_par_kahawa_soweto_181_2
1434	514	450	2	2	1	ben_par_kahawa_soweto_182_2
789	527	451	2	2	1	ben_par_kahawa_soweto_183_2
1542	526	452	2	2	1	ben_par_kahawa_soweto_184_2
1464	530	453	2	2	1	ben_par_kahawa_soweto_185_2
816	516	454	2	2	1	ben_par_kahawa_soweto_186_2
1413	512	455	2	2	1	ben_par_kahawa_soweto_187_2
1492	522	456	2	2	1	ben_par_kahawa_soweto_188_2
1449	517	457	2	2	1	ben_par_kahawa_soweto_189_2
860	524	458	2	2	1	ben_par_kahawa_soweto_190_2
1230	539	459	2	2	1	ben_par_kahawa_soweto_191_2
941	533	460	2	2	1	ben_par_kahawa_soweto_192_2
1021	530	461	2	2	1	ben_par_kahawa_soweto_193_2
1430	511	462	2	2	1	ben_par_kahawa_soweto_194_2
1355	534	463	2	2	1	ben_par_kahawa_soweto_195_2
1346	535	464	2	2	1	ben_par_kahawa_soweto_197_2
811	533	465	2	2	1	ben_par_kahawa_soweto_198_2
1188	518	466	2	2	1	ben_par_kahawa_soweto_199_2
1318	518	467	2	2	1	ben_par_kahawa_soweto_200_2
1514	517	468	2	2	1	ben_par_kahawa_soweto_201_2
1452	527	469	2	2	1	ben_par_kahawa_soweto_202_2
1290	519	470	2	2	1	ben_par_kahawa_soweto_203_2
1343	532	471	2	2	1	ben_par_kahawa_soweto_204_2
1253	511	472	2	2	1	ben_par_kahawa_soweto_205_2
1310	514	473	2	2	1	ben_par_kahawa_soweto_206_2
1486	523	474	2	2	1	ben_par_kahawa_soweto_207_2
1099	520	475	2	2	1	ben_par_kahawa_soweto_208_2
1117	523	476	2	2	1	ben_par_kahawa_soweto_209_2
850	539	477	2	2	1	ben_par_kahawa_soweto_210_2
1043	511	478	2	2	1	ben_par_kahawa_soweto_211_2
1442	522	479	2	2	1	ben_par_kahawa_soweto_212_2
1461	519	480	2	2	1	ben_par_kahawa_soweto_213_2
1483	515	481	2	2	1	ben_par_kahawa_soweto_214_2
1397	530	482	2	2	1	ben_par_kahawa_soweto_215_2
1022	527	483	2	2	1	ben_par_kahawa_soweto_216_2
918	534	484	2	2	1	ben_par_kahawa_soweto_217_2
792	535	485	2	2	1	ben_par_kahawa_soweto_218_2
840	512	486	2	2	1	ben_par_kahawa_soweto_219_2
1042	514	487	2	2	1	ben_par_kahawa_soweto_220_2
874	511	488	2	2	1	ben_par_kahawa_soweto_221_2
1205	534	489	2	2	1	ben_par_kahawa_soweto_222_2
966	517	490	2	2	1	ben_par_kahawa_soweto_223_2
1415	523	491	2	2	1	ben_par_kahawa_soweto_224_2
1357	524	492	2	2	1	ben_par_kahawa_soweto_225_2
1126	531	493	2	2	1	ben_par_kahawa_soweto_226_2
998	521	494	2	2	1	ben_par_kahawa_soweto_227_2
983	533	495	2	2	1	ben_par_kahawa_soweto_228_2
1503	515	496	2	2	1	ben_par_kahawa_soweto_229_2
912	515	497	2	2	1	ben_par_kahawa_soweto_230_2
880	533	498	2	2	1	ben_par_kahawa_soweto_231_2
1471	521	499	2	2	1	ben_par_kahawa_soweto_232_2
1482	518	500	2	2	1	ben_par_kahawa_soweto_233_2
879	539	501	2	2	1	ben_par_kahawa_soweto_234_2
844	517	502	2	2	1	ben_par_kahawa_soweto_235_2
1172	533	503	2	2	1	ben_par_kahawa_soweto_236_2
886	519	504	2	2	1	ben_par_kahawa_soweto_237_2
970	516	505	2	2	1	ben_par_kahawa_soweto_238_2
1003	522	506	2	2	1	ben_par_kahawa_soweto_239_2
980	539	507	2	2	1	ben_par_kahawa_soweto_240_2
1190	520	508	2	2	1	ben_par_kahawa_soweto_241_2
885	522	509	2	2	1	ben_par_kahawa_soweto_242_2
1039	531	510	2	2	1	ben_par_kahawa_soweto_243_2
977	531	511	2	2	1	ben_par_kahawa_soweto_244_2
780	519	512	2	2	1	ben_par_kahawa_soweto_245_2
843	535	513	2	2	1	ben_par_kahawa_soweto_246_2
1173	518	514	2	2	1	ben_par_kahawa_soweto_247_2
1326	512	515	2	2	1	ben_par_kahawa_soweto_248_2
1028	524	516	2	2	1	ben_par_kahawa_soweto_249_2
1298	516	517	2	2	1	ben_par_kahawa_soweto_250_2
1048	533	518	2	2	1	ben_par_kahawa_soweto_251_2
1104	512	519	2	2	1	ben_par_kahawa_soweto_253_2
932	527	520	2	2	1	ben_par_kahawa_soweto_254_2
1017	518	521	2	2	1	ben_par_kahawa_soweto_255_2
1137	539	522	2	2	1	ben_par_kahawa_soweto_256_2
939	532	523	2	2	1	ben_par_kahawa_soweto_257_2
1314	524	524	2	2	1	ben_par_kahawa_soweto_258_2
1493	516	525	2	2	1	ben_par_kahawa_soweto_259_2
1068	513	526	2	2	1	ben_par_kahawa_soweto_260_2
979	516	527	2	2	1	ben_par_kahawa_soweto_262_2
1232	514	528	2	2	1	ben_par_kahawa_soweto_263_2
1185	535	529	2	2	1	ben_par_kahawa_soweto_264_2
1304	512	530	2	2	1	ben_par_kahawa_soweto_265_2
1259	530	531	2	2	1	ben_par_kahawa_soweto_266_2
834	539	532	2	2	1	ben_par_kahawa_soweto_267_2
863	520	533	2	2	1	ben_par_kahawa_soweto_268_2
787	519	534	2	2	1	ben_par_kahawa_soweto_269_2
973	530	535	2	2	1	ben_par_kahawa_soweto_270_2
1410	513	536	2	2	1	ben_par_kahawa_soweto_271_2
1122	535	537	2	2	1	ben_par_kahawa_soweto_272_2
1083	517	538	2	2	1	ben_par_kahawa_soweto_273_2
1123	511	539	2	2	1	ben_par_kahawa_soweto_274_2
1322	526	540	2	2	1	ben_par_kahawa_soweto_275_2
875	522	541	2	2	1	ben_par_kahawa_soweto_276_2
993	527	542	2	2	1	ben_par_kahawa_soweto_277_2
1134	524	543	2	2	1	ben_par_kahawa_soweto_278_2
1336	524	544	2	2	1	ben_par_kahawa_soweto_279_2
897	519	545	2	2	1	ben_par_kahawa_soweto_280_2
1081	513	546	2	2	1	ben_par_kahawa_soweto_281_2
1014	530	547	2	2	1	ben_par_kahawa_soweto_282_2
947	522	548	2	2	1	ben_par_kahawa_soweto_283_2
1147	516	549	2	2	1	ben_par_kahawa_soweto_284_2
1454	513	550	2	2	1	ben_par_kahawa_soweto_285_2
1423	515	551	2	2	1	ben_par_kahawa_soweto_286_2
1096	535	552	2	2	1	ben_par_kahawa_soweto_287_2
894	517	553	2	2	1	ben_par_kahawa_soweto_288_2
1064	512	554	2	2	1	ben_par_kahawa_soweto_289_2
1125	519	555	2	2	1	ben_par_kahawa_soweto_290_2
1105	514	556	2	2	1	ben_par_kahawa_soweto_291_2
984	512	557	2	2	1	ben_par_kahawa_soweto_292_2
854	526	558	2	2	1	ben_par_kahawa_soweto_293_2
1289	522	559	2	2	1	ben_par_kahawa_soweto_294_2
1086	512	560	2	2	1	ben_par_kahawa_soweto_295_2
1136	534	561	2	2	1	ben_par_kahawa_soweto_296_2
1169	514	562	2	2	1	ben_par_kahawa_soweto_297_2
1118	527	563	2	2	1	ben_par_kahawa_soweto_298_2
1288	518	564	2	2	1	ben_par_kahawa_soweto_299_2
871	531	565	2	2	1	ben_par_kahawa_soweto_300_2
892	527	566	2	2	1	ben_par_kahawa_soweto_301_2
1414	511	567	2	2	1	ben_par_kahawa_soweto_302_2
1519	520	568	2	2	1	ben_par_kahawa_soweto_303_2
992	520	569	2	2	1	ben_par_kahawa_soweto_304_2
1044	533	570	2	2	1	ben_par_kahawa_soweto_305_2
847	522	571	2	2	1	ben_par_kahawa_soweto_306_2
1025	526	572	2	2	1	ben_par_kahawa_soweto_307_2
1258	532	573	2	2	1	ben_par_kahawa_soweto_308_2
1110	532	574	2	2	1	ben_par_kahawa_soweto_309_2
781	517	575	2	2	1	ben_par_kahawa_soweto_310_2
1400	512	576	2	2	1	ben_par_kahawa_soweto_311_2
1139	533	577	2	2	1	ben_par_kahawa_soweto_312_2
876	534	578	2	2	1	ben_par_kahawa_soweto_313_2
1001	539	579	2	2	1	ben_par_kahawa_soweto_314_2
1456	524	580	2	2	1	ben_par_kahawa_soweto_315_2
1521	524	581	2	2	1	ben_par_kahawa_soweto_316_2
1168	513	582	2	2	1	ben_par_kahawa_soweto_317_2
1100	534	583	2	2	1	ben_par_kahawa_soweto_318_2
899	527	584	2	2	1	ben_par_kahawa_soweto_319_2
1142	519	585	2	2	1	ben_par_kahawa_soweto_320_2
1216	517	586	2	2	1	ben_par_kahawa_soweto_321_2
906	512	587	2	2	1	ben_par_kahawa_soweto_322_2
1027	514	588	2	2	1	ben_par_kahawa_soweto_323_2
852	527	589	2	2	1	ben_par_kahawa_soweto_324_2
1473	533	590	2	2	1	ben_par_kahawa_soweto_325_2
889	514	591	2	2	1	ben_par_kahawa_soweto_326_2
862	519	592	2	2	1	ben_par_kahawa_soweto_327_2
1398	524	593	2	2	1	ben_par_kahawa_soweto_328_2
1487	520	594	2	2	1	ben_par_kahawa_soweto_329_2
1090	527	595	2	2	1	ben_par_kahawa_soweto_330_2
812	539	596	2	2	1	ben_par_kahawa_soweto_331_2
1260	533	597	2	2	1	ben_par_kahawa_soweto_332_2
1427	530	598	2	2	1	ben_par_kahawa_soweto_333_2
975	514	599	2	2	1	ben_par_kahawa_soweto_334_2
1098	522	600	2	2	1	ben_par_kahawa_soweto_335_2
1506	520	601	2	2	1	ben_par_kahawa_soweto_336_2
1119	534	602	2	2	1	ben_par_kahawa_soweto_337_2
1007	524	603	2	2	1	ben_par_kahawa_soweto_338_2
1204	524	604	2	2	1	ben_par_kahawa_soweto_339_2
1418	521	605	2	2	1	ben_par_kahawa_soweto_340_2
805	527	606	2	2	1	ben_par_kahawa_soweto_341_2
1509	518	607	2	2	1	ben_par_kahawa_soweto_342_2
845	535	608	2	2	1	ben_par_kahawa_soweto_343_2
824	520	609	2	2	1	ben_par_kahawa_soweto_344_2
1189	511	610	2	2	1	ben_par_kahawa_soweto_345_2
873	522	611	2	2	1	ben_par_kahawa_soweto_346_2
859	514	612	2	2	1	ben_par_kahawa_soweto_347_2
1382	530	613	2	2	1	ben_par_kahawa_soweto_348_2
1283	532	614	2	2	1	ben_par_kahawa_soweto_349_2
929	530	615	2	2	1	ben_par_kahawa_soweto_350_2
1128	524	616	2	2	1	ben_par_kahawa_soweto_351_2
1497	539	617	2	2	1	ben_par_kahawa_soweto_352_2
1371	535	618	2	2	1	ben_par_kahawa_soweto_353_2
1315	522	619	2	2	1	ben_par_kahawa_soweto_354_2
1194	514	620	2	2	1	ben_par_kahawa_soweto_355_2
836	519	621	2	2	1	ben_par_kahawa_soweto_356_2
1341	534	622	2	2	1	ben_par_kahawa_soweto_357_2
943	533	623	2	2	1	ben_par_kahawa_soweto_358_2
1073	511	624	2	2	1	ben_par_kahawa_soweto_359_2
931	530	625	2	2	1	ben_par_kahawa_soweto_360_2
1008	533	626	2	2	1	ben_par_kahawa_soweto_361_2
1469	527	627	2	2	1	ben_par_kahawa_soweto_362_2
1187	527	628	2	2	1	ben_par_kahawa_soweto_363_2
1377	517	629	2	2	1	ben_par_kahawa_soweto_364_2
1029	535	630	2	2	1	ben_par_kahawa_soweto_365_2
1337	517	631	2	2	1	ben_par_kahawa_soweto_366_2
1036	535	632	2	2	1	ben_par_kahawa_soweto_367_2
1036	533	633	2	2	1	ben_par_kahawa_soweto_367_2
1077	533	634	2	2	1	ben_par_kahawa_soweto_368_2
790	534	635	2	2	1	ben_par_kahawa_soweto_369_2
1448	534	636	2	2	1	ben_par_kahawa_soweto_370_2
1057	511	637	2	2	1	ben_par_kahawa_soweto_371_2
942	539	638	2	2	1	ben_par_kahawa_soweto_372_2
1112	524	639	2	2	1	ben_par_kahawa_soweto_373_2
1406	511	640	2	2	1	ben_par_kahawa_soweto_374_2
820	511	641	2	2	1	ben_par_kahawa_soweto_375_2
1362	512	642	2	2	1	ben_par_kahawa_soweto_376_2
1393	531	643	2	2	1	ben_par_kahawa_soweto_377_2
934	533	644	2	2	1	ben_par_kahawa_soweto_378_2
1265	526	645	2	2	1	ben_par_kahawa_soweto_379_2
1291	527	646	2	2	1	ben_par_kahawa_soweto_380_2
1071	512	647	2	2	1	ben_par_kahawa_soweto_381_2
1031	516	648	2	2	1	ben_par_kahawa_soweto_382_2
1324	521	649	2	2	1	ben_par_kahawa_soweto_383_2
1063	534	650	2	2	1	ben_par_kahawa_soweto_384_2
944	531	651	2	2	1	ben_par_kahawa_soweto_385_2
1120	516	652	2	2	1	ben_par_kahawa_soweto_386_2
914	511	653	2	2	1	ben_par_kahawa_soweto_387_2
1037	533	654	2	2	1	ben_par_kahawa_soweto_388_2
1274	511	655	2	2	1	ben_par_kahawa_soweto_389_2
1166	514	656	2	2	1	ben_par_kahawa_soweto_390_2
1241	521	657	2	2	1	ben_par_kahawa_soweto_391_2
978	516	658	2	2	1	ben_par_kahawa_soweto_392_2
1543	528	659	2	2	1	ben_par_kahawa_soweto_393_2
1544	529	660	2	2	1	ben_par_kahawa_soweto_394_2
1546	525	661	2	2	1	ben_par_kahawa_soweto_395_2
884	524	662	2	2	1	ben_par_kahawa_soweto_396_2
1554	515	663	2	2	1	ben_par_kahawa_soweto_397_2
1455	530	664	2	2	1	ben_par_kahawa_soweto_398_2
1480	521	665	2	2	1	ben_par_kahawa_soweto_399_2
1518	534	666	2	2	1	ben_par_kahawa_soweto_400_2
1475	512	667	2	2	1	ben_par_kahawa_soweto_401_2
1438	513	668	2	2	1	ben_par_kahawa_soweto_402_2
1334	527	669	2	2	1	ben_par_kahawa_soweto_403_2
1505	530	670	2	2	1	ben_par_kahawa_soweto_404_2
1389	511	671	2	2	1	ben_par_kahawa_soweto_405_2
1458	532	672	2	2	1	ben_par_kahawa_soweto_406_2
1545	516	673	2	2	1	ben_par_kahawa_soweto_407_2
1016	524	674	2	2	1	ben_par_kahawa_soweto_408_2
1490	522	675	2	2	1	ben_par_kahawa_soweto_409_2
1439	520	676	2	2	1	ben_par_kahawa_soweto_410_2
1087	520	677	2	2	1	ben_par_kahawa_soweto_411_2
858	511	678	2	2	1	ben_par_kahawa_soweto_412_2
911	523	679	2	2	1	ben_par_kahawa_soweto_413_2
851	512	680	2	2	1	ben_par_kahawa_soweto_414_2
839	532	681	2	2	1	ben_par_kahawa_soweto_415_2
1547	524	682	2	2	1	ben_par_kahawa_soweto_416_2
1416	530	683	2	2	1	ben_par_kahawa_soweto_417_2
1390	533	684	2	2	1	ben_par_kahawa_soweto_418_2
1303	520	685	2	2	1	ben_par_kahawa_soweto_419_2
1080	521	686	2	2	1	ben_par_kahawa_soweto_420_2
1303	522	687	2	2	1	ben_par_kahawa_soweto_419_2
1495	523	688	2	2	1	ben_par_kahawa_soweto_422_2
1548	524	689	2	2	1	ben_par_kahawa_soweto_423_2
1378	515	690	2	2	1	ben_par_kahawa_soweto_424_2
808	530	691	2	2	1	ben_par_kahawa_soweto_425_2
1055	523	692	2	2	1	ben_par_kahawa_soweto_426_2
1262	524	693	2	2	1	ben_par_kahawa_soweto_427_2
1412	526	694	2	2	1	ben_par_kahawa_soweto_428_2
1424	516	695	2	2	1	ben_par_kahawa_soweto_429_2
1225	511	696	2	2	1	ben_par_kahawa_soweto_430_2
1052	539	697	2	2	1	ben_par_kahawa_soweto_431_2
1024	513	698	2	2	1	ben_par_kahawa_soweto_432_2
933	516	699	2	2	1	ben_par_kahawa_soweto_433_2
1331	519	700	2	2	1	ben_par_kahawa_soweto_434_2
855	539	701	2	2	1	ben_par_kahawa_soweto_435_2
1015	520	702	2	2	1	ben_par_kahawa_soweto_436_2
936	523	703	2	2	1	ben_par_kahawa_soweto_437_2
1437	535	704	2	2	1	ben_par_kahawa_soweto_438_2
963	512	705	2	2	1	ben_par_kahawa_soweto_439_2
1354	511	706	2	2	1	ben_par_kahawa_soweto_440_2
958	535	707	2	2	1	ben_par_kahawa_soweto_441_2
1250	524	708	2	2	1	ben_par_kahawa_soweto_442_2
1111	534	709	2	2	1	ben_par_kahawa_soweto_443_2
1384	534	710	2	2	1	ben_par_kahawa_soweto_444_2
1229	516	711	2	2	1	ben_par_kahawa_soweto_445_2
1000	524	712	2	2	1	ben_par_kahawa_soweto_446_2
1373	519	713	2	2	1	ben_par_kahawa_soweto_447_2
825	511	714	2	2	1	ben_par_kahawa_soweto_448_2
1264	516	715	2	2	1	ben_par_kahawa_soweto_449_2
1529	512	716	2	2	1	ben_par_kahawa_soweto_450_2
1270	527	717	2	2	1	ben_par_kahawa_soweto_451_2
1049	530	718	2	2	1	ben_par_kahawa_soweto_452_2
1440	515	719	2	2	1	ben_par_kahawa_soweto_453_2
898	517	720	2	2	1	ben_par_kahawa_soweto_454_2
1526	512	721	2	2	1	ben_par_kahawa_soweto_455_2
1496	530	722	2	2	1	ben_par_kahawa_soweto_456_2
1034	517	723	2	2	1	ben_par_kahawa_soweto_457_2
972	514	724	2	2	1	ben_par_kahawa_soweto_458_2
1313	521	725	2	2	1	ben_par_kahawa_soweto_459_2
1467	532	726	2	2	1	ben_par_kahawa_soweto_460_2
1165	530	727	2	2	1	ben_par_kahawa_soweto_461_2
1054	530	728	2	2	1	ben_par_kahawa_soweto_462_2
1051	511	729	2	2	1	ben_par_kahawa_soweto_463_2
999	519	730	2	2	1	ben_par_kahawa_soweto_464_2
1372	524	731	2	2	1	ben_par_kahawa_soweto_465_2
1269	527	732	2	2	1	ben_par_kahawa_soweto_466_2
1426	533	733	2	2	1	ben_par_kahawa_soweto_467_2
1524	524	734	2	2	1	ben_par_kahawa_soweto_468_2
1141	518	735	2	2	1	ben_par_kahawa_soweto_469_2
1474	524	736	2	2	1	ben_par_kahawa_soweto_470_2
1032	534	737	2	2	1	ben_par_kahawa_soweto_471_2
813	524	738	2	2	1	ben_par_kahawa_soweto_472_2
861	512	739	2	2	1	ben_par_kahawa_soweto_473_2
1219	526	740	2	2	1	ben_par_kahawa_soweto_474_2
1072	515	741	2	2	1	ben_par_kahawa_soweto_475_2
1138	522	742	2	2	1	ben_par_kahawa_soweto_476_2
951	535	743	2	2	1	ben_par_kahawa_soweto_477_2
868	535	744	2	2	1	ben_par_kahawa_soweto_478_2
791	533	745	2	2	1	ben_par_kahawa_soweto_479_2
1309	531	746	2	2	1	ben_par_kahawa_soweto_480_2
1012	534	747	2	2	1	ben_par_kahawa_soweto_481_2
1091	517	748	2	2	1	ben_par_kahawa_soweto_482_2
1002	514	749	2	2	1	ben_par_kahawa_soweto_483_2
1404	516	750	2	2	1	ben_par_kahawa_soweto_484_2
1011	530	751	2	2	1	ben_par_kahawa_soweto_485_2
832	524	752	2	2	1	ben_par_kahawa_soweto_486_2
815	531	753	2	2	1	ben_par_kahawa_soweto_487_2
1527	530	754	2	2	1	ben_par_kahawa_soweto_488_2
1148	517	755	2	2	1	ben_par_kahawa_soweto_489_2
866	512	756	2	2	1	ben_par_kahawa_soweto_490_2
831	522	757	2	2	1	ben_par_kahawa_soweto_491_2
1293	519	758	2	2	1	ben_par_kahawa_soweto_492_2
1444	532	759	2	2	1	ben_par_kahawa_soweto_493_2
905	519	760	2	2	1	ben_par_kahawa_soweto_494_2
902	530	761	2	2	1	ben_par_kahawa_soweto_495_2
988	514	762	2	2	1	ben_par_kahawa_soweto_496_2
1234	522	763	2	2	1	ben_par_kahawa_soweto_497_2
782	526	764	2	2	1	ben_par_kahawa_soweto_498_2
1227	534	765	2	2	1	ben_par_kahawa_soweto_499_2
1405	511	766	2	2	1	ben_par_kahawa_soweto_500_2
829	524	767	2	2	1	ben_par_kahawa_soweto_501_2
1023	532	768	2	2	1	ben_par_kahawa_soweto_502_2
849	535	769	2	2	1	ben_par_kahawa_soweto_503_2
1468	516	770	2	2	1	ben_par_kahawa_soweto_504_2
1462	521	771	2	2	1	ben_par_kahawa_soweto_505_2
1004	521	772	2	2	1	ben_par_kahawa_soweto_506_2
1174	511	773	2	2	1	ben_par_kahawa_soweto_507_2
1508	518	774	2	2	1	ben_par_kahawa_soweto_508_2
1246	519	775	2	2	1	ben_par_kahawa_soweto_509_2
1292	522	776	2	2	1	ben_par_kahawa_soweto_510_2
1312	516	777	2	2	1	ben_par_kahawa_soweto_511_2
1010	519	778	2	2	1	ben_par_kahawa_soweto_512_2
1301	520	779	2	2	1	ben_par_kahawa_soweto_513_2
913	516	780	2	2	1	ben_par_kahawa_soweto_514_2
1132	513	781	2	2	1	ben_par_kahawa_soweto_515_2
1244	519	782	2	2	1	ben_par_kahawa_soweto_516_2
965	516	783	2	2	1	ben_par_kahawa_soweto_517_2
1267	521	784	2	2	1	ben_par_kahawa_soweto_518_2
1478	515	785	2	2	1	ben_par_kahawa_soweto_519_2
1207	516	786	2	2	1	ben_par_kahawa_soweto_520_2
1182	518	787	2	2	1	ben_par_kahawa_soweto_521_2
1084	512	788	2	2	1	ben_par_kahawa_soweto_522_2
1082	521	789	2	2	1	ben_par_kahawa_soweto_523_2
1271	520	790	2	2	1	ben_par_kahawa_soweto_524_2
1408	535	791	2	2	1	ben_par_kahawa_soweto_525_2
893	527	792	2	2	1	ben_par_kahawa_soweto_526_2
1391	518	793	2	2	1	ben_par_kahawa_soweto_527_2
1144	530	794	2	2	1	ben_par_kahawa_soweto_528_2
900	519	795	2	2	1	ben_par_kahawa_soweto_529_2
1375	516	796	2	2	1	ben_par_kahawa_soweto_530_2
1356	534	797	2	2	1	ben_par_kahawa_soweto_531_2
1164	518	798	2	2	1	ben_par_kahawa_soweto_532_2
1366	523	799	2	2	1	ben_par_kahawa_soweto_533_2
1277	511	800	2	2	1	ben_par_kahawa_soweto_534_2
1425	526	801	2	2	1	ben_par_kahawa_soweto_535_2
1340	522	802	2	2	1	ben_par_kahawa_soweto_536_2
1402	539	803	2	2	1	ben_par_kahawa_soweto_537_2
1056	527	804	2	2	1	ben_par_kahawa_soweto_538_2
823	530	805	2	2	1	ben_par_kahawa_soweto_539_2
1195	527	806	2	2	1	ben_par_kahawa_soweto_540_2
1170	532	807	2	2	1	ben_par_kahawa_soweto_541_2
1294	527	808	2	2	1	ben_par_kahawa_soweto_542_2
957	514	809	2	2	1	ben_par_kahawa_soweto_543_2
919	511	810	2	2	1	ben_par_kahawa_soweto_544_2
935	532	811	2	2	1	ben_par_kahawa_soweto_545_2
1374	512	812	2	2	1	ben_par_kahawa_soweto_546_2
1533	539	813	2	2	1	ben_par_kahawa_soweto_547_2
982	522	814	2	2	1	ben_par_kahawa_soweto_548_2
801	520	815	2	2	1	ben_par_kahawa_soweto_549_2
846	527	816	2	2	1	ben_par_kahawa_soweto_550_2
1549	538	817	2	2	1	ben_par_kahawa_soweto_551_2
1549	537	818	2	2	1	ben_par_kahawa_soweto_551_2
1538	525	819	2	2	1	ben_par_kahawa_soweto_552_2
1245	516	820	2	2	1	ben_par_kahawa_soweto_553_2
1281	534	821	2	2	1	ben_par_kahawa_soweto_554_2
1257	516	822	2	2	1	ben_par_kahawa_soweto_555_2
1305	531	823	2	2	1	ben_par_kahawa_soweto_556_2
1476	521	824	2	2	1	ben_par_kahawa_soweto_557_2
1181	539	825	2	2	1	ben_par_kahawa_soweto_558_2
1046	527	826	2	2	1	ben_par_kahawa_soweto_559_2
1276	519	827	2	2	1	ben_par_kahawa_soweto_560_2
968	521	828	2	2	1	ben_par_kahawa_soweto_561_2
853	519	829	2	2	1	ben_par_kahawa_soweto_562_2
1311	515	830	2	2	1	ben_par_kahawa_soweto_563_2
1370	518	831	2	2	1	ben_par_kahawa_soweto_564_2
814	511	832	2	2	1	ben_par_kahawa_soweto_565_2
1030	518	833	2	2	1	ben_par_kahawa_soweto_566_2
1409	531	834	2	2	1	ben_par_kahawa_soweto_567_2
1263	524	835	2	2	1	ben_par_kahawa_soweto_568_2
1494	511	836	2	2	1	ben_par_kahawa_soweto_569_2
1047	534	837	2	2	1	ben_par_kahawa_soweto_570_2
1387	539	838	2	2	1	ben_par_kahawa_soweto_571_2
1153	539	839	2	2	1	ben_par_kahawa_soweto_572_2
1433	516	840	2	2	1	ben_par_kahawa_soweto_573_2
822	516	841	2	2	1	ben_par_kahawa_soweto_574_2
828	524	842	2	2	1	ben_par_kahawa_soweto_575_2
901	532	843	2	2	1	ben_par_kahawa_soweto_576_2
997	534	844	2	2	1	ben_par_kahawa_soweto_577_2
1199	520	845	2	2	1	ben_par_kahawa_soweto_579_2
1199	527	846	2	2	1	ben_par_kahawa_soweto_579_2
1550	511	847	2	2	1	ben_par_kahawa_soweto_580_2
1364	515	848	2	2	1	ben_par_kahawa_soweto_581_2
948	523	849	2	2	1	ben_par_kahawa_soweto_582_2
925	511	850	2	2	1	ben_par_kahawa_soweto_583_2
1070	539	851	2	2	1	ben_par_kahawa_soweto_584_2
1070	533	852	2	2	1	ben_par_kahawa_soweto_584_2
1367	523	853	2	2	1	ben_par_kahawa_soweto_585_2
838	522	854	2	2	1	ben_par_kahawa_soweto_586_2
1319	530	855	2	2	1	ben_par_kahawa_soweto_587_2
1255	532	856	2	2	1	ben_par_kahawa_soweto_588_2
1466	523	857	2	2	1	ben_par_kahawa_soweto_589_2
1498	527	858	2	2	1	ben_par_kahawa_soweto_590_2
1256	530	859	2	2	1	ben_par_kahawa_soweto_591_2
1399	521	860	2	2	1	ben_par_kahawa_soweto_592_2
1515	521	861	2	2	1	ben_par_kahawa_soweto_593_2
1184	517	862	2	2	1	ben_par_kahawa_soweto_594_2
1388	527	863	2	2	1	ben_par_kahawa_soweto_595_2
1365	522	864	2	2	1	ben_par_kahawa_soweto_596_2
1108	522	865	2	2	1	ben_par_kahawa_soweto_597_2
1551	533	866	2	2	1	ben_par_kahawa_soweto_598_2
1215	523	867	2	2	1	ben_par_kahawa_soweto_599_2
1193	512	868	2	2	1	ben_par_kahawa_soweto_600_2
952	520	869	2	2	1	ben_par_kahawa_soweto_601_2
1224	520	870	2	2	1	ben_par_kahawa_soweto_602_2
784	511	871	2	2	1	ben_par_kahawa_soweto_603_2
1058	512	872	2	2	1	ben_par_kahawa_soweto_604_2
877	534	873	2	2	1	ben_par_kahawa_soweto_605_2
1531	522	874	2	2	1	ben_par_kahawa_soweto_606_2
1075	534	875	2	2	1	ben_par_kahawa_soweto_607_2
1223	511	876	2	2	1	ben_par_kahawa_soweto_608_2
1006	522	877	2	2	1	ben_par_kahawa_soweto_609_2
865	514	878	2	2	1	ben_par_kahawa_soweto_610_2
1484	519	879	2	2	1	ben_par_kahawa_soweto_611_2
1203	515	880	2	2	1	ben_par_kahawa_soweto_612_2
960	511	881	2	2	1	ben_par_kahawa_soweto_613_2
987	524	882	2	2	1	ben_par_kahawa_soweto_614_2
1502	534	883	2	2	1	ben_par_kahawa_soweto_615_2
961	531	884	2	2	1	ben_par_kahawa_soweto_616_2
1317	531	885	2	2	1	ben_par_kahawa_soweto_617_2
1088	521	886	2	2	1	ben_par_kahawa_soweto_618_2
1299	516	887	2	2	1	ben_par_kahawa_soweto_619_2
1107	517	888	2	2	1	ben_par_kahawa_soweto_620_2
1233	522	889	2	2	1	ben_par_kahawa_soweto_621_2
971	526	890	2	2	1	ben_par_kahawa_soweto_622_2
1443	521	891	2	2	1	ben_par_kahawa_soweto_623_2
1555	513	892	2	2	1	ben_par_kahawa_soweto_624_2
1500	535	893	2	2	1	ben_par_kahawa_soweto_625_2
1155	519	894	2	2	1	ben_par_kahawa_soweto_626_2
878	519	895	2	2	1	ben_par_kahawa_soweto_627_2
1252	522	896	2	2	1	ben_par_kahawa_soweto_628_2
1114	513	897	2	2	1	ben_par_kahawa_soweto_629_2
1175	517	898	2	2	1	ben_par_kahawa_soweto_630_2
1320	515	899	2	2	1	ben_par_kahawa_soweto_631_2
995	516	900	2	2	1	ben_par_kahawa_soweto_632_2
1127	514	901	2	2	1	ben_par_kahawa_soweto_633_2
1198	534	902	2	2	1	ben_par_kahawa_soweto_634_2
1060	516	903	2	2	1	ben_par_kahawa_soweto_635_2
1116	521	904	2	2	1	ben_par_kahawa_soweto_636_2
1159	512	905	2	2	1	ben_par_kahawa_soweto_637_2
1206	515	906	2	2	1	ben_par_kahawa_soweto_638_2
1403	530	907	2	2	1	ben_par_kahawa_soweto_639_2
1191	522	908	2	2	1	ben_par_kahawa_soweto_640_2
953	522	909	2	2	1	ben_par_kahawa_soweto_641_2
1261	518	910	2	2	1	ben_par_kahawa_soweto_642_2
806	517	911	2	2	1	ben_par_kahawa_soweto_643_2
930	531	912	2	2	1	ben_par_kahawa_soweto_644_2
1177	539	913	2	2	1	ben_par_kahawa_soweto_645_2
938	519	914	2	2	1	ben_par_kahawa_soweto_646_2
924	511	915	2	2	1	ben_par_kahawa_soweto_647_2
922	523	916	2	2	1	ben_par_kahawa_soweto_648_2
909	521	917	2	2	1	ben_par_kahawa_soweto_649_2
857	519	918	2	2	1	ben_par_kahawa_soweto_650_2
1368	539	919	2	2	1	ben_par_kahawa_soweto_651_2
1167	535	920	2	2	1	ben_par_kahawa_soweto_652_2
1491	534	921	2	2	1	ben_par_kahawa_soweto_653_2
1248	526	922	2	2	1	ben_par_kahawa_soweto_654_2
888	522	923	2	2	1	ben_par_kahawa_soweto_655_2
920	533	924	2	2	1	ben_par_kahawa_soweto_656_2
1358	517	925	2	2	1	ben_par_kahawa_soweto_657_2
1149	517	926	2	2	1	ben_par_kahawa_soweto_658_2
1178	517	927	2	2	1	ben_par_kahawa_soweto_659_2
903	521	928	2	2	1	ben_par_kahawa_soweto_660_2
1053	527	929	2	2	1	ben_par_kahawa_soweto_661_2
1380	513	930	2	2	1	ben_par_kahawa_soweto_662_2
1121	531	931	2	2	1	ben_par_kahawa_soweto_663_2
945	531	932	2	2	1	ben_par_kahawa_soweto_664_2
1041	534	933	2	2	1	ben_par_kahawa_soweto_665_2
1050	522	934	2	2	1	ben_par_kahawa_soweto_666_2
1266	533	935	2	2	1	ben_par_kahawa_soweto_667_2
833	535	936	2	2	1	ben_par_kahawa_soweto_668_2
910	527	937	2	2	1	ben_par_kahawa_soweto_669_2
1395	527	938	2	2	1	ben_par_kahawa_soweto_670_2
917	519	939	2	2	1	ben_par_kahawa_soweto_671_2
1156	526	940	2	2	1	ben_par_kahawa_soweto_672_2
1422	524	941	2	2	1	ben_par_kahawa_soweto_673_2
996	518	942	2	2	1	ben_par_kahawa_soweto_674_2
819	514	943	2	2	1	ben_par_kahawa_soweto_675_2
928	533	944	2	2	1	ben_par_kahawa_soweto_676_2
1247	521	945	2	2	1	ben_par_kahawa_soweto_677_2
1328	511	946	2	2	1	ben_par_kahawa_soweto_678_2
1520	519	947	2	2	1	ben_par_kahawa_soweto_679_2
1481	531	948	2	2	1	ben_par_kahawa_soweto_680_2
1348	519	949	2	2	1	ben_par_kahawa_soweto_681_2
1272	527	950	2	2	1	ben_par_kahawa_soweto_682_2
1085	519	951	2	2	1	ben_par_kahawa_soweto_683_2
1504	519	952	2	2	1	ben_par_kahawa_soweto_684_2
1150	530	953	2	2	1	ben_par_kahawa_soweto_685_2
882	513	954	2	2	1	ben_par_kahawa_soweto_686_2
864	530	955	2	2	1	ben_par_kahawa_soweto_687_2
795	520	956	2	2	1	ben_par_kahawa_soweto_688_2
1435	527	957	2	2	1	ben_par_kahawa_soweto_689_2
1302	523	958	2	2	1	ben_par_kahawa_soweto_690_2
1308	532	959	2	2	1	ben_par_kahawa_soweto_691_2
869	519	960	2	2	1	ben_par_kahawa_soweto_692_2
1211	521	961	2	2	1	ben_par_kahawa_soweto_693_2
1154	539	962	2	2	1	ben_par_kahawa_soweto_694_2
1228	519	963	2	2	1	ben_par_kahawa_soweto_695_2
1275	522	964	2	2	1	ben_par_kahawa_soweto_696_2
1361	530	965	2	2	1	ben_par_kahawa_soweto_697_2
1411	519	966	2	2	1	ben_par_kahawa_soweto_698_2
1441	524	967	2	2	1	ben_par_kahawa_soweto_699_2
1113	522	968	2	2	1	ben_par_kahawa_soweto_700_2
981	524	969	2	2	1	ben_par_kahawa_soweto_701_2
802	524	970	2	2	1	ben_par_kahawa_soweto_702_2
1035	515	971	2	2	1	ben_par_kahawa_soweto_703_2
826	514	972	2	2	1	ben_par_kahawa_soweto_704_2
1359	517	973	2	2	1	ben_par_kahawa_soweto_705_2
1417	524	974	2	2	1	ben_par_kahawa_soweto_706_2
1151	527	975	2	2	1	ben_par_kahawa_soweto_707_2
1183	515	976	2	2	1	ben_par_kahawa_soweto_708_2
1129	518	977	2	2	1	ben_par_kahawa_soweto_709_2
1284	517	978	2	2	1	ben_par_kahawa_soweto_710_2
1532	525	979	2	2	1	ben_par_kahawa_soweto_711_2
1552	539	980	2	2	1	ben_par_kahawa_soweto_712_2
1541	525	981	2	2	1	ben_par_kahawa_soweto_713_2
1537	536	982	2	2	1	ben_par_kahawa_soweto_714_2
1222	534	983	2	2	1	ben_par_kahawa_soweto_715_2
1316	516	984	2	2	1	ben_par_kahawa_soweto_716_2
1463	523	985	2	2	1	ben_par_kahawa_soweto_717_2
1428	526	986	2	2	1	ben_par_kahawa_soweto_718_2
1163	517	987	2	2	1	ben_par_kahawa_soweto_719_2
817	532	988	2	2	1	ben_par_kahawa_soweto_720_2
1152	514	989	2	2	1	ben_par_kahawa_soweto_721_2
1432	522	990	2	2	1	ben_par_kahawa_soweto_722_2
1363	522	991	2	2	1	ben_par_kahawa_soweto_723_2
1020	531	992	2	2	1	ben_par_kahawa_soweto_724_2
1171	511	993	2	2	1	ben_par_kahawa_soweto_725_2
1280	523	994	2	2	1	ben_par_kahawa_soweto_726_2
1401	519	995	2	2	1	ben_par_kahawa_soweto_727_2
1160	516	996	2	2	1	ben_par_kahawa_soweto_728_2
1392	520	997	2	2	1	ben_par_kahawa_soweto_729_2
1307	511	998	2	2	1	ben_par_kahawa_soweto_730_2
1097	519	999	2	2	1	ben_par_kahawa_soweto_731_2
964	511	1000	2	2	1	ben_par_kahawa_soweto_732_2
1279	518	1001	2	2	1	ben_par_kahawa_soweto_733_2
1457	515	1002	2	2	1	ben_par_kahawa_soweto_734_2
1407	539	1003	2	2	1	ben_par_kahawa_soweto_735_2
1135	533	1004	2	2	1	ben_par_kahawa_soweto_736_2
1133	523	1005	2	2	1	ben_par_kahawa_soweto_737_2
1436	514	1006	2	2	1	ben_par_kahawa_soweto_738_2
785	535	1007	2	2	1	ben_par_kahawa_soweto_739_2
1485	520	1008	2	2	1	ben_par_kahawa_soweto_740_2
1209	513	1009	2	2	1	ben_par_kahawa_soweto_741_2
956	535	1010	2	2	1	ben_par_kahawa_soweto_742_2
1431	516	1011	2	2	1	ben_par_kahawa_soweto_743_2
923	512	1012	2	2	1	ben_par_kahawa_soweto_744_2
1488	524	1013	2	2	1	ben_par_kahawa_soweto_745_2
1213	518	1014	2	2	1	ben_par_kahawa_soweto_746_2
1329	517	1015	2	2	1	ben_par_kahawa_soweto_747_2
1218	512	1016	2	2	1	ben_par_kahawa_soweto_748_2
974	513	1017	2	2	1	ben_par_kahawa_soweto_749_2
937	511	1018	2	2	1	ben_par_kahawa_soweto_750_2
1383	530	1019	2	2	1	ben_par_kahawa_soweto_751_2
954	518	1020	2	2	1	ben_par_kahawa_soweto_752_2
1385	522	1021	2	2	1	ben_par_kahawa_soweto_753_2
1297	535	1022	2	2	1	ben_par_kahawa_soweto_754_2
1540	524	1023	2	2	1	ben_par_kahawa_soweto_755_2
1540	520	1024	2	2	1	ben_par_kahawa_soweto_755_2
1556	539	1025	2	2	1	ben_par_kahawa_soweto_756_2
1556	531	1026	2	2	1	ben_par_kahawa_soweto_756_2
1556	527	1027	2	2	1	ben_par_kahawa_soweto_756_2
1158	513	1028	2	2	1	ben_par_kahawa_soweto_757_2
1446	533	1029	2	2	1	ben_par_kahawa_soweto_758_2
1459	526	1030	2	2	1	ben_par_kahawa_soweto_759_2
994	526	1031	2	2	1	ben_par_kahawa_soweto_760_2
985	519	1032	2	2	1	ben_par_kahawa_soweto_761_2
991	535	1033	2	2	1	ben_par_kahawa_soweto_762_2
1197	531	1034	2	2	1	ben_par_kahawa_soweto_763_2
1065	516	1035	2	2	1	ben_par_kahawa_soweto_764_2
926	535	1036	2	2	1	ben_par_kahawa_soweto_765_2
1470	532	1037	2	2	1	ben_par_kahawa_soweto_766_2
1242	520	1038	2	2	1	ben_par_kahawa_soweto_767_2
1106	524	1039	2	2	1	ben_par_kahawa_soweto_768_2
1192	526	1040	2	2	1	ben_par_kahawa_soweto_769_2
810	514	1041	2	2	1	ben_par_kahawa_soweto_770_2
1200	518	1042	2	2	1	ben_par_kahawa_soweto_771_2
1103	533	1043	2	2	1	ben_par_kahawa_soweto_772_2
1157	519	1044	2	2	1	ben_par_kahawa_soweto_773_2
896	524	1045	2	2	1	ben_par_kahawa_soweto_774_2
896	513	1046	2	2	1	ben_par_kahawa_soweto_774_2
1026	535	1047	2	2	1	ben_par_kahawa_soweto_776_2
1254	522	1048	2	2	1	ben_par_kahawa_soweto_777_2
1429	530	1049	2	2	1	ben_par_kahawa_soweto_778_2
1076	524	1050	2	2	1	ben_par_kahawa_soweto_779_2
1528	518	1051	2	2	1	ben_par_kahawa_soweto_780_2
1325	531	1052	2	2	1	ben_par_kahawa_soweto_781_2
1516	527	1053	2	2	1	ben_par_kahawa_soweto_782_2
1369	526	1054	2	2	1	ben_par_kahawa_soweto_783_2
1330	514	1055	2	2	1	ben_par_kahawa_soweto_784_2
\.


--
-- Data for Name: benefit_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.benefit_type (id, type) FROM stdin;
1	Secure tenure
2	Linkage to Safety Nets
3	Community Development Plan
4	Improved Infrastructure
5	Household Water Connection
6	Sewerage Connection
7	Training
8	Short-Term Employment
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
2	Kwale	Kwale	0106000020E610000002000000010300000001000000080000001288D7F50BBA4340B1A206D3303C12C009C4EBFA05BB4340A18499B67F2512C09981CAF8F7B9434070CE88D2DE2012C086200725CCB843405C3D27BD6F3C12C0FAD51C2098B74340FA9B5088804312C00708E6E8F1B743404A46CEC29E5612C09279E40F06BA4340234A7B832F4C12C01288D7F50BBA4340B1A206D3303C12C00103000000010000005C000000F20C1AFA27C84340A29C685721E50FC07D7901F6D1C543408BA6B393C1D10FC0617138F3ABC5434038328FFCC1C00FC0C8CD70033EC34340535C55F65D910FC056F146E691C3434038F3AB3940700FC034BA83D899C24340F8C264AA60540FC0AB09A2EE03C043404B766C04E2350FC01EE1B4E045BF4340170E846401130FC0207BBDFBE3BD43404221020EA10A0FC09DD7D825AABB4340CDAFE600C1DC0EC0F73B1405FAB843409DBAF2599EC70EC0FD6A0E10CCB543403CBD5296218E0EC0C9AB730CC8B2434011AAD4EC81960EC0381092054CB0434087DC0C37E0730EC055185B0872B043402A3A92CB7F480EC05969520ABAB14340554D10751F400EC0359886E123B243409031772D211F0EC03C8386FE09B24340FC3559A31EE20DC0C8EF6DFAB3AF4340D122DBF97EEA0DC03659A31EA2AD43401C42959A3DD00DC01B4CC3F011AD4340E466B8019F5F0DC02861A6ED5FAD4340622D3E05C0380DC00EF3E505D8AB43402EC55565DF150DC0A323B9FC87AC4340107A36AB3ED70CC02310AFEB17AC43406C04E275FDC20CC07D7901F6D1A9434050C24CDBBFB20CC00E15E3FC4DA84340E2CCAFE600810CC06E8B321B64A64340CE88D2DEE08B0CC0B9DFA128D08B4340B6B9313D61890CC00EF3E505D8874340FA9B508880830DC02BD9B111887B434059C0046EDD0D0DC0FBAE08FEB7764340C7F484251E900DC0E21E4B1FBA8443406B2BF697DD130EC0774A07EBFF784340B2D7BB3FDEAB0FC09352D0ED2539434094BC3AC7808C10C00E15E3FC4D9843408CF337A110A112C098A3C7EF6D9A434017821C9430B312C00708E6E8F19B43403C31EBC550AE12C0151DC9E53F9C43409357E718909D12C024D1CB28969B4340986E1283C08A12C0C8CD70033E9F4340014D840D4F6F12C0C63368E89FA04340AFB14B546F6D12C03F1D8F19A8A04340E8A4F78DAF5D12C034BF9A03049F434057B26323104F12C0E31934F44FA443405AD8D30E7F4D12C09981CAF8F7A94340D0D556EC2F3B12C086200725CCA84340917EFB3A704E12C0774A07EBFFA84340E1404816306112C00EF3E505D8A743407C613255306A12C007EBFF1CE6A74340D5EC8156608812C00A80F10C1AAA43408ECC237F309012C0B9DFA128D0AB434026FC523F6F8A12C0C616821C94B04340F836FDD98F9412C056F146E691B343408A8EE4F21F9212C03C8386FE09B24340D4601A868F6812C052616C21C8B14340E63FA4DFBE4E12C0E3FC4D2844B0434078978BF84E2C12C0C2C073EFE1B24340E0675C38103212C07120240B98B44340E3A59BC4203012C0DB334B02D4B44340DE76A1B94E2312C0029A081B9EB643408C67D0D03F2112C0F584251E50B64340E38DCC237F1012C0A228D027F2B84340BC0512143F0612C011AAD4EC81BA43403541D47D001212C0A774B0FECFBD43407F87A2409FE811C02BF697DD93BF434022718FA50FDD11C0B3D2A41474BF434091F2936A9FCE11C04C4F58E201C14340033E3F8C10BE11C03F3A75E5B3C0434079AF5A99F0AB11C04C7155D977C143409D853DEDF09711C0E86A2BF697C543401B81785DBFA011C0609335EA21C64340CB4A9352D08D11C0064CE0D6DDC843401AA88C7F9F5111C09C16BCE82BCC4340B806B64AB01811C0B1169F0260CC43406744696FF00511C04390831266CE4340C80C54C6BFCF10C04D10751F80D0434081785DBF60B710C0E76F422102D24340740CC85EEF9E10C04EEE77280AD04340F8C264AA609410C0C45A7C0A80D143408C67D0D03F8110C0CA89761552CE4340C381902C606210C040FB912232CC43400EA14ACD1E6810C024EEB1F4A1CB434010069E7B0F7710C01288D7F50BCA434099BB96900F7A10C07D7901F6D1C943400A2E56D4607A10C082CAF8F719CB434046D3D9C9E06810C00A80F10C1ACA43402C9FE579705710C07D7901F6D1C9434011DF89592F2610C00E15E3FC4DC8434080608E1EBF1710C078280AF489C84340EC2FBB270F0B10C0713D0AD7A3C843401AA88C7F9FF10FC0F20C1AFA27C84340A29C685721E50FC0
6	Taita Taveta	Taita Taveta	0103000020E6100000010000005500000021CD58349D894340A3755435415408C0C2DD59BBED82434026FC523F6F2A08C0D8F50B76C37E434065A54929E83608C0B610E4A0847D4340C6DCB5847C5008C08BFD65F7E47943401C42959A3D5008C0EBAD81AD12784340F3AB3940304708C08CA19C685775434025E99AC9375B08C0C381902C6072434074EFE192E34E08C07B832F4CA66E4340A20BEA5BE67408C012F758FAD0694340CE1951DA1B7C08C014967840D96843409C8A54185B8808C0F0332E1C08654340892991442F6308C0BB9BA73AE46243400BD28C45D35908C020EF552B135E434080828B15355808C034D769A4A55A4340367689EAAD4108C04CA60A46255543403815A930B65008C03F74417DCB54434058AD4CF8A53E08C0ED9925016A5243405F07CE19511A08C0F5B9DA8AFD4D4340CC28965B5A0D08C026AAB706B64A43402FC03E3A75E507C0E3DF675C3848434086C954C1A8E407C053D0ED258D4543406A87BF266BD407C0FC00A436714243400647C9AB73CC07C05A2A6F47384143402575029A08DB07C03480B740823A434097900F7A36EB07C0AFB14B546F39434049111956F1C607C0AD6EF59CF436434068AED3484BA507C02A8C2D0439344340079964E42C6C07C062670A9DD7304340637FD93D795807C0E2AFC91AF52C4340B8585183691807C0C5FEB27BF2284340984C158C4AAA06C0282CF180B225434090A0F831E66E06C0AFB14B546F214340DA03ADC0901506C0DEE522BE13174340956588635D9C05C07DAEB6627F154340018750A5668F05C08104C58F31134340B8CCE9B2989805C0DC2E34D76910434049F4328AE59605C0A6D590B8C70E4340FC8C0B0742B205C0E2E47E87A2FC4240029F1F46084F06C063EE5A423EF842402C2B4D4A413706C07DCB9C2E8BF5424034D769A4A5F206C06DFFCA4A93F242409F71E140481607C0412B306475EF4240CA37DBDC989E08C06FF085C954ED4240376C5B94D9A008C06891ED7C3FED4240637FD93D795809C06ADE718A8EEC42404D327216F67409C066F7E461A1EA42400708E6E8F17B09C0327216F6B4E74240DBBFB2D2A45409C02827DA5548E54240957D5704FF5B09C0EA78CC4065D84240CAA65CE15D6E09C02575029A08DB42406631B1F9B8760AC0A4DFBE0E9CD742401EFE9AAC518F0AC0A4DFBE0E9CD74240F7AFAC3429C50AC0D49AE61DA7D44240D7A3703D0AD70AC033F9669B1BCF424035EF384547320BC026016A6AD9CA4240FD87F4DBD7810BC026016A6AD9CA42405A12A0A696AD0BC05EF415A419CF424046D3D9C9E0A80BC01D03B2D7BBCF424011C7BAB88DC60BC0DA8F149161CD42404C37894160250CC0A5315A4755CF4240689604A8A9250CC012A0A696ADD542402332ACE28D0C0CC0083D9B559FD74240BCE82B4833160CC09352D0ED25D94240F758FAD005350CC0E3A59BC420DC4240EDF0D7648D3A0CC08121AB5B3DDF42409EB5DB2E34570CC04C37894160E142408E588B4F01F00CC0DCF4673F52E44240A5A0DB4B1A630DC022AB5B3D2739434094BC3AC7808C10C0E9F17B9BFE78434079758E01D9AB0FC07FC16ED8B68443404EB4AB90F2130EC0425BCEA5B8764340C7681D554D900DC0C87BD5CA847B4340AF997CB3CD0D0DC0EB1C03B2D78743404FE960FD9F830DC0C8EF6DFAB393434011363CBD52960AC0D690B8C7D29B4340A12DE7525C9508C069A9BC1DE1984340B0FECF61BE7C08C0F88DAF3DB3944340645DDC46037808C0D6E253008C934340E4DA5031CE5F08C01B2FDD240691434012C2A38D235608C09CBF0985089043406536C824232708C0AE0D15E3FC8D434086200725CC3408C094C151F2EA8C43407AC7293A924B08C059518369188A43402E043928616608C021CD58349D894340A3755435415408C0
19	Nyeri	Nyeri	0103000020E610000001000000560000009604A8A965A74240670FB4024356C3BF93C6681D559142400A850838842AA5BFF88DAF3DB3904240C63368E89FE0A2BF34D769A4A58E4240BADA8AFD65F7A4BFD9942BBCCB89424045F5D6C0560966BF2310AFEB1788424021020EA14ACD5E3F50AA7D3A1E8342406B9A779CA223A9BF96CFF23CB87F4240F870C971A774B0BF3737A6272C7D4240AA436E861BF0B1BFC425C79DD27D4240B9533A58FFE7C0BF2C0E677E357F42404A7B832F4CA6C2BF6284F068E380424045813E912749C3BF868F882991804240704221020EA1C6BF52499D80268242404DF38E537424C7BFA20BEA5BE68042408E06F0164850CCBF1A51DA1B7C814240083D9B559FABCDBF40DEAB562680424065C746205ED7CFBF2619390B7B7E424022718FA50F5DD0BFACADD85F767F424005FA449E245DD1BF609335EA217E42404DBED9E6C6F4D2BF6C21C841097B42407E18213CDA38D2BF9C8A54185B7042402A745E6397A8D0BF73BA2C26366F4240E3AAB2EF8AE0CFBFA14ACD1E686D4240F5DBD7817346D0BFCFF753E3A56B424082397AFCDEA6CBBF73BA2C26366B42408F368E588B4FC9BF78B988EFC46C4240179AEB34D252C9BF419AB1683A6F42400AD7A3703D0AC7BFB54FC763066E424004CAA65CE15DC2BF4A07EBFF1C6A4240757632384A5EC1BFFC3559A31E6A4240F697DD938785BABFD3F6AFAC346542408716D9CEF753BBBF6A300DC347604240AC730CC85EEFBEBFD61C2098A35B42404C546F0D6C95C0BF97FF907EFB5A42408D0B0742B280C1BFF20C1AFA275442409CF9D51C2098C3BF39D1AE42CA57424086E63A8DB454C6BFC1C58A1A4C574240E65C8AABCABEC7BFAE122C0E674E4240AA436E861BF0D3BF9274CDE49B4D4240CD920035B56CD5BFCAFD0E45814E4240AAB706B64AB0D6BF5BB6D617094D42407EE36BCF2C09D8BF158C4AEA045042406614CB2DAD86D8BF8109DCBA9B4F4240DDB5847CD0B3D9BF5E4BC8073D534240D82AC1E270E6DBBF3BAA9A20EA5242405396218E7571DDBFDB166536C85442406440F67AF7C7DDBFBEF6CC9200554240EAEC647094BCDEBF64CC5D4BC8534240D4601A868F88E0BFE2E47E87A25442403E7958A835CDE0BFA88C7F9F71554240D1747632384AE2BF17D4B7CCE9564240D847A7AE7C96E2BF89D2DEE00B574240F146E6913F18E3BFAE64C746205A4240033E3F8C101EE4BF423EE8D9AC5A4240B1A206D3307CE3BF74EACA67795A4240139B8F6B43C5E2BFC7681D554D5C4240B3CD8DE9094BE2BF27BD6F7CED5D42408B71FE261422E2BFEB56CF49EF634240DC4603780B24E2BFA6F27684D3664240008C67D0D03FE2BF5D33F9669B674240EE77280AF489E2BFCBF8F719176E424084640113B875E3BFBD3AC780EC7542400118CFA0A17FE3BF183E22A644764240BEA4315A4755E3BF82A8FB00A47E4240D6390664AF77E2BFAC730CC85E7F424004ADC090D5ADE2BFD9EBDD1FEF81424084F068E388B5E2BF4833164D67834240925CFE43FAEDE2BFE0A128D027864240F2EF332E1C08E3BFCEC7B5A162884240D4601A868F88E3BF309E4143FF8C42402CBCCB457C27E4BF2C4833164D8F4240F6EE8FF7AA95E4BFBD8C62B9A595424065DF15C1FF56E4BF020EA14ACD96424090A0F831E6AEE3BF89EAAD81AD964240B936548CF337E3BF3F6F2A52619442408ECC237F30F0E2BF115322895E92424059FAD005F52DE2BF176536C8249342405CC98E8D40BCE1BF7BBDFBE3BD9242407F6ABC749318E1BFE8305F5E809542400B0C59DDEA39E0BF465F419AB19442407C444C89247ADFBF4221020EA19642404777103B53E8DEBF0A2E56D460964240E0DBF4673F52DCBF04FF5BC98E9942409AB1683A3B19DCBFFC8C0B07429A424077103B53E8BCDABF9604A8A965A74240670FB4024356C3BF
36	Bomet	Bomet	0103000020E6100000010000003F0000003A1E335019CB4140DFC325C79DD2E2BFBDC62E51BDB941406D567DAEB662D7BF0B7BDAE1AFB94140F0F96184F068D7BF72F90FE9B7B741407B319413ED2AD8BF632827DA55B441404087F9F202ECD9BF6CCF2C0950B341403524EEB1F4A1D9BFAA0EB9196EAC4140124E0B5EF415DABF919BE1067CAA4140EEB1F4A10BEAD9BFFAB31F2922A74140B08F4E5DF92CDBBFC9C859D8D3A24140EB73B515FBCBDABF9A5FCD01829D41405EBA490C022BDBBF9B5AB6D6179D414032207BBDFBE3DBBF7BBDFBE3BD9A4140CEFC6A0E10CCDDBF32E6AE25E49B4140C217265305A3DEBF73D712F24197414027F73B1405FADEBFE5D022DBF9964140444C89247A19E0BF863DEDF0D7984140BA1457957D57E0BF1366DAFE959941403EE8D9ACFA5CE1BF118DEE20769A41406DE2E47E87A2E1BF9B3DD00A0C99414005A3923A014DE2BFA5BDC117269B41402237C30DF8FCE2BF9430D3F6AF9C4140FE7DC6850321E3BFB6679604A89D414052F2EA1C03B2E3BF2766BD18CA9941404AEF1B5F7B66E4BFF73B1405FA9841404D327216F6B4E4BFF584251E5096414069E388B5F814E5BF4C4F58E201914140D5264EEE7728E5BF3F1D8F19A88C41405778978BF84EE5BF26AAB706B68A41402176A6D0798DE5BF1288D7F50B8A41407C2C7DE882FAE4BF1EE1B4E0458B41400E677E350708E4BF2788BA0F408A4140933A014D840DE3BF6B9A779CA28741407CF2B0506B9AE3BFC095ECD808884140041C42959A3DE4BF029F1F460887414075931804560EE5BF695721E52789414066DAFE959526E6BFA72215C6168641409A9999999999E6BFC1ADBB79AA8B414004560E2DB29DE9BF617138F3AB854140632827DA5548EBBF001DE6CB0B844140F44F70B1A206EBBFAFEB17EC8681414051DA1B7C6132ECBFFD135CACA8814140F5108DEE2076ECBFB48EAA26888A414027F73B1405FAECBF26AAB706B69E4140499D8026C286F0BF390B7BDAE19F4140639CBF098588F0BFD99942E735A64140C3D842908312F0BF8FE4F21FD2A74140D061BEBC00FBEFBF11AAD4EC81AA4140FCFB8C0B0742EFBF064CE0D6DDAC41402497FF907EFBEEBFBBB88D06F0AE4140B54FC763062AEFBF40FB912232B04140BD35B05582C5EEBF5EBA490C02B3414008E6E8F17B9BEEBFE17F2BD9B1B54140D8648D7A8846EEBF6E861BF0F9B5414072C45A7C0A80EDBF7BBDFBE3BDB64140F29881CAF8F7ECBF0B5EF415A4B9414081CF0F238447ECBF1B4CC3F011BD4140FCFB8C0B0742EBBF27A5A0DB4BBE4140841266DAFE95EABFB84082E2C7C041401A51DA1B7C61EABF64E94317D4C34140DF6C73637AC2E9BF66A032FE7DB64140C078060DFD13E7BF47205ED72FB441409A5FCD018239E3BF3A1E335019CB4140DFC325C79DD2E2BF
1	Mombasa	Mombasa	0106000020E6100000050000000103000000010000000E0000004EEE77280AD04340F8C264AA609410C03C8386FE09D2434074982F2FC09E10C076711B0DE0D543406A6AD95A5F6410C0D99942E735D64340FC00A436715210C05C2041F163D4434054008C67D05010C055185B0872D043408FA50F5D503F10C02861A6ED5FCD434033DC80CF0F4310C082CAF8F719CB4340E97DE36BCF4C10C0B2F4A10BEACB434024624A24D16B10C024EEB1F4A1CB434010069E7B0F7710C040FB912232CC43400EA14ACD1E6810C0CA89761552CE4340C381902C606210C0C45A7C0A80D143408C67D0D03F8110C04EEE77280AD04340F8C264AA609410C0010300000001000000060000004C4F58E201D5434093E34EE9601D10C0E76F422102D24340B37BF2B0502B10C06DAD2F12DAD24340077C7E18213C10C08542041C42D54340E63FA4DFBE4E10C073D712F241D743406744696FF04510C04C4F58E201D5434093E34EE9601D10C001030000000100000008000000C0E78711C2CF4340938C9C853DAD0FC01FBFB7E9CFCE43402A3A92CB7FC80FC04D2D5BEB8BD04340DA8F149161D50FC03D61890794D14340554D10751FC00FC0FAB31F2922D3434016F6B4C35FD30FC0C0046EDDCDD3434058569A9482AE0FC06E8B321B64D243402CD49AE61DA70FC0C0E78711C2CF4340938C9C853DAD0FC00103000000010000001100000078280AF489C84340EC2FBB270F0B10C07E5704FF5BC9434047205ED72F1810C09ED2C1FA3FCB434029ED0DBE301910C08AB0E1E995CA4340ED478AC8B02A10C0C63368E89FD043400B7BDAE1AF2910C06E693524EED143407AFCDEA63F1B10C0DA5548F949D143402788BA0F40EA0FC03AE97DE36BCF4340B3075A8121EB0FC02F6EA301BCCD43403B8DB454DECE0FC0444C89247ACD434058E71890BD9E0FC0062AE3DF67CC43404030478FDF9B0FC02D95B7239CCA43403D7E6FD39FBD0FC0863DEDF0D7C8434041F163CC5DCB0FC01422E010AAC84340910A630B41CE0FC07E350708E6C843404B1FBAA0BEE50FC0713D0AD7A3C843401AA88C7F9FF10FC078280AF489C84340EC2FBB270F0B10C00103000000010000001700000065A54929E8D24340B4B0A71DFE9A0FC055F65D11FCD34340A29C685721A50FC0F65D11FC6FD543401D5A643BDFCF0FC06E693524EED5434033DC80CF0F0310C0693524EEB1D4434013B875374F1510C0FAB31F2922D74340CE70033E3F2C10C0F91400E319D843403A58FFE7303F10C01973D712F2D94340F1BA7EC16E3810C02A1DACFF73DC4340B77A4E7ADF1810C0B0389CF9D5DC4340B9533A58FF0710C0AE9E93DE37DE43404C37894160E50FC0D95A5F24B4E14340083D9B559FAB0FC02788BA0F40DE4340D97745F0BF950FC0B8239C16BCDC4340AD4CF8A57E9E0FC07C9BFEEC47DA4340C1A8A44E40930FC081ECF5EE8FD74340A818E76F42610FC07D7901F6D1D543407DAEB6627F590FC0D97C5C1B2AD243403480B74082620FC051A5660FB4D2434063450DA661780FC06DAD2F12DAD24340B77A4E7ADF780FC0DEC83CF207D3434081785DBF60770FC0D0D556EC2FD34340B77A4E7ADF780FC065A54929E8D24340B4B0A71DFE9A0FC0
3	Kilifi	Kilifi	0103000020E6100000010000007F00000081ECF5EE8FD74340A818E76F42610FC026AAB706B6DA434058569A94822E0FC002D9EBDD1FDB4340BD1DE1B4E0450FC08A8EE4F21FDA4340D122DBF97E6A0FC08FDFDBF467DB4340DFC325C79D920FC0AE81AD122CDE434072A774B0FE8F0FC040FB912232E04340FE65F7E461A10FC0448B6CE7FBE143401092054CE0960FC048DC63E943E34340E8305F5E807D0FC07120240B98E44340CAFD0E45813E0FC0F9F719170EE84340BA1457957DD70EC08386FE092EEA4340ECA353573E8B0EC0ABECBB22F8EB4340F12E17F19D180EC03737A6272CED4340200C3CF71EEE0DC0B58993FB1DEE434033A7CB6262B30DC041D47D0052EF4340ECA353573E8B0DC0A6B8AAECBBEE43404C37894160650DC03BC780ECF5EE434087C43D963E340DC0CA89761552EE434058E71890BD1E0DC01EC4CE143AEB4340E63FA4DFBE0E0DC0FE43FAEDEBE843400FB9196EC0270DC0126BF12900E643408ACDC7B5A1220DC084640113B8E54340E2E47E87A2000DC009C4EBFA05E743405DE15D2EE2FB0CC08386FE092EE64340C7F484251ED00CC0711B0DE02DE84340FF3EE3C281D00CC0AB09A2EE03EC4340CE88D2DEE00B0DC0ADA3AA09A2EE4340AAF1D24D62100DC05B25581CCEF04340EBE2361AC0DB0CC064062AE3DFF34340C45A7C0A80710CC0DFA63FFB91F643403F6F2A5261EC0BC096ECD808C4FB4340543541D47D400BC024D1CB2896FB43400A2E56D4601A0BC00708E6E8F1F74340CF31207BBDFB0AC00708E6E8F1F743400C1F115322C90AC00551F70148F943402A52616C21C80AC00A9DD7D825FA43404030478FDF9B0AC03E3F8C101EFD43400AD7A3703D8A0AC0ABE7A4F78DFF434046D3D9C9E0E80AC0B8019F1F46FC434092CB7F48BFFD0AC0143FC6DCB5FC4340BB44F5D6C0160BC05B25581CCE004440AF7C96E7C1DD0AC08FC2F5285C074440151DC9E53FA40AC01EC4CE143A0B4440B1169F02607C0AC0C1C58A1A4C0F4440975643E21E4B0AC05B25581CCE1044405001309E41030AC0CEFC6A0E10104440A0C37C7901F609C0B81E85EB5110444023BE13B35ECC09C0B3CD8DE9090F444046EBA86A82A809C0C8CD70033E0F44401E335019FF7E09C050C24CDBBF124440889D29745E2309C0D5264EEE77144440F20703CFBD0709C0E31934F44F144440A4367172BFC308C0FAD51C2098134440D252793BC2A908C084640113B81544400BEF7211DF8908C068791EDC9D1544405917B7D1005E08C089B5F814001744401F4B1FBAA03E08C0A228D027F2184440A73FFB91223208C0FE65F7E4611944403541D47D001208C023F3C81F0C1C444092CB7F48BFFD07C0EF7211DF891944409B20EA3E00E907C081CF0F2384174440EFACDD76A1F907C0764F1E166A1544408ACDC7B5A12208C0693A3B191C1544403E963E74413D08C0D8BB3FDEAB124440B8921D1B813808C057B26323101344408542041C421508C065C22FF5F31244406C43C5387FD307C05DDC46037813444069A9BC1DE1B407C048DC63E943134440FFE7305F5E8007C0E17F2BD9B1154440957D5704FF1B07C0E23B31EBC51444404209336DFF0A07C0E6AE25E483164440C4995FCD01C206C065C22FF5F31644408B4F01309E8106C055185B0872144440A245B6F3FD5406C0E21E4B1FBA144440B5E0455F411A06C0FC8C0B0742164440E6577380600E06C0D4484BE5ED144440889D29745EE305C0F05014E8131544404A46CEC29EB605C066A032FE7D164440132C0E677EB505C04B766C04E2F143407B14AE47E17A02C0ABECBB22F89B43405AD8D30E7F8D08C0C8EF6DFAB3934340BC5CC47762960AC0B9DFA128D08B4340B6B9313D61890CC06E8B321B64A64340CE88D2DEE08B0CC00E15E3FC4DA84340E2CCAFE600810CC07D7901F6D1A9434050C24CDBBFB20CC02310AFEB17AC43406C04E275FDC20CC0A323B9FC87AC4340107A36AB3ED70CC00EF3E505D8AB43402EC55565DF150DC02861A6ED5FAD4340622D3E05C0380DC01B4CC3F011AD4340E466B8019F5F0DC03659A31EA2AD43401C42959A3DD00DC0C8EF6DFAB3AF4340D122DBF97EEA0DC03C8386FE09B24340FC3559A31EE20DC0359886E123B243409031772D211F0EC05969520ABAB14340554D10751F400EC055185B0872B043402A3A92CB7F480EC0381092054CB0434087DC0C37E0730EC0C9AB730CC8B2434011AAD4EC81960EC0FD6A0E10CCB543403CBD5296218E0EC0F73B1405FAB843409DBAF2599EC70EC09DD7D825AABB4340CDAFE600C1DC0EC0207BBDFBE3BD43404221020EA10A0FC01EE1B4E045BF4340170E846401130FC0AB09A2EE03C043404B766C04E2350FC034BA83D899C24340F8C264AA60540FC056F146E691C3434038F3AB3940700FC0C8CD70033EC34340535C55F65D910FC0617138F3ABC5434038328FFCC1C00FC07D7901F6D1C543408BA6B393C1D10FC0F20C1AFA27C84340A29C685721E50FC07E350708E6C843404B1FBAA0BEE50FC01422E010AAC84340910A630B41CE0FC0863DEDF0D7C8434041F163CC5DCB0FC02D95B7239CCA43403D7E6FD39FBD0FC0062AE3DF67CC43404030478FDF9B0FC0444C89247ACD434058E71890BD9E0FC0C0E78711C2CF4340938C9C853DAD0FC06E8B321B64D243402CD49AE61DA70FC065A54929E8D24340B4B0A71DFE9A0FC0D0D556EC2FD34340B77A4E7ADF780FC0DEC83CF207D3434081785DBF60770FC06DAD2F12DAD24340B77A4E7ADF780FC051A5660FB4D2434063450DA661780FC0D97C5C1B2AD243403480B74082620FC07D7901F6D1D543407DAEB6627F590FC081ECF5EE8FD74340A818E76F42610FC0
4	Tana River	Tana River	0103000020E610000001000000C20000006E8B321B646243409A9999999999B1BF3B3602F1BA5E43401A8BA6B393C1B1BFC0046EDDCD5B4340543A58FFE730AFBF61C3D32B65594340A228D027F224A9BF97C5C4E6E3564340CC5D4BC8073DABBF47E6913F18544340522CB7B41A12A7BF19E25817B7514340FF092E56D460AABF74B515FBCB4E4340F701486DE2E49EBF3012DA722E4D43402670EB6E9EEAA0BF54573ECBF3484340F08AE07F2BD991BF0A4B3CA06C46434061E0B9F770C991BF5A8121AB5B4543407BF7C77BD5CAA4BF6DFFCA4A9342434047551344DD07B0BF5FEFFE78AF3E43404703780B2428AEBF355EBA490C3E4340833463D17476B2BF6EDDCD531D3A43402176A6D0798DB5BF7AC7293A923743404833164D6727B3BF67F2CD36376A43404F58E2016553E8BFF5D6C056097A4340A72215C61682F0BF118DEE20767A43403A92CB7F483FF1BF24B9FC87F47F4340C47C7901F6D1FABF4B9352D0ED7D434009FEB7921D1BFBBF184339D1AE7A43401F4B1FBAA03EFBBF2098A3C7EF814340728A8EE4F29FFEBF2766BD18CA6543406475ABE7A4B702C000E31934F4634340DCD7817346D402C0833463D1746243406EA301BC05D202C0670A9DD7D85D43402EFF21FDF6F502C099D36531B15D4340A01A2FDD240603C0B7D100DE02594340F90FE9B7AF4303C0705F07CE1955434030F5F3A6225503C0A6F27684D35243408126C286A75703C040FB912232504340F14BFDBCA94803C021CD58349D894340A3755435415408C059518369188A43402E043928616608C094C151F2EA8C43407AC7293A924B08C0AE0D15E3FC8D434086200725CC3408C09CBF0985089043406536C824232708C01B2FDD240691434012C2A38D235608C0D6E253008C934340E4DA5031CE5F08C0F88DAF3DB3944340645DDC46037808C069A9BC1DE1984340B0FECF61BE7C08C0D690B8C7D29B4340A12DE7525C9508C01D9430D3F69B434021EA3E00A98D08C06E4C4F58E2F14340D061BEBC007B02C0825660C8EA16444073F4F8BD4DBF05C080F10C1AFA174440A18499B67FA505C09F1F46088F1644403E05C078068D05C03AE97DE36B174440FD304278B47105C077BE9F1A2F19444020240B98C06D05C0276BD443341A4440632827DA558805C0E275FD82DD18444096CFF23CB8BB05C02E1C08C9021A44405001309E41C305C0A79196CADB1D44404087F9F2026C05C00A4B3CA06C2244403480B740822205C0CF2C095053274440F931E6AE25E404C07138F3AB392C4440FAD005F52DB304C0E527D53E1D334440064CE0D6DD7C04C04A5E9D63403A4440ACC5A700184F04C068E89FE062414440C1560916873304C033C4B12E6E3F44409FC893A46B2604C0991249F4323A44400B630B410E4A04C0C269C18BBE3A4440922232ACE20D04C050C763062A3F4440FC00A43671F203C07D224F92AE4144405A0D897B2CFD03C03CBD52962142444082AD122C0E2704C08048BF7D1D44444052616C21C84104C0273108AC1C464440130F289B724504C06ADE718A8E4844408F19A88C7F5F04C0E8A4F78DAF4D4440A1DB4B1AA37504C01895D409685244406C787AA52C4304C0FC8C0B07425644402BFBAE08FEF703C02844C0215459444038A1100187D003C0DAE6C6F4845D44404B9352D0EDA503C0F0F96184F05444402063EE5A42BE03C023DBF97E6A38444091D09673292E03C0CEA5B8AAEC1F44403AAFB14B542F03C0642310AFEB1F44405AF5B9DA8AFD01C0DFC325C79D1A44406CEC12D55B4300C029D027F2241944402CB7B41A12F7FFBF21020EA14A19444076E09C11A5BDFFBF07B13385CE174440087250C24C5BFFBF473D44A33B1844402C4833164DE7FEBF87DC0C37E01744407407B133854EFEBF47ACC5A700184440034356B77ACEFDBF064CE0D6DD1444403FE3C281902CFDBFA3586E6935144440ABCFD556EC2FFCBF60E5D022DB15444069E388B5F894FBBFF12900C633144440EC866D8B321BFBBF9CE1067C7E144440F758FAD00575FABFC1CAA145B61344407DE882FA96B9F9BF759318045612444019390B7BDA61F9BF4703780B24104440C8073D9B551FF9BF98512CB7B40E44409B559FABADD8F8BF2FC03E3A750D4440AA4885B18520F8BF25CCB4FD2B0B444049F4328AE596F7BFA9A44E40130944409B728577B988F7BF94DE37BEF60444400ABABDA431DAF7BF8E9257E718044440D7FA22A12D67F7BF384A5E9D630444402310AFEB17ECF6BF6536C824230344408D7F9F71E1C0F6BF42959A3DD0024440D122DBF97E6AF6BF554D10751F00444052448655BC91F5BFC6E1CCAFE600444043908312665AF5BFC1ADBB79AAFF434066A032FE7DC6F4BF8DD13AAA9A0044408CBE82346351F4BF7940D9942B004440FB96395D1613F4BF5BD3BCE314014440AC1C5A643BDFF3BF736891ED7CFF4340BB0F406A13A7F3BFF9BD4D7FF6FF434038BEF6CC9280F3BF4D10751F80FC43400938842A35FBF2BF97FF907EFBFA4340FAD005F52D73F2BFF0A2AF20CDF84340D39FFD481119F2BF088F368E58F74340A9D903ADC010F2BF7407B13385F6434003ECA353573EF1BF07D3307C44F4434019CA897615D2F0BF70B1A206D3F4434076711B0DE0ADF0BFDEE522BE13F343406C9560713873F0BF058BC3995FF143406397A8DE1AD8EFBF273108AC1CF2434016A4198BA6B3EFBFE561A1D634EF4340FC523F6F2A52EEBF0D6C956071F043400CB08F4E5DF9EDBFD15790662CEE4340C347C49448A2EDBF1B2FDD2406ED4340B81E85EB51B8ECBF3D2CD49AE6ED434060C8EA56CF49ECBF691D554D10ED434027A089B0E1E9EBBFBDC62E51BDED4340020EA14ACD1EEBBFA4AA09A2EEEB43400B5EF415A419EBBF6475ABE7A4EB4340BD8C62B9A5D5E9BF3F6F2A5261E84340CE1951DA1B7CE8BFD3BCE3141DE9434012BD8C62B9A5E7BFDDEA39E97DE74340336DFFCA4A93E7BF4E0B5EF415E84340813E912749D7E6BF359886E123E6434074EACA67791EE6BFC51B9947FEE44340518369183E22E5BF9F02603C83E24340280AF4893C49E4BF5726FC523FE343402B4D4A41B797E3BF8B71FE2614E243401E166A4DF38EE3BF1F2E39EE94DE4340FC6F253B3602E3BFF7CC920035D94340925CFE43FAEDE2BFC0E78711C2D74340C4EBFA05BB61E2BFD5CA845FEAD743402384471B47ACE1BFE275FD82DDD443400ABFD4CF9B8AE1BF1366DAFE95D5434051A5660FB402E1BF573ECBF3E0D2434065E42CEC6987E0BFBD3AC780ECD14340A167B3EA73B5DFBF30F0DC7BB8D0434098DD9387855ADFBFAA4885B185D043406EA301BC0512DEBFE89FE06245D143405F419AB1683ADDBF67B8019F1FCE4340B18A37328FFCDBBFADA3AA09A2CE4340338AE5965643DABF21020EA14ACD43400ADCBA9BA73ADABF6ADE718A8ECC4340064CE0D6DD3CD9BF4694F6065FCC4340522CB7B41A12D7BF97A8DE1AD8CA4340D15CA79196CAD5BFC095ECD808C8434036E50AEF7211D5BF035B25581CC643404777103B53E8D2BF9357E71890C14340B8CCE9B298D8D2BFD8B628B341C24340213CDA38622DD2BFD656EC2FBBBF43409ACE4E0647C9CFBFB0C91AF510BD43400D897B2C7DE8CEBF2AC6F99B50BC4340DC68006F8104CDBF43FF04172BBA43407E3A1E335019CBBFC5FEB27BF2B843400742B28009DCCABF58CA32C4B1B643400B630B410E4AC8BFCC4065FCFBB043403563D1747632C8BF9F3C2CD49AAE4340E12879758E01C5BFFA6184F068AB43404FAF94658863C5BFB1BFEC9E3CA84340809A5AB6D617C1BFA5DAA7E331A743406DE7FBA9F1D2C1BFDE76A1B94EA34340CFA0A17F828BC1BFE21E4B1FBAA043402EAD86C43D96C2BF9352D0ED259D4340F20C1AFA27B8C0BF01DE02098A9B43404C37894160E5C0BF598638D6C59943401283C0CAA145C2BFC5AC174339954340F5DBD7817346C0BFA8C64B37899143402D5BEB8B84B6C0BFF88DAF3DB3904340AEBB79AA436EBEBFFE7DC685038D4340E3361AC05B20B9BFA323B9FC878C434043AD69DE718AB6BFD3A414747B894340EFFE78AF5A99B0BF2A5778978B884340A27F828B1535A8BF4E452A8C2D844340B35E0CE544BBAABF34A2B437F8824340386744696FF0A5BFA12DE7525C81434029D027F224E9AABF39B9DFA1287C4340EF7211DF8959AFBF24456458C57B4340AB21718FA50FB5BF5CE674594C784340696FF085C954B9BF27A089B0E17543403A75E5B33C0FB6BF813E9127497343400D71AC8BDB68B8BFEEEBC039236E43404356B77A4E7AB7BFCBF8F719176A434060AB048BC399B7BFDB6D179AEB64434031B1F9B83654B4BF6E8B321B646243409A9999999999B1BF
12	Meru	Meru	0103000020E6100000010000006A000000AEB6627FD93543403F52448655BCB1BF7233DC80CF334340DE9387855AD39CBF66666666663243400E4A9869FB5786BF6A183E22A6304340C58F31772D215FBF0BB5A679C72D4340F1BA7EC16ED8963F99F04BFDBC2D4340E0BE0E9C33A2A43FEA043411362C43406B48DC63E943A73F31B610E4A02C4340C746205ED72FB03F5AF5B9DA8A294340CBA145B6F3FDB43FCA4FAA7D3A2A4340F146E6913F18B83F08E6E8F17B274340834C327216F6BC3FA514747B492743404C37894160E5C03F67B8019F1F264340CA37DBDC989EC43F92E86514CB214340E5D5390664AFC73FDB85E63A8D2043402176A6D0798DC93F22AB5B3D2719434068E89FE06245CD3FA9A44E4013194340A4703D0AD7A3D43FCA37DBDC98164340C8EF6DFAB31FD53F876D8B321B0C4340F7AFAC342905E23F32C9C859D8074340085A8121AB5BE53F36936FB6B9E942400A80F10C1AFAE13FC2340C1F11CB4240CF2C095053CBDE3F1FD7868A71CA42406F1283C0CAA1DD3F0A4B3CA06CCA42406F9EEA909BE1DA3F3BC780ECF5CA42402F8B89CDC7B5D93F9413ED2AA4CC424052F2EA1C03B2D93FCCD1E3F736CD4240BCE82B483316D73F91442FA358CA4240834C327216F6D43F3A1E335019C74240D061BEBC00FBD43F60764F1E16C642406E6E4C4F58E2D33FE7A90EB919C64240B1DCD26A48DCD13F8D28ED0DBEC44240BE13B35E0CE5D03F88BA0F406ABB4240CEDF8442041CD23F26C79DD2C1B6424057EC2FBB270FD33F6536C82423B3424014D044D8F0F4D23FF38E537424B34240931804560E2DD23F68E89FE062B142408E9257E71890D13F95607138F3AF42407A36AB3E575BD13F34A2B437F8AE42405A643BDF4F8DCF3F4D4A41B797AC424075029A081B9ECA3FF12E17F19DAC4240E3361AC05B20C93F658D7A8846AB42406B2BF697DD93C73F65AA605452A742408CF337A11001C73F9D853DEDF0A3424018CFA0A17F82C33FC1CAA145B6A3424043FF04172B6AC03FA8E3310395A1424064E94317D4B7BC3F60764F1E169E4240D0ED258DD13ABA3F672783A3E49D42409604A8A9656BB53F6B82A8FB0098424086032159C004AE3F4F0647C9AB9342403D0AD7A3703DAA3F6E4C4F58E2914240D313967840D9A43F91D09673298E4240274EEE77280AA43F88635DDC468B4240026553AEF02E973F46B6F3FDD48C42408811C2A38D23863F3B191C25AF8E4240AD342905DD5E92BFF88DAF3DB3904240C63368E89FE0A2BF93C6681D559142400A850838842AA5BF9604A8A965A74240670FB4024356C3BF9D8026C286C3424044FAEDEBC039C7BF7AE40F069ECB4240691D554D1075C7BFDA1B7C6132CD4240B9533A58FFE7C8BF465F419AB1D44240DA5548F949B5CBBFCB2DAD86C4D54240211FF46C567DCABFE1EEACDD76D942409B030473F4F8C9BFF8FC304278DC42402F6EA301BC05CABF0D6C956071E042403108AC1C5A64C7BFBD1DE1B4E0E14240D09B8A54185BC4BF71AC8BDB68E44240F163CC5D4BC8C3BF9981CAF8F7E5424008944DB9C2BBC4BFEFE6A90EB9ED4240E9482EFF21FDBEBFDBF97E6ABCEC424018096D3997E2BABF9886E12362EE4240E1EEACDD76A1B1BFBFF1B56796EC42407E3A1E3350199FBF533F6F2A52ED424056F146E6913F88BFF1BA7EC16EF04240DC114E0B5EF485BF12C2A38D23F242408733BF9A030493BFC9B08A3732F34240CBA145B6F3FD843F444C89247AF54240FA7E6ABC7493783F645DDC4603F84240611A868F8829813F78978BF84EF842402D95B7239C169C3F18B2BAD573FA424087BF266BD443A43F9A779CA223F942409947FE60E0B9A73F1EF98381E7FA4240CE3637A6272CB13F33164D6727FF4240B1A71DFE9AACB13F9981CAF8F70143409FABADD85F76AF3F96218E75710343401C42959A3DD0AA3FE1EEACDD76054340FFCF61BEBC009B3F3B191C25AF0A434097900F7A36AB9E3F0FB40243560B4340342E1C08C902A63FF4F8BD4D7F0E434068E89FE06245AD3F118DEE207612434073D712F241CFA63F8672A25D851443404703780B24289E3F0AA2EE0390164340894160E5D0229B3F4D840D4FAF18434004ADC090D5AD8E3F83C0CAA1451A4340DBBFB2D2A414943F0DFD135CAC1C434056F146E6913F883F0C0742B2801D43406B60AB048BC379BF73A25D85941F4340DBF97E6ABC7493BFAED3484BE52143409A25016A6AD98ABF30D80DDB162543406BD44334BA8398BF331B64929127434024D1CB28965BAABF76543541D4294340A27F828B1535B0BFBF7D1D38672C4340B4AB90F2936AAFBF8DEE2076A6304340040473F4F8BDB5BFFC3559A31E324340E5B33C0FEECEB2BFAEB6627FD93543403F52448655BCB1BF
5	Lamu	Lamu	0106000020E6100000050000000103000000010000000B000000D97C5C1B2A724440CF31207BBDFB01C0BADA8AFD656F4440E6577380600E02C08E01D9EBDD6B4440C7F484251E1002C00D37E0F3C36844405665DF15C13F02C01500E31934684440A6D0798D5DA202C01288D7F50B6A44402979758E019902C0A089B0E1E96D444046D3D9C9E06802C0BC9179E40F724440F146E6913F5802C0F12E17F19D74444058FFE7305F5E02C0695721E527754440A9D903ADC05002C0D97C5C1B2A724440CF31207BBDFB01C001030000000100000010000000A323B9FC877C44404985B18520C701C00FD1E80E627B4440CBD6FA22A1ED01C0766C04E2757944405A2F8672A2DD01C008E6E8F17B7744408E40BCAE5FF001C0FE48111956754440CD58349D9DCC01C0DDCD531D7273444080B74082E2C701C0DC2E34D769744440BD35B055820502C080F10C1AFA7744401C42959A3D5002C0F73B1405FA7444408E588B4F017002C0FC8C0B07427644404221020EA18A02C0A228D027F27844405001309E418302C0118DEE20767A4440A73FFB91227202C0B0389CF9D57C44402670EB6E9E2A02C0A796ADF5457E44408542041C421502C09296CADB117E44407AFCDEA63FFB01C0A323B9FC877C44404985B18520C701C00103000000010000000E0000006DAD2F12DA864440390B7BDAE1AF00C055F65D11FC83444025AFCE3120BB00C0E6913F187882444072BF4351A0CF00C0C9AB730CC87E4440EDD3F19881CA00C03F1D8F19A87C4440841266DAFED500C0A089B0E1E97D4440A73FFB9122F200C0BC749318047E4440B05582C5E10C01C04FE960FD9F7F4440CC9717601F1D01C0CC457C27668144404030478FDF1B01C043AD69DE71824440B0FECF61BEFC00C0DC114E0B5E8444401A69A9BC1DE100C05FB532E197864440774A07EBFFDC00C072F90FE9B7874440AA9A20EA3EC000C06DAD2F12DA864440390B7BDAE1AF00C00103000000010000001200000090BDDEFDF18A44405EA27A6B606B00C09A5FCD01828944403ACC9717609F00C0FAD51C209887444044A33B889DA900C07BBDFBE3BD86444050AA7D3A1EF300C082CAF8F719874440C1A8A44E401301C0A69BC420B08A4440FA9B5088800301C0ABECBB22F88B4440B5E0455F411A01C0AE9E93DE378E4440170E8464011301C0446E861BF08D444045BB0A293FE900C0143FC6DCB58C44403B8DB454DECE00C0C39E76F86B8E444039B4C876BE9F00C0C5387F130A914440F6D1A92B9FA500C05F984C158C924440371AC05B20C100C06BF12900C69344405BB1BFEC9EBC00C0E9263108AC944440170E8464019300C0C00985083890444086032159C08400C03ACC9717608F4440315F5E807D7400C090BDDEFDF18A44405EA27A6B606B00C001030000000100000078000000F67F0EF3E5B54440E40F069E7B0FFDBF302AA913D0BC4440774A07EBFF1CFCBFC9AB730CC8BE44407CED992501EAFBBFC7116BF129C0444048DC63E94397FBBFBCB376DB85C24440A5F78DAF3D33FBBFFBAE08FEB7C64440CAFD0E4581BEFABF0708E6E8F1C744400C0742B28089FABF56F146E69173444058569A94826EFBBF2D95B7239C1A4440A54E4013614300C0320395F1EF1F4440E8305F5E80FD01C0320395F1EF1F44405726FC523F2F03C0062AE3DF67384440200C3CF71E2E03C0772D211FF45444402063EE5A42BE03C01A6EC0E7875D4440A06CCA15DEA503C0B4B0A71DFE5E44402849D74CBE9903C043AD69DE716244404DF8A57EDE9403C0D8BB3FDEAB6244400EF8FC30427803C0E3FC4D28446444402849D74CBE5903C08542041C42694440CC9717601F1D03C07E5704FF5B694440BEF6CC9200F502C0632827DA5568444065DF15C1FFD602C0F67F0EF3E5654440EDD3F19881CA02C06A183E22A66444409FABADD85FF602C050C763062A634440C45A7C0A80F102C0E5B33C0FEE62444016DEE522BED302C0BE4D7FF6236144409031772D219F02C0BE4D7FF623614440EDBB22F8DF8A02C09274CDE49B5D4440315F5E807D7402C08A8EE4F21F5A44400DE02D90A07802C0FD87F4DBD7594440AA9A20EA3E4002C07C9BFEEC475A4440EA211ADD412C02C0B48EAA26885E4440A9D903ADC05002C0349D9D0C8E5E4440335019FF3E2302C09B1BD313965C4440A6D0798D5D2202C0A323B9FC875C4440D313967840D901C0C45A7C0A80614440115322895E0602C0EBE2361AC063444093E34EE960FD01C04D2D5BEB8B644440EDBB22F8DF0A02C0EDBB22F8DF6644403480B74082E201C00A80F10C1A6A44401C42959A3DD001C0BC749318046E44404C4F58E201E501C0D0B87020246F4440B6B9313D61C901C03BC780ECF56E44405726FC523FAF01C0D26F5F07CE714440C190D5AD9E9301C0FAD51C209873444051DA1B7C61B201C0598638D6C57544404ED1915CFEC301C0695721E5277544409F93DE37BE7601C0EF7211DF8975444031CEDF84424401C04D2D5BEB8B74444085EB51B81E0501C0E23B31EBC5744440D7DD3CD521B700C0FAB31F2922734440E0F3C308E19100C040FB9122327044404209336DFF8A00C055185B0872704440956588635D5C00C04C7155D9777144409ED2C1FA3F4700C048DC63E9437344407632384A5E5D00C0CFF753E3A5734440F12E17F19D1800C04D2D5BEB8B7044408ACDC7B5A12200C04FE960FD9F6F4440E2CCAFE6000100C08D45D3D9C96C4440D595CFF23CB8FFBF9886E123626A4440E4BD6A65C2AFFFBF8A93FB1D8A6644400D897B2C7D68FFBF713D0AD7A36844404209336DFF4AFFBF0708E6E8F16B4440982F2FC03E3AFFBFCC457C27666D44403E963E74417DFFBF34BA83D8996E4440603C8386FE89FFBFE162450DA67144401CB1169F02E0FFBFE14048163075444004E275FD82DDFFBF5FB532E1977644400FB9196EC02700C0E17F2BD9B1754440E71890BDDE3D00C08D28ED0DBE784440B3075A81216B00C087F9F202EC77444075B0FECF617E00C00D1AFA27B87844400A2E56D4609A00C01FA2D11DC47A4440C80C54C6BF8F00C026AAB706B67A444023BE13B35E4C00C0207BBDFBE3794440151DC9E53F2400C023F3C81F0C7C4440E2CCAFE600C1FFBF82CAF8F7197B444016DEE522BE13FFBF3C8386FE097E4440DAE6C6F484A5FEBF780B24287E844440910A630B410EFEBFFE261422E08444400473F4F8BD4DFEBF52616C21C881444019FF3EE3C281FEBF2783A3E4D57D44408121AB5B3D27FFBF26AAB706B67E444048DC63E94397FFBF207BBDFBE37D44404B1FBAA0BEE5FFBFD1967329AE7E4440126BF129000600C0C2A38D23D67E44404FE960FD9F4300C0535C55F65D81444019E76F42214200C0E162450DA68144405E6397A8DE5A00C072DC291DAC8344408542041C425500C084640113B88544404694F6065F1800C0FAD51C20988744407F87A2409F0800C00708E6E8F1874440A245B6F3FDD4FFBF207BBDFBE3894440467C2766BD98FFBF1F9DBAF2598E4440C87BD5CA845FFFBF37548CF3379144401B81785DBF60FFBFF73B1405FA944440309E4143FF04FFBFEF552B137E954440E04A766C04E2FEBF0C3CF71E2E9944400D37E0F3C388FEBF84640113B89944401A51DA1B7C61FEBF9DD7D825AA9B44402B6A300DC347FEBFB58993FB1D9E4440170E84640193FEBFC7116BF129A044403BE466B8019FFEBFAB09A2EE03A044405917B7D100DEFEBF2E90A0F8319E4440DD989EB0C403FFBF56D4601A869F44409B20EA3E0029FFBFA94D9CDCEFA044401AC05B2041F1FEBF5DDC460378A344403E963E7441FDFEBFCE1951DA1BA44440D734EF384547FFBFC8CD70033EA34440A2B437F8C264FFBFDDEA39E97DA34440BEF6CC9200B5FFBFE78C28ED0DA64440D44334BA8358FFBFF73B1405FAA84440BE874B8E3B25FFBF2844C02154A94440622D3E05C0F8FEBF0FEECEDA6DAB444021E527D53E9DFEBFB0389CF9D5AC4440499D8026C286FEBFC39E76F86BAE4440982F2FC03E3AFEBFD26F5F07CEB14440401878EE3DDCFDBFDFA63FFB91B2444084D382177D85FDBFE140481630B544405CC98E8D403CFDBFF67F0EF3E5B54440E40F069E7B0FFDBF
7	Garissa	Garissa	0103000020E610000001000000DC00000010CCD1E3F7BA43406A87BF266BD4EF3F6EDDCD531DAE43405F24B4E55C8AEE3F6B9F8EC70CA84340D3872EA86F99ED3FEECEDA6D179E43403EAE0D15E3FCEA3F6891ED7C3F9D43406A4DF38E5374EA3F0CC85EEFFE984340FE261422E010E93FD1967329AE96434036B05582C5E1E73F3CDA38622D964340BEC117265305E73F02486DE2E4924340D15790662C9AE63F6EFAB31F29924340020EA14ACD1EE63F5B25581CCE90434031CEDF844204E63F77F35487DC8C4340B3412619390BE63FED647094BC8A4340EA3E00A94D9CE53F74B515FBCB8643401AC05B2041F1E53FF2EF332E1C844340FBCBEEC9C342E53FB35E0CE54483434029B341261939E53FB4AB90F293824340FEB7921D1B81E43F4CE0D6DD3C8143405E85949F54FBE33F6E179AEB347E4340D4484BE5ED08E43F29ED0DBE307D434036B05582C5E1E33F5CE674594C784340787AA52C431CE43FBBD05CA791764340EFC9C342AD69E33FB5E0455F41724340F2EF332E1C08E33FA0C37C79016E43403FE3C281902CE33F3D44A33B88694340D7C056091687E23F60CD0182396643404DF8A57EDE54E13F8B37328FFC614340B7B41A12F758E03F1EC4CE143A5F4340240B98C0ADBBE03F30F0DC7BB85C4340B875374F75C8E03F5C1B2AC6F95B4340D9EBDD1FEF55E03F59518369185A43403563D1747632E03F7B88467710574340AD86C43D963EE03FD80DDB1665564340EACA67791EDCDF3F02BC0512145743403FE3C281902CDE3FC0B2D2A414584340A1A17F828B15DD3FA96A82A8FB584340FB96395D1613DB3F70CE88D2DE60434091F2936A9F8EC73F5C77F354876043406F1283C0CAA1C53F117008556A5E434003ECA353573EC33FD2FBC6D79E5D434036E50AEF7211BF3F2041F163CC5D434073A25D85949FA43FE6E8F17B9B5E4340AA7D3A1E3350793F876D8B321B604340B41F2922C32A9EBFCA15DEE5226243400395F1EF332EACBF6E8B321B646243409A9999999999B1BFDB6D179AEB64434031B1F9B83654B4BFCBF8F719176A434060AB048BC399B7BFEEEBC039236E43404356B77A4E7AB7BF813E9127497343400D71AC8BDB68B8BF27A089B0E17543403A75E5B33C0FB6BF5CE674594C784340696FF085C954B9BF24456458C57B4340AB21718FA50FB5BF39B9DFA1287C4340EF7211DF8959AFBFA12DE7525C81434029D027F224E9AABF34A2B437F8824340386744696FF0A5BF4E452A8C2D844340B35E0CE544BBAABF2A5778978B884340A27F828B1535A8BFD3A414747B894340EFFE78AF5A99B0BFA323B9FC878C434043AD69DE718AB6BFFE7DC685038D4340E3361AC05B20B9BFF88DAF3DB3904340AEBB79AA436EBEBFA8C64B37899143402D5BEB8B84B6C0BFC5AC174339954340F5DBD7817346C0BF598638D6C59943401283C0CAA145C2BF01DE02098A9B43404C37894160E5C0BF9352D0ED259D4340F20C1AFA27B8C0BFE21E4B1FBAA043402EAD86C43D96C2BFDE76A1B94EA34340CFA0A17F828BC1BFA5DAA7E331A743406DE7FBA9F1D2C1BFB1BFEC9E3CA84340809A5AB6D617C1BFFA6184F068AB43404FAF94658863C5BF9F3C2CD49AAE4340E12879758E01C5BFCC4065FCFBB043403563D1747632C8BF58CA32C4B1B643400B630B410E4AC8BFC5FEB27BF2B843400742B28009DCCABF43FF04172BBA43407E3A1E335019CBBF2AC6F99B50BC4340DC68006F8104CDBFB0C91AF510BD43400D897B2C7DE8CEBFD656EC2FBBBF43409ACE4E0647C9CFBFD8B628B341C24340213CDA38622DD2BF9357E71890C14340B8CCE9B298D8D2BF035B25581CC643404777103B53E8D2BFC095ECD808C8434036E50AEF7211D5BF97A8DE1AD8CA4340D15CA79196CAD5BF4694F6065FCC4340522CB7B41A12D7BF6ADE718A8ECC4340064CE0D6DD3CD9BF21020EA14ACD43400ADCBA9BA73ADABFADA3AA09A2CE4340338AE5965643DABF67B8019F1FCE4340B18A37328FFCDBBFE89FE06245D143405F419AB1683ADDBFAA4885B185D043406EA301BC0512DEBF30F0DC7BB8D0434098DD9387855ADFBFBD3AC780ECD14340A167B3EA73B5DFBF573ECBF3E0D2434065E42CEC6987E0BF1366DAFE95D5434051A5660FB402E1BFE275FD82DDD443400ABFD4CF9B8AE1BFD5CA845FEAD743402384471B47ACE1BFC0E78711C2D74340C4EBFA05BB61E2BFF7CC920035D94340925CFE43FAEDE2BF1F2E39EE94DE4340FC6F253B3602E3BF8B71FE2614E243401E166A4DF38EE3BF5726FC523FE343402B4D4A41B797E3BF9F02603C83E24340280AF4893C49E4BFC51B9947FEE44340518369183E22E5BF359886E123E6434074EACA67791EE6BF4E0B5EF415E84340813E912749D7E6BFDDEA39E97DE74340336DFFCA4A93E7BFD3BCE3141DE9434012BD8C62B9A5E7BF3F6F2A5261E84340CE1951DA1B7CE8BF6475ABE7A4EB4340BD8C62B9A5D5E9BFA4AA09A2EEEB43400B5EF415A419EBBFBDC62E51BDED4340020EA14ACD1EEBBF691D554D10ED434027A089B0E1E9EBBF3D2CD49AE6ED434060C8EA56CF49ECBF1B2FDD2406ED4340B81E85EB51B8ECBFD15790662CEE4340C347C49448A2EDBF0D6C956071F043400CB08F4E5DF9EDBFE561A1D634EF4340FC523F6F2A52EEBF273108AC1CF2434016A4198BA6B3EFBF058BC3995FF143406397A8DE1AD8EFBFDEE522BE13F343406C9560713873F0BF70B1A206D3F4434076711B0DE0ADF0BF07D3307C44F4434019CA897615D2F0BF7407B13385F6434003ECA353573EF1BF088F368E58F74340A9D903ADC010F2BFF0A2AF20CDF84340D39FFD481119F2BF97FF907EFBFA4340FAD005F52D73F2BF4D10751F80FC43400938842A35FBF2BFF9BD4D7FF6FF434038BEF6CC9280F3BF736891ED7CFF4340BB0F406A13A7F3BF5BD3BCE314014440AC1C5A643BDFF3BF7940D9942B004440FB96395D1613F4BF8DD13AAA9A0044408CBE82346351F4BFC1ADBB79AAFF434066A032FE7DC6F4BFC6E1CCAFE600444043908312665AF5BF554D10751F00444052448655BC91F5BF42959A3DD0024440D122DBF97E6AF6BF6536C824230344408D7F9F71E1C0F6BF384A5E9D630444402310AFEB17ECF6BF8E9257E718044440D7FA22A12D67F7BF94DE37BEF60444400ABABDA431DAF7BFA9A44E40130944409B728577B988F7BF25CCB4FD2B0B444049F4328AE596F7BF2FC03E3A750D4440AA4885B18520F8BF98512CB7B40E44409B559FABADD8F8BF4703780B24104440C8073D9B551FF9BF759318045612444019390B7BDA61F9BFC1CAA145B61344407DE882FA96B9F9BF9CE1067C7E144440F758FAD00575FABFF12900C633144440EC866D8B321BFBBF60E5D022DB15444069E388B5F894FBBFA3586E6935144440ABCFD556EC2FFCBF064CE0D6DD1444403FE3C281902CFDBF47ACC5A700184440034356B77ACEFDBF87DC0C37E01744407407B133854EFEBF473D44A33B1844402C4833164DE7FEBF07B13385CE174440087250C24C5BFFBF21020EA14A19444076E09C11A5BDFFBF29D027F2241944402CB7B41A12F7FFBFDFC325C79D1A44406CEC12D55B4300C07AC7293A9273444058569A94826EFBBFC780ECF5EEC74440992A1895D489FABF6440F67AF7C744408FC2F5285C8FF9BF744694F6067F4440B9196EC0E787EABF74D2FBC6D77E4440A03715A930B660BF2D431CEBE27E44406553AEF02E17C93FD769A4A5F27E4440B7EEE6A90EB9DD3F705F07CE197D444079CC4065FCFBDC3F90F7AA95097B44404A7B832F4CA6DC3F2F8B89CDC7754440DFFDF15EB532DB3FA14ACD1E687144405BD3BCE3141DD93F55D97745F06B44405B99F04BFDBCD73FD0B8702024634440C5FEB27BF2B0D63FD49AE61DA76044404F232D95B723D63F352905DD5E5E4440A7B393C151F2D43F32384A5E9D5B444078B471C45A7CD43F65E42CEC69574440319413ED2AA4D03F65DF15C1FF52444087A757CA32C4CD3F6649809A5A4E44402592E86514CBCD3F1EA7E8482E4B44401F9DBAF2599ECB3FE4141DC9E547444022AB5B3D27BDCB3FF0A7C64B374544404985B1852007CD3FEC2FBB270F4344403BAA9A20EA3ECC3F3F912749D7404440C47762D68BA1C83FC898BB96903F4440BB44F5D6C056C93F4BE5ED08A73D4440BBB88D06F016C83F61C3D32B65394440F8AA9509BFD4C73FAC8BDB6800374440D55B035B2558C83F6553AEF02E334440666B7D91D096C73F8733BF9A03304440C3B645990D32C93F6DE2E47E872A44403B3602F1BA7EC93F6CCF2C09502744400FD6FF39CC97CB3FE9482EFF212144401F115322895ECE3F713D0AD7A31C4440A110018750A5D03FA20BEA5BE6144440EC4CA1F31ABBD43FDC2E34D7691044407715527E52EDD53F0118CFA0A1074440E3361AC05B20D93F1EDC9DB5DB0244401C08C9022670D93F7715527E52FD4340B806B64AB038DA3F2905DD5ED2F84340FFE7305F5E80DB3FA4A5F27684F3434060AB048BC399DD3F793BC269C1EF4340B1C403CAA65CDD3FF05014E813ED43400B98C0ADBB79DE3F27A5A0DB4BE64340D23AAA9A20EADE3F88D7F50B76E343409E077767EDB6DF3F1AA88C7F9FE14340E7525C55F65DE03FD95A5F24B4DD43409335EA211ADDE03F7FC16ED8B6DC4340F7E978CC4065E13FAFEB17EC86D94340A04FE449D235E23FE6E8F17B9BD6434000AE64C74620E33F9DF4BEF1B5D343404451A04FE449E43FADFA5C6DC5D2434083A3E4D53906E53F7B6649809ACE4340079964E42CECE53F018750A566CB4340753C66A032FEE63F72FE261422C8434097FF907EFB3AE83F9D9D0C8E92C343405E807D74EACAEB3F1D2098A3C7BF43407B4E7ADFF8DAED3F65A54929E8BE43400C022B8716D9EE3F84D382177DBD4340825660C8EA56EF3F10CCD1E3F7BA43406A87BF266BD4EF3F
40	Busia	Busia	0103000020E61000000100000056000000EE08A7052F32414018601F9DBAF2DD3FF7065F984C3141409E245D33F966DF3F758E01D9EB3141408A3C49BA66F2DF3F55C1A8A44E3441408481E7DEC325E03F0490DAC4C931414049111956F146E13F176536C8242F4140EE08A7052FFAE13F31CEDF8442304140DA20938C9C85E23FBAA0BE654E2F4140DD7BB8E4B853E33F0664AF777F304140E8DEC325C79DE33F0CE544BB0A314140B4B0A71DFE9AE43FAF946588633541405D33F9669B1BE53FCEC7B5A162344140E813799274CDE53F614F3BFC353541404E9CDCEF5014E63F6BD44334BA3341404D4A41B79734E73F43C5387F133641407E1D38674469E73F3AE97DE36B374140E223624A24D1E73FE71DA7E848364140404D2D5BEB8BE83F6666666666324140221ADD41EC4CE83FF71E2E39EE3041403012DA722EC5E83F0A9DD7D8252E4140B8239C16BCE8E83F4777103B532841403A0664AF777FE83F9EEFA7C64B274140467C2766BD18E73F4EEE77280A28414055185B087250E63F16A4198BA6234140950ED6FF39CCE53F5D50DF32A72341400B7BDAE1AFC9E43FF931E6AE25204140CFBD874B8E3BE43FC74B3789411C414003ECA353573EE43F0B5EF415A4194140EDB60BCD751AE43F481B47ACC5174140456458C51B99E33F374F75C8CD1441405A2A6F47382DE33F01A436717213414037894160E5D0E23F8B4F01309E1141405709168733BFE23F87C43D963E10414053D0ED258DD1E13F8ECC237F30104140C8CD70033E3FE13F6C04E275FD0E4140C9E53FA4DFBEE03FCF83BBB3760F414090F7AA9509BFDE3F1DC9E53FA40B4140D9EBDD1FEF55DD3F486DE2E47E0B41400C93A9825149DB3FA2B437F8C20C4140D769A4A5F276DA3F124E0B5EF40D414043E7357689EAD73F8D45D3D9C90C41409C6D6E4C4F58D63F7E1D386744094140B56CAD2F12DAD43F05C58F31770541409357E71890BDD23FA297512CB7044140931D1B81785DD13F41D47D0052034140D47D00529B38D13F82FFAD64C702414082FFAD64C746D03F715AF0A2AF0041403C8386FE092ECE3F85949F54FBF44040143FC6DCB584BC3F5BEB8B84B6F44040448B6CE7FBA9B93FD218ADA3AAF940405F7B6649809A9ABF6DC5FEB27B0241409279E40F069E9BBF1A170E8464054140D2FBC6D79E5922BFB1506B9A77084140666666666666B63F4C7155D977094140F224E99AC937BB3F936FB6B931094140FE65F7E461A1BE3F2F17F19D980D4140840D4FAF9465C03F2670EB6E9E0E41406AFB57569A94C23F11363CBD520E41405ABBED42739DC63F84F068E3880D41402DB29DEFA7C6C73F89EAAD81AD0E4140A56B26DF6C73CB3F5E9D6340F60E41406EFAB31F2922CF3F6FF59CF4BE1141400F7F4DD6A887D03F401878EE3D1441407D224F92AE99D23FF584251E501641405F5E807D74EAD23F55FB743C661841402BF697DD9387D13F52F2EA1C031A4140E3361AC05B20D13FD8817346941A4140DC291DACFF73D23FBC5CC477621E414061545227A089D23FE44EE960FD1F4140581CCEFC6A0ED43F761A69A9BC2141403FE3C281902CD43F4D10751F80244140DC63E94317D4D33FD89E5912A02A414004392861A6EDD33FBAF770C9712F4140ADC090D5AD9ED33F62DBA2CC06314140F0A2AF20CD58D43F452FA3586E314140EB6E9EEA909BD53F5E6397A8DE32414011C7BAB88D06D63F014D840D4F3341406A1327F73B14D73F7D0569C6A235414057B2632310AFD73F2AE3DF675C3441400D54C6BFCFB8D83F46CEC29E763041401D2098A3C7EFD93F841266DAFE2D41400A2E56D4601ADA3F0708E6E8F12B41407B884677103BDB3F7C7E18213C2E4140B64AB0389CF9DB3F352905DD5E2E41405E68AED3484BDD3F601F9DBAF23141409CF9D51C2098DD3FEE08A7052F32414018601F9DBAF2DD3F
8	Wajir	Wajir	0103000020E610000001000000B80000000D1AFA27B8A84340828B153598C60B40C2DD59BBEDA6434032384A5E9DA30B406D1CB1169FA643407D0569C6A2690B402A52616C21A843408CF337A110410B408B89CDC7B5A943404EB9C2BB5C840A40C4995FCD01AA4340904E5DF92C4F0A40410E4A9869AB4340E15D2EE23B310A40B2BAD573D2AB434022C32ADEC8FC0940CEC7B5A162AC434056D4601A868F0840DAC9E02879A94340079964E42C6C084037E0F3C308A54340F163CC5D4B480840F27B9BFEEC9F4340488AC8B08AF707409D11A5BDC19F43400B410E4A98E90740BD1DE1B4E09943400FB9196EC0A70740C190D5AD9E93434017D9CEF753A30740008C67D0D08F4340C1E270E657730740170E8464018F4340A301BC0512540740F584251E508E4340705F07CE19110740B1F9B836548843405778978BF80E074078EE3D5C728843402D78D15790E60540B4024356B7864340AB9509BFD4CF0540207BBDFBE3854340B6F81400E3990540E2E47E87A284434002D4D4B2B57E054004FF5BC98E8543400D897B2C7D680540D93D7958A87D434052B81E85EB91044000C63368E87B4340A8C64B37898104400473F4F8BD7143402C6519E258570440D6A8876874734340849ECDAACFD5034029965B5A0D754340F4C308E1D186034049BA66F2CD764340CF143AAFB14B034024D1CB289677434058AD4CF8A5FE0240C8CD70033E774340AA0EB9196EC00240DDB5847CD0774340EC2FBB270F8B0240F415A4198B7643404F75C8CD70430240876D8B321B784340B936548CF3B70140F224E99AC9774340EEEBC039234A0140AF7C96E7C1794340EE258DD13AEA0040E561A1D6347B4340D6A8876874C70040FC3559A31E7E434091F2936A9F8E0040CBDB114E0B7E434009E1D1C6116B00401E166A4DF37E434027A5A0DB4B5A0040B4E55C8AAB7E43406475ABE7A4370040E5F21FD26F7F434056BC9179E40F0040BCB376DB85824340164D672783A3FF3FC6DCB5847C844340B7627FD93D79FF3FBA2C26361F874340B70BCD751AE9FE3F18601F9DBA8A43403468E89FE062FE3FB7EEE6A90E8D4340E8BCC62E513DFE3FFCC6D79E598E4340EBFF1CE6CB0BFE3F946A9F8EC790434024B9FC87F4DBFD3F51888043A89243408ACDC7B5A162FD3FBC79AA436E924340D3A414747B49FD3FA032FE7DC6954340B8AF03E78CA8FC3FB3EA73B515974340205ED72FD80DFC3FF31FD26F5F9B4340F19D98F56228FB3F12A0A696AD9D4340B6F81400E319FB3FCF83BBB376A743409B030473F478FA3FBC9179E40FAA434087E123624A24FA3FAA7D3A1E33AC4340156F641EF903FA3FCD1E680586B04340C425C79DD241F93F91B8C7D287B24340B3412619390BF93FA583F57F0EB34340202922C32ADEF83F8C101E6D1CB54340AA656B7D91D0F83F077C7E1821B84340D4F19881CA78F83F4CE0D6DD3CB943408FFCC1C0736FF83FEC4CA1F31AA34340CE1951DA1B7CF73FD690B8C7D2AB4340FD4D2844C0A1F43FF4FDD478E9B24340BA2C26361F57F23F09A7052FFABA4340E14048163001F03F10CCD1E3F7BA43406A87BF266BD4EF3F84D382177DBD4340825660C8EA56EF3F65A54929E8BE43400C022B8716D9EE3F1D2098A3C7BF43407B4E7ADFF8DAED3F9D9D0C8E92C343405E807D74EACAEB3F72FE261422C8434097FF907EFB3AE83F018750A566CB4340753C66A032FEE63F7B6649809ACE4340079964E42CECE53FADFA5C6DC5D2434083A3E4D53906E53F9DF4BEF1B5D343404451A04FE449E43FE6E8F17B9BD6434000AE64C74620E33FAFEB17EC86D94340A04FE449D235E23F7FC16ED8B6DC4340F7E978CC4065E13FD95A5F24B4DD43409335EA211ADDE03F1AA88C7F9FE14340E7525C55F65DE03F88D7F50B76E343409E077767EDB6DF3F27A5A0DB4BE64340D23AAA9A20EADE3FF05014E813ED43400B98C0ADBB79DE3F793BC269C1EF4340B1C403CAA65CDD3FA4A5F27684F3434060AB048BC399DD3F2905DD5ED2F84340FFE7305F5E80DB3F7715527E52FD4340B806B64AB038DA3F1EDC9DB5DB0244401C08C9022670D93F0118CFA0A1074440E3361AC05B20D93FDC2E34D7691044407715527E52EDD53FA20BEA5BE6144440EC4CA1F31ABBD43F713D0AD7A31C4440A110018750A5D03FE9482EFF212144401F115322895ECE3F6CCF2C09502744400FD6FF39CC97CB3F6DE2E47E872A44403B3602F1BA7EC93F8733BF9A03304440C3B645990D32C93F6553AEF02E334440666B7D91D096C73FAC8BDB6800374440D55B035B2558C83F61C3D32B65394440F8AA9509BFD4C73F4BE5ED08A73D4440BBB88D06F016C83FC898BB96903F4440BB44F5D6C056C93F3F912749D7404440C47762D68BA1C83FEC2FBB270F4344403BAA9A20EA3ECC3FF0A7C64B374544404985B1852007CD3FE4141DC9E547444022AB5B3D27BDCB3F1EA7E8482E4B44401F9DBAF2599ECB3F6649809A5A4E44402592E86514CBCD3F65DF15C1FF52444087A757CA32C4CD3F65E42CEC69574440319413ED2AA4D03F32384A5E9D5B444078B471C45A7CD43F352905DD5E5E4440A7B393C151F2D43FD49AE61DA76044404F232D95B723D63FD0B8702024634440C5FEB27BF2B0D63F55D97745F06B44405B99F04BFDBCD73FA14ACD1E687144405BD3BCE3141DD93F2F8B89CDC7754440DFFDF15EB532DB3F90F7AA95097B44404A7B832F4CA6DC3F705F07CE197D444079CC4065FCFBDC3FD769A4A5F27E4440B7EEE6A90EB9DD3F9E4143FF047F4440751F80D4264EE33F9E4143FF047F4440F870C971A774EB3F9E4143FF047F444043CA4FAA7DBAF23FF437A110017F44404B3CA06CCA15F73F6C04E275FD7E444022895E46B15CFB3F4278B471C47E44400E2DB29DEF27FF3F34A2B437F87E44407429AE2AFB6E0140EC866D8B327B4440295C8FC2F56801406B82A8FB0078444038DBDC989E70014014D044D8F07444402592E865148B0140C7116BF1297044405C38109205CC0140F27B9BFEEC6B4440D13FC1C58A1A0240D717096D396B4440F92CCF83BB330240E370E657736844409EEFA7C64B370240A03715A93066444041F163CC5D4B024000529B38B96344401BD82AC1E27002400569C6A2E9604440DD24068195830240FC00A436715E4440868F882991840240E3DF675C385C4440202922C32A9E0240E6797077D65A44405F0CE544BBCA0240715AF0A2AF5844403ECBF3E0EEEC0240E561A1D634574440F3C81F0C3CF70240B610E4A084554440AB7823F3C81F0340456458C51B5544401DC9E53FA45F0340DDD26A48DC534440F35487DC0C77034052499D8026524440406A1327F77B03407BDAE1AFC94E444032772D211FB403406BF12900C64B4440DFE00B93A90204408D7A8846774C44407EC6850321190440587380608E4A44402D431CEBE2360440ED9925016A4A4440D942908312660440C63368E89F4844406AA4A5F276840440D74CBED9E646444057957D5704BF04406D3997E2AA464440CBDB114E0BDE044072FE26142244444080B74082E247054026AAB706B642444037FDD98F14910540F180B22957404440CF49EF1B5FBB05402D95B7239C424440ED0DBE3099EA05402619390B7B4244407BBDFBE3BD2A0640226C787AA5404440444C89247A590640DE3CD521373F444022E010AAD46C0640C0046EDDCD3F444026FC523F6FAA0640D027F224E93E44406E693524EEF1064026361FD78622444087BF266BD4C3074033A7CB626217444068CBB91457950840B6679604A80544402506819543CB09409CE1067C7E044440BCE82B4833D60940A297512CB7E443407B319413EDAA0A40D0F23CB83BE343402AA913D044580D40677E350708E24340B515FBCBEE490D407CED992501CE434035D252793B020C40ED815660C8C64340265305A392BA0B408C2D043928C54340D578E92631C80B40ECA353573EC34340B2463D44A3BB0B40D578E92631C043408907944DB9C20B40BC22F8DF4ABE4340739D465A2AAF0B40E90E62670AB94340ABE7A4F78DAF0B409EB5DB2E34B74340D3F6AFAC34A90B40EAE74D452AB0434090831266DABE0B40AC8BDB6800AB43407B14AE47E1BA0B400D1AFA27B8A84340828B153598C60B40
9	Mandera	Mandera	0103000020E6100000010000007D00000034A2B437F87E44407429AE2AFB6E01402575029A087F4440C02154A9D90302403B014D840D7F4440C85EEFFE782F04401E5036E50A7F44400C022B871699064016DEE522BE97444022718FA50F1D0840042159C004AA4440095053CBD63A094065C746205EC34440B48EAA26887A0B403C889D2974D24440AB21718FA5CF0C4027C286A757E64440F5D6C05609960E40E7A90EB919F2444074EACA67799E0F4024D6E25300F4444072BF4351A0CF0F403BE466B801F34440EFFE78AF5AD90F405A9E077767ED44403F00A94D9C9C0F402098A3C7EFE9444057CF49EF1B9F0F40A9A44E4013E9444025404D2D5BAB0F402E73BA2C26E6444092E86514CBAD0F40F6402B3064E54440B1DCD26A48DC0F4082CAF8F719E344400803CFBD87CB0F40594C6C3EAEDD4440967840D994EB0F40EE5F596952DA44402DEC6987BFE60F40FD87F4DBD7D544401CEBE2361AC00F402B137EA99FD344404A41B79734C60F40C7116BF129D04440728A8EE4F2DF0F40E5ED08A705CF4440CDE49B6D6ECC0F4015747B4963C8444052499D8026C20F40D8648D7A88C6444019ADA3AA09E20F40AC90F2936AC3444009A7052FFACA0F40EFACDD76A1C14440BF4351A04FA40F40DC80CF0F23C0444052D50451F7C10F40F163CC5D4BBC444012BD8C62B9A50F402C4833164DBB444057B2632310AF0F400057B26323B844407AC2120F289B0F40C4CE143AAFB54440B6847CD0B3990F40AD342905DDB244409A5FCD0182B90F4055A4C2D842B0444038842A357BA00F4093C6681D55AD444007B13385CEAB0F402098A3C7EFA944400C1F115322890F40E4310395F1A74440BD18CA8976950F40406A1327F7A3444013F241CF66950F404417D4B7CCA14440A110018750A50F40FF04172B6AA04440C9AB730CC89E0F40919BE1067C9E4440ADA3AA09A2AE0F40FAB836548C9B44401B0DE02D90A00F40919BE1067C9A4440B1169F02607C0F4029965B5A0D99444003603C83867E0F401618B2BAD593444043FF04172BAA0F4030F0DC7BB8904440789CA223B9BC0F40E275FD82DD904440B329577897CB0F40FBCBEEC9C38E44400CE544BB0AE90F402237C30DF88C4440ACFF73982FEF0F40B18A37328F8C444060764F1E160A10407EC685032189444094D920938C1C1040726DA818E787444016DEE522BE331040187D0569C68644402861A6ED5F391040C55565DF15854440E5B33C0FEE4E1040581CCEFC6A824440F4E0EEACDD561040E4310395F17F444089981249F4721040594C6C3EAE7D444014E81379927410400DA661F8887C4440F7E978CC408510409F5912A0A67A44403541D47D00921040232D95B7237444408DD13AAA9AA0104082E7DEC325734440CE531D7233BC1040A8C64B3789714440A0A696ADF5C51040A8C64B378971444062670A9DD7D8104089EFC4AC176F444027A089B0E1E9104019C5724BAB6D4440B5C35F9335EA10409BFEEC478A6C444057957D5704FF10408CF84ECC7A69444032ACE28DCC0311403D61890794654440FBE8D495CF1211409CF9D51C20644440C47762D68B211140FE7DC68503614440543541D47D2011407A8D5DA27A5F4440917EFB3A700E114005DD5ED2185D4440A72215C616021140BBD573D2FB5A4440A64412BD8C02114029CB10C7BA58444082CAF8F719F71040062FFA0AD24C4440A913D044D8D01040A1BE654E973144409F93DE37BE7610405F24B4E55C1A4440D0F23CB83B2B10408E23D6E2531844401FF46C567D2E10401D7233DC801744408CF337A110211040D7A3703D0A0F4440605969520AFA0F4009E1D1C611EF4340713D0AD7A3F00E40D0F23CB83BE343402AA913D044580D40A297512CB7E443407B319413EDAA0A409CE1067C7E044440BCE82B4833D60940B6679604A80544402506819543CB094033A7CB626217444068CBB9145795084026361FD78622444087BF266BD4C30740D027F224E93E44406E693524EEF10640C0046EDDCD3F444026FC523F6FAA0640DE3CD521373F444022E010AAD46C0640226C787AA5404440444C89247A5906402619390B7B4244407BBDFBE3BD2A06402D95B7239C424440ED0DBE3099EA0540F180B22957404440CF49EF1B5FBB054026AAB706B642444037FDD98F1491054072FE26142244444080B74082E24705406D3997E2AA464440CBDB114E0BDE0440D74CBED9E646444057957D5704BF0440C63368E89F4844406AA4A5F276840440ED9925016A4A4440D942908312660440587380608E4A44402D431CEBE23604408D7A8846774C44407EC68503211904406BF12900C64B4440DFE00B93A90204407BDAE1AFC94E444032772D211FB4034052499D8026524440406A1327F77B0340DDD26A48DC534440F35487DC0C770340456458C51B5544401DC9E53FA45F0340B610E4A084554440AB7823F3C81F0340E561A1D634574440F3C81F0C3CF70240715AF0A2AF5844403ECBF3E0EEEC0240E6797077D65A44405F0CE544BBCA0240E3DF675C385C4440202922C32A9E0240FC00A436715E4440868F8829918402400569C6A2E9604440DD2406819583024000529B38B96344401BD82AC1E2700240A03715A93066444041F163CC5D4B0240E370E657736844409EEFA7C64B370240D717096D396B4440F92CCF83BB330240F27B9BFEEC6B4440D13FC1C58A1A0240C7116BF1297044405C38109205CC014014D044D8F07444402592E865148B01406B82A8FB0078444038DBDC989E700140EC866D8B327B4440295C8FC2F568014034A2B437F87E44407429AE2AFB6E0140
13	Tharaka-Nithi	Tharaka-Nithi	0103000020E6100000010000005D000000331B64929127434024D1CB28965BAABF30D80DDB162543406BD44334BA8398BFAED3484BE52143409A25016A6AD98ABF73A25D85941F4340DBF97E6ABC7493BF0C0742B2801D43406B60AB048BC379BF0DFD135CAC1C434056F146E6913F883F83C0CAA1451A4340DBBFB2D2A414943F4D840D4FAF18434004ADC090D5AD8E3F0AA2EE0390164340894160E5D0229B3F8672A25D851443404703780B24289E3F118DEE207612434073D712F241CFA63FF4F8BD4D7F0E434068E89FE06245AD3F0FB40243560B4340342E1C08C902A63F3B191C25AF0A434097900F7A36AB9E3FE1EEACDD76054340FFCF61BEBC009B3F96218E75710343401C42959A3DD0AA3F9981CAF8F70143409FABADD85F76AF3F33164D6727FF4240B1A71DFE9AACB13F1EF98381E7FA4240CE3637A6272CB13F9A779CA223F942409947FE60E0B9A73F18B2BAD573FA424087BF266BD443A43F78978BF84EF842402D95B7239C169C3F645DDC4603F84240611A868F8829813F444C89247AF54240FA7E6ABC7493783FC9B08A3732F34240CBA145B6F3FD843F12C2A38D23F242408733BF9A030493BFF1BA7EC16EF04240DC114E0B5EF485BF533F6F2A52ED424056F146E6913F88BFBFF1B56796EC42407E3A1E3350199FBF9886E12362EE4240E1EEACDD76A1B1BFDBF97E6ABCEC424018096D3997E2BABFEFE6A90EB9ED4240E9482EFF21FDBEBF9981CAF8F7E5424008944DB9C2BBC4BF71AC8BDB68E44240F163CC5D4BC8C3BFBD1DE1B4E0E14240D09B8A54185BC4BF0D6C956071E042403108AC1C5A64C7BFF8FC304278DC42402F6EA301BC05CABFE1EEACDD76D942409B030473F4F8C9BFCB2DAD86C4D54240211FF46C567DCABF465F419AB1D44240DA5548F949B5CBBFDA1B7C6132CD4240B9533A58FFE7C8BF7AE40F069ECB4240691D554D1075C7BF9D8026C286C3424044FAEDEBC039C7BF9604A8A965A74240670FB4024356C3BF5019FF3EE3C642407F130A117008D7BF62156F641EC94240936FB6B9313DD7BF62DBA2CC06CD4240143FC6DCB584D8BFEA094B3CA0D0424077BE9F1A2FDDD8BF919BE1067CD24240B21188D7F50BDABF06BB61DBA2D442400D897B2C7DE8DABFA5F78DAF3DD742401E335019FF3EDBBF45F0BF95ECD8424086032159C004DCBF4E7FF62345DC42403FA9F6E978CCDCBF5D6DC5FEB2DF424080D4264EEE77DCBF704221020EE1424017D4B7CCE9B2DCBF5C5A0D897BE44240E4F736FDD98FDCBFDC4B1AA375E84240E8A4F78DAF3DDBBF2D5BEB8B84EA42409335EA211ADDD9BF0EDB166536EC4240904E5DF92CCFD9BF62F8889812ED424030F0DC7BB8E4D8BFF4F8BD4D7FEE4240B58993FB1D8AD8BFB9DFA128D0EF4240B554DE8E705AD6BF840D4FAF94F14240F3716DA818E7D5BFD8648D7A88F242403A0664AF777FD6BF0ADCBA9BA7F242402FDD24068195D7BFBC74931804F242401405FA449E24D9BFBAA0BE654EF342405FEFFE78AF5AD9BFCEAACFD556F44240448655BC9179DABFB2D7BB3FDEF742409B3DD00A0C59DBBF68D0D03FC1F942405A8121AB5B3DDBBF1630815B77FB424065DF15C1FF56DABF30D80DDB16FD424002D4D4B2B5BED6BF0647C9AB73FC42408FFCC1C073EFD5BF43FF04172BFE4240A94D9CDCEF50D4BF61E0B9F770FD42403EAE0D15E3FCD3BFDE02098A1FFF4240A5660FB40243D2BF16A4198BA6FF424088BA0F406A13D1BF174850FC18034340FC1D8A027D22D1BF670A9DD7D80543409279E40F069ED1BFCAFD0E45810E4340E6AE25E4839ED1BFDA722EC5551143404B1FBAA0BE65D0BF0ABFD4CF9B1243404D2D5BEB8B84CEBFCEAACFD556144340A2B437F8C264CEBF45F0BF95EC144340F7E978CC4065CCBFD00F2384471743405BB1BFEC9E3CC8BF2BDEC83CF2174340910F7A36AB3EC3BFD847A7AE7C1A4340C0266BD44334C2BFD122DBF97E1A4340C51B9947FE60C0BFA3586E69351C4340A4C2D8429083BABF0742B28009204340DA20938C9C85B5BF9F93DE37BE224340E7E3DA5031CEB7BF787FBC57AD244340E0675C381092B5BF331B64929127434024D1CB28965BAABF
41	Siaya	Siaya	0103000020E61000000100000046000000BAF770C9712F4140ADC090D5AD9ED33FD89E5912A02A414004392861A6EDD33F4D10751F80244140DC63E94317D4D33F761A69A9BC2141403FE3C281902CD43FE44EE960FD1F4140581CCEFC6A0ED43FBC5CC477621E414061545227A089D23FD8817346941A4140DC291DACFF73D23F52F2EA1C031A4140E3361AC05B20D13F55FB743C661841402BF697DD9387D13FF584251E501641405F5E807D74EAD23F401878EE3D1441407D224F92AE99D23F6FF59CF4BE1141400F7F4DD6A887D03F5E9D6340F60E41406EFAB31F2922CF3F89EAAD81AD0E4140A56B26DF6C73CB3F84F068E3880D41402DB29DEFA7C6C73F11363CBD520E41405ABBED42739DC63F2670EB6E9E0E41406AFB57569A94C23F2F17F19D980D4140840D4FAF9465C03F936FB6B931094140FE65F7E461A1BE3F4C7155D977094140F224E99AC937BB3FB1506B9A77084140666666666666B63F1A170E8464054140D2FBC6D79E5922BF6DC5FEB27B0241409279E40F069E9BBFD218ADA3AAF940405F7B6649809A9ABF12BD8C62B9FD4040FF3EE3C28190C0BF1ADD41EC4CF94040BF60376C5B94D5BF34F44F70B11E41400C76C3B64599D5BF5D8AABCABE2341404703780B2428DABFD1AE42CA4F264140A04FE449D235DBBFDAC9E028792941404182E2C798BBDABFD94290831236414044A852B3075AD5BFBD1DE1B4E03D41408121AB5B3D27D3BF26361FD786364140DB85E63A8DB4C0BF715AF0A2AF3441406EA301BC0512B4BFF06DFAB31F3941406C5B94D92093ACBF253B3602F13A4140344B02D4D4B2A5BF60B01BB62D3E41402EAD86C43D969EBF8FAA2688BA434140B6847CD0B35995BFB83B6BB75D4441404356B77A4E7A8FBFFDD98F14914541407AFCDEA63FFB71BF9A5FCD0182454140118DEE2076A6803F6D3997E2AA4641409DF4BEF1B567963F2B4D4A41B74741408126C286A757B23F24287E8CB9474140EBFF1CE6CB0BB83FD09B8A54184741400ADCBA9BA73AC03F6FF085C954454140CD751A69A9BCC13F098A1F63EE424140758E01D9EBDDBF3FD34D6210583D4140EACF7EA4880CBB3F0569C6A2E93C41403F912749D74CBE3F268DD13AAA3A4140930035B56CADBF3FEE77280AF43D41407AFCDEA63FFBC13FA1F831E6AE3D414062D68BA19C68C33FC0E78711C23B414076711B0DE02DC43FC0B2D2A4143841404B02D4D4B2B5C23F335019FF3E374140D61C2098A3C7C33FBFD4CF9B8A384140367689EAAD81C53F9817601F9D36414030478FDFDBF4C73FD6A887687437414035EF38454772C93FD235936FB63941406DAD2F12DA72CA3FA94D9CDCEF384140B3EA73B515FBCB3F6D1CB1169F364140A9C1340C1F11CB3F2C2B4D4A413341400DAB7823F3C8C73FC503CAA65C3141407155D97745F0C73F8369183E22324140F949B54FC763CA3F1344DD0720314140179AEB34D252CD3FD044D8F0F43241402EE7525C55F6CD3F6CEC12D55B3341409430D3F6AFACD03F84BBB376DB314140448B6CE7FBA9D13F26016A6AD9324140DE1FEF552B13D23FBAF770C9712F4140ADC090D5AD9ED33F
10	Marsabit	Marsabit	0103000020E610000001000000CC000000DF6C73637A064240DE1FEF552BD31140E657738060064240B532E197FA3910406D3997E2AA0642409430D3F6AFEC09401AA37554350942404E9CDCEF50D40940D174763238124240B08F4E5DF9AC0940F92CCF83BB134240D6C56D3480B709400803CFBD87134240DB5031CEDF8409406EA301BC051242407B14AE47E13A0940AC5626FC5213424027BD6F7CED1909401D8F19A88C134240D482177D05A9084060764F1E16124240BD18CA8976950840C347C49448124240C286A757CA7208405AF5B9DA8A1142403B70CE88D21E0840861BF0F96110424047C9AB730C0808405682C5E1CC0F4240B6847CD0B3D907401B2FDD2406114240FE2B2B4D4AC10740F0332E1C08154240B2BAD573D2BB07408DEE2076A618424075C8CD7003BE0740B6679604A81942401904560E2DB20740E96514CB2D2142407E52EDD3F198074098DD938785224240E4141DC9E53F07402A8C2D043924424057CF49EF1B1F074059349D9D0C264240EFFE78AF5A1907406397A8DE1A2C4240D7868A71FEE606409964E42CEC2D4240FB05BB61DBE206405C3810920530424005A8A9656BBD0640AC8BDB6800334240BA2C26361F570640CC6262F37135424046088F368E18064012BD8C62B9354240111956F146E60540890CAB78233742409FABADD85FB605409B3DD00A0C3942408FA50F5D509F0540F2CD3637A6374240AEB6627FD97D0540B3D2A41474374240B532E197FA390540B9196EC0E7374240E10B93A982110540E0675C38103A4240C1FF56B263E30440B8AF03E78C3C4240205ED72FD8CD0440C251F2EA1C3F424047205ED72F98044076374F75C84142402A5778978B7804405E9D6340F6424240F6402B30643504406475ABE7A44342407689EAAD812D0440DD0720B5894342404165FCFB8CCB0340E6965643E24242407B4E7ADFF89A0340613255302A454240EAEC6470943C0340C898BB969047424021C84109332D034064E94317D44B4240EBFF1CE6CB4B0340293FA9F6E94C4240AD6EF59CF43E0340AC1C5A643B4F4240FBE8D495CF320340224F92AE995042401FBAA0BE654E0340D97745F0BF5142405E11FC6F253B034084D89942E7554240C7681D554D90034040F67AF7C7574240EC51B81E85AB034077BE9F1A2F5942401895D40968A20340925CFE43FA594240C408E1D1C6D10340B62DCA6C90594240B79C4B715519044081CF0F23845B4240C408E1D1C61104400D71AC8BDB604240A930B610E4200440CEC29E76F86B4240DFFDF15EB5320240179AEB34D26E424080B74082E2070240F4A62215C6724240EEEBC039238A01403A7AFCDEA6734240040473F4F83D01408C2D0439287542406FF085C95401014046B6F3FDD474424077F35487DCCC0040E0F3C308E1754240F6B4C35F93750040F7E978CC4075424040FB9122322C00404963B48EAA764240876D8B321B240040BD6F7CED99794240A56B26DF6C330040CDAFE600C1804240868F882991C4FF3F8CBE8234638542402AE3DF675CB8FF3F9DBAF2599E8B424023F3C81F0CBCFF3F9031772D21934240753C66A0327EFF3FADA3AA09A29642408716D9CEF753FF3FF27B9BFEEC974240645DDC4603F8FE3FFCFB8C0B079A4240B81E85EB51B8FE3F68B3EA73B59D42402C4833164D67FE3FFAD51C20989F42407D224F92AE19FE3FEEEBC03923A24240B459F5B9DA0AFE3F417DCB9C2EA742403A92CB7F483FFC3F70CE88D2DEAC4240E4DA5031CEDFFB3F3F3A75E5B3B84240A06CCA15DE65F93F40A4DFBE0EBC424058FFE7305FDEF83F32207BBDFBBF4240F7C77BD5CA04F83FBADA8AFD65C742401092054CE056F63F43AD69DE71CA424014D044D8F0F4F53F7FC16ED8B6CC4240C79DD2C1FA3FF63FA7E8482EFFCD4240E14048163001F63FD47D00529BD04240C0E78711C223F63FED815660C8D2424017F19D98F562F63F641EF98381D74240359886E12362F63F573ECBF3E0DA42408733BF9A0384F63F696FF085C9DC4240E8305F5E807DF63F64AF777FBCDF4240CC9717601F9DF63F3255302AA9E342400FD6FF39CC97F63F1B81785DBFE84240302AA913D0C4F63F16DEE522BEEB42401FA2D11DC4CEF63F3E22A64412ED42409C6D6E4C4F58F73F367689EAADF9424037C30DF8FC30F63F309E4143FFF84240145CACA8C134F43F33E197FA792B4340B0E600C11C3DF93F7767EDB60B3143400395F1EF332EFC3FE561A1D6347B4340D6A8876874C70040AF7C96E7C1794340EE258DD13AEA0040F224E99AC9774340EEEBC039234A0140876D8B321B784340B936548CF3B70140F415A4198B7643404F75C8CD70430240DDB5847CD0774340EC2FBB270F8B0240C8CD70033E774340AA0EB9196EC0024024D1CB289677434058AD4CF8A5FE024049BA66F2CD764340CF143AAFB14B034029965B5A0D754340F4C308E1D1860340D6A8876874734340849ECDAACFD503400473F4F8BD7143402C6519E25857044000C63368E87B4340A8C64B3789810440D93D7958A87D434052B81E85EB91044004FF5BC98E8543400D897B2C7D680540E2E47E87A284434002D4D4B2B57E0540207BBDFBE3854340B6F81400E3990540B4024356B7864340AB9509BFD4CF054078EE3D5C728843402D78D15790E60540B1F9B836548843405778978BF80E0740F584251E508E4340705F07CE19110740170E8464018F4340A301BC0512540740008C67D0D08F4340C1E270E657730740C190D5AD9E93434017D9CEF753A30740BD1DE1B4E09943400FB9196EC0A707409D11A5BDC19F43400B410E4A98E90740F27B9BFEEC9F4340488AC8B08AF7074037E0F3C308A54340F163CC5D4B480840DAC9E02879A94340079964E42C6C0840CEC7B5A162AC434056D4601A868F0840B2BAD573D2AB434022C32ADEC8FC0940410E4A9869AB4340E15D2EE23B310A40C4995FCD01AA4340904E5DF92C4F0A408B89CDC7B5A943404EB9C2BB5C840A402A52616C21A843408CF337A110410B406D1CB1169FA643407D0569C6A2690B40C2DD59BBEDA6434032384A5E9DA30B400D1AFA27B8A84340828B153598C60B40A032FE7DC6A54340672783A3E4D50B40B471C45A7CA24340D578E92631C80B40C55565DF159D43405ABBED4273DD0B4044FAEDEBC0994340D8BB3FDEABD60B40087250C24C9343407ADFF8DA330B0C4052EDD3F1988D4340520ABABDA4310C402497FF907E8B4340170E846401530C406DE7FBA9F186434002D9EBDD1F2F0C409BC937DBDC8443409357E718903D0C40C9C859D8D38243408D45D3D9C9200C401CB1169F02804340D0F23CB83B2B0C40F67AF7C77B7D4340892991442F230C40BADA8AFD657B43408E40BCAE5F300C40C24CDBBFB27A4340E0DBF4673F120C40793BC269C17343405C381092050C0C40DD41EC4CA16B43402783A3E4D5390C40FA0AD28C456B434047E6913F18380C40FA449E245D5B4340672C9ACE4E860C403A1E3350195B43402619390B7B9A0C4023F3C81F0C584340C6A2E9EC64F00C40CCB4FD2B2B554340FB743C66A0B20C404A5E9D63404E4340EA3E00A94DDC0C401B649291B34C434006BB61DBA2CC0C40BDC62E51BD494340E527D53E1DCF0C408FA50F5D50474340967840D994EB0C40D2E3F736FD454340CB67791EDC1D0D4015747B4963444340361FD7868A310D402E1C08C902424340B9C7D2872E280D4042B28009DC4243404356B77A4EFA0C40A3409FC893404340C5E6E3DA50F10C4021020EA14A3943400EF3E505D8C70C405053CBD6FA26434022FDF675E0DC0C40B324404D2D1743403E3F8C101EED0C40BF7D1D3867104340AEF545425BCE0C40DF4F8D976E0E4340357BA01518F20C4023A12DE7520443409A779CA223790D404963B48EAAFE4240A12DE7525CD50D4053D0ED258DF54240F5B9DA8AFD250E404E452A8C2DF44240F0DC7BB8E4380E40CA6C904946E64240CE88D2DEE0CB0E40B58993FB1DE242404DBED9E6C6F40E40E5F21FD26FD34240EE42739D469A0F405F0CE544BBD24240D3DEE00B93A90F40261E5036E5CA424077F86BB246FD0F4057EC2FBB27BF424018213CDA384210408BC3995FCDB5424052B81E85EB711040E9263108ACA44240793BC269C1CB1040D218ADA3AA91424091B8C7D2872E1140D13FC1C58A8E4240D1798D5DA23A1140BA4E232D958B4240AC5626FC525F1140A33B889D29884240454772F90F691140EACA67791E8442404209336DFF8A11402670EB6E9E824240B0389CF9D57C1140DB85E63A8D80424050C763062A831140B51A12F7587E4240C47C7901F691114007D3307C44744240888043A852B31140D50968226C704240431CEBE236BA1140E4F736FDD96B42405B087250C2CC114065A54929E8564240C05B2041F1C31140AA4885B1855442408655BC9179C411409869FB5756524240FF3EE3C281D01140EB909BE10650424054742497FFD011402EC55565DF454240D734EF3845C71140F6D1A92B9F214240594C6C3EAECD11405DDC4603781F42408672A25D85D41140CBF3E0EEAC1D42409296CADB11CE1140DF6C73637A064240DE1FEF552BD31140
11	Isiolo	Isiolo	0103000020E610000001000000DA000000309E4143FFF84240145CACA8C134F43F0CB08F4E5DF94240EB56CF49EF1BF33F4EB4AB90F2034340944DB9C2BB5CF13FD21DC4CE1406434035D252793BC2E93FD1CB28965B0A4340E12879758E01E93FD80DDB166506434043E7357689EAE83F603C8386FE054340431CEBE2361AE93F8B37328FFC014340541D7233DC80E93F8A7615527EFE42403A4030478FDFE83FCDE49B6D6EFC42401B2AC6F99B50E83FB83B6BB75DF84240DC2E34D769A4E73FC02154A9D9F74240C9AB730CC85EE73F77D66EBBD0F44240B875374F75C8E63F12BD8C62B9F14240DC2E34D769A4E73F6A1327F73BF04240E353008C67D0E73FC2FA3F87F9EE4240C53D963E7441E73FF180B22957EC4240A2EE0390DAC4E63F15C616821CEC42406FD39FFD4811E63F3480B74082EA42407120240B98C0E53FF775E09C11E5424051BD35B05582E53F7B88467710E342406E693524EEB1E53FBEF6CC9200E142404BCD1E680586E53F7AC7293A92DF42406CB2463D44A3E53FE17A14AE47DD4240355EBA490C02E53F904946CEC2DA424044A852B3075AE53F062AE3DF67D842409CBF09850838E53F8C67D0D03FD542405001309E4143E43FE622BE13B3D24240E466B8019F1FE43FD95A5F24B4D14240E4DA5031CEDFE33F45D8F0F44AD1424037C30DF8FC30E33F2CD49AE61DCF4240FDA4DAA7E331E33F99F04BFDBCCD42401630815B77F3E23F2D78D15790CA42405D50DF32A7CBE23F910F7A36ABCA4240689604A8A965E23F088F368E58C742401283C0CAA145E23F6FD8B628B3C54240224F92AE997CE23F0E4A9869FBC34240809A5AB6D617E23F176536C824BF4240CC6262F3716DE23F9F5912A0A6BE42405DA79196CADBE23FACFF73982FBB4240327216F6B4C3E23F5A2A6F4738B9424018265305A392E23F9E077767EDB64240F085C954C1A8E23FE0F3C308E1B14240BC22F8DF4A76E23F18096D3997AE4240BEBC00FBE8D4E23F4CFDBCA948AD42402063EE5A423EE33F77A1B94E23AD4240D23AAA9A20EAE33F39B4C876BEAB424052F2EA1C03B2E43FA67EDE54A4AA4240314278B471C4E43F8481E7DEC3A942404FAF94658863E53F151DC9E53FA84240D00A0C59DDEAE53FCAFD0E4581A642409DBAF2599E07E73F772D211FF4A442406AFB57569A94E73F3BC780ECF5A24240758E01D9EBDDE73FE9D495CFF2A04240C8D2872EA86FE83FCF31207BBD9F42403D0FEECEDA6DE83F878A71FE269C4240EF552B137EA9E73FEEB1F4A10B9A424072FE261422E0E73F92CB7F48BF95424087A757CA32C4E73F164D6727839342405AD8D30E7F4DE83FF67AF7C77B9142405AD8D30E7F4DE83F404D2D5BEB8F4240A06CCA15DEE5E83FB77F65A5498D4240DDCD531D7233E93F0CB08F4E5D894240FBE8D495CFF2E83FA3CC0699648042405305A3923A01E83FD6390664AF7B4240E42CEC6987BFE73F107A36AB3E7742407C2766BD18CAE73FC971A774B0764240A5BDC1172653E73F268DD13AAA7642408B89CDC7B5A1E53FC74B37894174424014967840D994E43FB515FBCBEE714240E8C1DD59BBEDE33F36936FB6B9714240747B4963B48EE33F978BF84ECC6E4240C45A7C0A80F1E23F5FD218ADA36E4240B4C876BE9F1AE23FF7CC920035894240EC6987BF266BE13F3E22A64412A14240963E74417DCBE03F5E4BC8073DAF4240029A081B9E5EE03F18213CDA38AE42403F8C101E6D1CE03F0B7BDAE1AFAD4240B515FBCBEEC9DD3F3F1D8F19A8AC4240CE3637A6272CDD3FE17A14AE47AD42405DBF60376C5BDA3F5F24B4E55CAE42402D95B7239C16DA3F1630815B77AF42406C26DF6C7363D83F0CE544BB0AB1424073D712F241CFD63FA0A696ADF5B14240D925AAB706B6D63FE657738060B2424011FC6F253B36D43F68E89FE062B142408E9257E71890D13FF38E537424B34240931804560E2DD23F6536C82423B3424014D044D8F0F4D23F26C79DD2C1B6424057EC2FBB270FD33F88BA0F406ABB4240CEDF8442041CD23F8D28ED0DBEC44240BE13B35E0CE5D03FE7A90EB919C64240B1DCD26A48DCD13F60764F1E16C642406E6E4C4F58E2D33F3A1E335019C74240D061BEBC00FBD43F91442FA358CA4240834C327216F6D43FCCD1E3F736CD4240BCE82B483316D73F9413ED2AA4CC424052F2EA1C03B2D93F3BC780ECF5CA42402F8B89CDC7B5D93F0A4B3CA06CCA42406F9EEA909BE1DA3F1FD7868A71CA42406F1283C0CAA1DD3FC2340C1F11CB4240CF2C095053CBDE3F36936FB6B9E942400A80F10C1AFAE13F32C9C859D8074340085A8121AB5BE53F876D8B321B0C4340F7AFAC342905E23FCA37DBDC98164340C8EF6DFAB31FD53FA9A44E4013194340A4703D0AD7A3D43F22AB5B3D2719434068E89FE06245CD3FDB85E63A8D2043402176A6D0798DC93F92E86514CB214340E5D5390664AFC73F67B8019F1F264340CA37DBDC989EC43FA514747B492743404C37894160E5C03F08E6E8F17B274340834C327216F6BC3FCA4FAA7D3A2A4340F146E6913F18B83F5AF5B9DA8A294340CBA145B6F3FDB43F31B610E4A02C4340C746205ED72FB03FEA043411362C43406B48DC63E943A73F99F04BFDBC2D4340E0BE0E9C33A2A43F0BB5A679C72D4340F1BA7EC16ED8963F6A183E22A6304340C58F31772D215FBF66666666663243400E4A9869FB5786BF7233DC80CF334340DE9387855AD39CBFAEB6627FD93543403F52448655BCB1BF7AC7293A923743404833164D6727B3BF6EDDCD531D3A43402176A6D0798DB5BF355EBA490C3E4340833463D17476B2BF5FEFFE78AF3E43404703780B2428AEBF6DFFCA4A9342434047551344DD07B0BF5A8121AB5B4543407BF7C77BD5CAA4BF0A4B3CA06C46434061E0B9F770C991BF54573ECBF3484340F08AE07F2BD991BF3012DA722E4D43402670EB6E9EEAA0BF74B515FBCB4E4340F701486DE2E49EBF19E25817B7514340FF092E56D460AABF47E6913F18544340522CB7B41A12A7BF97C5C4E6E3564340CC5D4BC8073DABBF61C3D32B65594340A228D027F224A9BFC0046EDDCD5B4340543A58FFE730AFBF3B3602F1BA5E43401A8BA6B393C1B1BF6E8B321B646243409A9999999999B1BFCA15DEE5226243400395F1EF332EACBF876D8B321B604340B41F2922C32A9EBFE6E8F17B9B5E4340AA7D3A1E3350793F2041F163CC5D434073A25D85949FA43FD2FBC6D79E5D434036E50AEF7211BF3F117008556A5E434003ECA353573EC33F5C77F354876043406F1283C0CAA1C53F70CE88D2DE60434091F2936A9F8EC73FA96A82A8FB584340FB96395D1613DB3FC0B2D2A414584340A1A17F828B15DD3F02BC0512145743403FE3C281902CDE3FD80DDB1665564340EACA67791EDCDF3F7B88467710574340AD86C43D963EE03F59518369185A43403563D1747632E03F5C1B2AC6F95B4340D9EBDD1FEF55E03F30F0DC7BB85C4340B875374F75C8E03F1EC4CE143A5F4340240B98C0ADBBE03F8B37328FFC614340B7B41A12F758E03F60CD0182396643404DF8A57EDE54E13F3D44A33B88694340D7C056091687E23FA0C37C79016E43403FE3C281902CE33FB5E0455F41724340F2EF332E1C08E33FBBD05CA791764340EFC9C342AD69E33F5CE674594C784340787AA52C431CE43F29ED0DBE307D434036B05582C5E1E33F6E179AEB347E4340D4484BE5ED08E43F4CE0D6DD3C8143405E85949F54FBE33FB4AB90F293824340FEB7921D1B81E43FB35E0CE54483434029B341261939E53FF2EF332E1C844340FBCBEEC9C342E53F74B515FBCB8643401AC05B2041F1E53FED647094BC8A4340EA3E00A94D9CE53F77F35487DC8C4340B3412619390BE63F5B25581CCE90434031CEDF844204E63F6EFAB31F29924340020EA14ACD1EE63F02486DE2E4924340D15790662C9AE63F3CDA38622D964340BEC117265305E73FD1967329AE96434036B05582C5E1E73F0CC85EEFFE984340FE261422E010E93F6891ED7C3F9D43406A4DF38E5374EA3FEECEDA6D179E43403EAE0D15E3FCEA3F6B9F8EC70CA84340D3872EA86F99ED3F6EDDCD531DAE43405F24B4E55C8AEE3F10CCD1E3F7BA43406A87BF266BD4EF3F09A7052FFABA4340E14048163001F03FF4FDD478E9B24340BA2C26361F57F23FD690B8C7D2AB4340FD4D2844C0A1F43FEC4CA1F31AA34340CE1951DA1B7CF73F4CE0D6DD3CB943408FFCC1C0736FF83F077C7E1821B84340D4F19881CA78F83F8C101E6D1CB54340AA656B7D91D0F83FA583F57F0EB34340202922C32ADEF83F91B8C7D287B24340B3412619390BF93FCD1E680586B04340C425C79DD241F93FAA7D3A1E33AC4340156F641EF903FA3FBC9179E40FAA434087E123624A24FA3FCF83BBB376A743409B030473F478FA3F12A0A696AD9D4340B6F81400E319FB3FF31FD26F5F9B4340F19D98F56228FB3FB3EA73B515974340205ED72FD80DFC3FA032FE7DC6954340B8AF03E78CA8FC3FBC79AA436E924340D3A414747B49FD3F51888043A89243408ACDC7B5A162FD3F946A9F8EC790434024B9FC87F4DBFD3FFCC6D79E598E4340EBFF1CE6CB0BFE3FB7EEE6A90E8D4340E8BCC62E513DFE3F18601F9DBA8A43403468E89FE062FE3FBA2C26361F874340B70BCD751AE9FE3FC6DCB5847C844340B7627FD93D79FF3FBCB376DB85824340164D672783A3FF3FE5F21FD26F7F434056BC9179E40F0040B4E55C8AAB7E43406475ABE7A43700401E166A4DF37E434027A5A0DB4B5A0040CBDB114E0B7E434009E1D1C6116B0040FC3559A31E7E434091F2936A9F8E0040E561A1D6347B4340D6A8876874C700407767EDB60B3143400395F1EF332EFC3F33E197FA792B4340B0E600C11C3DF93F309E4143FFF84240145CACA8C134F43F
14	Embu	Embu	0103000020E61000000100000064000000B2D7BB3FDEF742409B3DD00A0C59DBBFCEAACFD556F44240448655BC9179DABFBAA0BE654EF342405FEFFE78AF5AD9BFBC74931804F242401405FA449E24D9BF0ADCBA9BA7F242402FDD24068195D7BFD8648D7A88F242403A0664AF777FD6BF840D4FAF94F14240F3716DA818E7D5BFB9DFA128D0EF4240B554DE8E705AD6BFF4F8BD4D7FEE4240B58993FB1D8AD8BF62F8889812ED424030F0DC7BB8E4D8BF0EDB166536EC4240904E5DF92CCFD9BF2D5BEB8B84EA42409335EA211ADDD9BFDC4B1AA375E84240E8A4F78DAF3DDBBF5C5A0D897BE44240E4F736FDD98FDCBF704221020EE1424017D4B7CCE9B2DCBF5D6DC5FEB2DF424080D4264EEE77DCBF4E7FF62345DC42403FA9F6E978CCDCBF45F0BF95ECD8424086032159C004DCBFA5F78DAF3DD742401E335019FF3EDBBF06BB61DBA2D442400D897B2C7DE8DABF919BE1067CD24240B21188D7F50BDABFEA094B3CA0D0424077BE9F1A2FDDD8BF62DBA2CC06CD4240143FC6DCB584D8BF62156F641EC94240936FB6B9313DD7BF5019FF3EE3C642407F130A117008D7BF9604A8A965A74240670FB4024356C3BF8CF337A110B5424078280AF4893CD9BFBCE82B4833B64240D2C6116BF129DABF98FA795391B64240CAC342AD69DEDDBF4BEA043411B64240EB73B515FBCBDEBFB51A12F758B6424073BA2C26361FE0BFF3E505D847B742402F34D769A4A5E0BFC6A70018CFB842404417D4B7CCE9E0BF3E7958A835B94240419FC893A46BE1BF546F0D6C95BC424067D5E76A2BF6E1BFD9942BBCCBBD4240CC9717601F9DE2BF29B3412619BD424038BEF6CC9200E3BF115322895EBE4240412B306475ABE3BF6AA4A5F276BC4240527E52EDD3F1E4BF1A69A9BC1DBD42402FA86F99D365E5BFEFE192E34EBD424088855AD3BCE3E6BF4985B18520BB42408FC2F5285C8FE7BF95F1EF332EB842400B98C0ADBB79E7BF5ABBED4273B5424086AC6EF59CF4E7BF5E68AED348B3424046CEC29E76F8E7BFAEF02E17F1AD42405F7B6649809AE8BF15A930B610AC424075029A081B9EE8BF130F289B72A942406C26DF6C7363E8BFF853E3A59BA842405E85949F54FBE7BFAC1C5A643BA34240AF5FB01BB62DE8BF2046088F36A242406F2A52616C21E9BFAA8251499DA442401F2E39EE940EE9BF2592E86514A74240C6A70018CFA0E9BFC2340C1F11A74240E71890BDDEFDE9BF8B54185B08AA4240DD989EB0C403EBBF3C31EBC550AE4240DD989EB0C403EBBF43CA4FAA7DB642404B02D4D4B2B5EBBF630B410E4AB842409CF9D51C2098EBBF137EA99F37B942409A25016A6AD9EBBF693524EEB1BC4240594C6C3EAE0DECBF05C078060DBD42407E52EDD3F198ECBF4FCC7A3194BF4240F758FAD005F5ECBFD99942E735C242402AA913D044D8ECBF020EA14ACDC2424015E3FC4D2844EDBF062AE3DF67C442401D554D10751FEDBF295C8FC2F5C442408C2D04392861ECBFBD00FBE8D4C9424092B3B0A71DFEEBBF5709168733CB4240EC2FBB270F0BECBF1618B2BAD5CB4240F7C77BD5CA84EBBFDC4B1AA375D042408DD13AAA9A20EBBF5A9E077767D1424080B74082E2C7EABF2A00C63368D44240C898BB96900FEBBFBA83D89942D74240A8C64B378941EABF08556AF640D742409AEB34D25279E9BFEF38454772D94240C9C859D8D30EE9BF9E077767EDDE4240A01518B2BAD5E8BF85CE6BEC12E1424005A3923A014DEABFA4C7EF6DFAE3424024D1CB28965BEABFB05582C5E1E84240BA4E232D95B7E9BFBB0A293FA9EA4240EE08A7052FFAE9BF7138F3AB39EC4240D23AAA9A20EAE9BF567DAEB662EF4240D5CA845FEAE7E9BFA2EE0390DAF042406649809A5AB6E9BF30F0DC7BB8F04240BABDA4315A47E9BF518369183EF24240BF4351A04FE4E8BF8A8EE4F21FF24240E370E6577380E8BFF8C264AA60F442409BAC510FD1E8E7BF850838842AF54240868F88299144E7BF30F0DC7BB8F4424069520ABABDA4E6BFC217265305F3424051BD35B05582E6BFA4198BA6B3F34240CC7A319413EDE5BFFB3A70CE88F242403012DA722EC5E5BF83DDB06D51F2424073A25D85949FE4BFA0C37C7901F642403737A6272CF1E3BF94DE37BEF6F04240F71E2E39EE94E2BF61376C5B94F14240A4C7EF6DFAB3E1BF14B35E0CE5F04240ACA8C1340C1FE1BFDB6D179AEBF44240BEBC00FBE8D4DDBF65A54929E8F64240CD1E680586ACDCBFB2D7BB3FDEF742409B3DD00A0C59DBBF
15	Kitui	Kitui	0103000020E610000001000000C50000007AC7293A923743404833164D6727B3BFAEB6627FD93543403F52448655BCB1BFFC3559A31E324340E5B33C0FEECEB2BF8DEE2076A6304340040473F4F8BDB5BFBF7D1D38672C4340B4AB90F2936AAFBF76543541D4294340A27F828B1535B0BF331B64929127434024D1CB28965BAABF787FBC57AD244340E0675C381092B5BF9F93DE37BE224340E7E3DA5031CEB7BF0742B28009204340DA20938C9C85B5BFA3586E69351C4340A4C2D8429083BABFD122DBF97E1A4340C51B9947FE60C0BFD847A7AE7C1A4340C0266BD44334C2BF2BDEC83CF2174340910F7A36AB3EC3BFD00F2384471743405BB1BFEC9E3CC8BF45F0BF95EC144340F7E978CC4065CCBFCEAACFD556144340A2B437F8C264CEBF0ABFD4CF9B1243404D2D5BEB8B84CEBFDA722EC5551143404B1FBAA0BE65D0BFCAFD0E45810E4340E6AE25E4839ED1BF670A9DD7D80543409279E40F069ED1BF174850FC18034340FC1D8A027D22D1BF16A4198BA6FF424088BA0F406A13D1BFDE02098A1FFF4240A5660FB40243D2BF61E0B9F770FD42403EAE0D15E3FCD3BF43FF04172BFE4240A94D9CDCEF50D4BF0647C9AB73FC42408FFCC1C073EFD5BF30D80DDB16FD424002D4D4B2B5BED6BF1630815B77FB424065DF15C1FF56DABF68D0D03FC1F942405A8121AB5B3DDBBFB2D7BB3FDEF742409B3DD00A0C59DBBF65A54929E8F64240CD1E680586ACDCBFDB6D179AEBF44240BEBC00FBE8D4DDBF14B35E0CE5F04240ACA8C1340C1FE1BF61376C5B94F14240A4C7EF6DFAB3E1BF94DE37BEF6F04240F71E2E39EE94E2BFA0C37C7901F642403737A6272CF1E3BF83DDB06D51F2424073A25D85949FE4BFFB3A70CE88F242403012DA722EC5E5BFA4198BA6B3F34240CC7A319413EDE5BFC217265305F3424051BD35B05582E6BF30F0DC7BB8F4424069520ABABDA4E6BF850838842AF54240868F88299144E7BFF8C264AA60F442409BAC510FD1E8E7BF8A8EE4F21FF24240E370E6577380E8BF518369183EF24240BF4351A04FE4E8BF30F0DC7BB8F04240BABDA4315A47E9BFA2EE0390DAF042406649809A5AB6E9BF567DAEB662EF4240D5CA845FEAE7E9BF7138F3AB39EC4240D23AAA9A20EAE9BFAA4885B185EC4240A1D634EF3845EABF5D6DC5FEB2EB42403D7E6FD39FFDEABF43E7357689EA42408B4F01309E41EBBFD34D621058E94240213CDA38622DECBFE197FA7953E942409CF9D51C2098ECBF6C26DF6C73EB42409D11A5BDC117EDBFECDD1FEF55EB4240F12900C63368EDBF1BD82AC1E2EC4240CF2C095053CBEDBFEA78CC4065EC4240AEB6627FD93DEEBFB6847CD0B3ED42400AA2EE0390DAEEBF7380608E1EEF4240317C444C8924EFBF55DE8E705AEC42409EB5DB2E34D7EFBF467C2766BDEC424050E449D23513F0BFD5EC815660EC42402844C02154A9F0BFEE42739D46EA4240A089B0E1E915F1BFF0BF95ECD8E84240C45F9335EA21F1BF124E0B5EF4E54240F1D7648D7A08F2BF6DC5FEB27BDE424076E09C11A53DF1BF323D618907CC42401CB1169F0260F1BFBF7D1D3867CC4240D0B359F5B95AF2BF111956F146CE424068D0D03FC145F2BFCF31207BBDCF42405C77F354875CF2BF3D9B559FABD14240D93D7958A8B5F2BF9014916115D34240F085C954C128F3BFF4F8BD4D7FD642402AE3DF675CB8F3BF967840D994D74240FF5BC98E8DC0F3BF1361C3D32BD942400473F4F8BD4DF4BF906B43C538DB4240649291B3B0A7F4BF520ABABDA4DD4240A913D044D870F5BF8FE4F21FD2DF4240D80DDB1665B6F5BFFDA4DAA7E3E14240967840D994ABF5BFB459F5B9DAE6424072A774B0FE4FF6BF65AA605452E7424016A4198BA6B3F6BFB1169F0260E84240B2683A3B191CF7BF9626A5A0DBE3424064CC5D4BC887F7BF50C763062AE34240FCFB8C0B07C2F7BF4BEA043411DE4240AA2B9FE579F0F7BF74D2FBC6D7DA4240C49448A297D1F7BF543A58FFE7D842400A80F10C1AFAF7BF7B4E7ADFF8DA4240FD4D2844C021F8BF7D5C1B2AC6DD42403EB324404DADF8BFAB7823F3C8DF4240944DB9C2BBDCF8BF1CB62DCA6CE0424056BC9179E40FF9BFDFFDF15EB5E24240C11C3D7E6F53F9BF87A757CA32E442407138F3AB39C0F9BFED9E3C2CD4E642406440F67AF747FABF2D431CEBE2E642408B6CE7FBA971FABF21C8410933E94240BB7EC16ED8B6FABFB05582C5E1E842400AA2EE0390DAFABFC251F2EA1CEB4240CC4065FCFB0CFBBF8CDB68006FED424036CD3B4ED111FCBF5D16139B8FEB4240B745990D3249FCBF1EC4CE143AEB4240F2B0506B9A77FCBF711B0DE02DEC4240D47D00529BB8FCBFBCAE5FB01BF242407FA4880CAB78FDBF85CE6BEC12F1424054E3A59BC4A0FDBFE5B33C0FEEF2424018096D3997E2FDBFA301BC0512F442400F289B728577FEBF7E1D386744F542403A75E5B33C8FFEBF319413ED2AF4424009E1D1C611EBFEBF3F74417DCBF44240A2EE0390DA44FFBF6614CB2DADF64240A913D044D8F0FFBF5D6DC5FEB2F7424034A2B437F80200C0EE940ED6FFF94240F9BD4D7FF66300C0910F7A36ABFA4240C2C073EFE19200C084BBB376DBF94240075F984C150C01C0087250C24CFB4240FFCF61BEBC4001C0E25817B7D1FC4240D200DE02094A01C051A5660FB402434058CA32C4B12E01C057B2632310034340DD240681954301C0598B4F01300643407EC68503215901C04833164D6707434069C6A2E9ECA401C01B649291B30843402E73BA2C26B601C0DB6D179AEB08434026C79DD2C1FA01C05ED72FD80D0B43404417D4B7CC2902C00BB5A679C70D43405019FF3EE34202C074B515FBCB0E4340041C42959A7D02C0D673D2FBC60F4340ED478AC8B08A02C05FEFFE78AF124340C5387F130A9102C0185B087250164340A27F828B15B502C000E31934F41743406519E25817B702C07DAEB6627F194340DE1FEF552BD302C0A54929E8F61A4340A1B94E232DD502C06A6AD95A5F1C43401EC4CE143A2F03C063450DA66120434078EE3D5C725C03C0971C774A07234340A4880CAB786303C054C6BFCFB8244340B5E0455F41DA03C0D8648D7A8826434006D847A7AEFC03C0C1CAA145B627434019E76F42210204C01B2FDD24062943403C4ED1915C3E04C0A29C68572129434000C63368E85F04C0B51A12F7582A43407380608E1E7F04C0C1A8A44E402B434092E86514CBAD04C0A3923A014D2C434087DC0C37E0B304C07B14AE47E12E4340C7BAB88D063005C0CD069964E4304340E4839ECDAA4F05C0D235936FB6314340DA38622D3E8505C00D8E9257E7344340707CED99250106C02F6EA301BC3543403659A31EA21106C0EC4CA1F31A374340300DC347C45406C0753C66A032364340EBE2361AC05B06C043739D465A36434080B74082E28706C063D1747632384340B84082E2C7D806C09B559FABAD384340156F641EF90307C0D97C5C1B2A3A43400473F4F8BD0D07C0715AF0A2AF3C434060EAE74D456A07C0546F0D6C954043409D4B7155D9B707C0FC00A436714243400647C9AB73CC07C053D0ED258D4543406A87BF266BD407C0E3DF675C3848434086C954C1A8E407C026AAB706B64A43402FC03E3A75E507C0F5B9DA8AFD4D4340CC28965B5A0D08C0ED9925016A5243405F07CE19511A08C03F74417DCB54434058AD4CF8A53E08C04CA60A46255543403815A930B65008C034D769A4A55A4340367689EAAD4108C020EF552B135E434080828B15355808C0BB9BA73AE46243400BD28C45D35908C0F0332E1C08654340892991442F6308C014967840D96843409C8A54185B8808C012F758FAD0694340CE1951DA1B7C08C07B832F4CA66E4340A20BEA5BE67408C0C381902C6072434074EFE192E34E08C08CA19C685775434025E99AC9375B08C0EBAD81AD12784340F3AB3940304708C08BFD65F7E47943401C42959A3D5008C0B610E4A0847D4340C6DCB5847C5008C0D8F50B76C37E434065A54929E83608C0C2DD59BBED82434026FC523F6F2A08C021CD58349D894340A3755435415408C040FB912232504340F14BFDBCA94803C0A6F27684D35243408126C286A75703C0705F07CE1955434030F5F3A6225503C0B7D100DE02594340F90FE9B7AF4303C099D36531B15D4340A01A2FDD240603C0670A9DD7D85D43402EFF21FDF6F502C0833463D1746243406EA301BC05D202C000E31934F4634340DCD7817346D402C02766BD18CA6543406475ABE7A4B702C02098A3C7EF814340728A8EE4F29FFEBF184339D1AE7A43401F4B1FBAA03EFBBF4B9352D0ED7D434009FEB7921D1BFBBF24B9FC87F47F4340C47C7901F6D1FABF118DEE20767A43403A92CB7F483FF1BFF5D6C056097A4340A72215C61682F0BF67F2CD36376A43404F58E2016553E8BF7AC7293A923743404833164D6727B3BF
16	Machakos	Machakos	0103000020E610000001000000B20000007138F3AB39EC4240D23AAA9A20EAE9BFBB0A293FA9EA4240EE08A7052FFAE9BFB05582C5E1E84240BA4E232D95B7E9BFA4C7EF6DFAE3424024D1CB28965BEABF85CE6BEC12E1424005A3923A014DEABF9E077767EDDE4240A01518B2BAD5E8BFEF38454772D94240C9C859D8D30EE9BF08556AF640D742409AEB34D25279E9BFBA83D89942D74240A8C64B378941EABF2A00C63368D44240C898BB96900FEBBF5A9E077767D1424080B74082E2C7EABFDC4B1AA375D042408DD13AAA9A20EBBF1618B2BAD5CB4240F7C77BD5CA84EBBF5709168733CB4240EC2FBB270F0BECBFBD00FBE8D4C9424092B3B0A71DFEEBBF295C8FC2F5C442408C2D04392861ECBF062AE3DF67C442401D554D10751FEDBF020EA14ACDC2424015E3FC4D2844EDBFD99942E735C242402AA913D044D8ECBF4FCC7A3194BF4240F758FAD005F5ECBF05C078060DBD42407E52EDD3F198ECBF693524EEB1BC4240594C6C3EAE0DECBF137EA99F37B942409A25016A6AD9EBBF630B410E4AB842409CF9D51C2098EBBF43CA4FAA7DB642404B02D4D4B2B5EBBF3C31EBC550AE4240DD989EB0C403EBBF8B54185B08AA4240DD989EB0C403EBBFC2340C1F11A74240E71890BDDEFDE9BF2592E86514A74240C6A70018CFA0E9BFAA8251499DA442401F2E39EE940EE9BF2046088F36A242406F2A52616C21E9BFDB6D179AEBA042406F47382D78D1EABFFC1873D7129E4240E42CEC6987BFEABFB01BB62DCA9C4240E4141DC9E53FEBBF87A757CA32A04240F20703CFBD87EBBF4F92AE997CA342402176A6D0798DECBF62F3716DA8A842408F8D40BCAE5FEDBFE8305F5E80A942404BB0389CF9D5EDBFB2683A3B19A84240D95F764F1E16EEBF6519E25817AB42401C9947FE60E0EEBF378E588B4FAD4240DCF4673F5244EEBFEDBB22F8DFAE42405C2041F163CCEEBF0E677E3507AC424077F86BB2463DEFBF00A94D9CDCB342409CBF09850838F0BF8481E7DEC3B542403A5D16139B8FF0BFAEB6627FD9B14240983446EBA8EAF0BFD82AC1E270AE4240F9F719170E84F1BF5D33F9669BAB424039D1AE42CACFF1BFD5CF9B8A54A84240F180B2295778F1BF8A8EE4F21FA642406B82A8FB0024F1BF2ECA6C9049A24240F7065F984C15F1BF96E7C1DD599F4240102384471B47F1BF367689EAAD9D424086200725CC34F1BF8121AB5B3D9B42406A183E22A644F1BF3F355EBA49984240747B4963B48EF1BF0A4B3CA06C964240ED815660C8EAF1BF4030478FDF97424064E94317D437F2BFBA490C022B9742406E5166834CB2F2BF4E7ADFF8DA934240693A3B191C25F3BF9CA73AE46694424076374F75C84DF3BFCFA0A17F829342409CF9D51C2098F3BF650113B8758F424034A2B437F8C2F3BF5726FC523F8F42403BC780ECF5EEF3BF9352D0ED258D42408E588B4F0130F4BF1344DD07208D42401A69A9BC1D61F4BF6F2F698CD6894240C520B0726891F4BF36B05582C589424061376C5B94D9F4BF1EA7E8482E834240083D9B559FABF4BFF8A57EDE5480424001FBE8D495CFF4BF889D29745E7F4240C5C9FD0E4581F4BF8672A25D857C42408CA19C6857A1F4BF9AEB34D2527D4240C5387F130A11F5BF78978BF84E784240FB3A70CE8852F5BF32ACE28DCC73424061376C5B94D9F5BF446E861BF075424028F224E99A49F6BFF853E3A59B784240C6E1CCAFE680F6BFBEC1172653794240CD0182397AFCF6BF5E68AED34877424089247A19C5F2F6BFCBD6FA22A17142408351499D80A6F6BF9CF9D51C2070424024B4E55C8AABF7BF8CB96B09F9704240DEAB5626FCD2F7BF74EACA67797642408CD651D50451F7BF300DC347C47C4240A6B8AAECBBA2F7BF1CD31396787C424084BBB376DB05F8BF7AA52C431C7B42407B884677103BF8BF34D769A4A57A4240B8AF03E78CA8F8BFEBA86A82A87B424047205ED72FD8F8BFE1B4E0455F7D4240CD920035B5ECF8BF1E335019FF7E424064E94317D437F9BFA7E8482EFF8D42409E077767EDB6FBBFEB909BE106904240CAC342AD69DEFBBFA0A696ADF591424005A3923A01CDFBBFBB270F0BB59242405704FF5BC90EFCBF0057B263239442403BAA9A20EA3EFCBF543541D47D9442407AE40F069E7BFCBF75CDE49B6D9A42409CC420B07268FCBF4E621058399C4240AA7D3A1E3350FCBFAC394030479F4240A1D634EF38C5FBBF0473F4F8BDA14240A7E8482EFF21FCBF4F92AE997CA3424083177D056946FCBFF67AF7C77BA54240D218ADA3AA09FCBF3BFC3559A3A64240CC4065FCFB0CFCBFC66D3480B7A44240AE2AFBAE087EFBBF80B74082E2A74240DC9DB5DB2E34FBBF9BC937DBDCA84240C0EC9E3C2C54FBBFE3FC4D2844AC4240325A47551344FBBFC02154A9D9AF4240D50451F70148FBBFDB334B02D4B44240BC79AA436E06FBBF715AF0A2AFB04240D0D03FC1C50AFABF6DA818E76FAE424094A46B26DF6CF9BF895E46B1DCAA4240E960FD9FC3FCF8BFE353008C67AC42400CEA5BE674D9F8BF38DBDC989EB04240895E46B1DC52F8BF5E4BC8073DB34240800EF3E50558F8BF4F0647C9ABB742404CFDBCA94885F8BFB2463D44A3BB42405F984C158C4AF8BF66DAFE9595BE42400EF3E505D847F8BF1F4B1FBAA0C2424061C3D32B6599F8BF1366DAFE95C54240FE7DC68503A1F8BF791EDC9DB5C742406DC5FEB27BF2F8BF98A3C7EF6DCA42407E8CB96B09F9F8BFE3DF675C38CC424052B81E85EBD1F8BFF4F8BD4D7FCE4240309E4143FF04F9BFBF4868CBB9D042407AA52C431C6BF9BFD2E3F736FDD142401361C3D32B65F9BF5166834C32D24240FAB31F2922C3F9BF6362F3716DD44240352905DD5E52FABF1E8A027D22D74240A3923A014D04FABFA4C2D84290D7424046990D32C9C8F9BFAC5626FC52D7424000529B38B95FF9BF12A0A696ADD94240882EA86F9953F9BFF27B9BFEECDB4240959F54FB74BCF9BFD2C6116BF1DD4240130F289B7285F9BFF59CF4BEF1DD4240BEF6CC920035F9BF1CB62DCA6CE0424056BC9179E40FF9BFAB7823F3C8DF4240944DB9C2BBDCF8BF7D5C1B2AC6DD42403EB324404DADF8BF7B4E7ADFF8DA4240FD4D2844C021F8BF543A58FFE7D842400A80F10C1AFAF7BF74D2FBC6D7DA4240C49448A297D1F7BF4BEA043411DE4240AA2B9FE579F0F7BF50C763062AE34240FCFB8C0B07C2F7BF9626A5A0DBE3424064CC5D4BC887F7BFB1169F0260E84240B2683A3B191CF7BF65AA605452E7424016A4198BA6B3F6BFB459F5B9DAE6424072A774B0FE4FF6BFFDA4DAA7E3E14240967840D994ABF5BF8FE4F21FD2DF4240D80DDB1665B6F5BF520ABABDA4DD4240A913D044D870F5BF906B43C538DB4240649291B3B0A7F4BF1361C3D32BD942400473F4F8BD4DF4BF967840D994D74240FF5BC98E8DC0F3BFF4F8BD4D7FD642402AE3DF675CB8F3BF9014916115D34240F085C954C128F3BF3D9B559FABD14240D93D7958A8B5F2BFCF31207BBDCF42405C77F354875CF2BF111956F146CE424068D0D03FC145F2BFBF7D1D3867CC4240D0B359F5B95AF2BF323D618907CC42401CB1169F0260F1BF6DC5FEB27BDE424076E09C11A53DF1BF124E0B5EF4E54240F1D7648D7A08F2BFF0BF95ECD8E84240C45F9335EA21F1BFEE42739D46EA4240A089B0E1E915F1BFD5EC815660EC42402844C02154A9F0BF467C2766BDEC424050E449D23513F0BF55DE8E705AEC42409EB5DB2E34D7EFBF7380608E1EEF4240317C444C8924EFBFB6847CD0B3ED42400AA2EE0390DAEEBFEA78CC4065EC4240AEB6627FD93DEEBF1BD82AC1E2EC4240CF2C095053CBEDBFECDD1FEF55EB4240F12900C63368EDBF6C26DF6C73EB42409D11A5BDC117EDBFE197FA7953E942409CF9D51C2098ECBFD34D621058E94240213CDA38622DECBF43E7357689EA42408B4F01309E41EBBF5D6DC5FEB2EB42403D7E6FD39FFDEABFAA4885B185EC4240A1D634EF3845EABF7138F3AB39EC4240D23AAA9A20EAE9BF
17	Makueni	Makueni	0103000020E610000001000000A40000001CB62DCA6CE0424056BC9179E40FF9BFF59CF4BEF1DD4240BEF6CC920035F9BFD2C6116BF1DD4240130F289B7285F9BFF27B9BFEECDB4240959F54FB74BCF9BF12A0A696ADD94240882EA86F9953F9BFAC5626FC52D7424000529B38B95FF9BFA4C2D84290D7424046990D32C9C8F9BF1E8A027D22D74240A3923A014D04FABF6362F3716DD44240352905DD5E52FABF5166834C32D24240FAB31F2922C3F9BFD2E3F736FDD142401361C3D32B65F9BFBF4868CBB9D042407AA52C431C6BF9BFF4F8BD4D7FCE4240309E4143FF04F9BFE3DF675C38CC424052B81E85EBD1F8BF98A3C7EF6DCA42407E8CB96B09F9F8BF791EDC9DB5C742406DC5FEB27BF2F8BF1366DAFE95C54240FE7DC68503A1F8BF1F4B1FBAA0C2424061C3D32B6599F8BF66DAFE9595BE42400EF3E505D847F8BFB2463D44A3BB42405F984C158C4AF8BF4F0647C9ABB742404CFDBCA94885F8BF5E4BC8073DB34240800EF3E50558F8BF38DBDC989EB04240895E46B1DC52F8BFE353008C67AC42400CEA5BE674D9F8BF895E46B1DCAA4240E960FD9FC3FCF8BF6DA818E76FAE424094A46B26DF6CF9BF715AF0A2AFB04240D0D03FC1C50AFABFDB334B02D4B44240BC79AA436E06FBBFC02154A9D9AF4240D50451F70148FBBFE3FC4D2844AC4240325A47551344FBBF9BC937DBDCA84240C0EC9E3C2C54FBBF80B74082E2A74240DC9DB5DB2E34FBBFC66D3480B7A44240AE2AFBAE087EFBBF3BFC3559A3A64240CC4065FCFB0CFCBFF67AF7C77BA54240D218ADA3AA09FCBF4F92AE997CA3424083177D056946FCBF0473F4F8BDA14240A7E8482EFF21FCBFAC394030479F4240A1D634EF38C5FBBF4E621058399C4240AA7D3A1E3350FCBF75CDE49B6D9A42409CC420B07268FCBF543541D47D9442407AE40F069E7BFCBF6EDDCD531D92424003780B2428FEFCBF60B01BB62D924240FB912232AC62FDBF4D840D4FAF9442406631B1F9B8B6FDBF30478FDFDB9442401C08C90226F0FDBFC11C3D7E6F9342406C21C8410933FEBF44FAEDEBC095424024B4E55C8AABFEBF1D774A07EB97424014E8137992F4FEBF46EBA86A829C4240AC730CC85EEFFEBF9981CAF8F79D424027F73B1405FAFEBF1630815B779F4240A98768740731FFBFC408E1D1C6A1424085CE6BEC1255FFBF65AA605452A34240A4880CAB78A3FFBF6B9A779CA2A34240744694F606DFFFBFFCA9F1D24DA64240CE88D2DEE00B00C027BD6F7CEDAD4240444C89247A1900C0C746205ED7AF424029E8F692C62800C0D28C45D3D9B94240BA2C26361F9700C071E6577380C442402A1DACFF73D800C01FD7868A71C64240A6F27684D30201C00000000000C84240FF5BC98E8D0001C0C7BAB88D06CC42407E18213CDA3801C056D4601A86CF42400E4FAF94654801C0543A58FFE7D442407AFCDEA63F3B01C03D44A33B88D942401B2AC6F99B5001C0ADA3AA09A2DA424050AA7D3A1E7301C0446E861BF0D9424017821C94309301C056D4601A86D742409AB67F65A5C901C051F701486DD6424073BA2C26361F02C0FE60E0B9F7D44240FFB27BF2B05002C0317C444C89D04240D23AAA9A206A02C02FA86F99D3CD4240F3716DA8186702C0DC4B1AA375CC4240B0FECF61BE7C02C07077D66EBBEC424014967840D9D404C0C6A2E9EC64F042402E56D4601A4605C0999EB0C403F24240C1FF56B2636305C0D751D50451F34240587380608E9E05C07DD0B359F5F542403480B74082A205C0B3EA73B515F74240EE77280AF4C905C0AED85F764FF64240CC6262F371ED05C0B3CD8DE909F74240DD5ED218AD2306C063EE5A423EF842402C2B4D4A413706C0E2E47E87A2FC4240029F1F46084F06C0A6D590B8C70E4340FC8C0B0742B205C0DC2E34D76910434049F4328AE59605C08104C58F31134340B8CCE9B2989805C07DAEB6627F154340018750A5668F05C0DEE522BE13174340956588635D9C05C0AFB14B546F214340DA03ADC0901506C0282CF180B225434090A0F831E66E06C0C5FEB27BF2284340984C158C4AAA06C0E2AFC91AF52C4340B8585183691807C062670A9DD7304340637FD93D795807C02A8C2D0439344340079964E42C6C07C0AD6EF59CF436434068AED3484BA507C0AFB14B546F39434049111956F1C607C03480B740823A434097900F7A36EB07C05A2A6F47384143402575029A08DB07C0FC00A436714243400647C9AB73CC07C0546F0D6C954043409D4B7155D9B707C0715AF0A2AF3C434060EAE74D456A07C0D97C5C1B2A3A43400473F4F8BD0D07C09B559FABAD384340156F641EF90307C063D1747632384340B84082E2C7D806C043739D465A36434080B74082E28706C0753C66A032364340EBE2361AC05B06C0EC4CA1F31A374340300DC347C45406C02F6EA301BC3543403659A31EA21106C00D8E9257E7344340707CED99250106C0D235936FB6314340DA38622D3E8505C0CD069964E4304340E4839ECDAA4F05C07B14AE47E12E4340C7BAB88D063005C0A3923A014D2C434087DC0C37E0B304C0C1A8A44E402B434092E86514CBAD04C0B51A12F7582A43407380608E1E7F04C0A29C68572129434000C63368E85F04C01B2FDD24062943403C4ED1915C3E04C0C1CAA145B627434019E76F42210204C0D8648D7A8826434006D847A7AEFC03C054C6BFCFB8244340B5E0455F41DA03C0971C774A07234340A4880CAB786303C063450DA66120434078EE3D5C725C03C06A6AD95A5F1C43401EC4CE143A2F03C0A54929E8F61A4340A1B94E232DD502C07DAEB6627F194340DE1FEF552BD302C000E31934F41743406519E25817B702C0185B087250164340A27F828B15B502C05FEFFE78AF124340C5387F130A9102C0D673D2FBC60F4340ED478AC8B08A02C074B515FBCB0E4340041C42959A7D02C00BB5A679C70D43405019FF3EE34202C05ED72FD80D0B43404417D4B7CC2902C0DB6D179AEB08434026C79DD2C1FA01C01B649291B30843402E73BA2C26B601C04833164D6707434069C6A2E9ECA401C0598B4F01300643407EC68503215901C057B2632310034340DD240681954301C051A5660FB402434058CA32C4B12E01C0E25817B7D1FC4240D200DE02094A01C0087250C24CFB4240FFCF61BEBC4001C084BBB376DBF94240075F984C150C01C0910F7A36ABFA4240C2C073EFE19200C0EE940ED6FFF94240F9BD4D7FF66300C05D6DC5FEB2F7424034A2B437F80200C06614CB2DADF64240A913D044D8F0FFBF3F74417DCBF44240A2EE0390DA44FFBF319413ED2AF4424009E1D1C611EBFEBF7E1D386744F542403A75E5B33C8FFEBFA301BC0512F442400F289B728577FEBFE5B33C0FEEF2424018096D3997E2FDBF85CE6BEC12F1424054E3A59BC4A0FDBFBCAE5FB01BF242407FA4880CAB78FDBF711B0DE02DEC4240D47D00529BB8FCBF1EC4CE143AEB4240F2B0506B9A77FCBF5D16139B8FEB4240B745990D3249FCBF8CDB68006FED424036CD3B4ED111FCBFC251F2EA1CEB4240CC4065FCFB0CFBBFB05582C5E1E842400AA2EE0390DAFABF21C8410933E94240BB7EC16ED8B6FABF2D431CEBE2E642408B6CE7FBA971FABFED9E3C2CD4E642406440F67AF747FABF87A757CA32E442407138F3AB39C0F9BFDFFDF15EB5E24240C11C3D7E6F53F9BF1CB62DCA6CE0424056BC9179E40FF9BF
18	Nyandarua	Nyandarua	0103000020E61000000100000072000000F20C1AFA275442409CF9D51C2098C3BFF90FE9B7AF5342400664AF777FBCC3BFDBA7E33103514240BC5CC47762D6BBBF5C035B25584C4240F8A57EDE54A4BABF2F8672A25D494240CC7A319413EDBABF4182E2C7984742409F8EC70C54C6B7BFBC22F8DF4A46424004E275FD82DDB0BF01DE02098A474240D881734694F6A6BFE6AE25E4834A4240AE122C0E677E95BF1E8A027D2253424033E197FA795391BFE15D2EE23B514240A8A9656B7D91903F8D0B0742B24C4240255D33F9669B6B3F6C09F9A0674B4240CDE9B298D87C9C3F9EEFA7C64B4B4240029F1F46088FA63F7D91D096734942403BFC3559A31EB23F82E2C798BB424240AED3484BE5EDA83FFE481119564142402592E86514CBB53F8104C58F313B4240857CD0B359F5C13FB875374F753842403D0FEECEDA6DB73F6EFAB31F293642403CA06CCA15DEB53F5743E21E4B3342400C1F11532289AE3FAEBB79AA4336424024D6E253008CA73FD4484BE5ED3442402B6A300DC347A43FB98D06F016304240DF4F8D976E12A33F7407B133852E424045F0BF95ECD8A83FC503CAA65C2D42406E8B321B6492B13F57B26323102B42409F71E1404816B03FD595CFF23C2C4240C55565DF15C19F3FCA897615522A4240CBB91457957D973FADDD76A1B926424019FF3EE3C281903F425BCEA5B82242402F6EA301BC0552BFD99942E735224240D39FFD48111996BF3F3A75E5B320424006D847A7AE7C96BF00E31934F41F42401D8F19A88C7FAFBF000000000020424034D769A4A5F2B6BF0F971C774A1F4240309E4143FF04BFBFB2F4A10BEA1B4240BEF6CC920035BDBFEF1B5F7B66194240E6913F1878EEC1BFEDBB22F8DF1A42402ECA6C904946CABF55C1A8A44E1C4240A796ADF54542CBBF419AB1683A1F4240E370E6577380D0BF98512CB7B41A424075ABE7A4F78DD1BFAA2B9FE5791C42406E179AEB34D2D6BF6F1283C0CA1D42401AC05B2041F1D5BF130F289B72214240A14ACD1E6805D6BFA54929E8F6224240BD1DE1B4E045D9BF5AF0A2AF2025424063D174763238D8BFDE9387855A274240E94317D4B7CCD7BF5D6DC5FEB22742401A170E846401D9BF5114E813792A42406B9A779CA223D9BF923F1878EE2D4240CCB4FD2B2B4DD8BFBCCB457C272E42402237C30DF8FCD8BF23F3C81F0C3042407DAEB6627FD9D9BFA3CC0699643042406EFAB31F2922DBBFCB9C2E8B893142409886E123624ADCBFB003E78C28314240A60F5D50DF32DDBF6614CB2DAD324240FB7953910A63DFBF11AAD4EC81324240946A9F8EC70CE0BFC173EFE192334240F3936A9F8EC7E0BF1EDC9DB5DB3242405AF5B9DA8AFDE0BFDD7BB8E4B83342404772F90FE9B7E1BF333333333333424038A110018750E2BFDCBA9BA73A3442406284F068E388E2BF30F5F3A622394240D734EF384547E2BF685C381092394240598B4F01309EE3BFBA1457957D3B4240026553AEF02EE4BFC7F484251E404240D9B11188D7F5E3BF992A1895D4414240D7DD3CD52137E4BF984C158C4A424240A06CCA15DEE5E4BF5BD3BCE3144542400C93A9825149E6BFAE81AD122C424240FAB31F2922C3E6BF39622D3E0544424003B2D7BB3FDEE7BF3B53E8BCC6464240828B15359886EABFC11C3D7E6F4742405760C8EA56CFEABFA03715A930464240F91400E31934EBBF8A592F86724642402332ACE28DCCEBBF132C0E677E4542400057B2632310EDBFFBCBEEC9C3464240713D0AD7A370EDBF6B48DC63E9474240E9F17B9BFEECECBF6536C824234B4240C74B37894160ECBF9BFEEC478A4C4240DCD781734694EBBF486DE2E47E4B42400A850838842AEBBF170E8464014B42405036E50AEF72EABF904E5DF92C4F4240CB10C7BAB88DEABFEE3D5C72DC4D4240D61C2098A3C7E9BF179F02603C534240B9C2BB5CC477E8BFA0A696ADF55542402FFA0AD28C45E8BF793BC269C15742409AEB34D25279E8BF2EAD86C43D5A42409AB1683A3B19E9BFEAE74D452A5C424076374F75C8CDE9BF5C3D27BD6F5C42406CEC12D55B03E9BF9EEA909BE15A424048A7AE7C96E7E6BF75E5B33C0F5A42408D5DA27A6B60E6BF518369183E5A42407B6649809A5AE5BF12F758FAD05942402EE23B31EBC5E4BFAE64C746205A4240033E3F8C101EE4BF89D2DEE00B574240F146E6913F18E3BF17D4B7CCE9564240D847A7AE7C96E2BFA88C7F9F71554240D1747632384AE2BFE2E47E87A25442403E7958A835CDE0BF64CC5D4BC8534240D4601A868F88E0BFBEF6CC9200554240EAEC647094BCDEBFDB166536C85442406440F67AF7C7DDBF3BAA9A20EA5242405396218E7571DDBF5E4BC8073D534240D82AC1E270E6DBBF8109DCBA9B4F4240DDB5847CD0B3D9BF158C4AEA045042406614CB2DAD86D8BF5BB6D617094D42407EE36BCF2C09D8BFCAFD0E45814E4240AAB706B64AB0D6BF9274CDE49B4D4240CD920035B56CD5BFAE122C0E674E4240AA436E861BF0D3BFC1C58A1A4C574240E65C8AABCABEC7BF39D1AE42CA57424086E63A8DB454C6BFF20C1AFA275442409CF9D51C2098C3BF
20	Kirinyaga	Kirinyaga	0103000020E610000001000000320000002046088F36A242406F2A52616C21E9BFAC1C5A643BA34240AF5FB01BB62DE8BFF853E3A59BA842405E85949F54FBE7BF130F289B72A942406C26DF6C7363E8BF15A930B610AC424075029A081B9EE8BFAEF02E17F1AD42405F7B6649809AE8BF5E68AED348B3424046CEC29E76F8E7BF5ABBED4273B5424086AC6EF59CF4E7BF95F1EF332EB842400B98C0ADBB79E7BF4985B18520BB42408FC2F5285C8FE7BFEFE192E34EBD424088855AD3BCE3E6BF1A69A9BC1DBD42402FA86F99D365E5BF6AA4A5F276BC4240527E52EDD3F1E4BF115322895EBE4240412B306475ABE3BF29B3412619BD424038BEF6CC9200E3BFD9942BBCCBBD4240CC9717601F9DE2BF546F0D6C95BC424067D5E76A2BF6E1BF3E7958A835B94240419FC893A46BE1BFC6A70018CFB842404417D4B7CCE9E0BFF3E505D847B742402F34D769A4A5E0BFB51A12F758B6424073BA2C26361FE0BF4BEA043411B64240EB73B515FBCBDEBF98FA795391B64240CAC342AD69DEDDBFBCE82B4833B64240D2C6116BF129DABF8CF337A110B5424078280AF4893CD9BF9604A8A965A74240670FB4024356C3BFFC8C0B07429A424077103B53E8BCDABF04FF5BC98E9942409AB1683A3B19DCBF0A2E56D460964240E0DBF4673F52DCBF4221020EA19642404777103B53E8DEBF465F419AB19442407C444C89247ADFBFE8305F5E809542400B0C59DDEA39E0BF7BBDFBE3BD9242407F6ABC749318E1BF176536C8249342405CC98E8D40BCE1BF115322895E92424059FAD005F52DE2BF3F6F2A52619442408ECC237F30F0E2BF89EAAD81AD964240B936548CF337E3BF020EA14ACD96424090A0F831E6AEE3BFBD8C62B9A595424065DF15C1FF56E4BF92AE997CB39542400074982F2FC0E4BFF3716DA818974240B324404D2D5BE5BF9357E718909942402063EE5A423EE5BF890CAB78239B42402D3E05C07806E6BF780B24287E9C4240C47762D68BA1E5BFAE9E93DE379E4240AC90F2936A9FE5BF7ADFF8DA339F4240FB05BB61DBA2E6BFF1D7648D7AA04240DA38622D3E05E7BF4B766C04E2A14240EB73B515FBCBE7BF7FC16ED8B6A042401D03B2D7BB3FE8BF2046088F36A242406F2A52616C21E9BF
21	Murang'a	Murang'a	0103000020E61000000100000055000000BD8C62B9A595424065DF15C1FF56E4BF2C4833164D8F4240F6EE8FF7AA95E4BF309E4143FF8C42402CBCCB457C27E4BFCEC7B5A162884240D4601A868F88E3BFE0A128D027864240F2EF332E1C08E3BF4833164D67834240925CFE43FAEDE2BFD9EBDD1FEF81424084F068E388B5E2BFAC730CC85E7F424004ADC090D5ADE2BF82A8FB00A47E4240D6390664AF77E2BF183E22A644764240BEA4315A4755E3BFBD3AC780EC7542400118CFA0A17FE3BFCBF8F719176E424084640113B875E3BF5D33F9669B674240EE77280AF489E2BFA6F27684D3664240008C67D0D03FE2BFEB56CF49EF634240DC4603780B24E2BF27BD6F7CED5D42408B71FE261422E2BFC7681D554D5C4240B3CD8DE9094BE2BF74EACA67795A4240139B8F6B43C5E2BF423EE8D9AC5A4240B1A206D3307CE3BFAE64C746205A4240033E3F8C101EE4BF12F758FAD05942402EE23B31EBC5E4BF518369183E5A42407B6649809A5AE5BF75E5B33C0F5A42408D5DA27A6B60E6BF9EEA909BE15A424048A7AE7C96E7E6BF5C3D27BD6F5C42406CEC12D55B03E9BFEAE74D452A5C424076374F75C8CDE9BF282CF180B25D4240AA9A20EA3E00EABF5C3810920560424087F9F202ECA3EABF8A7615527E624240529B38B9DFA1EABF975643E21E6742407CED9925016AEBBFC47C7901F66D42406C26DF6C7363ECBF4CA60A46257142407EA99F3715A9ECBF11363CBD52724240967840D9942BEDBF2BFBAE08FE73424033E197FA7953EDBF46425BCEA5744240E3A59BC420B0EDBF9BFEEC478A784240FBCBEEC9C342EEBFA4880CAB787B42404963B48EAA26EFBF53E8BCC62E7D4240CE8DE9094B3CEFBFACA8C1340C7F4240F59CF4BEF1B5EFBF09336DFFCA8242401FF46C567D2EF0BF645DDC460384424076FD82DDB06DF0BF2F6EA301BC854240802BD9B11188F0BF6AFB57569A884240BA6B09F9A067F0BFFB5C6DC5FE8A424043C5387F138AF0BFE86A2BF6978D4240349D9D0C8E92F0BF257A19C5728F424033F9669B1BD3F0BF1B81785DBF90424049111956F1C6F0BFCFA0A17F82934240CD3B4ED191DCF0BF4A5E9D6340964240D925AAB706B6F0BFE5D53906649B42402176A6D0798DF0BFA1A17F828B9D424007EBFF1CE64BF0BF48BF7D1D389F4240BA83D8994267F0BF282CF180B2A142404C7155D97745F0BFEACF7EA488A442405A12A0A696ADF0BF84F068E388A942405CC98E8D403CF1BF08E6E8F17BAB4240D4D4B2B5BE48F1BFEAB298D87CAC42404EEE77280A74F1BFD82AC1E270AE4240F9F719170E84F1BFAEB6627FD9B14240983446EBA8EAF0BF8481E7DEC3B542403A5D16139B8FF0BF00A94D9CDCB342409CBF09850838F0BF0E677E3507AC424077F86BB2463DEFBFEDBB22F8DFAE42405C2041F163CCEEBF378E588B4FAD4240DCF4673F5244EEBF6519E25817AB42401C9947FE60E0EEBFB2683A3B19A84240D95F764F1E16EEBFE8305F5E80A942404BB0389CF9D5EDBF62F3716DA8A842408F8D40BCAE5FEDBF4F92AE997CA342402176A6D0798DECBF87A757CA32A04240F20703CFBD87EBBFB01BB62DCA9C4240E4141DC9E53FEBBFFC1873D7129E4240E42CEC6987BFEABFDB6D179AEBA042406F47382D78D1EABF2046088F36A242406F2A52616C21E9BF7FC16ED8B6A042401D03B2D7BB3FE8BF4B766C04E2A14240EB73B515FBCBE7BFF1D7648D7AA04240DA38622D3E05E7BF7ADFF8DA339F4240FB05BB61DBA2E6BFAE9E93DE379E4240AC90F2936A9FE5BF780B24287E9C4240C47762D68BA1E5BF890CAB78239B42402D3E05C07806E6BF9357E718909942402063EE5A423EE5BFF3716DA818974240B324404D2D5BE5BF92AE997CB39542400074982F2FC0E4BFBD8C62B9A595424065DF15C1FF56E4BF
22	Kiambu	Kiambu	0103000020E61000000100000067000000FBCBEEC9C3464240713D0AD7A370EDBF67614F3BFC494240CD751A69A9BCEDBFBEA4315A47494240D7868A71FE26EEBF5E6397A8DE4A4240D61C2098A3C7EEBF5E6397A8DE4A42408386FE092E56EFBF0EDB1665364C4240B22E6EA301BCEFBF105839B4C84A42402F8B89CDC7B5F0BFE59B6D6E4C4B4240168733BF9A03F1BFCD3B4ED19148424039B4C876BE9FF1BF93C6681D55454240D578E9263108F2BF7172BF4351444240E6E8F17B9B7EF2BF5A8121AB5B41424047382D78D1D7F3BF8A7615527E3E4240D31396784059F4BF4E452A8C2D5442408D5DA27A6BE0F4BF1B12F758FA5442405EF415A4190BF5BF48A7AE7C96574240711B0DE02D90F4BF5C035B2558584240BFB7E9CF7E24F4BF32C9C859D85B4240026553AEF02EF4BF6FBBD05CA75D42406D904946CEC2F3BF2C4833164D5F4240F853E3A59BC4F3BF062AE3DF6760424029AE2AFBAE88F3BFACA8C1340C634240AF777FBC57ADF3BF70CE88D2DE644240747B4963B40EF3BFA089B0E1E9694240670FB4024356F3BFA4C2D842906B42402F51BD35B055F3BF0FD1E80E626F4240551344DD0720F3BFA661F888987242403815A930B610F3BF6FD39FFD48714240FE43FAEDEBC0F2BF3B191C25AF724240FE0E45813E91F2BF68226C787A754240F12E17F19D98F2BF32ACE28DCC774240923F1878EEBDF2BFF20703CFBD7742401F11532289DEF2BF63450DA66174424021020EA14A4DF3BF60E5D022DB75424079CC4065FC7BF3BFAF5A99F04B794240C58F31772DA1F3BF8FE4F21FD27B4240613255302AA9F3BFADC090D5AD7E42409E29745E6397F3BF4D4A41B7978042407D3F355EBAC9F3BF1A51DA1B7C8542407A36AB3E575BF3BF1D03B2D7BB874240986E1283C04AF3BFAE47E17A148A4240CB9C2E8B89CDF3BF9352D0ED258D42408E588B4F0130F4BF5726FC523F8F42403BC780ECF5EEF3BF650113B8758F424034A2B437F8C2F3BFCFA0A17F829342409CF9D51C2098F3BF9CA73AE46694424076374F75C84DF3BF4E7ADFF8DA934240693A3B191C25F3BFBA490C022B9742406E5166834CB2F2BF4030478FDF97424064E94317D437F2BF0A4B3CA06C964240ED815660C8EAF1BF3F355EBA49984240747B4963B48EF1BF8121AB5B3D9B42406A183E22A644F1BF367689EAAD9D424086200725CC34F1BF96E7C1DD599F4240102384471B47F1BF2ECA6C9049A24240F7065F984C15F1BF8A8EE4F21FA642406B82A8FB0024F1BFD5CF9B8A54A84240F180B2295778F1BF5D33F9669BAB424039D1AE42CACFF1BFD82AC1E270AE4240F9F719170E84F1BFEAB298D87CAC42404EEE77280A74F1BF08E6E8F17BAB4240D4D4B2B5BE48F1BF84F068E388A942405CC98E8D403CF1BFEACF7EA488A442405A12A0A696ADF0BF282CF180B2A142404C7155D97745F0BF48BF7D1D389F4240BA83D8994267F0BFA1A17F828B9D424007EBFF1CE64BF0BFE5D53906649B42402176A6D0798DF0BF4A5E9D6340964240D925AAB706B6F0BFCFA0A17F82934240CD3B4ED191DCF0BF1B81785DBF90424049111956F1C6F0BF257A19C5728F424033F9669B1BD3F0BFE86A2BF6978D4240349D9D0C8E92F0BFFB5C6DC5FE8A424043C5387F138AF0BF6AFB57569A884240BA6B09F9A067F0BF2F6EA301BC854240802BD9B11188F0BF645DDC460384424076FD82DDB06DF0BF09336DFFCA8242401FF46C567D2EF0BFACA8C1340C7F4240F59CF4BEF1B5EFBF53E8BCC62E7D4240CE8DE9094B3CEFBFA4880CAB787B42404963B48EAA26EFBF9BFEEC478A784240FBCBEEC9C342EEBF46425BCEA5744240E3A59BC420B0EDBF2BFBAE08FE73424033E197FA7953EDBF11363CBD52724240967840D9942BEDBF4CA60A46257142407EA99F3715A9ECBFC47C7901F66D42406C26DF6C7363ECBF975643E21E6742407CED9925016AEBBF8A7615527E624240529B38B9DFA1EABF5C3810920560424087F9F202ECA3EABF282CF180B25D4240AA9A20EA3E00EABFEAE74D452A5C424076374F75C8CDE9BF2EAD86C43D5A42409AB1683A3B19E9BF793BC269C15742409AEB34D25279E8BFA0A696ADF55542402FFA0AD28C45E8BF179F02603C534240B9C2BB5CC477E8BFEE3D5C72DC4D4240D61C2098A3C7E9BF904E5DF92C4F4240CB10C7BAB88DEABF170E8464014B42405036E50AEF72EABF486DE2E47E4B42400A850838842AEBBF9BFEEC478A4C4240DCD781734694EBBF6536C824234B4240C74B37894160ECBF6B48DC63E9474240E9F17B9BFEECECBFFBCBEEC9C3464240713D0AD7A370EDBF
23	Turkana	Turkana	0103000020E6100000010000004A010000DF6C73637A064240DE1FEF552BD311409487855AD3F8414053E8BCC62E311240C0EC9E3C2CF84140BC5CC47762561240933A014D84F94140884B8E3BA583124024B9FC87F4E74140E140481630211340D5CA845FEAE74140FCFB8C0B0762144033E197FA79EB41408D45D3D9C9801440757632384AEE41408D976E1283A01440E6E8F17B9BEE4140EDD808C4EBBA1440BEA4315A47ED414039454772F9CF14404F3BFC3559EB41409CA73AE466D814403D49BA66F2E941409CBF098508F81440C30DF8FC30EA414097A8DE1AD80A1540F224E99AC9EB41404AD235936F161540514EB4AB90EE4140F9669B1BD3331540E84D452A8CED4140F67F0EF3E54515409B728577B9E84140CA897615525E154029ED0DBE30E54140367689EAAD6115402315C61682E4414044696FF085691540115322895EE24140BA6B09F9A06715400DE02D90A0E041402176A6D0796D1540DC9DB5DB2EE04140CBDB114E0B7E1540CEAACFD556DC41401F4B1FBAA07E1540C1C58A1A4CDB414090662C9ACE8E15401AA3755435D941407155D977459015402098A3C7EFD541400B410E4A988915406688635DDCD24140200C3CF71E8E154094C151F2EAD04140486DE2E47E871540917EFB3A70CE4140912749D74C9E1540545227A089CC4140D3C1FA3F87991540172B6A300DCB41407C61325530AA1540EBA86A82A8C741401B4CC3F011B1154020EF552B13BE41402BFBAE08FEB7154061A6ED5F59A54140F0164850FCB81540BEBC00FBE898414041D47D00521B1540AD174339D12E4140E6913F18784E12402592E86514FF40404F5DF92CCFE310408AC8B08A370641404A46CEC29EB61040C616821C94084140A8E33103959110403480B74082064140240B98C0AD7B1040F94ECC7A310841401D554D10755F1040E6913F18780A4140BBF2599E07571040642310AFEB0B4140F5A10BEA5B461040C898BB96900B41408351499D802610405D50DF32A7074140224F92AE991C104080D4264EEE0741400B410E4A9809104051F701486D0A4140A4C2D842900310406F8104C58F0D4140A9D903ADC0D00F40697407B1331141405396218E75B10F404FCC7A31940F4140697407B133450F4050C24CDBBF0E41403D0FEECEDA2D0F40240B98C0AD0B4140BD8C62B9A5150F40888043A8520B4140A3409FC893E40E40718FA50F5D1041407CB8E4B853FA0E4036C82423671541409FABADD85FF60E40AD2F12DA72164140991249F4320A0F40B3295778971B4140764F1E166A0D0F40376C5B94D91C41403A5D16139BCF0E40376C5B94D91C41401349F4328AA50E402C7DE882FA16414048BF7D1D38A70E403F912749D714414096CFF23CB87B0E403D0FEECEDA154140F3599E0777670E40D55B035B251841400586AC6EF55C0E40DC114E0B5E1841401557957D57440E404B3CA06CCA1541404F92AE997C330E40F5B9DA8AFD154140A3586E6935240E4078978BF84E1C41402DB29DEFA7460E400FEECEDA6D1F4140D97C5C1B2A460E406E179AEB342241409817601F9DFA0D4008AC1C5A6427414034BF9A0304B30D40A18499B67F29414052448655BCD10D405322895E462D4140FDC1C073EFE10D403108AC1C5A304140B858518369D80D4025CCB4FD2B334140D8B628B341A60D40AB048BC3993341404209336DFF8A0D40FC6F253B363A4140EE258DD13A6A0D4090882991443B414041D47D00525B0D403541D47D003A4140F701486DE2E40C40BC79AA436E3A4140A818E76F42A10C405969520ABA3941408351499D80260C4091ED7C3F35364140ADA3AA09A2EE0B40E02D90A0F8314140ABECBB22F8DF0B407E3A1E33503541405DA79196CA9B0B40CBD6FA22A135414063D1747632780B40018750A5663341406F47382D78510B40F3E505D8473341400D6C956071F80A401EF98381E73641400118CFA0A1BF0A40E89FE06245394140A14ACD1E68450A40AEBB79AA433A414009FEB7921D9B094034A2B437F83A4140A228D027F26409406F1283C0CA3D41406F47382D78510940F302ECA3533F41408B89CDC7B52109406FD8B628B34141402FA3586E69350940EECEDA6D17464140B1DCD26A481C094024D1CB28964741404833164D67E7084021EA3E00A94941402506819543CB0840925CFE43FA494140904E5DF92C8F0840CB845FEAE7494140E4BD6A65C22F0840E59B6D6E4C4B41407F130A1170080840DDCD531D724B4140D09B8A5418DB074006D847A7AE4C41409B38B9DFA1680740446E861BF05141406D904946CE420740419FC893A4534140A99F3715A9F00640CD751A69A9584140F3E505D847E70640672783A3E45941402ECA6C9049060740B324404D2D5B41402384471B47EC06402EE7525C555E41404850FC1873D706408E1EBFB7E95F4140EC866D8B329B0640AE64C746206241406AFB57569A940640957D5704FF634140DAFE95952625064023A12DE7526441406F0D6C9560F10540ACFF73982F634140F792C6681D9505404C6C3EAE0D6541400D54C6BFCF780540FC6F253B36664140C9E53FA4DF3E0540AEBB79AA436A414049A297512CF70440BE13B35E0C6D41407AA52C431CAB04407B6B60AB046F4140C5387F130A9104409CA73AE46670414069E388B5F89404401B0DE02D90704140D6C56D3480B70440666B7D91D07241404DD6A88768B40440062FFA0AD2744140FCA9F1D24D2204401EE1B4E045774140E04A766C04220440B6A1629CBF7941400A11700855AA034054A9D903AD78414014799274CDA40340BF4351A04F7C4140923F1878EE7D034077F86BB2468141404356B77A4E3A0340F792C6681D814140670A9DD7D86503403411363CBD8241409CA73AE466780340274EEE7728824140715AF0A2AFA00340C8D2872EA87F4140CC4065FCFBCC0340FF78AF5A99804140FE0E45813E11044077DB85E63A814140E605D847A76E0440271422E0108241405F984C158C8A0440D68BA19C6883414032E6AE25E4830440DC4603780B84414007D3307C444C0440617138F3AB854140DFA63FFB91220440715AF0A2AF884140890CAB7823B30340728A8EE4F28B4140DC63E94317D4034069C6A2E9EC8C41402B1895D409E80340E7C6F484258E41400A9DD7D8252A044093E34EE9608D41408CA19C6857610440E09C11A5BD8D414005172B6A308D04409E245D33F98E414087FE092E56D40440632827DA559041400708E6E8F1FB044086E63A8DB4904140D40E7F4DD628054094D920938C9441401DACFF73982F0540EE5F59695296414047205ED72F180540E1B4E0455F994140CE1951DA1BBC0440335019FF3E9B4140D5CA845FEA670440D4F19881CA9C414077F86BB2463D04402A6F47382D9C4140A5F78DAF3DF303400D897B2C7D9C414018601F9DBAB20340D93D7958A89D41406440F67AF78703407845F0BF959C4140CE88D2DEE04B0340757632384A9E4140BABDA4315A070340D235936FB69D4140E59B6D6E4CCF024061E0B9F770A14140F3E505D847A70240DB85E63A8DA4414036C8242367610240C2120F289BA64140A3E9EC6470140240A8E3310395A941401366DAFE955501405D16139B8FAB4140AB2688BA0F0001403B70CE88D2AE4140274EEE77284A00402BFBAE08FEAF4140ABECBB22F8DFFF3F5DA79196CAAF41404C8E3BA58375FF3FEACF7EA488B04140D07EA4880C2BFF3FD0D03FC1C5AE4140EC12D55B03DBFE3FC6F99B5088B84140FE65F7E461A1FD3F331B649291BB41408C84B69C4B71FD3F392861A6EDBB4140ABECBB22F8DFFC3FB1E1E995B2C04140666666666666FC3FC5C9FD0E45C14140F0DC7BB8E438FC3FCC457C2766C5414088D7F50B7643FC3FB7D100DE02C941408B1A4CC3F011FC3F7250C24CDBCB4140287E8CB96B09FC3FD39FFD4811CD414053CBD6FA2221FC3FA5660FB402CF4140B2632310AFEBFB3F1500E31934D041406B65C22FF5F3FB3FC7D79E5912D441405778978BF8CEFB3F0BD28C45D3D54140865AD3BCE394FB3F680586AC6ED94140FAF202ECA353FB3FEAE74D452ADC41408E06F0164850FB3F06D847A7AEE0414038A1100187D0FA3F9FABADD85FE241408AC8B08A37B2FA3F7632384A5EE54140598B4F01309EFA3F718FA50F5D0C424084D89942E7B5F23FF5673F5244164240EB1C03B2D7BBF23FD4601A868F2842409CA73AE466B8EF3F0F45813E912B4240B9A5D590B8C7EF3FD4F19881CA2C424079758E01D9EBEE3F89981249F42E42409F5912A0A696EE3F0612143FC6304240CB10C7BAB88DEE3F8BC3995FCD3142409981CAF8F719EE3FEE08A7052F3242402D78D1579066ED3FAFCE31207B354240977329AE2AFBED3FE622BE13B33A4240DB8AFD65F7E4EF3F639CBF09853842401DACFF7398AFF03F7FFB3A70CE38424018096D3997E2F03F556AF6402B38424026AAB706B64AF13F556AF6402B3842406F2A52616CA1F13F62A1D634EF384240718FA50F5DD0F13F81ECF5EE8F374240650113B87537F23F649291B3B03742401D774A07EB7FF23FAA8251499D3842406A300DC347C4F23F1366DAFE95354240EA78CC4065FCF23F9E5E29CB10334240BABDA4315AC7F23F0B0C59DDEA3142400612143FC6DCF23FDE8E705AF03242403B014D840D4FF33F75CDE49B6D324240F7AFAC342985F33F9981CAF8F735424044696FF085C9F33FEFACDD76A1314240E4141DC9E53FF43FAA9A20EA3E344240492EFF21FD76F43F3B014D840D3742402C9ACE4E0647F43FF7E461A1D638424042959A3DD00AF43F59349D9D0C3A4240FCDEA63FFB11F43F6FD8B628B3394240EAB298D87C5CF43F72BF4351A0374240556AF6402BB0F43FFAF202ECA33342401FA2D11DC4CEF43F9F5912A0A6324240E8D9ACFA5CEDF43FB6DB2E34D7354240F1D7648D7A88F53FF9DA334B02384240184339D1AEC2F53F2DB29DEFA73A42406666666666E6F53F5648F949B53B4240FF092E56D460F63F2EAD86C43D3A4240C9AB730CC85EF63FDB8AFD65F7384240D5E76A2BF697F63FECA353573E374240006F8104C58FF63F145CACA8C134424038328FFCC1C0F63F19390B7BDA3142403BFC3559A31EF73F0B24287E8C2D4240D2A92B9FE5F9F63F5C77F354872C424085EB51B81E05F73FEFE192E34E2942403FC6DCB5847CF73F29AE2AFBAE244240143FC6DCB584F73F60764F1E16264240AA7D3A1E33D0F73F9274CDE49B2542409C8A54185B08F83F7CD5CA845F264240226C787AA5ACF83F6E8B321B642A4240C21726530523F93FD26F5F07CE2D4240A7E8482EFF21F93FD26F5F07CE2D42400FD1E80E6267F93F156F641EF92F42404260E5D0225BF93FD734EF38452F4240F8DF4A766C04F93F083D9B559F2F4240A31EA2D11DC4F83F30D80DDB163142405665DF15C17FF83F4A46CEC29E32424050C763062A63F83FF8FC304278344240EE08A7052FFAF83F73BA2C2636374240273108AC1C5AF93FFAD005F52D374240FE0E45813E91F93F226C787AA53842404E97C5C4E6E3F93F1E8A027D223B4240478FDFDBF4E7F93FC0098508383C4240D044D8F0F44AFA3FF9BD4D7FF63B424054C6BFCFB870FA3FBE13B35E0C3D42405890662C9ACEFA3F3CBD5296213E4240938C9C853DEDFA3F040473F4F83D4240C9E53FA4DF3EFB3F2BA4FCA4DA3F4240B2852007254CFB3FA297512CB74042403333333333B3FB3F7CD5CA845F424240EC12D55B03DBFB3FF3C81F0C3C434240878A71FE2614FC3FE6913F1878424240A31EA2D11D44FC3FBB0A293FA94242403A5D16139B8FFC3F39B4C876BE43424024624A24D1CBFC3F52448655BC414240AE81AD122C0EFD3FD769A4A5F24242407B832F4CA68AFD3F616C21C84141424038328FFCC1C0FD3FA1A17F828B4142406E8B321B6412FE3F6AC18BBE82444240A81DFE9AAC51FE3F29965B5A0D454240FA0AD28C45D3FE3FFF04172B6A444240984C158C4A6AFF3F84D89942E7454240AD69DE718A0E00404B02D4D4B24542400708E6E8F13B004038F8C264AA484240F8FC3042787400400EF8FC30424842407E52EDD3F1D80040EE42739D464A42402367614F3BFC004090DAC4C9FD4A42408195438B6C270140F5D6C056094E4240CC4065FCFB4C01408CDB68006F514240E4839ECDAA4F01406B82A8FB0054424033DC80CF0F63014016359886E1574240C6C4E6E3DA900140C45A7C0A80594240DA8F1491619501405AF5B9DA8A594240B22E6EA301BC0140A54929E8F65A4240F0A7C64B37C90140B398D87C5C5B42404DA1F31ABB0402401F115322895A42404EB4AB90F21302408672A25D855C42406C95607138330240E2E47E87A25C4240F19D98F562680240221ADD41EC4C42401ADD41EC4CE10240293FA9F6E94C4240AD6EF59CF43E034064E94317D44B4240EBFF1CE6CB4B0340C898BB969047424021C84109332D0340613255302A454240EAEC6470943C0340E6965643E24242407B4E7ADFF89A0340DD0720B5894342404165FCFB8CCB03406475ABE7A44342407689EAAD812D04405E9D6340F6424240F6402B306435044076374F75C84142402A5778978B780440C251F2EA1C3F424047205ED72F980440B8AF03E78C3C4240205ED72FD8CD0440E0675C38103A4240C1FF56B263E30440B9196EC0E7374240E10B93A982110540B3D2A41474374240B532E197FA390540F2CD3637A6374240AEB6627FD97D05409B3DD00A0C3942408FA50F5D509F0540890CAB78233742409FABADD85FB6054012BD8C62B9354240111956F146E60540CC6262F37135424046088F368E180640AC8BDB6800334240BA2C26361F5706405C3810920530424005A8A9656BBD06409964E42CEC2D4240FB05BB61DBE206406397A8DE1A2C4240D7868A71FEE6064059349D9D0C264240EFFE78AF5A1907402A8C2D043924424057CF49EF1B1F074098DD938785224240E4141DC9E53F0740E96514CB2D2142407E52EDD3F1980740B6679604A81942401904560E2DB207408DEE2076A618424075C8CD7003BE0740F0332E1C08154240B2BAD573D2BB07401B2FDD2406114240FE2B2B4D4AC107405682C5E1CC0F4240B6847CD0B3D90740861BF0F96110424047C9AB730C0808405AF5B9DA8A1142403B70CE88D21E0840C347C49448124240C286A757CA72084060764F1E16124240BD18CA89769508401D8F19A88C134240D482177D05A90840AC5626FC5213424027BD6F7CED1909406EA301BC051242407B14AE47E13A09400803CFBD87134240DB5031CEDF840940F92CCF83BB134240D6C56D3480B70940D174763238124240B08F4E5DF9AC09401AA37554350942404E9CDCEF50D409406D3997E2AA0642409430D3F6AFEC0940E657738060064240B532E197FA391040DF6C73637A064240DE1FEF552BD31140
24	West Pokot	West Pokot	0103000020E610000001000000810000007632384A5EE54140598B4F01309EFA3F9FABADD85FE241408AC8B08A37B2FA3F06D847A7AEE0414038A1100187D0FA3FEAE74D452ADC41408E06F0164850FB3F680586AC6ED94140FAF202ECA353FB3F0BD28C45D3D54140865AD3BCE394FB3FC7D79E5912D441405778978BF8CEFB3F1500E31934D041406B65C22FF5F3FB3FA5660FB402CF4140B2632310AFEBFB3FD39FFD4811CD414053CBD6FA2221FC3F7250C24CDBCB4140287E8CB96B09FC3FB7D100DE02C941408B1A4CC3F011FC3FCC457C2766C5414088D7F50B7643FC3FC5C9FD0E45C14140F0DC7BB8E438FC3FB1E1E995B2C04140666666666666FC3F392861A6EDBB4140ABECBB22F8DFFC3F331B649291BB41408C84B69C4B71FD3FC6F99B5088B84140FE65F7E461A1FD3FD0D03FC1C5AE4140EC12D55B03DBFE3FEACF7EA488B04140D07EA4880C2BFF3F5DA79196CAAF41404C8E3BA58375FF3F2BFBAE08FEAF4140ABECBB22F8DFFF3F3B70CE88D2AE4140274EEE77284A00405D16139B8FAB4140AB2688BA0F000140A8E3310395A941401366DAFE95550140C2120F289BA64140A3E9EC6470140240DB85E63A8DA4414036C824236761024061E0B9F770A14140F3E505D847A70240D235936FB69D4140E59B6D6E4CCF0240757632384A9E4140BABDA4315A0703407845F0BF959C4140CE88D2DEE04B0340D93D7958A89D41406440F67AF78703400D897B2C7D9C414018601F9DBAB203402A6F47382D9C4140A5F78DAF3DF30340D4F19881CA9C414077F86BB2463D0440335019FF3E9B4140D5CA845FEA670440E1B4E0455F994140CE1951DA1BBC0440EE5F59695296414047205ED72F18054094D920938C9441401DACFF73982F054086E63A8DB4904140D40E7F4DD6280540632827DA559041400708E6E8F1FB04409E245D33F98E414087FE092E56D40440E09C11A5BD8D414005172B6A308D044093E34EE9608D41408CA19C6857610440E7C6F484258E41400A9DD7D8252A044069C6A2E9EC8C41402B1895D409E80340728A8EE4F28B4140DC63E94317D40340715AF0A2AF884140890CAB7823B30340617138F3AB854140DFA63FFB91220440DC4603780B84414007D3307C444C0440D68BA19C6883414032E6AE25E4830440271422E0108241405F984C158C8A044077DB85E63A814140E605D847A76E0440FF78AF5A99804140FE0E45813E110440C8D2872EA87F4140CC4065FCFBCC0340274EEE7728824140715AF0A2AFA003403411363CBD8241409CA73AE466780340F792C6681D814140670A9DD7D865034077F86BB2468141404356B77A4E3A0340BF4351A04F7C4140923F1878EE7D034054A9D903AD78414014799274CDA403405F0CE544BB764140DF32A7CB62A203405726FC523F73414014B35E0CE584034094FB1D8A0271414061376C5B945903408672A25D857041401EDC9DB5DB2E0340F92CCF83BB7341401C42959A3D900240DD0720B5897741400708E6E8F1FB0140F90FE9B7AF7B41401FBFB7E9CF7E0140302AA913D07C414092AE997CB34D0140C2172653057F4140AE9E93DE37BE00408FC2F5285C7B4140FCE3BD6A65820040B6DB2E34D77D41405A0D897B2CFDFF3FD9EBDD1FEF7D414038DBDC989EB0FF3F014D840D4F83414061E0B9F770C9FE3FCEFC6A0E108041404417D4B7CC69FD3FD82AC1E2707E4140BE9F1A2FDDA4FA3F6AFB57569A78414063D174763238F93FDDEA39E97D73414066F7E461A1D6F83F04E275FD827141404D672783A3E4F83F718FA50F5D704140D7C056091687F83F43E73576896E4140CC7A3194136DF83FD95F764F1E6E4140CE8DE9094B3CF83F609335EA216E4140AA656B7D9150F73FD690B8C7D26B41408C67D0D03F41F73F7C0A80F10C664140751F80D426CEF63F1B12F758FA644140AFB14B546F8DF63F49D74CBED9664140D6A887687407F63F84F068E388654140BD1DE1B4E0C5F53F359886E1236A4140977329AE2AFBF43F83177D05696A4140022B8716D94EF43FF7E978CC40694140331B64929133F43F3FE3C28190744140075F984C158CF43F80F10C1AFA734140639CBF098508F43FB18A37328F784140C251F2EA1C03F43FB8585183697C4140713D0AD7A3F0F33F2CD49AE61D7F4140C8073D9B551FF43FA1A17F828B814140535C55F65D11F43F10069E7B0F834140E544BB0A29BFF33F5227A089B0854140A7B393C15172F33F8D976E12838441408907944DB942F33FDDD26A48DC874140A88C7F9F71E1F23FA8E3310395894140A7052FFA0AD2F23FD0B87020248B4140573ECBF3E0EEF23FE5D022DBF98E4140FC6F253B3602F33F96438B6CE78F4140C68A1A4CC3F0F23FEC34D2527993414038DBDC989E30F33F361FD7868AA941403EE8D9ACFADCF13FB610E4A084AD4140B0389CF9D51CF23F21CD58349DC54140C780ECF5EE8FF43F040473F4F8C941407FC16ED8B6A8F43F9A779CA223CD4140B9AAECBB2278F43F12F758FAD0D141407D96E7C1DDD9F43F5F5E807D74D64140AE81AD122C0EF53F5BD3BCE314D94140268DD13AAA1AF53F3D27BD6F7CD94140CC5D4BC8073DF53F8733BF9A03D84140DEC83CF20783F53FF8DF4A766CD841404E7FF62345E4F53F43AD69DE71DA4140B0C91AF5108DF63F4390831266DA4140D8D825AAB706F73F315F5E807DDC41408386FE092E56F73F15C616821CDC4140349D9D0C8E92F73FD1E80E6267DE41406DC5FEB27BF2F73F9A779CA223E1414075029A081B1EF83F107A36AB3EE34140FFCA4A9352D0F83FB1A206D330E4414014D044D8F0F4F83F938C9C853DE54140DEC83CF20703FA3F9D4B7155D9E34140336DFFCA4A13FA3FD6C56D3480E341400AA2EE03905AFA3F7632384A5EE54140598B4F01309EFA3F
25	Samburu	Samburu	0103000020E610000001000000E5000000309E4143FFF84240145CACA8C134F43F367689EAADF9424037C30DF8FC30F63F3E22A64412ED42409C6D6E4C4F58F73F16DEE522BEEB42401FA2D11DC4CEF63F1B81785DBFE84240302AA913D0C4F63F3255302AA9E342400FD6FF39CC97F63F64AF777FBCDF4240CC9717601F9DF63F696FF085C9DC4240E8305F5E807DF63F573ECBF3E0DA42408733BF9A0384F63F641EF98381D74240359886E12362F63FED815660C8D2424017F19D98F562F63FD47D00529BD04240C0E78711C223F63FA7E8482EFFCD4240E14048163001F63F7FC16ED8B6CC4240C79DD2C1FA3FF63F43AD69DE71CA424014D044D8F0F4F53FBADA8AFD65C742401092054CE056F63F32207BBDFBBF4240F7C77BD5CA04F83F40A4DFBE0EBC424058FFE7305FDEF83F3F3A75E5B3B84240A06CCA15DE65F93F70CE88D2DEAC4240E4DA5031CEDFFB3F417DCB9C2EA742403A92CB7F483FFC3FEEEBC03923A24240B459F5B9DA0AFE3FFAD51C20989F42407D224F92AE19FE3F68B3EA73B59D42402C4833164D67FE3FFCFB8C0B079A4240B81E85EB51B8FE3FF27B9BFEEC974240645DDC4603F8FE3FADA3AA09A29642408716D9CEF753FF3F9031772D21934240753C66A0327EFF3F9DBAF2599E8B424023F3C81F0CBCFF3F8CBE8234638542402AE3DF675CB8FF3FCDAFE600C1804240868F882991C4FF3FBD6F7CED99794240A56B26DF6C3300404963B48EAA764240876D8B321B240040F7E978CC4075424040FB9122322C0040E0F3C308E1754240F6B4C35F9375004046B6F3FDD474424077F35487DCCC00408C2D0439287542406FF085C9540101403A7AFCDEA6734240040473F4F83D0140F4A62215C6724240EEEBC039238A0140179AEB34D26E424080B74082E2070240CEC29E76F86B4240DFFDF15EB53202400D71AC8BDB604240A930B610E420044081CF0F23845B4240C408E1D1C6110440B62DCA6C90594240B79C4B7155190440925CFE43FA594240C408E1D1C6D1034077BE9F1A2F5942401895D40968A2034040F67AF7C7574240EC51B81E85AB034084D89942E7554240C7681D554D900340D97745F0BF5142405E11FC6F253B0340224F92AE995042401FBAA0BE654E0340AC1C5A643B4F4240FBE8D495CF320340293FA9F6E94C4240AD6EF59CF43E0340221ADD41EC4C42401ADD41EC4CE10240E2E47E87A25C4240F19D98F5626802408672A25D855C42406C956071383302401F115322895A42404EB4AB90F2130240B398D87C5C5B42404DA1F31ABB040240A54929E8F65A4240F0A7C64B37C901405AF5B9DA8A594240B22E6EA301BC0140C45A7C0A80594240DA8F14916195014016359886E1574240C6C4E6E3DA9001406B82A8FB0054424033DC80CF0F6301408CDB68006F514240E4839ECDAA4F0140F5D6C056094E4240CC4065FCFB4C014090DAC4C9FD4A42408195438B6C270140EE42739D464A42402367614F3BFC00400EF8FC30424842407E52EDD3F1D8004038F8C264AA484240F8FC3042787400404B02D4D4B24542400708E6E8F13B004084D89942E7454240AD69DE718A0E0040FF04172B6A444240984C158C4A6AFF3F29965B5A0D454240FA0AD28C45D3FE3F6AC18BBE82444240A81DFE9AAC51FE3FA1A17F828B4142406E8B321B6412FE3F616C21C84141424038328FFCC1C0FD3FD769A4A5F24242407B832F4CA68AFD3F52448655BC414240AE81AD122C0EFD3F39B4C876BE43424024624A24D1CBFC3FBB0A293FA94242403A5D16139B8FFC3FE6913F1878424240A31EA2D11D44FC3FF3C81F0C3C434240878A71FE2614FC3F7CD5CA845F424240EC12D55B03DBFB3FA297512CB74042403333333333B3FB3F2BA4FCA4DA3F4240B2852007254CFB3F040473F4F83D4240C9E53FA4DF3EFB3F3CBD5296213E4240938C9C853DEDFA3FBE13B35E0C3D42405890662C9ACEFA3FF9BD4D7FF63B424054C6BFCFB870FA3FC0098508383C4240D044D8F0F44AFA3F1E8A027D223B4240478FDFDBF4E7F93F226C787AA53842404E97C5C4E6E3F93FFAD005F52D374240FE0E45813E91F93F73BA2C2636374240273108AC1C5AF93FF8FC304278344240EE08A7052FFAF83F4A46CEC29E32424050C763062A63F83F30D80DDB163142405665DF15C17FF83F083D9B559F2F4240A31EA2D11DC4F83FD734EF38452F4240F8DF4A766C04F93F156F641EF92F42404260E5D0225BF93FD26F5F07CE2D42400FD1E80E6267F93FD26F5F07CE2D4240A7E8482EFF21F93F6E8B321B642A4240C21726530523F93F7CD5CA845F264240226C787AA5ACF83F9274CDE49B2542409C8A54185B08F83F60764F1E16264240AA7D3A1E33D0F73F29AE2AFBAE244240143FC6DCB584F73FEFE192E34E2942403FC6DCB5847CF73F5C77F354872C424085EB51B81E05F73F0B24287E8C2D4240D2A92B9FE5F9F63F19390B7BDA3142403BFC3559A31EF73F145CACA8C134424038328FFCC1C0F63FECA353573E374240006F8104C58FF63FDB8AFD65F7384240D5E76A2BF697F63F2EAD86C43D3A4240C9AB730CC85EF63F5648F949B53B4240FF092E56D460F63F2DB29DEFA73A42406666666666E6F53FF9DA334B02384240184339D1AEC2F53FB6DB2E34D7354240F1D7648D7A88F53F9F5912A0A6324240E8D9ACFA5CEDF43FFAF202ECA33342401FA2D11DC4CEF43F72BF4351A0374240556AF6402BB0F43F6FD8B628B3394240EAB298D87C5CF43F59349D9D0C3A4240FCDEA63FFB11F43FF7E461A1D638424042959A3DD00AF43F3B014D840D3742402C9ACE4E0647F43FAA9A20EA3E344240492EFF21FD76F43FEFACDD76A1314240E4141DC9E53FF43F9981CAF8F735424044696FF085C9F33F75CDE49B6D324240F7AFAC342985F33FDE8E705AF03242403B014D840D4FF33F0B0C59DDEA3142400612143FC6DCF23F9E5E29CB10334240BABDA4315AC7F23F1366DAFE95354240EA78CC4065FCF23FAA8251499D3842406A300DC347C4F23F649291B3B03742401D774A07EB7FF23F81ECF5EE8F374240650113B87537F23F62A1D634EF384240718FA50F5DD0F13F556AF6402B3842406F2A52616CA1F13F556AF6402B38424026AAB706B64AF13F7FFB3A70CE38424018096D3997E2F03F639CBF09853842401DACFF7398AFF03FE622BE13B33A4240DB8AFD65F7E4EF3FAFCE31207B354240977329AE2AFBED3FEE08A7052F3242402D78D1579066ED3F641EF983813342407077D66EBBD0EC3F377172BF433542403480B74082E2EC3FB4B0A71DFE3642400DC347C49448EC3F44A852B3073A424021B0726891EDEB3F587380608E3E4240F0164850FC18EB3FB6A1629CBF3D4240D578E9263108EA3F282CF180B2554240F44F70B1A206EA3F6440F67AF75742409B38B9DFA128EA3F6614CB2DAD5A42403A75E5B33C0FEA3F3C8386FE095E4240F4893C49BA66EA3F46990D32C9604240645DDC460378EB3F0B24287E8C6542408A8EE4F21FD2EB3F312592E865684240DDD26A48DC63EB3FF4C308E1D16A4240630B410E4A98E93FB6679604A86D424075CDE49B6D6EE83F5F46B1DCD26E4240ED9E3C2CD49AE73F4DBED9E6C670424066BD18CA8976E73FBB61DBA2CC724240AAB706B64AB0E73F9548A2975174424015C616821C94E73F107A36AB3E7742407C2766BD18CAE73FD6390664AF7B4240E42CEC6987BFE73FA3CC0699648042405305A3923A01E83F0CB08F4E5D894240FBE8D495CFF2E83FB77F65A5498D4240DDCD531D7233E93F404D2D5BEB8F4240A06CCA15DEE5E83FF67AF7C77B9142405AD8D30E7F4DE83F164D6727839342405AD8D30E7F4DE83F92CB7F48BF95424087A757CA32C4E73FEEB1F4A10B9A424072FE261422E0E73F878A71FE269C4240EF552B137EA9E73FCF31207BBD9F42403D0FEECEDA6DE83FE9D495CFF2A04240C8D2872EA86FE83F3BC780ECF5A24240758E01D9EBDDE73F772D211FF4A442406AFB57569A94E73FCAFD0E4581A642409DBAF2599E07E73F151DC9E53FA84240D00A0C59DDEAE53F8481E7DEC3A942404FAF94658863E53FA67EDE54A4AA4240314278B471C4E43F39B4C876BEAB424052F2EA1C03B2E43F77A1B94E23AD4240D23AAA9A20EAE33F4CFDBCA948AD42402063EE5A423EE33F18096D3997AE4240BEBC00FBE8D4E23FE0F3C308E1B14240BC22F8DF4A76E23F9E077767EDB64240F085C954C1A8E23F5A2A6F4738B9424018265305A392E23FACFF73982FBB4240327216F6B4C3E23F9F5912A0A6BE42405DA79196CADBE23F176536C824BF4240CC6262F3716DE23F0E4A9869FBC34240809A5AB6D617E23F6FD8B628B3C54240224F92AE997CE23F088F368E58C742401283C0CAA145E23F910F7A36ABCA4240689604A8A965E23F2D78D15790CA42405D50DF32A7CBE23F99F04BFDBCCD42401630815B77F3E23F2CD49AE61DCF4240FDA4DAA7E331E33F45D8F0F44AD1424037C30DF8FC30E33FD95A5F24B4D14240E4DA5031CEDFE33FE622BE13B3D24240E466B8019F1FE43F8C67D0D03FD542405001309E4143E43F062AE3DF67D842409CBF09850838E53F904946CEC2DA424044A852B3075AE53FE17A14AE47DD4240355EBA490C02E53F7AC7293A92DF42406CB2463D44A3E53FBEF6CC9200E142404BCD1E680586E53F7B88467710E342406E693524EEB1E53FF775E09C11E5424051BD35B05582E53F3480B74082EA42407120240B98C0E53F15C616821CEC42406FD39FFD4811E63FF180B22957EC4240A2EE0390DAC4E63FC2FA3F87F9EE4240C53D963E7441E73F6A1327F73BF04240E353008C67D0E73F12BD8C62B9F14240DC2E34D769A4E73F77D66EBBD0F44240B875374F75C8E63FC02154A9D9F74240C9AB730CC85EE73FB83B6BB75DF84240DC2E34D769A4E73FCDE49B6D6EFC42401B2AC6F99B50E83F8A7615527EFE42403A4030478FDFE83F8B37328FFC014340541D7233DC80E93F603C8386FE054340431CEBE2361AE93FD80DDB166506434043E7357689EAE83FD1CB28965B0A4340E12879758E01E93FD21DC4CE1406434035D252793BC2E93F4EB4AB90F2034340944DB9C2BB5CF13F0CB08F4E5DF94240EB56CF49EF1BF33F309E4143FFF84240145CACA8C134F43F
26	Trans-Nzoia	Trans-Nzoia	0103000020E6100000010000004B000000F7E978CC40694140331B64929133F43FFFCF61BEBC6841409E7B0F971CF7F33F44A33B889D654140C269C18BBE82F33F2CD49AE61D6341409DBAF2599E87F33F7CED9925015A4140C32ADEC83C72F33FA1DB4B1AA35541405E807D74EA4AF33FDC63E9431754414014E8137992F4F23F5F24B4E55C4E4140CE88D2DEE08BF23FBC3FDEAB564A41400FB9196EC067F23FED9925016A4E4140E1B4E0455FC1F13FE9F17B9BFE504140DFF8DA334B82F13F62BEBC00FB5441404850FC187357F13F5D50DF32A75341409014916115EFF03F159161156F544140B9FC87F4DBD7F03F696FF085C9584140AED3484BE5EDEF3F8A93FB1D8A5E4140753C66A032FEED3FCA6C90494662414089247A19C572ED3F3FA9F6E9786441407C9BFEEC478AED3F8AE59656436641407E350708E6E8EC3F2332ACE28D644140FC00A4367172EC3FFB22A12DE76641404E452A8C2D04EB3F4F5DF92CCF674140C1ADBB79AA43EA3FF3599E0777674140B0FECF61BEBCE93FBA66F2CD366F4140419FC893A46BEA3F86032159C07441406FD39FFD4811EB3FB37BF2B0507741400EF3E505D847EB3FCD1E6805867841404BB0389CF9D5EB3F4F92AE997C7B4140176536C82423EC3FF5673F5244824140F4893C49BA66EC3F82A8FB00A4864140A835CD3B4ED1EC3F7715527E52894140BCAE5FB01BB6EC3FE5D022DBF98A41404963B48EAA26EC3F0CE544BB0A8D41401CF0F96184F0EB3F75931804568E41404833164D6727EC3FB41F2922C38E41402B8716D9CEF7EC3FF86BB2463D90414076A6D0798D5DED3F9981CAF8F795414009E1D1C6116BED3F48FE60E0B9974140CC4065FCFB8CED3F55DE8E705A9C4140863DEDF0D764ED3FAA60545227A041403255302AA913EE3F8A3C49BA66A24140F931E6AE25E4ED3FA9D903ADC0A441408C2D04392861ED3FF35487DC0CA74140E8305F5E807DEC3F43FF04172BAA414073D712F241CFED3F3F1D8F19A8AC41401F680586AC6EED3F8B54185B08AE41408048BF7D1D38EE3FD5E76A2BF6AB4140D4D4B2B5BE48EE3F7A36AB3E57AB4140E0D6DD3CD521EF3F4D327216F6AC414052B81E85EB51EF3F24287E8CB9AB414047ACC5A70018F03F446E861BF0AD41406CB2463D4423F03F7CED992501AE4140CF2C0950534BF03F94BC3AC780A84140639CBF098588F03F25E99AC937A3414048FE60E0B9F7F03F1E5036E50A9F4140C5E6E3DA5031F13FB22E6EA3019C4140B30C71AC8BDBF13F350708E6E8994140FF092E56D4E0F13F08556AF6409741400A117008556AF23F94BC3AC78094414050C763062AE3F23FEC34D2527993414038DBDC989E30F33F96438B6CE78F4140C68A1A4CC3F0F23FE5D022DBF98E4140FC6F253B3602F33FD0B87020248B4140573ECBF3E0EEF23FA8E3310395894140A7052FFA0AD2F23FDDD26A48DC874140A88C7F9F71E1F23F8D976E12838441408907944DB942F33F5227A089B0854140A7B393C15172F33F10069E7B0F834140E544BB0A29BFF33FA1A17F828B814140535C55F65D11F43F2CD49AE61D7F4140C8073D9B551FF43FB8585183697C4140713D0AD7A3F0F33FB18A37328F784140C251F2EA1C03F43F80F10C1AFA734140639CBF098508F43F3FE3C28190744140075F984C158CF43FF7E978CC40694140331B64929133F43F
27	Uasin-Gishu	Uasin-Gishu	0103000020E610000001000000630000008B54185B08AE41408048BF7D1D38EE3F3F1D8F19A8AC41401F680586AC6EED3F43FF04172BAA414073D712F241CFED3FF35487DC0CA74140E8305F5E807DEC3FA9D903ADC0A441408C2D04392861ED3F8A3C49BA66A24140F931E6AE25E4ED3FAA60545227A041403255302AA913EE3F55DE8E705A9C4140863DEDF0D764ED3F48FE60E0B9974140CC4065FCFB8CED3F9981CAF8F795414009E1D1C6116BED3FF86BB2463D90414076A6D0798D5DED3FB41F2922C38E41402B8716D9CEF7EC3F75931804568E41404833164D6727EC3F910A630B418E4140F0A2AF20CD58EB3F5DE15D2EE28F414095D40968226CEA3F2D95B7239C9241401878EE3D5C72EA3F65DF15C1FF924140B85851836918E83F8143A852B393414095607138F3ABE73FC173EFE192934140734BAB21718FE53FB56CAD2F12924140693A3B191C25E53FF7CC9200358D4140C16ED8B628B3E43F6DE7FBA9F18A414085B185200725E43FF0164850FC88414059A31EA2D11DE43FDAC9E02879854140CE70033E3F8CE43F88D7F50B76834140BFB7E9CF7EA4E33FDD7BB8E4B87F41402861A6ED5F59E43F0C0742B2807D41401F2E39EE940EE43FFA7E6ABC747B4140E14048163081E33F9487855AD378414024287E8CB96BE33FE0F3C308E175414000A94D9CDCEFE23F111E6D1CB1724140B1BFEC9E3C2CE33FF7E461A1D66C41404A46CEC29E76E13FA1F831E6AE8541406475ABE7A4F7E13F548CF337A18C41407138F3AB3940E13F4B1FBAA0BE8D41409609BFD4CF9BE13FE0D6DD3CD5914140069E7B0F971CE13FB9533A58FF9341402783A3E4D539E13FFF21FDF675944140FC1D8A027D22E03FE7FBA9F1D29141408E588B4F0130DE3F8BFD65F7E4954140B51A12F758FADA3F0A68226C789641406BB75D68AED3DA3F7077D66EBB9841404243FF04172BD83F7120240B989C4140117008556AF6D43FB43C0FEECEA64140261E5036E50ACB3FEC51B81E85AB4140ACC5A70018CFC83FCFBD874B8EAB4140A3923A014D84C53FD7868A71FEAA4140E23B31EBC550C23FF3599E0777AF4140EF1B5F7B6649C03FC520B07268B1414050FC1873D712BA3FF90FE9B7AFB34140F888981249F4BA3FEBA86A82A8B74140A2D11DC4CE149A3F488AC8B08ABB4140C4B12E6EA3019C3F9ACE4E0647BD4140691D554D10758F3F761A69A9BCC14140DFE00B93A982813FA52C431CEBC24140AC394030478F8F3F567DAEB662C34140410E4A9869FBA73F0586AC6EF5C44140032670EB6E9EAA3F6FD8B628B3C541408750A5660FB4B23F614F3BFC35C541401557957D5704B73F378E588B4FC94140D47D00529B38B13F0CEA5BE674C941400A850838842ABD3FC85EEFFE78CB4140BF4868CBB914C33F5E2EE23B31CB41401904560E2DB2C53F7D0569C6A2C9414060AB048BC399C73F09E1D1C611C741403BAA9A20EA3EC83FE8305F5E80C1414044A33B889D29C83FB324404D2DC3414070253B3602F1CA3F704221020EC541403737A6272CF1CC3F6C43C5387FC3414089D2DEE00B93CD3F168733BF9ABF4140187D0569C6A2CD3F4A07EBFF1CBE4140E63FA4DFBE0ED03F1D774A07EBBF4140E09C11A5BDC1D13F79CC4065FCBF41400FD6FF39CC97D33F336DFFCA4ABF41408C4AEA043411D43FACADD85F76BF414053AEF02E17F1D53FF645425BCEBD414032384A5E9D63D63F87F9F202ECBB414038328FFCC1C0D73F3D7E6FD39FBD4140C425C79DD2C1D83F855FEAE74DBD41406BF12900C633DA3FAC5626FC52BB41406CCF2C095053DB3F5E9D6340F6BA4140091B9E5E29CBDC3F41D47D0052BB41407311DF89592FE03F05A8A9656BBD414045F0BF95ECD8E23FB1E1E995B2B441408EAF3DB32440E63F87E123624AB44140F697DD938785E63F2AC6F99B50C041405C3D27BD6F7CE63F2C7DE882FABE4140AB2688BA0F40E73F5C72DC291DC041407FD93D7958A8E83F5D50DF32A7BF414074417DCB9C2EEA3FE8305F5E80BD4140B5A679C7293AEA3F1EDC9DB5DBBE4140D8648D7A8846EB3F2EE7525C55BE4140BB61DBA2CC06EC3F6E3480B740BA4140740CC85EEFFEEB3FABB2EF8AE0BB414027C286A757CAEC3F450DA661F8B44140F2EF332E1C08ED3F1349F4328AB5414039EE940ED6FFED3F5322895E46B14140191C25AFCE31EE3F63450DA661B041401F80D4264EEEED3F8B54185B08AE41408048BF7D1D38EE3F
28	Elgeyo-Marakwet	Elgeyo-Marakwet	0103000020E6100000010000006E0000005E2EE23B31CB41401904560E2DB2C53FB7973446EBD841405019FF3EE3C2C53F315F5E807DD8414015E3FC4D2844C83F63EE5A423EDC4140E0D6DD3CD521CB3F47E6913F18DC414099F5622827DACD3F5FEFFE78AFDA41400FD1E80E6267D03F569A94826EDB4140DC4B1AA37554D33F65A54929E8DA41409F3C2CD49AE6D33F55A4C2D842DC4140126BF12900C6D53F4ED1915CFEDB4140CC457C2766BDD63F1A51DA1B7CD54140B2463D44A33BD83FD656EC2FBBD341407C444C89247AD93F8D976E1283D441402B6A300DC347DA3FBA313D6189D341407008556AF640DB3F111E6D1CB1D241404B766C04E275DD3FA930B610E4D04140C5AC174339D1DE3F38328FFCC1D041403A75E5B33C0FE03F66834C3272CE41404278B471C45AE03F6891ED7C3FCD4140AA9A20EA3E00E13F29965B5A0DCD414054008C67D0D0E13F98DD938785CE41400C1F11532289E23FE010AAD4ECCD414066834C327216E33FC6F99B5088CC4140BB44F5D6C056E33FA3CC069964CC4140BA313D618907E43F925CFE43FACD4140CBBE2B82FFADE43F8CA19C6857CD41404DD6A8876874E53FF3599E0777CF41405839B4C876BEE53FBE4D7FF623D14140AB5B3D27BD6FE63FF88DAF3DB3D041401F85EB51B81EE73F65C746205ECF41407FD93D7958A8E73FA9C1340C1FD141403AE97DE36BCFE83FA9DE1AD82AD14140573ECBF3E0EEE93F43FF04172BD24140715AF0A2AF20EA3F2159C0046ED141402A8C2D043928EB3F15A930B610D041407A36AB3E575BEB3F80608E1EBFCF4140C6DCB5847CD0EB3FCE1951DA1BD041400647C9AB730CED3F2FC03E3A75D141408C2D04392861ED3F3815A930B6D041400BEF7211DF89EE3FCB67791EDCD14140003ACC971760EF3F3E22A64412D141403E7958A835CDEF3F518369183ED24140876D8B321B64F03F62DBA2CC06D541407BDAE1AFC99AF03F03ECA35357D64140BD3AC780ECF5F03F26016A6AD9D641402310AFEB176CF13F9ACE4E0647D941405EA27A6B60ABF13F984C158C4ADA414076E09C11A53DF23FA7052FFA0ADA4140747B4963B40EF33F3E7958A835D941402D431CEBE236F33FDA03ADC090D9414067F2CD363726F43F29D027F224D94140A323B9FC8774F43F5BD3BCE314D94140268DD13AAA1AF53F5F5E807D74D64140AE81AD122C0EF53F12F758FAD0D141407D96E7C1DDD9F43F9A779CA223CD4140B9AAECBB2278F43F040473F4F8C941407FC16ED8B6A8F43F21CD58349DC54140C780ECF5EE8FF43FB610E4A084AD4140B0389CF9D51CF23F361FD7868AA941403EE8D9ACFADCF13FEC34D2527993414038DBDC989E30F33F94BC3AC78094414050C763062AE3F23F08556AF6409741400A117008556AF23F350708E6E8994140FF092E56D4E0F13FB22E6EA3019C4140B30C71AC8BDBF13F1E5036E50A9F4140C5E6E3DA5031F13F25E99AC937A3414048FE60E0B9F7F03F94BC3AC780A84140639CBF098588F03F7CED992501AE4140CF2C0950534BF03F446E861BF0AD41406CB2463D4423F03F24287E8CB9AB414047ACC5A70018F03F4D327216F6AC414052B81E85EB51EF3F7A36AB3E57AB4140E0D6DD3CD521EF3FD5E76A2BF6AB4140D4D4B2B5BE48EE3F8B54185B08AE41408048BF7D1D38EE3F63450DA661B041401F80D4264EEEED3F5322895E46B14140191C25AFCE31EE3F1349F4328AB5414039EE940ED6FFED3F450DA661F8B44140F2EF332E1C08ED3FABB2EF8AE0BB414027C286A757CAEC3F6E3480B740BA4140740CC85EEFFEEB3F2EE7525C55BE4140BB61DBA2CC06EC3F1EDC9DB5DBBE4140D8648D7A8846EB3FE8305F5E80BD4140B5A679C7293AEA3F5D50DF32A7BF414074417DCB9C2EEA3F5C72DC291DC041407FD93D7958A8E83F2C7DE882FABE4140AB2688BA0F40E73F2AC6F99B50C041405C3D27BD6F7CE63F87E123624AB44140F697DD938785E63FB1E1E995B2B441408EAF3DB32440E63F05A8A9656BBD414045F0BF95ECD8E23F41D47D0052BB41407311DF89592FE03F5E9D6340F6BA4140091B9E5E29CBDC3FAC5626FC52BB41406CCF2C095053DB3F855FEAE74DBD41406BF12900C633DA3F3D7E6FD39FBD4140C425C79DD2C1D83F87F9F202ECBB414038328FFCC1C0D73FF645425BCEBD414032384A5E9D63D63FACADD85F76BF414053AEF02E17F1D53F336DFFCA4ABF41408C4AEA043411D43F79CC4065FCBF41400FD6FF39CC97D33F1D774A07EBBF4140E09C11A5BDC1D13F4A07EBFF1CBE4140E63FA4DFBE0ED03F168733BF9ABF4140187D0569C6A2CD3F6C43C5387FC3414089D2DEE00B93CD3F704221020EC541403737A6272CF1CC3FB324404D2DC3414070253B3602F1CA3FE8305F5E80C1414044A33B889D29C83F09E1D1C611C741403BAA9A20EA3EC83F7D0569C6A2C9414060AB048BC399C73F5E2EE23B31CB41401904560E2DB2C53F
29	Nandi	Nandi	0103000020E61000000100000053000000F7E461A1D66C41404A46CEC29E76E13F1A170E84647141409D8026C286A7E03F47ACC5A70074414069E388B5F814E03F0E677E35077441407B6B60AB048BDF3FEE08A7052F764140A2B437F8C264DE3F7CD5CA845F7A41401DE6CB0BB08FDA3F92B3B0A71D7A4140D3D9C9E02879D73FC5AC17433979414024B4E55C8AABD63F4F232D95B7774140ECFA05BB61DBD63FB1506B9A7778414034A2B437F8C2D43F6F8104C58F794140BEF6CC920035D33FC6E1CCAFE67C41409D8026C286A7CF3F2063EE5A427A4140D0B359F5B9DACE3FFF3EE3C2817841400118CFA0A17FCA3F581CCEFC6A764140C959D8D30E7FC93F938C9C853D75414096438B6CE7FBC53F21C8410933754140821C9430D3F6C33FC58F31772D714140D2FBC6D79E59C23FAE0D15E3FC6D41400490DAC4C9FDBE3F27DA5548F96D41401D5A643BDF4FB53F23BE13B35E6C4140D6E253008C67B03F57091687336B4140336DFFCA4A93A23F40D9942BBC6741405917B7D100DEA23F793BC269C16341406D904946CEC27E3F92B3B0A71D6241400DA661F88898623F2A745E6397604140946A9F8EC70C843F3411363CBD5E4140D313967840D9743F4FE960FD9F5F4140179AEB34D25299BF842A357BA06141401A51DA1B7C6192BFDD989EB0C46341407715527E52ED93BF50FC1873D7664140014D840D4FAF843FF7C77BD5CA6841402C9FE5797077963F58E20165536A4140247F30F0DC7B983FA60F5D50DF664140705F07CE19518ABF166A4DF38E674140889D29745E6397BFA774B0FECF694140A7E8482EFF219DBFA089B0E1E9754140C0B2D2A414749BBFA054FB743C764140B9A5D590B8C7A2BF0F0BB5A6797B4140CE70033E3F8CA0BF7BA01518B27E4140CC0BB08F4E5D99BF7940D9942B844140D218ADA3AA09A2BF6666666666864140EC34D252793BA2BF312592E865884140D027F224E99AB1BFC45A7C0A808941408E06F0164850ACBFD656EC2FBB8B41402849D74CBED9A6BF85CE6BEC128D4140FE7DC685032199BFB728B341268D4140732EC55565DF75BF83177D05699241402EFF21FDF675A0BF5587DC0C37944140E388B5F81400A3BF910F7A36AB9641408121AB5B3D279DBFE674594C6C9A41402575029A081B9EBF9548A297519C41403C4ED1915CFEA3BF5B99F04BFD9C4140BB44F5D6C056B1BF5B99F04BFD9C41409C16BCE82B48BBBFC02154A9D9A34140C8D2872EA86FB9BFAC90F2936AA741404D4A41B79734B6BF419FC893A4AB41400C0742B28009BCBFEB6E9EEA90AF4140C8CD70033E3FBCBF7A8D5DA27AB3414086E63A8DB454B6BF83C0CAA145B641404D158C4AEA04B4BF72DC291DACB3414002B7EEE6A90E99BFD4484BE5EDB44140C22FF5F3A622753FB9533A58FFB741407B884677103B933FEBA86A82A8B74140A2D11DC4CE149A3FF90FE9B7AFB34140F888981249F4BA3FC520B07268B1414050FC1873D712BA3FF3599E0777AF4140EF1B5F7B6649C03FD7868A71FEAA4140E23B31EBC550C23FCFBD874B8EAB4140A3923A014D84C53FEC51B81E85AB4140ACC5A70018CFC83FB43C0FEECEA64140261E5036E50ACB3F7120240B989C4140117008556AF6D43F7077D66EBB9841404243FF04172BD83F0A68226C789641406BB75D68AED3DA3F8BFD65F7E4954140B51A12F758FADA3FE7FBA9F1D29141408E588B4F0130DE3FFF21FDF675944140FC1D8A027D22E03FB9533A58FF9341402783A3E4D539E13FE0D6DD3CD5914140069E7B0F971CE13F4B1FBAA0BE8D41409609BFD4CF9BE13F548CF337A18C41407138F3AB3940E13FA1F831E6AE8541406475ABE7A4F7E13FF7E461A1D66C41404A46CEC29E76E13F
30	Baringo	Baringo	0103000020E610000001000000940000007632384A5EE54140598B4F01309EFA3FD6C56D3480E341400AA2EE03905AFA3F9D4B7155D9E34140336DFFCA4A13FA3F938C9C853DE54140DEC83CF20703FA3FB1A206D330E4414014D044D8F0F4F83F107A36AB3EE34140FFCA4A9352D0F83F9A779CA223E1414075029A081B1EF83FD1E80E6267DE41406DC5FEB27BF2F73F15C616821CDC4140349D9D0C8E92F73F315F5E807DDC41408386FE092E56F73F4390831266DA4140D8D825AAB706F73F43AD69DE71DA4140B0C91AF5108DF63FF8DF4A766CD841404E7FF62345E4F53F8733BF9A03D84140DEC83CF20783F53F3D27BD6F7CD94140CC5D4BC8073DF53F5BD3BCE314D94140268DD13AAA1AF53F29D027F224D94140A323B9FC8774F43FDA03ADC090D9414067F2CD363726F43F3E7958A835D941402D431CEBE236F33FA7052FFA0ADA4140747B4963B40EF33F984C158C4ADA414076E09C11A53DF23F9ACE4E0647D941405EA27A6B60ABF13F26016A6AD9D641402310AFEB176CF13F03ECA35357D64140BD3AC780ECF5F03F62DBA2CC06D541407BDAE1AFC99AF03F518369183ED24140876D8B321B64F03F3E22A64412D141403E7958A835CDEF3FCB67791EDCD14140003ACC971760EF3F3815A930B6D041400BEF7211DF89EE3F2FC03E3A75D141408C2D04392861ED3FCE1951DA1BD041400647C9AB730CED3F80608E1EBFCF4140C6DCB5847CD0EB3F15A930B610D041407A36AB3E575BEB3F2159C0046ED141402A8C2D043928EB3F43FF04172BD24140715AF0A2AF20EA3FA9DE1AD82AD14140573ECBF3E0EEE93FA9C1340C1FD141403AE97DE36BCFE83F65C746205ECF41407FD93D7958A8E73FF88DAF3DB3D041401F85EB51B81EE73FBE4D7FF623D14140AB5B3D27BD6FE63FF3599E0777CF41405839B4C876BEE53F8CA19C6857CD41404DD6A8876874E53F925CFE43FACD4140CBBE2B82FFADE43FA3CC069964CC4140BA313D618907E43FC6F99B5088CC4140BB44F5D6C056E33FE010AAD4ECCD414066834C327216E33F98DD938785CE41400C1F11532289E23F29965B5A0DCD414054008C67D0D0E13F6891ED7C3FCD4140AA9A20EA3E00E13F66834C3272CE41404278B471C45AE03F38328FFCC1D041403A75E5B33C0FE03FA930B610E4D04140C5AC174339D1DE3F111E6D1CB1D241404B766C04E275DD3FBA313D6189D341407008556AF640DB3F8D976E1283D441402B6A300DC347DA3FD656EC2FBBD341407C444C89247AD93F1A51DA1B7CD54140B2463D44A33BD83F4ED1915CFEDB4140CC457C2766BDD63F55A4C2D842DC4140126BF12900C6D53F65A54929E8DA41409F3C2CD49AE6D33F569A94826EDB4140DC4B1AA37554D33F5FEFFE78AFDA41400FD1E80E6267D03F47E6913F18DC414099F5622827DACD3F63EE5A423EDC4140E0D6DD3CD521CB3F315F5E807DD8414015E3FC4D2844C83FB7973446EBD841405019FF3EE3C2C53F5E2EE23B31CB41401904560E2DB2C53FC85EEFFE78CB4140BF4868CBB914C33F0CEA5BE674C941400A850838842ABD3F378E588B4FC94140D47D00529B38B13F614F3BFC35C541401557957D5704B73F6FD8B628B3C541408750A5660FB4B23F0586AC6EF5C44140032670EB6E9EAA3F567DAEB662C34140410E4A9869FBA73FA52C431CEBC24140AC394030478F8F3F6F8104C58FC5414076FD82DDB06D81BF587380608ECA4140C11C3D7E6FD37FBFE7A90EB919CE41406DE2E47E87A2A0BF70EB6E9EEAD041405D6DC5FEB27BA2BF6744696FF0D14140650113B87537AFBFE527D53E1DD3414034A2B437F8C2B4BF5AF5B9DA8AD54140D7FA22A12DE7B2BF15E3FC4D28D841406EDDCD531D72B3BF86AC6EF59CD841406EA301BC0512BCBF7CB8E4B853DA414021C84109336DBFBF1ADD41EC4CDD4140C269C18BBE82C4BF0D6C956071DC414065FCFB8C0B07C6BFE960FD9FC3DC414090882991442FCBBF4434BA83D8DD4140295C8FC2F528CCBF76FD82DDB0E14140B745990D32C9CCBFC02154A9D9E3414000A94D9CDCEFC8BF26E4839ECDE241400586AC6EF59CC8BFE92B483316E5414090F7AA9509BFC4BFF758FAD005E5414087A2409FC893BCBFF38E537424E741408F19A88C7F9FB9BFB0AC342905E94140643BDF4F8D97BEBF8750A5660FF04140DF89592F8672A2BF4356B77A4EF24140359886E12362AABF4243FF0417F341409E29745E6397A8BF8C84B69C4BF541404DBED9E6C6F4B4BFA835CD3B4EF94140B7D100DE0209AABFC74B378941FC4140B9A5D590B8C782BF0CC85EEFFEFC4140795DBF60376C8B3F020EA14ACDF6414078EE3D5C72DCB13F4E452A8C2DF84140397F130A1170B83F7B832F4CA6FA41406649809A5AB6B63F7311DF8959FB41404221020EA14AAD3FB3EF8AE07FFF41403A3B191C25AFAE3F31D3F6AFAC004240378E588B4F01A03FE2E995B20C0542407FD93D7958A8953F66834C327206424094DE37BEF6CC723F9626A5A0DB0B424057957D5704FF8BBFC32ADEC83C0E42406FD39FFD4811793F1AFA27B8580D4240691D554D1075AF3FB9C7D2872E1042404B1FBAA0BE65AE3F1344DD07201142408369183E22A6BC3FA04FE449D2114240B97020240B98C03F3B70CE88D2124240DBDC989EB0C4C73F5A0D897B2C194240A852B3075A81C93FBEBC00FBE8184240A4C7EF6DFAB3CB3FADDD76A1B9164240419AB1683A3BCD3F4B598638D619424045F5D6C05609CE3FC87BD5CA841B4240317C444C8924D03F2BD9B11188174240C91F0C3CF71ED43FC503CAA65C1D4240E92B4833164DDB3FA1DB4B1AA32542406553AEF02E17E23FD42B6519E2244240029F1F46088FE23FA514747B4923424082A8FB00A436E43FF0F96184F02442408CB96B09F9A0E43FAA436E861B2C42402905DD5ED218E53F006F8104C53342406C95607138F3E63FEB73B515FB3B42407B14AE47E17AEA3F546F0D6C953C4240A245B6F3FDD4EA3F587380608E3E4240F0164850FC18EB3F44A852B3073A424021B0726891EDEB3FB4B0A71DFE3642400DC347C49448EC3F377172BF433542403480B74082E2EC3F641EF983813342407077D66EBBD0EC3FEE08A7052F3242402D78D1579066ED3F8BC3995FCD3142409981CAF8F719EE3F0612143FC6304240CB10C7BAB88DEE3F89981249F42E42409F5912A0A696EE3FD4F19881CA2C424079758E01D9EBEE3F0F45813E912B4240B9A5D590B8C7EF3FD4601A868F2842409CA73AE466B8EF3FF5673F5244164240EB1C03B2D7BBF23F718FA50F5D0C424084D89942E7B5F23F7632384A5EE54140598B4F01309EFA3F
31	Laikipia	Laikipia	0103000020E6100000010000008B000000587380608E3E4240F0164850FC18EB3F546F0D6C953C4240A245B6F3FDD4EA3FEB73B515FB3B42407B14AE47E17AEA3F006F8104C53342406C95607138F3E63FAA436E861B2C42402905DD5ED218E53FF0F96184F02442408CB96B09F9A0E43FA514747B4923424082A8FB00A436E43FD42B6519E2244240029F1F46088FE23FA1DB4B1AA32542406553AEF02E17E23FC503CAA65C1D4240E92B4833164DDB3F2BD9B11188174240C91F0C3CF71ED43FC87BD5CA841B4240317C444C8924D03F4B598638D619424045F5D6C05609CE3FB5A679C7291E424016FBCBEEC9C3CA3F3AAFB14B542342402F17F19D98F5C23F06F52D73BA244240D3307C444C89BC3F919BE1067C22424049F4328AE596B63F3F1D8F19A8204240AB3E575BB1BFAC3FBD3AC780EC214240DD41EC4CA1F39A3F3F3A75E5B320424006D847A7AE7C96BFD99942E735224240D39FFD48111996BF425BCEA5B82242402F6EA301BC0552BFADDD76A1B926424019FF3EE3C281903FCA897615522A4240CBB91457957D973FD595CFF23C2C4240C55565DF15C19F3F57B26323102B42409F71E1404816B03FC503CAA65C2D42406E8B321B6492B13F7407B133852E424045F0BF95ECD8A83FB98D06F016304240DF4F8D976E12A33FD4484BE5ED3442402B6A300DC347A43FAEBB79AA4336424024D6E253008CA73F5743E21E4B3342400C1F11532289AE3F6EFAB31F293642403CA06CCA15DEB53FB875374F753842403D0FEECEDA6DB73F8104C58F313B4240857CD0B359F5C13FFE481119564142402592E86514CBB53F82E2C798BB424240AED3484BE5EDA83F7D91D096734942403BFC3559A31EB23F9EEFA7C64B4B4240029F1F46088FA63F6C09F9A0674B4240CDE9B298D87C9C3F8D0B0742B24C4240255D33F9669B6B3FE15D2EE23B514240A8A9656B7D91903F1E8A027D2253424033E197FA795391BFE6AE25E4834A4240AE122C0E677E95BF01DE02098A474240D881734694F6A6BFBC22F8DF4A46424004E275FD82DDB0BF4182E2C7984742409F8EC70C54C6B7BF2F8672A25D494240CC7A319413EDBABF5C035B25584C4240F8A57EDE54A4BABFDBA7E33103514240BC5CC47762D6BBBFF90FE9B7AF5342400664AF777FBCC3BFF20C1AFA275442409CF9D51C2098C3BF97FF907EFB5A42408D0B0742B280C1BFD61C2098A35B42404C546F0D6C95C0BF6A300DC347604240AC730CC85EEFBEBFD3F6AFAC346542408716D9CEF753BBBFFC3559A31E6A4240F697DD938785BABF4A07EBFF1C6A4240757632384A5EC1BFB54FC763066E424004CAA65CE15DC2BF419AB1683A6F42400AD7A3703D0AC7BF78B988EFC46C4240179AEB34D252C9BF73BA2C26366B42408F368E588B4FC9BFCFF753E3A56B424082397AFCDEA6CBBFA14ACD1E686D4240F5DBD7817346D0BF73BA2C26366F4240E3AAB2EF8AE0CFBF9C8A54185B7042402A745E6397A8D0BF6C21C841097B42407E18213CDA38D2BF609335EA217E42404DBED9E6C6F4D2BFACADD85F767F424005FA449E245DD1BF2619390B7B7E424022718FA50F5DD0BF40DEAB562680424065C746205ED7CFBF1A51DA1B7C814240083D9B559FABCDBFA20BEA5BE68042408E06F0164850CCBF52499D80268242404DF38E537424C7BF868F882991804240704221020EA1C6BF6284F068E380424045813E912749C3BF2C0E677E357F42404A7B832F4CA6C2BFC425C79DD27D4240B9533A58FFE7C0BF3737A6272C7D4240AA436E861BF0B1BF96CFF23CB87F4240F870C971A774B0BF50AA7D3A1E8342406B9A779CA223A9BF2310AFEB1788424021020EA14ACD5E3FD9942BBCCB89424045F5D6C0560966BF34D769A4A58E4240BADA8AFD65F7A4BFF88DAF3DB3904240C63368E89FE0A2BF3B191C25AF8E4240AD342905DD5E92BF46B6F3FDD48C42408811C2A38D23863F88635DDC468B4240026553AEF02E973F91D09673298E4240274EEE77280AA43F6E4C4F58E2914240D313967840D9A43F4F0647C9AB9342403D0AD7A3703DAA3F6B82A8FB0098424086032159C004AE3F672783A3E49D42409604A8A9656BB53F60764F1E169E4240D0ED258DD13ABA3FA8E3310395A1424064E94317D4B7BC3FC1CAA145B6A3424043FF04172B6AC03F9D853DEDF0A3424018CFA0A17F82C33F65AA605452A742408CF337A11001C73F658D7A8846AB42406B2BF697DD93C73FF12E17F19DAC4240E3361AC05B20C93F4D4A41B797AC424075029A081B9ECA3F34A2B437F8AE42405A643BDF4F8DCF3F95607138F3AF42407A36AB3E575BD13F68E89FE062B142408E9257E71890D13FE657738060B2424011FC6F253B36D43FA0A696ADF5B14240D925AAB706B6D63F0CE544BB0AB1424073D712F241CFD63F1630815B77AF42406C26DF6C7363D83F5F24B4E55CAE42402D95B7239C16DA3FE17A14AE47AD42405DBF60376C5BDA3F3F1D8F19A8AC4240CE3637A6272CDD3F0B7BDAE1AFAD4240B515FBCBEEC9DD3F18213CDA38AE42403F8C101E6D1CE03F5E4BC8073DAF4240029A081B9E5EE03F3E22A64412A14240963E74417DCBE03FF7CC920035894240EC6987BF266BE13F5FD218ADA36E4240B4C876BE9F1AE23F978BF84ECC6E4240C45A7C0A80F1E23F36936FB6B9714240747B4963B48EE33FB515FBCBEE714240E8C1DD59BBEDE33FC74B37894174424014967840D994E43F268DD13AAA7642408B89CDC7B5A1E53FC971A774B0764240A5BDC1172653E73F107A36AB3E7742407C2766BD18CAE73F9548A2975174424015C616821C94E73FBB61DBA2CC724240AAB706B64AB0E73F4DBED9E6C670424066BD18CA8976E73F5F46B1DCD26E4240ED9E3C2CD49AE73FB6679604A86D424075CDE49B6D6EE83FF4C308E1D16A4240630B410E4A98E93F312592E865684240DDD26A48DC63EB3F0B24287E8C6542408A8EE4F21FD2EB3F46990D32C9604240645DDC460378EB3F3C8386FE095E4240F4893C49BA66EA3F6614CB2DAD5A42403A75E5B33C0FEA3F6440F67AF75742409B38B9DFA128EA3F282CF180B2554240F44F70B1A206EA3FB6A1629CBF3D4240D578E9263108EA3F587380608E3E4240F0164850FC18EB3F
32	Nakuru	Nakuru	0103000020E610000001000000580100004B598638D619424045F5D6C05609CE3FADDD76A1B9164240419AB1683A3BCD3FBEBC00FBE8184240A4C7EF6DFAB3CB3F5A0D897B2C194240A852B3075A81C93F3B70CE88D2124240DBDC989EB0C4C73FA04FE449D2114240B97020240B98C03F1344DD07201142408369183E22A6BC3FB9C7D2872E1042404B1FBAA0BE65AE3F1AFA27B8580D4240691D554D1075AF3FC32ADEC83C0E42406FD39FFD4811793F9626A5A0DB0B424057957D5704FF8BBF66834C327206424094DE37BEF6CC723FE2E995B20C0542407FD93D7958A8953F31D3F6AFAC004240378E588B4F01A03FB3EF8AE07FFF41403A3B191C25AFAE3F7311DF8959FB41404221020EA14AAD3F7B832F4CA6FA41406649809A5AB6B63F4E452A8C2DF84140397F130A1170B83F020EA14ACDF6414078EE3D5C72DCB13F0CC85EEFFEFC4140795DBF60376C8B3FC74B378941FC4140B9A5D590B8C782BFA835CD3B4EF94140B7D100DE0209AABF8C84B69C4BF541404DBED9E6C6F4B4BF4243FF0417F341409E29745E6397A8BF4356B77A4EF24140359886E12362AABF8750A5660FF04140DF89592F8672A2BFB0AC342905E94140643BDF4F8D97BEBFF38E537424E741408F19A88C7F9FB9BFF758FAD005E5414087A2409FC893BCBFE92B483316E5414090F7AA9509BFC4BF26E4839ECDE241400586AC6EF59CC8BFC02154A9D9E3414000A94D9CDCEFC8BF76FD82DDB0E14140B745990D32C9CCBF4434BA83D8DD4140295C8FC2F528CCBFE960FD9FC3DC414090882991442FCBBF0D6C956071DC414065FCFB8C0B07C6BF1ADD41EC4CDD4140C269C18BBE82C4BF7CB8E4B853DA414021C84109336DBFBF86AC6EF59CD841406EA301BC0512BCBF15E3FC4D28D841406EDDCD531D72B3BF5AF5B9DA8AD54140D7FA22A12DE7B2BFE527D53E1DD3414034A2B437F8C2B4BF6744696FF0D14140650113B87537AFBF84471B47ACD14140A8E3310395F1AFBF1349F4328AD14140191C25AFCE31B0BF61E0B9F770D14140C51B9947FE60B0BFAF5A99F04BD1414095B7239C16BCB0BFF701486DE2D041402F8B89CDC7B5B1BF637FD93D79D041405D6DC5FEB27BB2BF159161156FD04140336DFFCA4A93B2BFB9196EC0E7CF41402B4D4A41B797B4BF5648F949B5CF4140984C158C4AEAB4BF41BCAE5FB0CF4140EA211ADD41ECB4BF3A0664AF77CF41403CF71E2E39EEB4BFAC5626FC52CF41408ECC237F30F0B4BFFA27B85851CF4140A913D044D8F0B4BF6DCA15DEE5CE4140E010AAD4EC81B6BF342E1C08C9CE4140C173EFE192E3B6BF88F4DBD781CF4140E353008C67D0B8BFA4198BA6B3CF41405D6DC5FEB27BBABF649291B3B0CF4140DB5031CEDF84BABFF3C81F0C3CCF4140A04FE449D235BBBF9886E12362CE41407094BC3AC780BCBF7CD5CA845FCE4140404D2D5BEB8BBCBF58C51B9947CE41407FF623456458BDBF9B38B9DFA1CC4140F5B9DA8AFD65BFBF9B728577B9CC4140EE3D5C72DC29C1BFA20BEA5BE6CC414053CBD6FA22A1C1BF293FA9F6E9CC4140986E1283C0CAC1BF2FA3586E69CD4140C55565DF15C1C3BF4434BA83D8CD4140992A1895D409C4BF03603C8386CE414047551344DD07C4BF102384471BCF41407632384A5E9DC3BFAC39403047CF41401E166A4DF38EC3BFFA6184F068CF4140DC80CF0F2384C3BF2B306475ABCF4140CA32C4B12E6EC3BF55DE8E705AD04140B1F9B836548CC3BFC5E6E3DA50D14140D6390664AF77C3BF19ADA3AA09D241405C8FC2F5285CC3BFD122DBF97ED2414083DDB06D5166C3BF5053CBD6FAD2414036AB3E575BB1C3BF6553AEF02ED341408655BC9179E4C3BF81785DBF60D34140D4D4B2B5BE48C4BF232D95B723D44140959A3DD00A0CC5BF1405FA449ED44140573ECBF3E0EEC4BFA1F31ABB44D54140E353008C67D0C4BF3D7E6FD39FD54140C993A46B26DFC4BFE162450DA6D54140FF21FDF675E0C4BF1A6EC0E787D54140DFE00B93A982C5BF679B1BD313D641400395F1EF332EC8BFA774B0FECFD54140166A4DF38E53C8BFEACF7EA488D441402783A3E4D539CABF55185B0872D44140488AC8B08A37CABF32207BBDFBD3414003B2D7BB3FDECBBF569FABADD8D34140BC3FDEAB5626CCBF24D6E25300D44140317C444C8924CEBF32384A5E9DD34140AB9509BFD4CFCFBF4850FC1873D34140E882FA96395DD0BFC1C58A1A4CD34140B537F8C264AAD0BFDFC325C79DD241403EE8D9ACFA5CD1BFA75CE15D2ED2414041481630815BD1BF0BD28C45D3D14140FDD98F149161D1BFA835CD3B4ED1414018CFA0A17F82D1BF2AE3DF675CD041408CDB68006F81D2BFA852B3075ACD41406D904946CEC2D2BF304CA60A46CD4140D28C45D3D9C9D2BF624A24D1CBCC414069E388B5F814D2BF79758E01D9CB41403F52448655BCD1BF0EF3E505D8CB41400664AF777FBCD1BF27C286A757CA414065E42CEC6987D3BF4DA1F31ABBC8414009E1D1C6116BD3BF9352D0ED25C941401CCEFC6A0E10D2BFA29C685721C94140581CCEFC6A0ED2BF88F4DBD781C74140C6F99B508880D1BFDDCD531D72C341406397A8DE1AD8D0BFA5BDC11726C3414045813E912749D1BF7C7E18213CC241403D618907944DD1BF2384471B47C0414089EFC4AC1743D1BFA67EDE54A4BE4140F5673F524486D1BFCB67791EDCBD4140EECEDA6D179AD1BF86200725CCB44140EC12D55B035BD3BF6284F068E3B4414058569A94826ED3BFBDC62E51BDB941406D567DAEB662D7BF3A1E335019CB4140DFC325C79DD2E2BFE9B7AF03E7CC4140211FF46C567DE5BFBA6B09F9A0CF41405C2041F163CCE5BF9C50888043D04140B9533A58FFE7E5BF111E6D1CB1D24140726DA818E76FE6BFC269C18BBED24140B554DE8E705AE6BF5F29CB10C7D24140D9EBDD1FEF55E6BF25581CCEFCD2414060C8EA56CF49E6BFFAEDEBC039D3414046D3D9C9E028E6BF481B47ACC5D34140D36A48DC63E9E5BF72A774B0FED3414054573ECBF3E0E5BF86AC6EF59CD441403B191C25AFCEE5BFB7973446EBD44140D46531B1F9B8E5BF2237C30DF8D441407E52EDD3F198E5BF29B3412619D54140417DCB9C2E8BE5BFB0E600C11CD5414063B48EAA2688E5BF1A868F8829D54140713D0AD7A370E5BFA1F31ABB44D54140E5F21FD26F5FE5BFEF38454772D5414041F163CC5D4BE5BFAF25E4839ED54140A27F828B1535E5BF5969520ABAD54140967840D9942BE5BF60CD018239D6414066834C327216E5BF5F984C158CD64140A01A2FDD2406E5BFE5B33C0FEED641405227A089B0E1E4BF4968CBB914D741402A52616C21C8E4BF81785DBF60D74140C780ECF5EE8FE4BF5D16139B8FD74140A20BEA5BE674E4BFEB6E9EEA90D74140C8CD70033E3FE4BF32384A5E9DD7414088687407B133E4BFBA6B09F9A0D741409A081B9E5E29E4BF4165FCFB8CD7414071033E3F8C10E4BF81CF0F2384D74140E0A128D027F2E3BF4165FCFB8CD74140596E693524EEE3BFF90FE9B7AFD741403CA06CCA15DEE3BFCF31207BBDD7414047205ED72FD8E3BF9626A5A0DBD7414040D9942BBCCBE3BFCEA5B8AAECD741401E1B81785DBFE3BF645DDC4603D84140B9C7D2872EA8E3BF4E0B5EF415D841405F7B6649809AE3BF63B48EAA26D841407FA4880CAB78E3BF39B9DFA128D841406B7D91D09673E3BF78978BF84ED84140AB048BC3995FE3BF384A5E9D63D8414079AF5A99F04BE3BFDB5031CEDFD8414009FEB7921D1BE3BF7EC6850321D94140CE88D2DEE00BE3BF3EEDF0D764D941401EA7E8482EFFE2BFD3C1FA3F87D941400DE02D90A0F8E2BFB6847CD0B3D94140CC7A319413EDE2BF4BB0389CF9D94140E73A8DB454DEE2BFEE258DD13ADA41407120240B98C0E2BF7CF2B0506BDA4140357BA01518B2E2BF91D5AD9E93DA4140E57E87A2409FE2BF7BA01518B2DA41406FBBD05CA791E2BFE63FA4DFBEDA4140A032FE7DC685E2BF666B7D91D0DA4140691D554D1075E2BF2D431CEBE2DA414044A852B3075AE2BF026553AEF0DA41403B014D840D4FE2BF6DE7FBA9F1DA41405AD8D30E7F4DE2BFB476DB85E6DA4140E544BB0A293FE2BFD72FD80DDBDA4140761A69A9BC1DE2BFF4E0EEACDDDA4140F9669B1BD313E2BF17D4B7CCE9DA414090831266DAFEE1BF6688635DDCDA4140B9533A58FFE7E1BF97A8DE1AD8DA414099F5622827DAE1BF97A8DE1AD8DA41406BB75D68AED3E1BF825660C8EADA41402C2B4D4A41B7E1BF481B47ACC5DB414040FB912232ACE1BF40C1C58A1ADC414029ED0DBE3099E1BF5B423EE8D9DC41400FD1E80E6267E1BF4D327216F6DC414046088F368E58E1BF936FB6B931DD4140BE4D7FF62345E1BF930035B56CDD4140543A58FFE730E1BF3659A31EA2DD4140E0D6DD3CD521E1BF207BBDFBE3DD41402EC55565DF15E1BFE04A766C04DE4140548CF337A110E1BF8386FE092EDE414045F5D6C05609E1BF2E90A0F831DE4140462575029A08E1BF1904560E2DE241400F45813E9127E1BF49809A5AB6E24140213CDA38622DE1BFB3075A8121E34140CCEEC9C342ADE0BFAF5FB01BB6E541405A2A6F47382DDEBF5A12A0A696E541407AC7293A92CBDDBFFD304278B4E54140A9D903ADC090DDBFF5F3A62215E64140D50451F70148DDBF4339D1AE42E6414067614F3BFC35DDBF88855AD3BCE7414081CF0F238447DDBFCE3637A627E841401C5F7B664980DEBF67D5E76A2BEA414039EE940ED6FFDDBF7C9BFEEC47EA414003B2D7BB3FDEDDBF49F4328AE5EA414078EE3D5C72DCDDBF1EE1B4E045EB414074982F2FC03EDEBF1F85EB51B8EA4140D6A887687407DFBF9F71E14048EA4140A0E062450DA6DFBFA1F831E6AEF1414078EE3D5C72DCE0BFD15790662CF241409DBAF2599E07E1BF8F53742497F34140C00985083884E1BF335019FF3EF74140FB05BB61DBA2E1BF0E84640113F841403FA9F6E978CCE1BF376C5B94D9F84140963E74417DCBE1BF69C6A2E9ECF84140E353008C67D0E1BF9A94826E2FF941409DBAF2599E07E2BF1AA88C7F9FFD41405D8AABCABE2BE4BF0DA661F888FC4140F180B2295778E4BF28B8585183F94140CCB4FD2B2B4DE5BF29B3412619F54140166A4DF38E53E4BF56BC9179E4F34140107A36AB3E57E4BF9CE1067C7EF04140AA60545227A0E4BF7F130A1170F041401D9430D3F6AFE4BFA3CC069964F041406649809A5AB6E4BF19CA897615F24140EF0390DAC4C9E4BFA54929E8F6F64140D1747632384AE6BF97C5C4E6E3F641404EB4AB90F293E6BFA9A44E4013F94140CF83BBB376DBE6BF82AD122C0EFB4140622D3E05C078E6BF287E8CB96B014240419AB1683A3BE5BFE4839ECDAA0342409A779CA223B9E5BF9D853DEDF0074240BEC117265305E5BF2497FF907E0B424011363CBD5296E4BFAA2B9FE5790C4240F2B0506B9A77E4BF7845F0BF950C424053D0ED258DD1E4BF698CD651D50C42401ADD41EC4CA1E5BF6649809A5A124240F623456458C5E6BF5053CBD6FA12424054008C67D0D0E6BF65AA6054521342405DA79196CADBE6BF0F0BB5A679134240E9482EFF21FDE6BFDDCD531D72134240C078060DFD13E7BF00C63368E8134240A0FD48111956E7BF003ACC9717144240C4EBFA05BB61E7BFF20C1AFA2714424060764F1E166AE7BF2AA913D044144240B7627FD93D79E7BF374F75C8CD1442400E32C9C859D8E7BF77103B53E8144240ECFA05BB61DBE7BF5A0D897B2C154240C2A38D23D6E2E7BF6F8104C58F154240C32ADEC83CF2E7BF92AE997CB315424039EE940ED6FFE7BFC4EBFA05BB1542400E677E350708E8BFD1747632381642408481E7DEC325E8BF2D78D15790164240ABCFD556EC2FE8BF6631B1F9B816424031D3F6AFAC34E8BF3BAA9A20EA164240936FB6B9313DE8BFDE1FEF552B17424048E17A14AE47E8BF56B77A4E7A174240F8C264AA6054E8BFA4FCA4DAA7174240689604A8A965E8BF41BCAE5FB0174240D6E253008C67E8BFC0EC9E3C2C184240DF89592F8672E8BFA3E9EC6470184240EDF0D7648D7AE8BF5C5A0D897B18424003780B24287EE8BFC1E270E657174240664E97C5C4E6E8BF4E2844C02118424021C84109336DE9BF95607138F317424055D97745F0BFE9BF2098A3C7EF1542407C0F971C774AEABF40C1C58A1A1442407F87A2409FC8EABFE1455F419A1542400B293FA9F6E9EBBF355EBA490C1A4240E50AEF7211DFEDBF5C2041F163204240166A4DF38E53EDBFE1455F419A2142407E18213CDA38EDBF7BBDFBE3BD2A4240D174763238CAF0BFFB743C66A03E42404B766C04E2F5F1BF7172BF4351444240E6E8F17B9B7EF2BF93C6681D55454240D578E9263108F2BFCD3B4ED19148424039B4C876BE9FF1BFE59B6D6E4C4B4240168733BF9A03F1BF105839B4C84A42402F8B89CDC7B5F0BF0EDB1665364C4240B22E6EA301BCEFBF5E6397A8DE4A42408386FE092E56EFBF5E6397A8DE4A4240D61C2098A3C7EEBFBEA4315A47494240D7868A71FE26EEBF67614F3BFC494240CD751A69A9BCEDBFFBCBEEC9C3464240713D0AD7A370EDBF132C0E677E4542400057B2632310EDBF8A592F86724642402332ACE28DCCEBBFA03715A930464240F91400E31934EBBFC11C3D7E6F4742405760C8EA56CFEABF3B53E8BCC6464240828B15359886EABF39622D3E0544424003B2D7BB3FDEE7BFAE81AD122C424240FAB31F2922C3E6BF5BD3BCE3144542400C93A9825149E6BF984C158C4A424240A06CCA15DEE5E4BF992A1895D4414240D7DD3CD52137E4BFC7F484251E404240D9B11188D7F5E3BFBA1457957D3B4240026553AEF02EE4BF685C381092394240598B4F01309EE3BF30F5F3A622394240D734EF384547E2BFDCBA9BA73A3442406284F068E388E2BF333333333333424038A110018750E2BFDD7BB8E4B83342404772F90FE9B7E1BF1EDC9DB5DB3242405AF5B9DA8AFDE0BFC173EFE192334240F3936A9F8EC7E0BF11AAD4EC81324240946A9F8EC70CE0BF6614CB2DAD324240FB7953910A63DFBFB003E78C28314240A60F5D50DF32DDBFCB9C2E8B893142409886E123624ADCBFA3CC0699643042406EFAB31F2922DBBF23F3C81F0C3042407DAEB6627FD9D9BFBCCB457C272E42402237C30DF8FCD8BF923F1878EE2D4240CCB4FD2B2B4DD8BF5114E813792A42406B9A779CA223D9BF5D6DC5FEB22742401A170E846401D9BFDE9387855A274240E94317D4B7CCD7BF5AF0A2AF2025424063D174763238D8BFA54929E8F6224240BD1DE1B4E045D9BF130F289B72214240A14ACD1E6805D6BF6F1283C0CA1D42401AC05B2041F1D5BFAA2B9FE5791C42406E179AEB34D2D6BF98512CB7B41A424075ABE7A4F78DD1BF419AB1683A1F4240E370E6577380D0BF55C1A8A44E1C4240A796ADF54542CBBFEDBB22F8DF1A42402ECA6C904946CABFEF1B5F7B66194240E6913F1878EEC1BFB2F4A10BEA1B4240BEF6CC920035BDBF0F971C774A1F4240309E4143FF04BFBF000000000020424034D769A4A5F2B6BF00E31934F41F42401D8F19A88C7FAFBF3F3A75E5B320424006D847A7AE7C96BFBD3AC780EC214240DD41EC4CA1F39A3F3F1D8F19A8204240AB3E575BB1BFAC3F919BE1067C22424049F4328AE596B63F06F52D73BA244240D3307C444C89BC3F3AAFB14B542342402F17F19D98F5C23FB5A679C7291E424016FBCBEEC9C3CA3F4B598638D619424045F5D6C05609CE3F
33	Narok	Narok	0103000020E610000001000000E000000067D5E76A2BEA414039EE940ED6FFDDBFF91400E319E8414080D4264EEE77DEBF88855AD3BCE7414081CF0F238447DDBF4339D1AE42E6414067614F3BFC35DDBFF5F3A62215E64140D50451F70148DDBFFD304278B4E54140A9D903ADC090DDBF5A12A0A696E541407AC7293A92CBDDBF84640113B8E54140931804560E2DDEBFFAB31F2922E341407689EAAD81ADE0BF49809A5AB6E24140213CDA38622DE1BF1904560E2DE241400F45813E9127E1BF2E90A0F831DE4140462575029A08E1BF8386FE092EDE414045F5D6C05609E1BFE04A766C04DE4140548CF337A110E1BF207BBDFBE3DD41402EC55565DF15E1BF3659A31EA2DD4140E0D6DD3CD521E1BF930035B56CDD4140543A58FFE730E1BF936FB6B931DD4140BE4D7FF62345E1BF4D327216F6DC414046088F368E58E1BF5B423EE8D9DC41400FD1E80E6267E1BF40C1C58A1ADC414029ED0DBE3099E1BF481B47ACC5DB414040FB912232ACE1BF825660C8EADA41402C2B4D4A41B7E1BF97A8DE1AD8DA41406BB75D68AED3E1BF97A8DE1AD8DA414099F5622827DAE1BF6688635DDCDA4140B9533A58FFE7E1BF17D4B7CCE9DA414090831266DAFEE1BFF4E0EEACDDDA4140F9669B1BD313E2BFD72FD80DDBDA4140761A69A9BC1DE2BFB476DB85E6DA4140E544BB0A293FE2BF6DE7FBA9F1DA41405AD8D30E7F4DE2BF026553AEF0DA41403B014D840D4FE2BF2D431CEBE2DA414044A852B3075AE2BF666B7D91D0DA4140691D554D1075E2BFE63FA4DFBEDA4140A032FE7DC685E2BF7BA01518B2DA41406FBBD05CA791E2BF91D5AD9E93DA4140E57E87A2409FE2BF7CF2B0506BDA4140357BA01518B2E2BFEE258DD13ADA41407120240B98C0E2BF4BB0389CF9D94140E73A8DB454DEE2BFB6847CD0B3D94140CC7A319413EDE2BFD3C1FA3F87D941400DE02D90A0F8E2BF3EEDF0D764D941401EA7E8482EFFE2BF7EC6850321D94140CE88D2DEE00BE3BFDB5031CEDFD8414009FEB7921D1BE3BF384A5E9D63D8414079AF5A99F04BE3BF78978BF84ED84140AB048BC3995FE3BF39B9DFA128D841406B7D91D09673E3BF63B48EAA26D841407FA4880CAB78E3BF4E0B5EF415D841405F7B6649809AE3BF645DDC4603D84140B9C7D2872EA8E3BFCEA5B8AAECD741401E1B81785DBFE3BF9626A5A0DBD7414040D9942BBCCBE3BFCF31207BBDD7414047205ED72FD8E3BFF90FE9B7AFD741403CA06CCA15DEE3BF4165FCFB8CD74140596E693524EEE3BF81CF0F2384D74140E0A128D027F2E3BF4165FCFB8CD7414071033E3F8C10E4BFBA6B09F9A0D741409A081B9E5E29E4BF32384A5E9DD7414088687407B133E4BFEB6E9EEA90D74140C8CD70033E3FE4BF5D16139B8FD74140A20BEA5BE674E4BF81785DBF60D74140C780ECF5EE8FE4BF4968CBB914D741402A52616C21C8E4BFE5B33C0FEED641405227A089B0E1E4BF5F984C158CD64140A01A2FDD2406E5BF60CD018239D6414066834C327216E5BF5969520ABAD54140967840D9942BE5BFAF25E4839ED54140A27F828B1535E5BFEF38454772D5414041F163CC5D4BE5BFA1F31ABB44D54140E5F21FD26F5FE5BF1A868F8829D54140713D0AD7A370E5BFB0E600C11CD5414063B48EAA2688E5BF29B3412619D54140417DCB9C2E8BE5BF2237C30DF8D441407E52EDD3F198E5BFB7973446EBD44140D46531B1F9B8E5BF86AC6EF59CD441403B191C25AFCEE5BF72A774B0FED3414054573ECBF3E0E5BF481B47ACC5D34140D36A48DC63E9E5BFFAEDEBC039D3414046D3D9C9E028E6BF25581CCEFCD2414060C8EA56CF49E6BF5F29CB10C7D24140D9EBDD1FEF55E6BFC269C18BBED24140B554DE8E705AE6BF111E6D1CB1D24140726DA818E76FE6BF9C50888043D04140B9533A58FFE7E5BFBA6B09F9A0CF41405C2041F163CCE5BF293FA9F6E9CC414094FB1D8A027DE5BF3A1E335019CB4140DFC325C79DD2E2BF47205ED72FB441409A5FCD018239E3BF66A032FE7DB64140C078060DFD13E7BF64E94317D4C34140DF6C73637AC2E9BFB84082E2C7C041401A51DA1B7C61EABF27A5A0DB4BBE4140841266DAFE95EABF1B4CC3F011BD4140FCFB8C0B0742EBBF0B5EF415A4B9414081CF0F238447ECBF7BBDFBE3BDB64140F29881CAF8F7ECBF6E861BF0F9B5414072C45A7C0A80EDBFE17F2BD9B1B54140D8648D7A8846EEBF5EBA490C02B3414008E6E8F17B9BEEBF40FB912232B04140BD35B05582C5EEBFBBB88D06F0AE4140B54FC763062AEFBF064CE0D6DDAC41402497FF907EFBEEBF11AAD4EC81AA4140FCFB8C0B0742EFBF8FE4F21FD2A74140D061BEBC00FBEFBFD99942E735A64140C3D842908312F0BF390B7BDAE19F4140639CBF098588F0BF26AAB706B69E4140499D8026C286F0BFB48EAA26888A414027F73B1405FAECBFFD135CACA8814140F5108DEE2076ECBFB6679604A8814140F5108DEE2076ECBFD712F241CF5641407BDAE1AFC91AEFBF91F2936A9F564140E3361AC05B20EFBFB515FBCBEE554140F5D6C0560916EFBF617138F3AB554140D39FFD481119EFBFCCEEC9C3425541409981CAF8F719EFBF4CA60A4625554140642310AFEB17EFBF4F0647C9AB5341401CF0F96184F0EEBF2670EB6E9E52414055DE8E705AF0EEBF83DDB06D5152414062156F641EF9EEBFABE7A4F78D4B41402A3A92CB7F48F0BF9430D3F6AF4C41407216F6B4C3DFF0BF3BC780ECF54E4140EE258DD13A2AF1BF349D9D0C8E4E4140F67AF7C77B55F1BFB3EF8AE07F4F414075C8CD7003BEF1BF55185B08725041402788BA0F40EAF1BFB7627FD93D514140A18499B67F65F2BFC8EF6DFAB353414034BF9A0304F3F2BFF67F0EF3E5554140BFB7E9CF7E24F3BFE08442041C5641407077D66EBB50F3BFF9F719170E584140EC12D55B035BF3BF1A6EC0E7875D4140F0C4AC174339F6BF359886E1238241405AD8D30E7FCDF8BF4EEE77280A004240D97745F0BFD500C04EEE77280A0042407CED992501AA00C04FE960FD9F034240D252793BC2A900C0DDEF5014E8034240E9F17B9BFE2C00C086200725CC044240B05582C5E10C00C0E9263108AC04424071E6577380E0FFBFEF7211DF89054240F20703CFBD07FFBFD6E253008C03424044FAEDEBC039FEBFE78C28ED0D064240F6285C8FC2F5FDBFFC8C0B0742064240D061BEBC007BFDBF72DC291DAC034240DC291DACFFF3FCBFF1113125920442407BBDFBE3BDEAFBBF609335EA21064240CAFD0E4581BEFBBFF0332E1C08054240D0F23CB83B6BFBBF950ED6FF3908424078B988EFC42CFBBF8B71FE261406424001C11C3D7E6FFABF0FD1E80E620742409D6340F67AF7F9BFF05014E8130942409CA223B9FC87F9BF8A8EE4F21F0A4240E700C11C3D7EF9BF9FB0C403CA0A4240000000000000F9BFD8BB3FDEAB0642404278B471C4DAF7BF8E23D6E2532C424073D712F241CFF2BF7BBDFBE3BD2A42404339D1AE42CAF0BFBD6F7CED99214240452A8C2D0439EDBF5C2041F163204240166A4DF38E53EDBF1288D7F50B1A4240AD4CF8A57EDEEDBF68791EDC9D1542400B293FA9F6E9EBBFCE1951DA1B1442409BFEEC478AC8EABF2098A3C7EF1542407C0F971C774AEABF0708E6E8F117424039622D3E05C0E9BF4E2844C02118424021C84109336DE9BFC1E270E657174240664E97C5C4E6E8BF5C5A0D897B18424003780B24287EE8BFA3E9EC6470184240EDF0D7648D7AE8BFC0EC9E3C2C184240DF89592F8672E8BF41BCAE5FB0174240D6E253008C67E8BFA4FCA4DAA7174240689604A8A965E8BF56B77A4E7A174240F8C264AA6054E8BFDE1FEF552B17424048E17A14AE47E8BF3BAA9A20EA164240936FB6B9313DE8BF6631B1F9B816424031D3F6AFAC34E8BF2D78D15790164240ABCFD556EC2FE8BFD1747632381642408481E7DEC325E8BFC4EBFA05BB1542400E677E350708E8BF92AE997CB315424039EE940ED6FFE7BF6F8104C58F154240C32ADEC83CF2E7BF5A0D897B2C154240C2A38D23D6E2E7BF77103B53E8144240ECFA05BB61DBE7BF374F75C8CD1442400E32C9C859D8E7BF2AA913D044144240B7627FD93D79E7BFF20C1AFA2714424060764F1E166AE7BF003ACC9717144240C4EBFA05BB61E7BF00C63368E8134240A0FD48111956E7BFDDCD531D72134240C078060DFD13E7BF0F0BB5A679134240E9482EFF21FDE6BF65AA6054521342405DA79196CADBE6BF5053CBD6FA12424054008C67D0D0E6BF6649809A5A124240F623456458C5E6BFB0389CF9D50C42408CB96B09F9A0E5BF7845F0BF950C424053D0ED258DD1E4BFAA2B9FE5790C4240F2B0506B9A77E4BF2497FF907E0B424011363CBD5296E4BF0708E6E8F107424084D382177D05E5BFE4839ECDAA0342409A779CA223B9E5BF4C546F0D6C01424043CA4FAA7D3AE5BF82AD122C0EFB4140622D3E05C078E6BFA9A44E4013F94140CF83BBB376DBE6BF6DCA15DEE5F64140DD0720B58993E6BFE5D022DBF9F64140D3A414747B49E6BF60764F1E16F2414044696FF085C9E4BFA3CC069964F041406649809A5AB6E4BF7F130A1170F041401D9430D3F6AFE4BF9CE1067C7EF04140AA60545227A0E4BF56BC9179E4F34140107A36AB3E57E4BF29B3412619F54140166A4DF38E53E4BF9A5FCD0182F94140B16D5166834CE5BF0DA661F888FC4140F180B2295778E4BF3659A31EA2FD4140B3EF8AE07F2BE4BF9A94826E2FF941409DBAF2599E07E2BF69C6A2E9ECF84140E353008C67D0E1BF376C5B94D9F84140963E74417DCBE1BF0E84640113F841403FA9F6E978CCE1BF73D712F241F741406DE2E47E87A2E1BFFAD51C2098F34140C139234A7B83E1BFD15790662CF241409DBAF2599E07E1BF367689EAADF141405C77F35487DCE0BF7C9BFEEC47EA4140A0E062450DA6DFBF1F85EB51B8EA4140D6A887687407DFBF1EE1B4E045EB414074982F2FC03EDEBF49F4328AE5EA414078EE3D5C72DCDDBF7C9BFEEC47EA414003B2D7BB3FDEDDBF67D5E76A2BEA414039EE940ED6FFDDBF
34	Kajiado	Kajiado	0103000020E610000001000000720000007BBDFBE3BD2A4240D174763238CAF0BFBF4351A04F2C424001FBE8D495CFF2BF983446EBA80642405FEFFE78AFDAF7BF17D4B7CCE90A42405A2A6F47382DF9BF92B3B0A71D0A424072DC291DAC7FF9BFD39FFD4811094240473D44A33B88F9BF43C5387F13064240C2A38D23D662FABF50AA7D3A1E0742403C889D2974DEFABF31CEDF8442084240014D840D4F2FFBBFDE54A4C2D80642400CEA5BE67459FBBFC6504EB4AB044240A774B0FECFE1FBBF33C4B12E6E034240CFBD874B8EBBFCBF24456458C5034240492EFF21FDF6FCBF51A04FE4490642402497FF907E7BFDBF0A4B3CA06C0642401C7C613255B0FDBF2905DD5ED204424075C8CD70033EFEBF6458C51B990342403D49BA66F24DFEBFFFCF61BEBC04424007CE1951DA9BFEBF933A014D84054240F20703CFBD07FFBFB8AF03E78C044240DBC4C9FD0E0500C03A5D16139B034240A835CD3B4E5100C03A5D16139B03424027A089B0E1A900C0EB909BE106004240D23AAA9A20AA00C0EB909BE106004240BD00FBE8D4D500C005A8A9656B4142404F3BFC35592303C00074982F2F604240D925AAB7063604C0957D5704FFA74240EE940ED6FFB906C0E3DF675C38BC4240A86F99D3657107C03BDF4F8D97C24240BCCB457C27A607C0A99F3715A9C84240DA722EC555E507C0446E861BF0D542402A6F47382D7808C0EA78CC4065D84240CAA65CE15D6E09C02827DA5548E54240957D5704FF5B09C0327216F6B4E74240DBBFB2D2A45409C066F7E461A1EA42400708E6E8F17B09C06ADE718A8EEC42404D327216F67409C06891ED7C3FED4240637FD93D795809C06FF085C954ED4240376C5B94D9A008C0412B306475EF4240CA37DBDC989E08C06DFFCA4A93F242409F71E140481607C07DCB9C2E8BF5424034D769A4A5F206C063EE5A423EF842402C2B4D4A413706C0B3CD8DE909F74240DD5ED218AD2306C0AED85F764FF64240CC6262F371ED05C0B3EA73B515F74240EE77280AF4C905C07DD0B359F5F542403480B74082A205C0D751D50451F34240587380608E9E05C0999EB0C403F24240C1FF56B2636305C0C6A2E9EC64F042402E56D4601A4605C07077D66EBBEC424014967840D9D404C0DC4B1AA375CC4240B0FECF61BE7C02C02FA86F99D3CD4240F3716DA8186702C0317C444C89D04240D23AAA9A206A02C0FE60E0B9F7D44240FFB27BF2B05002C051F701486DD6424073BA2C26361F02C056D4601A86D742409AB67F65A5C901C0446E861BF0D9424017821C94309301C0ADA3AA09A2DA424050AA7D3A1E7301C03D44A33B88D942401B2AC6F99B5001C0543A58FFE7D442407AFCDEA63F3B01C056D4601A86CF42400E4FAF94654801C0C7BAB88D06CC42407E18213CDA3801C00000000000C84240FF5BC98E8D0001C01FD7868A71C64240A6F27684D30201C071E6577380C442402A1DACFF73D800C0D28C45D3D9B94240BA2C26361F9700C0C746205ED7AF424029E8F692C62800C027BD6F7CEDAD4240444C89247A1900C0FCA9F1D24DA64240CE88D2DEE00B00C06B9A779CA2A34240744694F606DFFFBF65AA605452A34240A4880CAB78A3FFBFC408E1D1C6A1424085CE6BEC1255FFBF1630815B779F4240A98768740731FFBF9981CAF8F79D424027F73B1405FAFEBF46EBA86A829C4240AC730CC85EEFFEBF1D774A07EB97424014E8137992F4FEBF44FAEDEBC095424024B4E55C8AABFEBFC11C3D7E6F9342406C21C8410933FEBF30478FDFDB9442401C08C90226F0FDBF4D840D4FAF9442406631B1F9B8B6FDBF60B01BB62D924240FB912232AC62FDBF6EDDCD531D92424003780B2428FEFCBF543541D47D9442407AE40F069E7BFCBF0057B263239442403BAA9A20EA3EFCBFBB270F0BB59242405704FF5BC90EFCBFA0A696ADF591424005A3923A01CDFBBFEB909BE106904240CAC342AD69DEFBBFA7E8482EFF8D42409E077767EDB6FBBF1E335019FF7E424064E94317D437F9BFE1B4E0455F7D4240CD920035B5ECF8BFEBA86A82A87B424047205ED72FD8F8BF34D769A4A57A4240B8AF03E78CA8F8BF7AA52C431C7B42407B884677103BF8BF1CD31396787C424084BBB376DB05F8BF300DC347C47C4240A6B8AAECBBA2F7BF74EACA67797642408CD651D50451F7BF8CB96B09F9704240DEAB5626FCD2F7BF9CF9D51C2070424024B4E55C8AABF7BFCBD6FA22A17142408351499D80A6F6BFFBAE08FEB76A4240B6BE4868CB39F6BF32772D211F684240CA37DBDC981EF6BF0A4B3CA06C6642407DE882FA9639F6BF481B47ACC55F4240F2CD3637A627F6BF689604A8A95D4240E76F4221020EF6BF689604A8A9594240DC2E34D769A4F5BF30F0DC7BB8584240CD1E680586ACF5BF9ACE4E0647554240B806B64AB038F5BF1B12F758FA5442405EF415A4190BF5BF4E452A8C2D5442408D5DA27A6BE0F4BF8A7615527E3E4240D31396784059F4BF5A8121AB5B41424047382D78D1D7F3BF7172BF4351444240E6E8F17B9B7EF2BFFB743C66A03E42404B766C04E2F5F1BF7BBDFBE3BD2A4240D174763238CAF0BF
39	Bungoma	Bungoma	0103000020E6100000010000006A000000BC3FDEAB564A41400FB9196EC067F23FA089B0E1E9494140609335EA219AF13F4165FCFB8C434140A7CB6262F3F1F13F72BF4351A0434140E8A4F78DAFBDF13F8B1A4CC3F0414140C5AC17433951F13F2A5778978B404140176536C82423F13FACFF73982F3F41402F8B89CDC7B5F03F18EC866D8B3E4140B745990D3249F03F2619390B7B3E4140D1798D5DA27AEF3FC5C9FD0E453D414011C7BAB88D06EE3F1D386744693B41406BF12900C633ED3F04FF5BC98E39414066A032FE7DC6EC3FCC5D4BC807394140DE8E705AF0A2EB3FEE08A7052F364140D044D8F0F44AEB3F130A11700835414054A9D903ADC0EA3F31B610E4A0344140A453573ECBF3E93FB03DB3244031414022AB5B3D27BDE93F0A9DD7D8252E4140B8239C16BCE8E83FF71E2E39EE3041403012DA722EC5E83F6666666666324140221ADD41EC4CE83FE71DA7E848364140404D2D5BEB8BE83F3AE97DE36B374140E223624A24D1E73F43C5387F133641407E1D38674469E73F6BD44334BA3341404D4A41B79734E73F614F3BFC353541404E9CDCEF5014E63FCEC7B5A162344140E813799274CDE53FAF946588633541405D33F9669B1BE53F0CE544BB0A314140B4B0A71DFE9AE43F0664AF777F304140E8DEC325C79DE33FBAA0BE654E2F4140DD7BB8E4B853E33F31CEDF8442304140DA20938C9C85E23F176536C8242F4140EE08A7052FFAE13F0490DAC4C931414049111956F146E13F55C1A8A44E3441408481E7DEC325E03F758E01D9EB3141408A3C49BA66F2DF3FF7065F984C3141409E245D33F966DF3FEE08A7052F32414018601F9DBAF2DD3FB9A5D590B8334140BB9BA73AE466DE3F0BB5A679C735414050DF32A7CB62DE3F0F45813E913741404F92AE997CB3DD3F5F46B1DCD23A41406D1CB1169F02DE3FE0F3C308E13D41409413ED2AA4FCDE3F5C1B2AC6F93F4140A04FE449D235DD3F0057B2632344414065DF15C1FF56DC3FE275FD82DD444140C4995FCD0182DD3F0AA2EE039046414035B56CAD2F12DE3F800EF3E50548414094F6065F984CDD3FD1CB28965B4A41401E5036E50AEFDC3FE6913F18784A41407AE40F069E7BDB3F533F6F2A524D41403FA9F6E978CCDC3F09FEB7921D4F414082A8FB00A436DD3F03098A1F6352414037894160E5D0DC3FBDFBE3BD6A554140C8D2872EA86FDD3FC7D79E59125841408CF337A11001DF3F30F5F3A622594140018750A5660FE03F4777103B535C414062A1D634EF38E03F59FAD005F55D4140A54929E8F692E03F98C0ADBB795E4140E12879758E01E13F8D5DA27A6B60414067B8019F1F46E13FD9942BBCCB614140FB3F87F9F202E23F732EC555656741406ADE718A8EE4E23F8A1F63EE5A6641400FEECEDA6D17E33F8E3BA583F56741405E4BC8073D9BE33F27C286A7576A414065A54929E8F6E33F0742B280096C4140533F6F2A5261E53FE0675C38106E4140EACA67791EDCE53F4DBED9E6C6704140F54A598638D6E53F03780B2428724140B85851836918E63FF1BA7EC16E744140A323B9FC87F4E53F09336DFFCA764140F623456458C5E63FAE0D15E3FC75414016DEE522BE13E73FC2FA3F87F9764140C03E3A75E5B3E73F36AB3E575B794140228E75711B0DE83FE7C6F484257E41400D8E9257E718E83F81ECF5EE8F7F4140CB9C2E8B89CDE73F3EB324404D8141402C6519E25817E83FC87BD5CA8483414072A774B0FECFE73F53B3075A81854140F792C6681D55E83FE3361AC05B8841406744696FF085E83FF2B5679604884140EB39E97DE36BE93FCA1AF5108D8641403BE466B8019FE93FA96A82A8FB84414031D3F6AFAC34EA3F25581CCEFC8241405ABBED42739DEA3FDEC83CF207834140F1F44A598638EB3FC47762D68B81414010069E7B0F97EB3FF5673F5244824140F4893C49BA66EC3F4F92AE997C7B4140176536C82423EC3FCD1E6805867841404BB0389CF9D5EB3FB37BF2B0507741400EF3E505D847EB3F86032159C07441406FD39FFD4811EB3FBA66F2CD366F4140419FC893A46BEA3FF3599E0777674140B0FECF61BEBCE93F4F5DF92CCF674140C1ADBB79AA43EA3FFB22A12DE76641404E452A8C2D04EB3F2332ACE28D644140FC00A4367172EC3F8AE59656436641407E350708E6E8EC3F3FA9F6E9786441407C9BFEEC478AED3FCA6C90494662414089247A19C572ED3F8A93FB1D8A5E4140753C66A032FEED3F696FF085C9584140AED3484BE5EDEF3F159161156F544140B9FC87F4DBD7F03F5D50DF32A75341409014916115EFF03F62BEBC00FB5441404850FC187357F13FE9F17B9BFE504140DFF8DA334B82F13FED9925016A4E4140E1B4E0455FC1F13FBC3FDEAB564A41400FB9196EC067F23F
35	Kericho	Kericho	0103000020E610000001000000E000000084471B47ACD14140A8E3310395F1AFBF543A58FFE7D04140726DA818E76FA2BFB58993FB1DCE4140B97020240B98A0BF0AA2EE0390CA41401D8F19A88C7F7FBF685C381092C54140E7525C55F65D81BFE5B33C0FEEC241405839B4C876BE8F3F5969520ABAC14140E7525C55F65D813FAF5A99F04BBD41405839B4C876BE8F3F2BD9B11188BB4140C8EA56CF49EF9B3F0000000000B841407216F6B4C35F933FD4484BE5EDB4414055D97745F0BF753F72DC291DACB341406FD39FFD481199BF7C9BFEEC47B6414031CEDF844204B4BFDDEA39E97DB341406B9F8EC70C54B6BF2BF697DD93AF4140406A1327F73BBCBF24EEB1F4A1AB4140D578E9263108BCBF65E42CEC69A741408E588B4F0130B6BFE4F736FDD9A3414024287E8CB96BB9BFA245B6F3FD9C4140F86BB2463D44BBBFA796ADF5459E414080828B153598BEBFD50968226CA04140D673D2FBC6D7BEBF34BA83D899A24140802BD9B11188C3BFDDEA39E97DA3414063B48EAA2688C2BFF6622827DAA5414063B48EAA2688C6BF7C9BFEEC47AA414059349D9D0C8EC6BF1F80D4264EAA41400B462575029AC8BF1D03B2D7BBAB414019CA89761552CEBF0000000000A8414007EBFF1CE6CBCFBFE5D022DBF9A6414052499D8026C2CEBFD8BB3FDEABA241407CED9925016ACEBFC8EF6DFAB39F4140BC57AD4CF8A5CABF9274CDE49B9D4140F9DA334B02D4C8BFA301BC05129C414043E21E4B1FBAC8BF88F4DBD7819B4140D94290831266C6BF8542041C4299414015A930B610E4C4BFDDEF5014E89341405DE15D2EE23BC5BFC63368E89F9041407923F3C81F0CC4BFAF5A99F04B8D414020D26F5F07CEC9BF0551F70148894140D925AAB706B6CABF9CF9D51C2088414040A4DFBE0E9CCBBF65E42CEC698741406ABC74931804CEBF7BBDFBE3BD8641408B37328FFCC1D2BF3E3F8C101E814140DE8E705AF0A2D5BF4D327216F680414075E5B33C0FEED6BF44FAEDEBC0814140AF08FEB7921DD9BF527E52EDD38141402A8C2D043928D9BF596E6935248241404BC8073D9B55D9BF0395F1EF338241405C3D27BD6F7CD9BF4339D1AE42824140EECEDA6D179AD9BF5F07CE19518241400A9DD7D825AAD9BF742497FF9082414044C02154A9D9D9BF66F7E461A1824140FAEDEBC03923DABF573ECBF3E0824140C442AD69DE71DABFD6390664AF8341401A34F44F70B1DABFE4310395F18341408E1EBFB7E9CFDABFAA605452278441408D45D3D9C9E0DABF9C16BCE82B844140F701486DE2E4DABF00AE64C746844140AA9A20EA3E00DBBFBFF1B56796844140B1169F02603CDBBF22C32ADEC88441401F680586AC6EDBBFC6C4E6E3DA844140BED9E6C6F484DBBFA94D9CDCEF84414031EBC5504EB4DBBF1344DD07208541409D11A5BDC117DCBF7E74EACA678541402B6A300DC347DCBF61376C5B94854140D6E253008C67DCBF6FD8B628B3854140C5FEB27BF2B0DCBFAF42CA4FAA854140E0A128D027F2DCBFA8A9656B7D85414073BA2C26361FDDBF3ED00A0C59854140D8648D7A8846DDBFFE481119568541400EA14ACD1E68DDBF211FF46C568541404B766C04E275DDBFB6B9313D618541404772F90FE9B7DDBF7E5704FF5B854140F08AE07F2BD9DDBFD3D9C9E028854140A930B610E4A0DEBFF06DFAB31F85414030BB270F0BB5DEBFB0AC34290585414004E275FD82DDDEBFA323B9FC878441400E10CCD1E3F7DEBF55DE8E705A8441403CDA38622D3EDFBF9C8A54185B8441400ABABDA4315ADFBF8DEE2076A6844140CAC342AD69DEDFBFA98768740785414032207BBDFBE3DFBF68791EDC9D854140A323B9FC87F4DFBF59A31EA2D18541406C95607138F3DFBF67B8019F1F8641408E75711B0DE0DFBF98C0ADBB7986414070CE88D2DEE0DFBF9FB0C403CA864140FB96395D1613E0BF97C5C4E6E38641408CA19C685721E0BFEC2FBB270F8741401B4CC3F01131E0BF90A0F831E6864140D68BA19C6857E0BF423EE8D9AC864140567DAEB6627FE0BF8A93FB1D8A8641409E29745E6397E0BF03780B2428864140EDD3F19881CAE0BFE6AE25E483864140758E01D9EBDDE0BF0A85083884864140202922C32ADEE0BF0AA2EE039086414075E5B33C0FEEE0BF4A46CEC29E864140DC68006F8104E1BFAD69DE718A864140020EA14ACD1EE1BFAD69DE718A864140E23B31EBC550E1BF836E2F698C864140D122DBF97E6AE1BF1FF46C567D8641400CCD751A69A9E1BF4AB54FC7638641405DF92CCF83BBE1BF7593180456864140EE5A423EE8D9E1BF9161156F64864140573ECBF3E0EEE1BF2D211FF46C8641402F6EA301BC05E2BF1FBAA0BE65864140124E0B5EF415E2BFBC0512143F86414068E89FE06245E2BF759318045686414048BF7D1D3867E2BFF437A110018741400C022B8716D9E2BF89EFC4AC1787414025404D2D5BEBE2BF48C49448A287414076711B0DE02DE3BF07EBFF1CE68741409296CADB114EE3BF642310AFEB874140A25D85949F54E3BF96438B6CE78741402D78D1579066E3BF8E01D9EBDD874140BF823463D174E3BF6B9A779CA28741407CF2B0506B9AE3BF2788BA0F408A4140933A014D840DE3BF1EE1B4E0458B41400E677E350708E4BF1288D7F50B8A41407C2C7DE882FAE4BF26AAB706B68A41402176A6D0798DE5BF3F1D8F19A88C41405778978BF84EE5BF4C4F58E201914140D5264EEE7728E5BFF584251E5096414069E388B5F814E5BFF73B1405FA9841404D327216F6B4E4BF2766BD18CA9941404AEF1B5F7B66E4BFB6679604A89D414052F2EA1C03B2E3BF9430D3F6AF9C4140FE7DC6850321E3BFA5BDC117269B41402237C30DF8FCE2BF9B3DD00A0C99414005A3923A014DE2BF118DEE20769A41406DE2E47E87A2E1BF1366DAFE959941403EE8D9ACFA5CE1BF863DEDF0D7984140BA1457957D57E0BFE5D022DBF9964140444C89247A19E0BF73D712F24197414027F73B1405FADEBF32E6AE25E49B4140C217265305A3DEBF7BBDFBE3BD9A4140CEFC6A0E10CCDDBF9B5AB6D6179D414032207BBDFBE3DBBF9A5FCD01829D41405EBA490C022BDBBFC9C859D8D3A24140EB73B515FBCBDABFFAB31F2922A74140B08F4E5DF92CDBBF919BE1067CAA4140EEB1F4A10BEAD9BFAA0EB9196EAC4140124E0B5EF415DABF6CCF2C0950B341403524EEB1F4A1D9BF632827DA55B441404087F9F202ECD9BF72F90FE9B7B741407B319413ED2AD8BF0B7BDAE1AFB94140F0F96184F068D7BF6284F068E3B4414058569A94826ED3BF86200725CCB44140EC12D55B035BD3BFCB67791EDCBD4140EECEDA6D179AD1BFA67EDE54A4BE4140F5673F524486D1BF2384471B47C0414089EFC4AC1743D1BF7C7E18213CC241403D618907944DD1BFA5BDC11726C3414045813E912749D1BFDDCD531D72C341406397A8DE1AD8D0BF81CF0F2384C74140C959D8D30E7FD1BFA29C685721C94140581CCEFC6A0ED2BF9352D0ED25C941401CCEFC6A0E10D2BF8D28ED0DBEC8414009E1D1C6116BD3BF27C286A757CA414065E42CEC6987D3BF0EF3E505D8CB41400664AF777FBCD1BF79758E01D9CB41403F52448655BCD1BF624A24D1CBCC414069E388B5F814D2BF304CA60A46CD4140D28C45D3D9C9D2BFA852B3075ACD41406D904946CEC2D2BF2AE3DF675CD041408CDB68006F81D2BFA835CD3B4ED1414018CFA0A17F82D1BF0BD28C45D3D14140FDD98F149161D1BFA75CE15D2ED2414041481630815BD1BFDFC325C79DD241403EE8D9ACFA5CD1BFC1C58A1A4CD34140B537F8C264AAD0BF4850FC1873D34140E882FA96395DD0BF32384A5E9DD34140AB9509BFD4CFCFBF24D6E25300D44140317C444C8924CEBF569FABADD8D34140BC3FDEAB5626CCBF32207BBDFBD3414003B2D7BB3FDECBBF55185B0872D44140488AC8B08A37CABFEACF7EA488D441402783A3E4D539CABFA774B0FECFD54140166A4DF38E53C8BF679B1BD313D641400395F1EF332EC8BF1A6EC0E787D54140DFE00B93A982C5BFE162450DA6D54140FF21FDF675E0C4BF3D7E6FD39FD54140C993A46B26DFC4BFA1F31ABB44D54140E353008C67D0C4BF1405FA449ED44140573ECBF3E0EEC4BF232D95B723D44140959A3DD00A0CC5BF81785DBF60D34140D4D4B2B5BE48C4BF6553AEF02ED341408655BC9179E4C3BF5053CBD6FAD2414036AB3E575BB1C3BFD122DBF97ED2414083DDB06D5166C3BF19ADA3AA09D241405C8FC2F5285CC3BFC5E6E3DA50D14140D6390664AF77C3BF55DE8E705AD04140B1F9B836548CC3BF2B306475ABCF4140CA32C4B12E6EC3BFFA6184F068CF4140DC80CF0F2384C3BFAC39403047CF41401E166A4DF38EC3BF102384471BCF41407632384A5E9DC3BF03603C8386CE414047551344DD07C4BF4434BA83D8CD4140992A1895D409C4BF2FA3586E69CD4140C55565DF15C1C3BF293FA9F6E9CC4140986E1283C0CAC1BFA20BEA5BE6CC414053CBD6FA22A1C1BF9B728577B9CC4140EE3D5C72DC29C1BF9B38B9DFA1CC4140F5B9DA8AFD65BFBF58C51B9947CE41407FF623456458BDBF7CD5CA845FCE4140404D2D5BEB8BBCBF9886E12362CE41407094BC3AC780BCBFF3C81F0C3CCF4140A04FE449D235BBBF649291B3B0CF4140DB5031CEDF84BABFA4198BA6B3CF41405D6DC5FEB27BBABF88F4DBD781CF4140E353008C67D0B8BF342E1C08C9CE4140C173EFE192E3B6BF6DCA15DEE5CE4140E010AAD4EC81B6BFFA27B85851CF4140A913D044D8F0B4BFAC5626FC52CF41408ECC237F30F0B4BF3A0664AF77CF41403CF71E2E39EEB4BF41BCAE5FB0CF4140EA211ADD41ECB4BF5648F949B5CF4140984C158C4AEAB4BFB9196EC0E7CF41402B4D4A41B797B4BF159161156FD04140336DFFCA4A93B2BF637FD93D79D041405D6DC5FEB27BB2BFF701486DE2D041402F8B89CDC7B5B1BFAF5A99F04BD1414095B7239C16BCB0BF61E0B9F770D14140C51B9947FE60B0BF1349F4328AD14140191C25AFCE31B0BF84471B47ACD14140A8E3310395F1AFBF
37	Kakamega	Kakamega	0103000020E61000000100000091000000F5673F5244824140F4893C49BA66EC3FC47762D68B81414010069E7B0F97EB3FDEC83CF207834140F1F44A598638EB3F25581CCEFC8241405ABBED42739DEA3FA96A82A8FB84414031D3F6AFAC34EA3FCA1AF5108D8641403BE466B8019FE93FF2B5679604884140EB39E97DE36BE93FE3361AC05B8841406744696FF085E83F53B3075A81854140F792C6681D55E83FC87BD5CA8483414072A774B0FECFE73F3EB324404D8141402C6519E25817E83F81ECF5EE8F7F4140CB9C2E8B89CDE73FE7C6F484257E41400D8E9257E718E83F36AB3E575B794140228E75711B0DE83FC2FA3F87F9764140C03E3A75E5B3E73FAE0D15E3FC75414016DEE522BE13E73F09336DFFCA764140F623456458C5E63FF1BA7EC16E744140A323B9FC87F4E53F03780B2428724140B85851836918E63F4DBED9E6C6704140F54A598638D6E53FE0675C38106E4140EACA67791EDCE53F0742B280096C4140533F6F2A5261E53F27C286A7576A414065A54929E8F6E33F8E3BA583F56741405E4BC8073D9BE33F8A1F63EE5A6641400FEECEDA6D17E33F732EC555656741406ADE718A8EE4E23FD9942BBCCB614140FB3F87F9F202E23F8D5DA27A6B60414067B8019F1F46E13F98C0ADBB795E4140E12879758E01E13F59FAD005F55D4140A54929E8F692E03F4777103B535C414062A1D634EF38E03F30F5F3A622594140018750A5660FE03FC7D79E59125841408CF337A11001DF3FBDFBE3BD6A554140C8D2872EA86FDD3F03098A1F6352414037894160E5D0DC3F09FEB7921D4F414082A8FB00A436DD3F533F6F2A524D41403FA9F6E978CCDC3FE6913F18784A41407AE40F069E7BDB3FD1CB28965B4A41401E5036E50AEFDC3F800EF3E50548414094F6065F984CDD3F0AA2EE039046414035B56CAD2F12DE3FE275FD82DD444140C4995FCD0182DD3F0057B2632344414065DF15C1FF56DC3F5C1B2AC6F93F4140A04FE449D235DD3FE0F3C308E13D41409413ED2AA4FCDE3F5F46B1DCD23A41406D1CB1169F02DE3F0F45813E913741404F92AE997CB3DD3F0BB5A679C735414050DF32A7CB62DE3FB9A5D590B8334140BB9BA73AE466DE3FEE08A7052F32414018601F9DBAF2DD3F601F9DBAF23141409CF9D51C2098DD3F352905DD5E2E41405E68AED3484BDD3F7C7E18213C2E4140B64AB0389CF9DB3F0708E6E8F12B41407B884677103BDB3F841266DAFE2D41400A2E56D4601ADA3F46CEC29E763041401D2098A3C7EFD93F2AE3DF675C3441400D54C6BFCFB8D83F7D0569C6A235414057B2632310AFD73F014D840D4F3341406A1327F73B14D73F5E6397A8DE32414011C7BAB88D06D63F452FA3586E314140EB6E9EEA909BD53F62DBA2CC06314140F0A2AF20CD58D43FBAF770C9712F4140ADC090D5AD9ED33F26016A6AD9324140DE1FEF552B13D23F84BBB376DB314140448B6CE7FBA9D13F6CEC12D55B3341409430D3F6AFACD03FD044D8F0F43241402EE7525C55F6CD3F1344DD0720314140179AEB34D252CD3F8369183E22324140F949B54FC763CA3FC503CAA65C3141407155D97745F0C73F2C2B4D4A413341400DAB7823F3C8C73F6D1CB1169F364140A9C1340C1F11CB3FA94D9CDCEF384140B3EA73B515FBCB3FD235936FB63941406DAD2F12DA72CA3FD6A887687437414035EF38454772C93F9817601F9D36414030478FDFDBF4C73FBFD4CF9B8A384140367689EAAD81C53F335019FF3E374140D61C2098A3C7C33FC0B2D2A4143841404B02D4D4B2B5C23FC0E78711C23B414076711B0DE02DC43FA1F831E6AE3D414062D68BA19C68C33FEE77280AF43D41407AFCDEA63FFBC13F268DD13AAA3A4140930035B56CADBF3F0569C6A2E93C41403F912749D74CBE3FD34D6210583D4140EACF7EA4880CBB3F098A1F63EE424140758E01D9EBDDBF3F6FF085C954454140CD751A69A9BCC13FD09B8A54184741400ADCBA9BA73AC03F24287E8CB9474140EBFF1CE6CB0BB83F10751F80D44A4140F46C567DAEB6BA3F1E5036E50A4B41408E9257E71890BD3FB08F4E5DF9504140861BF0F96184C03FA94D9CDCEF544140A27F828B1535C03F1E1B81785D5741403D2CD49AE61DBF3F274EEE77285A4140CAC342AD69DEC13F80608E1EBF5B4140FB912232ACE2C13FCAFD0E45815E41404C6C3EAE0D15C33F0F7F4DD6A85F41409CC420B07268C13F6E861BF0F9654140A245B6F3FDD4C43FF19D98F562684140BB7EC16ED8B6C43F78B471C45A684140F46C567DAEB6C63F9A081B9E5E694140B3EA73B515FBC73F221ADD41EC6C4140CF4E0647C9ABC73FE7525C55F66D41404AEF1B5F7B66C93FA67EDE54A47241403BDF4F8D976ECA3F486DE2E47E734140DDEF5014E813C93F581CCEFC6A764140C959D8D30E7FC93FFF3EE3C2817841400118CFA0A17FCA3F2063EE5A427A4140D0B359F5B9DACE3FC6E1CCAFE67C41409D8026C286A7CF3F6F8104C58F794140BEF6CC920035D33FB1506B9A7778414034A2B437F8C2D43F4F232D95B7774140ECFA05BB61DBD63FC5AC17433979414024B4E55C8AABD63F92B3B0A71D7A4140D3D9C9E02879D73F7CD5CA845F7A41401DE6CB0BB08FDA3FEE08A7052F764140A2B437F8C264DE3F0E677E35077441407B6B60AB048BDF3F47ACC5A70074414069E388B5F814E03F1A170E84647141409D8026C286A7E03FF7E461A1D66C41404A46CEC29E76E13F111E6D1CB1724140B1BFEC9E3C2CE33FE0F3C308E175414000A94D9CDCEFE23F9487855AD378414024287E8CB96BE33FFA7E6ABC747B4140E14048163081E33F0C0742B2807D41401F2E39EE940EE43FDD7BB8E4B87F41402861A6ED5F59E43F88D7F50B76834140BFB7E9CF7EA4E33FDAC9E02879854140CE70033E3F8CE43FF0164850FC88414059A31EA2D11DE43F6DE7FBA9F18A414085B185200725E43FF7CC9200358D4140C16ED8B628B3E43FB56CAD2F12924140693A3B191C25E53FC173EFE192934140734BAB21718FE53F8143A852B393414095607138F3ABE73F65DF15C1FF924140B85851836918E83F2D95B7239C9241401878EE3D5C72EA3F5DE15D2EE28F414095D40968226CEA3F910A630B418E4140F0A2AF20CD58EB3F75931804568E41404833164D6727EC3F0CE544BB0A8D41401CF0F96184F0EB3FE5D022DBF98A41404963B48EAA26EC3F7715527E52894140BCAE5FB01BB6EC3F82A8FB00A4864140A835CD3B4ED1EC3FF5673F5244824140F4893C49BA66EC3F
38	Vihiga	Vihiga	0103000020E61000000100000033000000581CCEFC6A764140C959D8D30E7FC93F486DE2E47E734140DDEF5014E813C93FA67EDE54A47241403BDF4F8D976ECA3FE7525C55F66D41404AEF1B5F7B66C93F221ADD41EC6C4140CF4E0647C9ABC73F9A081B9E5E694140B3EA73B515FBC73F78B471C45A684140F46C567DAEB6C63FF19D98F562684140BB7EC16ED8B6C43F6E861BF0F9654140A245B6F3FDD4C43F0F7F4DD6A85F41409CC420B07268C13FCAFD0E45815E41404C6C3EAE0D15C33F80608E1EBF5B4140FB912232ACE2C13F274EEE77285A4140CAC342AD69DEC13F1E1B81785D5741403D2CD49AE61DBF3FA94D9CDCEF544140A27F828B1535C03FB08F4E5DF9504140861BF0F96184C03F1E5036E50A4B41408E9257E71890BD3F10751F80D44A4140F46C567DAEB6BA3F24287E8CB9474140EBFF1CE6CB0BB83F2B4D4A41B74741408126C286A757B23F6D3997E2AA4641409DF4BEF1B567963F9A5FCD0182454140118DEE2076A6803FFDD98F14914541407AFCDEA63FFB71BFB83B6BB75D4441404356B77A4E7A8FBF6BB75D68AE4741402EE7525C55F69DBF07B64AB03848414038F8C264AA60A4BFC3F5285C8F4A41404C8E3BA583F59FBFA54E4013614B414033F9669B1BD3533F21020EA14A4D414085B69C4B7155893F265305A3924E4140C7BAB88D06F046BF28F224E99A51414038842A357BA045BF2E1C08C9025641402AE3DF675C3890BFA3CC069964584140A167B3EA73B585BF1B81785DBF584140C3F5285C8FC295BF7BA01518B25A4140D8D825AAB70696BF7EC68503215D4140C0EC9E3C2CD47ABF49809A5AB65E41406C26DF6C73639ABF4FE960FD9F5F4140179AEB34D25299BF3411363CBD5E4140D313967840D9743F2A745E6397604140946A9F8EC70C843F92B3B0A71D6241400DA661F88898623F793BC269C16341406D904946CEC27E3F40D9942BBC6741405917B7D100DEA23F57091687336B4140336DFFCA4A93A23F23BE13B35E6C4140D6E253008C67B03F27DA5548F96D41401D5A643BDF4FB53FAE0D15E3FC6D41400490DAC4C9FDBE3FC58F31772D714140D2FBC6D79E59C23F21C8410933754140821C9430D3F6C33F938C9C853D75414096438B6CE7FBC53F581CCEFC6A764140C959D8D30E7FC93F
42	Kisumu	Kisumu	0103000020E6100000010000005E000000B83B6BB75D4441404356B77A4E7A8FBF8FAA2688BA434140B6847CD0B35995BF60B01BB62D3E41402EAD86C43D969EBF253B3602F13A4140344B02D4D4B2A5BFF06DFAB31F3941406C5B94D92093ACBF715AF0A2AF3441406EA301BC0512B4BF26361FD786364140DB85E63A8DB4C0BFBD1DE1B4E03D41408121AB5B3D27D3BF40DEAB562644414016C1FF56B263D1BF3546EBA86A5A414032E6AE25E483D0BF7120240B986041409F02603C8386D2BF293FA9F6E9604140F6EE8FF7AA95D3BF946A9F8EC764414080B74082E2C7D4BF3F00A94D9C6441401C9947FE60E0D5BF0395F1EF33664140B537F8C264AAD6BF569A94826E674140F8A57EDE54A4D6BFA11001875069414007EBFF1CE6CBD7BF6F8104C58F6941406BB75D68AED3D8BF04ADC090D5714140CBB91457957DD9BFF7AFAC342975414097900F7A36ABD8BF3E22A644127541403B191C25AFCED9BF49D74CBED9764140C095ECD808C4D9BFC47762D68B7941409609BFD4CF9BDABF7E350708E67C4140617138F3AB39DABFE09C11A5BD7D4140F5108DEE2076DABF7155D97745804140C8EA56CF49EFD9BF3D618907948141403E05C078060DD9BF931804560E814140930035B56CADD5BFB98D06F0168441400A80F10C1AFAD3BFD8D825AAB7864140D673D2FBC6D7D2BF65E42CEC698741406ABC74931804CEBF077C7E1821884140CEC7B5A1629CCBBF5322895E46894140B81E85EB51B8CABFF7065F984C8D41408DEE2076A6D0C9BF6362F3716D904140B3EA73B515FBC3BF96ECD808C4934140115322895E46C5BF064CE0D6DD944140D313967840D9C4BF61A6ED5F59994140A88C7F9F71E1C4BF4165FCFB8C9B41401BD82AC1E270C6BF312592E8659C4140C993A46B26DFC8BFE40F069E7B9F41409A5FCD018239CABF4CC3F01131A141402FA86F99D365CDBFCA54C1A8A4A241406DAD2F12DA72CEBFDEAB5626FCA64140C425C79DD2C1CEBFD5CA845FEAA74140D15CA79196CACFBF9D2E8B89CDAB4140F73B1405FA44CEBF03CFBD874BAA41407D224F92AE99C8BF7C9BFEEC47AA41408FC2F5285C8FC6BF3D0FEECEDAA54140F1D7648D7A88C6BF1D7233DC80A341407FFB3A70CE88C2BF34BA83D899A24140802BD9B11188C3BFF8DF4A766CA04140791EDC9DB5DBBEBF3C1405FA449E41405ABBED42739DBEBF5B99F04BFD9C41409C16BCE82B48BBBF5B99F04BFD9C4140BB44F5D6C056B1BF9548A297519C41403C4ED1915CFEA3BFE674594C6C9A41402575029A081B9EBF910F7A36AB9641408121AB5B3D279DBF5587DC0C37944140E388B5F81400A3BF83177D05699241402EFF21FDF675A0BFB728B341268D4140732EC55565DF75BF85CE6BEC128D4140FE7DC685032199BFD656EC2FBB8B41402849D74CBED9A6BFC45A7C0A808941408E06F0164850ACBF312592E865884140D027F224E99AB1BF6666666666864140EC34D252793BA2BF7940D9942B844140D218ADA3AA09A2BF7BA01518B27E4140CC0BB08F4E5D99BF0F0BB5A6797B4140CE70033E3F8CA0BFA054FB743C764140B9A5D590B8C7A2BFA089B0E1E9754140C0B2D2A414749BBFA774B0FECF694140A7E8482EFF219DBF166A4DF38E674140889D29745E6397BFA60F5D50DF664140705F07CE19518ABF58E20165536A4140247F30F0DC7B983FF7C77BD5CA6841402C9FE5797077963F50FC1873D7664140014D840D4FAF843FDD989EB0C46341407715527E52ED93BF842A357BA06141401A51DA1B7C6192BF4FE960FD9F5F4140179AEB34D25299BF49809A5AB65E41406C26DF6C73639ABF7EC68503215D4140C0EC9E3C2CD47ABF7BA01518B25A4140D8D825AAB70696BF1B81785DBF584140C3F5285C8FC295BFA3CC069964584140A167B3EA73B585BF2E1C08C9025641402AE3DF675C3890BF28F224E99A51414038842A357BA045BF265305A3924E4140C7BAB88D06F046BF21020EA14A4D414085B69C4B7155893FA54E4013614B414033F9669B1BD3533FC3F5285C8F4A41404C8E3BA583F59FBF07B64AB03848414038F8C264AA60A4BF6BB75D68AE4741402EE7525C55F69DBFB83B6BB75D4441404356B77A4E7A8FBF
43	Homa Bay	Homa Bay	0103000020E610000001000000550000003D618907948141403E05C078060DD9BF7155D97745804140C8EA56CF49EFD9BFE09C11A5BD7D4140F5108DEE2076DABF7E350708E67C4140617138F3AB39DABFC47762D68B7941409609BFD4CF9BDABF49D74CBED9764140C095ECD808C4D9BF3E22A644127541403B191C25AFCED9BFF7AFAC342975414097900F7A36ABD8BF04ADC090D5714140CBB91457957DD9BF6F8104C58F6941406BB75D68AED3D8BFA11001875069414007EBFF1CE6CBD7BF569A94826E674140F8A57EDE54A4D6BF0395F1EF33664140B537F8C264AAD6BF3F00A94D9C6441401C9947FE60E0D5BF946A9F8EC764414080B74082E2C7D4BF293FA9F6E9604140F6EE8FF7AA95D3BF7120240B986041409F02603C8386D2BF3546EBA86A5A414032E6AE25E483D0BF40DEAB562644414016C1FF56B263D1BFBD1DE1B4E03D41408121AB5B3D27D3BFD94290831236414044A852B3075AD5BFDAC9E028792941404182E2C798BBDABFD1AE42CA4F264140A04FE449D235DBBF5D8AABCABE2341404703780B2428DABF34F44F70B11E41400C76C3B64599D5BF1ADD41EC4CF94040BF60376C5B94D5BF74B515FBCBF6404024456458C51BDDBFAF7C96E7C1F54040D1915CFE43FAE1BF666B7D91D0F64040930035B56CADE9BFA6D0798D5D0A4140930035B56CADE9BF062AE3DF670C4140462575029A08E9BF6DA818E76F0E41404C37894160E5E8BF16DEE522BE0F4140E76F4221020EE9BF92E86514CB1141402A00C63368E8E8BF95607138F3134140179F02603C83E8BFB0AC34290515414011E4A08499B6E8BFCD0182397A184140EB909BE1067CE8BFA79196CADB194140168733BF9A03E8BF33F9669B1B1B4140F5673F524486E8BFF60B76C3B61D4140168733BF9A03E9BFB24B546F0D2041408ECC237F30F0E9BF8BC3995FCD2141403E05C078060DEABF6F2F698CD62541407C2766BD18CAEABF064CE0D6DD284140AD174339D1AEEBBFF3716DA8182B41405DBF60376C5BEBBFECA353573E2F4140077C7E18213CEBBF70CE88D2DE304140C1A8A44E4013EBBF6E3480B7403241400CC85EEFFE78EABFD925AAB706324140FDF675E09C11EABFAC730CC85E374140CEFC6A0E10CCEABF25404D2D5B3B414089D2DEE00B93EBBF450DA661F83C4140F94ECC7A3194EABF5D16139B8F3F414070253B3602F1E9BF03CFBD874B3E4140AF946588635DE9BFB0389CF9D5404140C0E78711C2A3E8BF3A58FFE7304341407D96E7C1DD59E8BF8DEE2076A6444140EC4CA1F31ABBE7BF1327F73B1445414080828B153598E6BF3333333333474140C1E270E65773E5BF4512BD8C624D41405ED72FD80DDBE4BFD2FBC6D79E514140D4D4B2B5BE48E5BFD122DBF97E524140832F4CA60A46E4BF0D37E0F3C3544140A0FD48111956E3BF39D1AE42CA574140850838842A35E3BFE0A128D0275A4140520FD1E80E62E2BF8ECC237F306041406397A8DE1AD8E1BFBCE82B48336241400D71AC8BDB68E1BFFB912232AC6641405DA79196CADBE0BFDBDC989EB06C4140B7B41A12F758E0BF4A9869FB576E4140261E5036E50AE0BF8D0B0742B2704140EB8B84B69C4BDFBF8109DCBA9B734140F3C81F0C3CF7DEBFA33B889D29784140D15CA79196CADDBFD50451F7017C4140855FEAE74D45DCBFF2EF332E1C8041401B81785DBF60DBBF58569A9482824140A2B437F8C264DABF66F7E461A1824140FAEDEBC03923DABF742497FF9082414044C02154A9D9D9BF5F07CE19518241400A9DD7D825AAD9BF4339D1AE42824140EECEDA6D179AD9BF0395F1EF338241405C3D27BD6F7CD9BF596E6935248241404BC8073D9B55D9BF527E52EDD38141402A8C2D043928D9BF44FAEDEBC0814140AF08FEB7921DD9BF3D618907948141403E05C078060DD9BF
44	Migori	Migori	0103000020E6100000010000003C000000D2FBC6D79E514140D4D4B2B5BE48E5BF4512BD8C624D41405ED72FD80DDBE4BF3333333333474140C1E270E65773E5BF1327F73B1445414080828B153598E6BF8DEE2076A6444140EC4CA1F31ABBE7BF3A58FFE7304341407D96E7C1DD59E8BFB0389CF9D5404140C0E78711C2A3E8BF03CFBD874B3E4140AF946588635DE9BF5D16139B8F3F414070253B3602F1E9BF450DA661F83C4140F94ECC7A3194EABF25404D2D5B3B414089D2DEE00B93EBBFAC730CC85E374140CEFC6A0E10CCEABFD925AAB706324140FDF675E09C11EABF6E3480B7403241400CC85EEFFE78EABF70CE88D2DE304140C1A8A44E4013EBBFECA353573E2F4140077C7E18213CEBBFF3716DA8182B41405DBF60376C5BEBBF064CE0D6DD284140AD174339D1AEEBBF6F2F698CD62541407C2766BD18CAEABF8BC3995FCD2141403E05C078060DEABFB24B546F0D2041408ECC237F30F0E9BFF60B76C3B61D4140168733BF9A03E9BF33F9669B1B1B4140F5673F524486E8BFA79196CADB194140168733BF9A03E8BFCD0182397A184140EB909BE1067CE8BFB0AC34290515414011E4A08499B6E8BF95607138F3134140179F02603C83E8BF92E86514CB1141402A00C63368E8E8BF16DEE522BE0F4140E76F4221020EE9BF6DA818E76F0E41404C37894160E5E8BF062AE3DF670C4140462575029A08E9BFA6D0798D5D0A4140930035B56CADE9BF666B7D91D0F64040930035B56CADE9BF41BCAE5FB0F74040DC68006F8104F0BF855FEAE74D014140A01A2FDD2406F0BF2C7DE882FA02414040A4DFBE0E1CF0BF5DF92CCF8303414039D6C56D3480F0BF68D0D03FC10541409A779CA223B9F0BF7E00529B3809414085251E503665F0BFB9533A58FF0B41405D6DC5FEB27BF0BF0E4A9869FB2F41404D2D5BEB8B04F3BF28B85851835D4140289B72857739F6BFB285200725584140CAC342AD695EF3BF60764F1E16564140FE9AAC510F51F3BFD2C6116BF155414067F2CD363726F3BF73A25D859453414003098A1F63EEF2BF9D11A5BDC153414061E0B9F770C9F2BF459E245D335141407CD5CA845F6AF2BF312592E865504140BCCB457C27E6F1BFAD86C43D964E41400282397AFC5EF1BFEDD808C4EB4E4140494BE5ED0827F1BFB806B64AB04C4140E4DA5031CEDFF0BF81ECF5EE8F4B4140B875374F7548F0BF8AABCABE2B52414079CC4065FCFBEEBF37C30DF8FC504140D95A5F24B4E5EEBF739D465A2A4F414017821C9430D3ECBFFF21FDF67550414061C3D32B6519E8BFA2D11DC4CE5041404278B471C45AE7BFDF4F8D976E52414054742497FF90E6BFD2FBC6D79E514140D4D4B2B5BE48E5BF
45	Kisii	Kisii	0103000020E61000000100000031000000B6679604A8814140F5108DEE2076ECBF76FD82DDB079414036E50AEF7211E9BFBA313D6189774140367689EAAD81E8BF55A4C2D84274414047382D78D157E8BFED2AA4FCA472414024B9FC87F4DBE7BF61545227A06D4140F60B76C3B645E7BF422619390B6B4140EDF5EE8FF7AAE6BFC53D963E74694140473D44A33B88E6BFA2629CBF09694140A7E8482EFF21E6BF16F6B4C35F67414053AEF02E17F1E5BF99D36531B1654140D4484BE5ED08E6BF9B030473F464414008E6E8F17B9BE5BFD61C2098A36741405ED72FD80DDBE4BF386744696F6841406631B1F9B836E4BFA6D590B8C76A4140AAD4EC815660E3BFA228D027F26C4140FDF675E09C11E3BF03780B24286E41408DB454DE8E70E3BF5BCEA5B8AA7041402BD9B11188D7E3BF59DDEA39E971414029B341261939E3BF0F7F4DD6A86F4140C4EBFA05BB61E2BF30F5F3A6227141402A3A92CB7F48E1BFBEF6CC92007141406B60AB048BC3E0BF4A9869FB576E4140261E5036E50AE0BFDBDC989EB06C4140B7B41A12F758E0BFFB912232AC6641405DA79196CADBE0BFBCE82B48336241400D71AC8BDB68E1BF8ECC237F306041406397A8DE1AD8E1BFE0A128D0275A4140520FD1E80E62E2BF39D1AE42CA574140850838842A35E3BF0D37E0F3C3544140A0FD48111956E3BFD122DBF97E524140832F4CA60A46E4BFD2FBC6D79E514140D4D4B2B5BE48E5BFDF4F8D976E52414054742497FF90E6BFA2D11DC4CE5041404278B471C45AE7BFFF21FDF67550414061C3D32B6519E8BF739D465A2A4F414017821C9430D3ECBF37C30DF8FC504140D95A5F24B4E5EEBF8AABCABE2B52414079CC4065FCFBEEBF83DDB06D5152414062156F641EF9EEBF2670EB6E9E52414055DE8E705AF0EEBF4F0647C9AB5341401CF0F96184F0EEBF4CA60A4625554140642310AFEB17EFBFCCEEC9C3425541409981CAF8F719EFBF617138F3AB554140D39FFD481119EFBFB515FBCBEE554140F5D6C0560916EFBF91F2936A9F564140E3361AC05B20EFBFD712F241CF5641407BDAE1AFC91AEFBFFD135CACA8814140833463D17476ECBFB6679604A8814140F5108DEE2076ECBF
46	Nyamira	Nyamira	0103000020E61000000100000067000000573ECBF3E0824140C442AD69DE71DABF58569A9482824140A2B437F8C264DABFF2EF332E1C8041401B81785DBF60DBBFD50451F7017C4140855FEAE74D45DCBFA33B889D29784140D15CA79196CADDBF8109DCBA9B734140F3C81F0C3CF7DEBF8D0B0742B2704140EB8B84B69C4BDFBF4A9869FB576E4140261E5036E50AE0BFBEF6CC92007141406B60AB048BC3E0BF30F5F3A6227141402A3A92CB7F48E1BF0F7F4DD6A86F4140C4EBFA05BB61E2BF59DDEA39E971414029B341261939E3BF5BCEA5B8AA7041402BD9B11188D7E3BF03780B24286E41408DB454DE8E70E3BFA228D027F26C4140FDF675E09C11E3BFA6D590B8C76A4140AAD4EC815660E3BF386744696F6841406631B1F9B836E4BFD61C2098A36741405ED72FD80DDBE4BF9B030473F464414008E6E8F17B9BE5BF99D36531B1654140D4484BE5ED08E6BF16F6B4C35F67414053AEF02E17F1E5BFA2629CBF09694140A7E8482EFF21E6BFC53D963E74694140473D44A33B88E6BF422619390B6B4140EDF5EE8FF7AAE6BF61545227A06D4140F60B76C3B645E7BFED2AA4FCA472414024B9FC87F4DBE7BF55A4C2D84274414047382D78D157E8BFBA313D6189774140367689EAAD81E8BF76FD82DDB079414036E50AEF7211E9BFB6679604A8814140F5108DEE2076ECBFFD135CACA8814140833463D17476ECBFFD135CACA8814140F5108DEE2076ECBFAFEB17EC8681414051DA1B7C6132ECBF001DE6CB0B844140F44F70B1A206EBBF617138F3AB854140632827DA5548EBBFC1ADBB79AA8B414004560E2DB29DE9BFA72215C6168641409A9999999999E6BF695721E52789414066DAFE959526E6BF029F1F460887414075931804560EE5BFC095ECD808884140041C42959A3DE4BF6B9A779CA28741407CF2B0506B9AE3BF8E01D9EBDD874140BF823463D174E3BF96438B6CE78741402D78D1579066E3BF642310AFEB874140A25D85949F54E3BF07EBFF1CE68741409296CADB114EE3BF48C49448A287414076711B0DE02DE3BF89EFC4AC1787414025404D2D5BEBE2BFF437A110018741400C022B8716D9E2BF759318045686414048BF7D1D3867E2BFBC0512143F86414068E89FE06245E2BF1FBAA0BE65864140124E0B5EF415E2BF2D211FF46C8641402F6EA301BC05E2BF9161156F64864140573ECBF3E0EEE1BF7593180456864140EE5A423EE8D9E1BF4AB54FC7638641405DF92CCF83BBE1BF1FF46C567D8641400CCD751A69A9E1BF836E2F698C864140D122DBF97E6AE1BFAD69DE718A864140E23B31EBC550E1BFAD69DE718A864140020EA14ACD1EE1BF4A46CEC29E864140DC68006F8104E1BF0AA2EE039086414075E5B33C0FEEE0BF0A85083884864140202922C32ADEE0BFE6AE25E483864140758E01D9EBDDE0BF03780B2428864140EDD3F19881CAE0BF8A93FB1D8A8641409E29745E6397E0BF423EE8D9AC864140567DAEB6627FE0BF90A0F831E6864140D68BA19C6857E0BFEC2FBB270F8741401B4CC3F01131E0BF97C5C4E6E38641408CA19C685721E0BF9FB0C403CA864140FB96395D1613E0BF98C0ADBB7986414070CE88D2DEE0DFBF67B8019F1F8641408E75711B0DE0DFBF59A31EA2D18541406C95607138F3DFBF68791EDC9D854140A323B9FC87F4DFBFA98768740785414032207BBDFBE3DFBF8DEE2076A6844140CAC342AD69DEDFBF9C8A54185B8441400ABABDA4315ADFBF55DE8E705A8441403CDA38622D3EDFBFA323B9FC878441400E10CCD1E3F7DEBFB0AC34290585414004E275FD82DDDEBFF06DFAB31F85414030BB270F0BB5DEBFD3D9C9E028854140A930B610E4A0DEBF7E5704FF5B854140F08AE07F2BD9DDBFB6B9313D618541404772F90FE9B7DDBF211FF46C568541404B766C04E275DDBFFE481119568541400EA14ACD1E68DDBF3ED00A0C59854140D8648D7A8846DDBFA8A9656B7D85414073BA2C26361FDDBFAF42CA4FAA854140E0A128D027F2DCBF6FD8B628B3854140C5FEB27BF2B0DCBF61376C5B94854140D6E253008C67DCBF7E74EACA678541402B6A300DC347DCBF1344DD07208541409D11A5BDC117DCBFA94D9CDCEF84414031EBC5504EB4DBBFC6C4E6E3DA844140BED9E6C6F484DBBF22C32ADEC88441401F680586AC6EDBBFBFF1B56796844140B1169F02603CDBBF00AE64C746844140AA9A20EA3E00DBBF9C16BCE82B844140F701486DE2E4DABFAA605452278441408D45D3D9C9E0DABFE4310395F18341408E1EBFB7E9CFDABFD6390664AF8341401A34F44F70B1DABF573ECBF3E0824140C442AD69DE71DABF
47	Nairobi	Nairobi	0103000020E610000001000000340000009352D0ED258D42408E588B4F0130F4BFAE47E17A148A4240CB9C2E8B89CDF3BF1D03B2D7BB874240986E1283C04AF3BF1A51DA1B7C8542407A36AB3E575BF3BF4D4A41B7978042407D3F355EBAC9F3BFADC090D5AD7E42409E29745E6397F3BF8FE4F21FD27B4240613255302AA9F3BFAF5A99F04B794240C58F31772DA1F3BF60E5D022DB75424079CC4065FC7BF3BF63450DA66174424021020EA14A4DF3BFF20703CFBD7742401F11532289DEF2BF32ACE28DCC774240923F1878EEBDF2BF68226C787A754240F12E17F19D98F2BF3B191C25AF724240FE0E45813E91F2BF6FD39FFD48714240FE43FAEDEBC0F2BFA661F888987242403815A930B610F3BF0FD1E80E626F4240551344DD0720F3BFA4C2D842906B42402F51BD35B055F3BFA089B0E1E9694240670FB4024356F3BF70CE88D2DE644240747B4963B40EF3BFACA8C1340C634240AF777FBC57ADF3BF062AE3DF6760424029AE2AFBAE88F3BF2C4833164D5F4240F853E3A59BC4F3BF6FBBD05CA75D42406D904946CEC2F3BF32C9C859D85B4240026553AEF02EF4BF5C035B2558584240BFB7E9CF7E24F4BF48A7AE7C96574240711B0DE02D90F4BF1B12F758FA5442405EF415A4190BF5BF9ACE4E0647554240B806B64AB038F5BF30F0DC7BB8584240CD1E680586ACF5BF689604A8A9594240DC2E34D769A4F5BF689604A8A95D4240E76F4221020EF6BF481B47ACC55F4240F2CD3637A627F6BF0A4B3CA06C6642407DE882FA9639F6BF32772D211F684240CA37DBDC981EF6BFFBAE08FEB76A4240B6BE4868CB39F6BFCBD6FA22A17142408351499D80A6F6BF5E68AED34877424089247A19C5F2F6BFBEC1172653794240CD0182397AFCF6BFF853E3A59B784240C6E1CCAFE680F6BF446E861BF075424028F224E99A49F6BF32ACE28DCC73424061376C5B94D9F5BF78978BF84E784240FB3A70CE8852F5BF9AEB34D2527D4240C5387F130A11F5BF8672A25D857C42408CA19C6857A1F4BF889D29745E7F4240C5C9FD0E4581F4BFF8A57EDE5480424001FBE8D495CFF4BF1EA7E8482E834240083D9B559FABF4BF36B05582C589424061376C5B94D9F4BF6F2F698CD6894240C520B0726891F4BF1344DD07208D42401A69A9BC1D61F4BF9352D0ED258D42408E588B4F0130F4BF
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

COPY public.education_facility (id, name, school_number, category, level, reg_status, ownership_type, owner, catchment, male_enrollment, female_enrollment, number_teachers, number_other_staff, number_classrooms, number_male_toilets, number_female_toilets, avg_fees_term, number_handwashing_stns, mhm, parcel_tenure, tenancy, settlement_id, code, geom) FROM stdin;
1	Imaan Integrated School	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	18d1fcca-ec6f-4e15-826d-86ea854d239a	0101000020E610000043E966DA59734240A674FA8BEA1EF5BF
2	Emmaus Group of Schools	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	846b190d-fc9c-4673-82ca-8eb6d81428f7	0101000020E6100000B4AB90F2937242405FB4C70BE910F5BF
3	Emmaus Junior Academy Primary School	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	b0dff123-c585-493d-a074-991a170e4615	0101000020E6100000E2C2CB1D4772424071C56A984618F5BF
4	Harvest View Academy & Junior Secondary	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	2bb4531d-f051-44c9-8d24-953411f1f90f	0101000020E6100000066C62DC6875424078955A947EE7F4BF
6	Emmaus High School	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	b1e530bd-642b-483c-9358-695b1e64ec8e	0101000020E6100000B823F7CF2E724240FE49D7A7770CF5BF
7	ELO-HIM ACADEMY PRI	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	97582571-3616-4279-b47c-261fc0477430	0101000020E610000052B81E85EB7142401F85EB51B81EF5BF
8	EMBAKASI PRI SCH	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	426e5ade-e7a0-45d8-aecc-737c32ea188e	0101000020E6100000A30C0BA47A7442404D4E48C6C5CCF4BF
9	Embakasi Prebysterian Academy	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	2e1fefa6-0ca8-4fc3-bca5-527be8df2b59	0101000020E6100000C7A41A51357542402374869801DDF4BF
10	Bester High School	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	8ca6834f-d4dd-4c16-98ee-98f45128f50c	0101000020E61000006B494739987142406A4FC939B107F5BF
11	Great Achievers Preparatory School	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	b282c9b8-f8f0-4d5c-a5fb-646dadc67b0e	0101000020E61000008227E3CE3B724240845B881FAD3BF5BF
12	MZESA ACADEMY -PRI	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	a678aa9c-2ffc-4c09-9f4a-80b87ecfa5dd	0101000020E610000014AE47E17A744240A4703D0AD7A3F4BF
13	Better Start Junior School	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	717d06da-aa0a-43f6-97b1-9e51e71db10e	0101000020E6100000112A82493B73424082C476F700DDF4BF
14	St. Bakhita Primary and Junior High School	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	d9053a26-6a09-491c-81df-5f3f969cf97f	0101000020E61000000E999768356D42408A7B87365B34F5BF
15	Asasi Academy Boarding/Day School	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	532ebf26-e549-48a2-8777-46d1e00d0670	0101000020E61000001DD83BED3A744240D83E2EBB71BCF4BF
16	AEF RUEBEN PRI SCH	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	6b5ce38a-1949-4dfa-9777-6d0e8bf27a41	0101000020E61000004E8BB0975C6F4240901B34AAC2F5F4BF
17	TIMANNE JUNIOR ACADEMY - PRI	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	3e9c9803-15df-4c5b-b683-8f2ecd49fb44	0101000020E6100000AE765E74C3754240BEBF417BF551F4BF
18	ST EMMA ACADEMY	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	f2b334ab-847a-424b-93ec-a2eb62555072	0101000020E6100000B745990D32734240BFAC9A3116D7F3BF
19	Embakasi Secondary School	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	dd4fc38d-31aa-453c-95e4-aa44cb4e7dc5	0101000020E61000005F8E684CD2744240E2299ABD226EF4BF
20	CATHSAM PRI SCH	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	9084ffd1-2d46-4a93-baec-57d5a57f2f04	0101000020E610000052B81E85EB7142407B14AE47E17AF4BF
21	Daycare and Kindergarten|Prism Kindergarten School	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	b0538cbc-5a7b-4259-a0e1-8ae2661f3ed4	0101000020E61000008C07A579117342407BD404F63D0FF5BF
22	Tumaini Preparatory And Kindergarten Education Centre	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	3474f296-7059-46bb-a5ed-efc3c7d5b6b8	0101000020E610000054E0641BB87142402E43D25DC8F9F4BF
23	Good Testimony Kindergarten	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	86bfc194-92ac-44da-88c9-993fd0b2ae60	0101000020E61000001ED324C2D075424067A8401CDAF6F4BF
24	Imaan Integrated School	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	69ff10b3-0080-4c33-9c55-7345ad0e1a3c	0101000020E610000043E966DA59734240A674FA8BEA1EF5BF
25	EMMAUS JUNIOR ACADEMY PRI	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	2df636bc-b8f2-42a3-bfed-671d6cbd6693	0101000020E610000052B81E85EB7142401F85EB51B81EF5BF
26	Bumblee Kindergarten & Playschool	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	08fb7a28-c3a7-4488-a34a-424ae5e28969	0101000020E6100000A4DEF87F7A724240EF0FA5074FB2F4BF
27	Blessed kid kindergarten	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	0dc09f35-ea80-4b8a-b8ed-72fbe8c888b4	0101000020E61000003588C55EDE7A4240EF92382BA266F4BF
28	nairobi world of kindergaten	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	3ad0dbbe-d674-4b72-9a3d-f4ddf3d028a7	0101000020E61000005FDACB118D6A4240C5C0DFD4ACB8F4BF
29	Saint Bakhita Kindergarten	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	5f76bafc-536a-404a-8744-2f71f5028566	0101000020E610000045BB0A293F6B4240981EA8AED70FF5BF
30	Famica Montessori Kindergarten	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	9917dfd4-fd25-468d-ac92-f9112bb8fb65	0101000020E61000005E62D119BD7B42405B2CA0AB0892F4BF
31	Utawala Kindergarden & Primary School	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	8172aaaa-57b3-4a11-b00b-1ae2e0e53b10	0101000020E610000067B96C74CE7A424099AC9B9CEB85F4BF
32	kyndercare kindergarten	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	84626653-be0c-409b-b489-1ca39836092c	0101000020E6100000CFAFF72C196A4240B4D3C55C0828F5BF
33	Syrram kindergarten	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	fb866d1a-8212-478e-90ab-7911b3d247a0	0101000020E6100000ADA00ED022564240698AA5ED04E0F4BF
34	Lavington Montessori Kindergarten	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	11e2938f-f7b3-4449-9970-fca41434078f	0101000020E61000009F234D17BD62424034C06092254EF4BF
35	Bletag Kindergarten	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	eef387a9-837b-4466-94ea-042bd4cd66ad	0101000020E61000000D501A6A1460424003081F4AB424F4BF
36	Lavington Kindergarten	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	9beb0338-007f-41ee-b923-7edd7bfc9590	0101000020E610000048707E1EFE604240F9A985ED829CF4BF
37	Kidpalace Kindergarten and Grade School	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	b3226739-d284-43c6-86f4-8588df514838	0101000020E6100000BF863B72FF5C42406E1393DC065AF6BF
38	Imani Montessori School in Nairobi Kenya	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	e99cd605-0cbc-437e-a397-8eda1a9899a8	0101000020E61000000A28791AD56242406D0CF0935953F4BF
39	Kindergarten	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	b544be86-ef57-4c0f-9f5f-d8413f937d2b	0101000020E610000048814FBD7F5B4240AB668CC525FDF4BF
40	Langata Kindergarten	\N	\N	\N	OPERATIONAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	cabafa74-5941-4fa0-9845-cde4be44bed2	0101000020E6100000A39D899FB5634240815D4D9EB23AF5BF
5	EMBAKASI PREBYSTERIAN ACADEMY	\N	\N	\N	OPERATIONAL	\N	\N	\N	1	11	11	111	11	1	3	\N	4	4	\N	\N	1	066f3543-53b4-4e55-91c7-cc7843325f3d	0101000020E6100000A30C0BA47A7442404D4E48C6C5CCF4BF
68	Mumliz School	primary_school	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	1	0101000020E6100000403B6C7EEB74424030C499CCF9DDF4BF
69	Trinity Child Friendly Centre	kindergarten	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	2	0101000020E6100000109686B8DE744240C2FD03816DDFF4BF
70	Sharp Brains Learning Center 	kindergarten	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	3	0101000020E610000056B44020E5744240D80AD089F2E0F4BF
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

COPY public.health_facility (id, name, facility_number, level, reg_status, ownership_type, owner, inpatient, patients_per_day, number_beds, occupancy, number_doctors, number_clinical_officers, number_pharm, number_nurses, parcel_tenure, tenancy, settlement_id, code, geom) FROM stdin;
35	St Marys Embakasi - felix 	NA	Level 2	Registered	Registered	tsss	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	1	cbb3096e-0cd0-43ee-8f37-533d6b883276	0101000020E6100000702F3E0D5D75424080A515AB81E1F4BF
1	Waikiki Health Services	14585	Level 2	Registered	Private Practice	Private Practice - Clinical Officer	t	\N	3	\N	\N	\N	\N	\N	\N	\N	1	25652	0101000020E6100000011B6BDA20724240DE12CA0C65F2F4BF
2	Penda health limited tassia	66966	Level 3	Registered	Private Practice	Private Practice - Private Company	t	\N	7	\N	\N	\N	\N	\N	\N	\N	1	25344	0101000020E610000015600E71627242407F40B15FC1E7F4BF
3	Olivelink Healthcare Limited	39408	Level 3	Registered	Private Practice	Private Practice - Private Company	t	\N	14	\N	\N	\N	\N	\N	\N	\N	1	24991	0101000020E6100000EA78CC4065724240552BB8C436EEF4BF
4	K.P.A ICD Clinic Nairobi	1308	Level 3	Registered	Ministry of Health	Public Institution - Parastatal	t	\N	7	\N	\N	\N	\N	\N	\N	\N	1	24914	0101000020E6100000F2D313F131734240128CDE043A2EF5BF
5	Royaleridah Medical Clinic	16283	Level 2	Registered	Private Practice	Private Practice - Clinical Officer	t	\N	5	\N	\N	\N	\N	\N	\N	\N	1	24883	0101000020E6100000F2D313F131734240128CDE043A2EF5BF
6	Wells Womens Hospital Limited	16018	Level 2	Registered	Private Practice	Private Practice - General Practitioner	t	\N	10	\N	\N	\N	\N	\N	\N	\N	1	24630	0101000020E6100000F2D313F131734240128CDE043A2EF5BF
7	Bristol Park Hospital Fedha	None	Level 4	Not Registered	Private Practice	Private Practice - Private Institution Academic	t	\N	45	\N	\N	\N	\N	\N	\N	\N	1	24587	0101000020E6100000ED3FD763C7724240B678C25C9C02F5BF
8	Little Rock Childrens Clinic	None	Level 2	Not Registered	Private Practice	Private Practice - Clinical Officer	t	\N	4	\N	\N	\N	\N	\N	\N	\N	1	24536	0101000020E6100000714FA10447744240F8C1F9D4B1EAF4BF
9	Baby Blessing Medical Services	7131	Level 3	Registered	Private Practice	Private Practice - Nurse / Midwifery	t	\N	10	\N	\N	\N	\N	\N	\N	\N	1	24278	0101000020E6100000F908466F02734240ACF424FAC6E1F4BF
10	RFH Health Care LTF-Embakasi Medical Clinic	15534	Level 2	Registered	Private Practice	Private Practice - Medical Specialist	t	\N	4	\N	\N	\N	\N	\N	\N	\N	1	24174	0101000020E61000002B700DC74E7442400CB7D7DD97EEF4BF
11	Rheema Hospital	5922	Level 4	Registered	Private Practice	Private Practice - General Practitioner	t	\N	5	\N	\N	\N	\N	\N	\N	\N	1	24001	0101000020E61000009091A2844F734240520548D9C7EFF4BF
12	Vebeneza Medical Clinic	None	Level 2	Not Registered	Private Practice	Private Practice - Clinical Officer	t	\N	3	\N	\N	\N	\N	\N	\N	\N	1	23719	0101000020E61000002A91442FA37442400010C18245CFF4BF
13	Bahati Tassia Medical Centre	15050	Level 2	Registered	Private Practice	Private Practice - Clinical Officer	t	\N	10	\N	\N	\N	\N	\N	\N	\N	1	23718	0101000020E6100000194EE3288A734240B863A021D2E5F4BF
14	Rangel Medical Centre	None	Level 2	Not Registered	Private Practice	Private Practice - Private Institution Academic	t	\N	13	\N	\N	\N	\N	\N	\N	\N	1	23715	0101000020E6100000F2D313F131734240128CDE043A2EF5BF
15	Hope World Wide Kenya Tassia	218/051/99913/1253	Level 3	Registered	Non-Governmental Organizations	Non-Governmental Organizations	t	\N	2	\N	\N	\N	\N	\N	\N	\N	1	23415	0101000020E6100000FE214784906F42403685DF974407F5BF
16	Bliss GVS Embakasi Clinic	14758	Level 2	Registered	Private Practice	Private Practice - General Practitioner	t	\N	4	\N	\N	\N	\N	\N	\N	\N	1	23058	0101000020E610000063C8FB82276942403BD395198097F4BF
17	Nimoli Medical Services (Fedha)	2458	Level 2	Registered	Private Practice	Private Practice - General Practitioner	f	\N	0	\N	\N	\N	\N	\N	\N	\N	1	23050	0101000020E61000002638F581E47242401AA721AAF0E7F4BF
18	Joyland F Clinic Tassia	3030	Level 2	Registered	Faith Based Organization	Other Faith Based	t	\N	8	\N	\N	\N	\N	\N	\N	\N	1	23002	0101000020E610000050166305647242403B1279DC01E8F4BF
19	Avenue Health Care Embakasi	None	Level 2	Not Registered	Private Practice	Private Practice - General Practitioner	t	\N	8	\N	\N	\N	\N	\N	\N	\N	1	22562	0101000020E61000008710FC146C734240A33CF372D83DF5BF
20	Transami Medical Centre	None	Level 2	Not Registered	Private Practice	Private Practice - Clinical Officer	t	\N	4	\N	\N	\N	\N	\N	\N	\N	1	22521	0101000020E61000005D1D119DAF724240234A7B832F2CF5BF
21	Kenya Airways Pride Clinic	None	Level 2	Not Registered	Ministry of Health	Public Institution - Parastatal	t	\N	4	\N	\N	\N	\N	\N	\N	\N	1	22018	0101000020E6100000FE34A44055754240FB8CB04DCF00F5BF
22	Gatwekera B Dispensary	None	Level 2	Not Registered	Ministry of Health	Ministry of Health	f	\N	0	\N	\N	\N	\N	\N	\N	\N	1	21189	0101000020E6100000F2D313F131734240128CDE043A2EF5BF
23	Blissgvs Health Care(Pipeline)	None	Level 2	Not Registered	Private Practice	Private Practice - Clinical Officer	f	\N	0	\N	\N	\N	\N	\N	\N	\N	1	21050	0101000020E6100000384C3448C172424049AD41A90716F5BF
24	Lina Medical Services	None	Level 2	Not Registered	Ministry of Health	Ministry of Health	t	\N	6	\N	\N	\N	\N	\N	\N	\N	1	20406	0101000020E6100000E0F599B33E7342403A94A12AA652F5BF
25	AAR Health Care	None	Level 2	Not Registered	Private Practice	Private Practice - General Practitioner	t	\N	6	\N	\N	\N	\N	\N	\N	\N	1	20405	0101000020E6100000E1A58A98C87442403B8FE5B8AEF3F4BF
26	Connections Medical Clinic	None	Level 2	Not Registered	Private Practice	Private Practice - Nurse / Midwifery	t	\N	2	\N	\N	\N	\N	\N	\N	\N	1	19450	0101000020E6100000F2D313F131734240128CDE043A2EF5BF
27	Agakhan University Clinic (Embakasi)	None	Level 2	Not Registered	Private Practice	Private Practice - General Practitioner	t	\N	6	\N	\N	\N	\N	\N	\N	\N	1	18894	0101000020E61000007AA9D898D77242400AE764F38219F5BF
28	Getrude Embakasi Clinic	None	Level 2	Not Registered	Private Practice	Private Practice - General Practitioner	t	\N	6	\N	\N	\N	\N	\N	\N	\N	1	18395	0101000020E61000006F078FDBD4714240FE6C9A2D0F48F5BF
29	Bristal Park Hospital	None	Level 4	Not Registered	Private Practice	Private Practice - General Practitioner	t	\N	8	\N	\N	\N	\N	\N	\N	\N	1	18271	0101000020E6100000A128756E7F72424099A2B7D33102F5BF
30	Romieva Medical Centre	None	Level 3	Not Registered	Non-Governmental Organizations	Non-Governmental Organizations	t	\N	20	\N	\N	\N	\N	\N	\N	\N	1	17861	0101000020E6100000F2D313F131734240128CDE043A2EF5BF
31	JKIA Health Centre	None	Level 3	Not Registered	Ministry of Health	Ministry of Health	t	\N	4	\N	\N	\N	\N	\N	\N	\N	1	12991	0101000020E610000031AA567089764240B25EB12BD229F5BF
32	Garrison Health Centre	None	Level 3	Not Registered	Ministry of Health	Armed Forces	f	\N	0	\N	\N	\N	\N	\N	\N	\N	1	12947	0101000020E6100000F2D313F131734240128CDE043A2EF5BF
33	Kapu Medical Clinic	None	Level 2	Not Registered	Private Practice	Private Practice - General Practitioner	f	\N	0	\N	\N	\N	\N	\N	\N	\N	1	13002	0101000020E6100000F2D313F131734240128CDE043A2EF5BF
34	Embakasi Health Centre	None	Level 3	Not Registered	Ministry of Health	Ministry of Health	f	\N	0	\N	\N	\N	\N	\N	\N	\N	1	12935	0101000020E6100000E5DAABEA407242404D2B2A87BB3FF5BF
\.


--
-- Data for Name: households; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.households (id, settlement_id, name, gender, national_id, kra_pin, marital_status, education_level, residence_type, length_stay, ownership_status, photo, hh_size_03, hh_size_414, hh_size_1520, hh_size_2125, hh_size_2655, hh_size_gt55, over_80, terminally_ill, ph_disabled, orphans, ment_disabled, hearing_disabled, visual_disabled, emp_status, income_level, type_structure, struct_owner, rent_payable, address, code) FROM stdin;
67	1	Festus Rubara Mukiri	Male	Emba67	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba67
68	1	Florence Auma Ochieno	Female	Emba68	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba68
70	1	Florence Mueni Munywoki	Female	Emba70	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba70
71	1	Florence Ndunge	Female	Emba71	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba71
83	1	George Wambua Mutwiwa	Male	Emba83	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba83
75	1	Francis Mwangi Waichari	Male	Emba75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba75
57	1	Eluid Kipkosgei Cherop	Male	Emba57	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba57
8	1	Alex Omollo	Male	Emba8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba8
58	1	Emily Kahuria Wangari	Female	Emba58	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba58
59	1	Emily Wangari Kahuria	Female	Emba59	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba59
60	1	Emma Daniel Kalii	Female	Emba60	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba60
61	1	Emmah Wangui Munene	Female	Emba61	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba61
17	1	Annah Omwari	Female	Emba17	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba17
3	1	Addy Ngombe Wafula	Male	Emba3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba3
77	1	Fridah Igoji Mrimunya	Female	Emba77	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba77
63	1	Erick Gordon Obare Aloo	Male	Emba63	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba63
45	1	Daniel Ogechi Kinara	Male	Emba45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba45
65	1	Fancy Jebet Rotich	Female	Emba65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba65
66	1	Fanuel Jauko Owino	Male	Emba66	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba66
85	1	Gibson Mwangi Warui	Male	Emba85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba85
54	1	Elizabeth Atieno Awuor	Female	Emba54	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba54
86	1	Gideon  Muregwa Muriithi	Male	Emba86	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba86
89	1	Hannah Wariara Thiong’O	Female	Emba89	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba89
35	1	Charles Odhiambo Onongo	Male	Emba35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba35
88	1	Hannah Nyambura Maina	Female	Emba88	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba88
25	1	Benjamin Safari Kisilu	Male	Emba25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba25
10	1	Alice Mogendi	Female	Emba10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba10
78	1	Gabriel Karaya Murage	Male	Emba78	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba78
62	1	Emmanuel Mutisya Joel	Male	Emba62	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba62
79	1	Geoffrey Gatuna Kungu	Male	Emba79	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba79
80	1	George Ngatia Jackson	Male	Emba80	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba80
81	1	George Odiwuor Awuonda	Male	Emba81	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba81
90	1	Helen Kemunto Obwocha	Female	Emba90	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba90
64	1	Evanson Kingori Ndiragu	Male	Emba64	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba64
16	1	Annah Kanini Maingi	Female	Emba16	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba16
76	1	Francis Orata Muntendo	Male	Emba76	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba76
2	1	Abraham Kirwa Ngetich	Male	Emba2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba2
22	1	Beatrice Junga Ondigu	Female	Emba22	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba22
13	1	Angelina Itaya Otieno	Female	Emba13	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba13
36	1	Cheruiyot Kiplangat Alfred	Male	Emba36	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba36
87	1	Gilbert M Munyao	Male	Emba87	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba87
72	1	Francis Kamenwa Chege	Male	Emba72	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba72
6	1	Agnes Wambui Wang’Ombe	Female	Emba6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba6
56	1	Elizabeth Wawira Kariithi	Female	Emba56	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba56
9	1	Alexander Musembi	Male	Emba9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba9
11	1	Alice Njeri Ngochi	Female	Emba11	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba11
4	1	Agnes N’Salambi Mbuthye Mbondo	Female	Emba4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba4
12	1	Alice Wambui Karanja	Female	Emba12	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba12
82	1	George Oluoch Onyango	Male	Emba82	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba82
14	1	Angelina Kanini Mutunga	Female	Emba14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba14
15	1	Ann Waruguru Gitau	Female	Emba15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba15
19	1	Anthony Ngugi Kamau	Male	Emba19	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba19
20	1	Anyona Rosemary	Female	Emba20	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba20
21	1	Arther Onyango	Male	Emba21	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba21
74	1	Francis Mwangi	Male	Emba74	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba74
23	1	Benard Kyangu Peter Musango	Male	Emba23	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba23
24	1	Benjamin Ratemo	Male	Emba24	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba24
27	1	Boniface Kasanga Mutua	Male	Emba27	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba27
29	1	Caroline J Kiprotich	Female	Emba29	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba29
69	1	Florence Kanini Musyoki	Female	Emba69	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba69
43	1	Cyprian Aritho Kithuri	Male	Emba43	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba43
91	1	Hellen Adhiambo Onunda	Female	Emba91	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba91
30	1	Caroline Mbula Makenzi	Female	Emba30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba30
31	1	Catherine Wanjiku Kamiri	Female	Emba31	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba31
73	1	Francis Muchira Kithece	Male	Emba73	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba73
32	1	Cecilia Gaceri Mugambi	Female	Emba32	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba32
33	1	Charles Agachi	Male	Emba33	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba33
34	1	Charles Murigi M	Male	Emba34	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba34
37	1	Chrisantus Nyabuto Oigo	Male	Emba37	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba37
38	1	Chrispus Muthoka Ndunda	Male	Emba38	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba38
39	1	Christine Munyiva Mutua	Female	Emba39	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba39
40	1	Christiner Mueni Musau	Female	Emba40	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba40
41	1	Collins Kiprop Cheruiyot	Male	Emba41	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba41
42	1	Cornelius Kiio Somba	Male	Emba42	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba42
5	1	Agnes Ndululu Tuta	Female	Emba5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba5
44	1	Daniel Mule Anthony	Male	Emba44	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba44
46	1	David Kamau Wanyoike	Male	Emba46	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba46
47	1	David Mbithi Kilimbua	Male	Emba47	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba47
48	1	David Mbogo Mwangangi	Male	Emba48	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba48
84	1	Gerald Kamotho Muturi	Male	Emba84	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba84
49	1	David Mwoya Gakure	Male	Emba49	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba49
50	1	David Okeyo Nyagowa	Male	Emba50	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba50
51	1	Dinah Jebet Sang	Female	Emba51	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba51
52	1	Dorcas Wairimu Mungai	Female	Emba52	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba52
53	1	Dorothy Syombua Muthee	Female	Emba53	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba53
55	1	Elizabeth Wakagio	Female	Emba55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba55
159	1	Micheal Nganga Thiru	Male	Emba159	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba159
175	1	Nancy Wairimu Kamuri	Female	Emba175	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba175
160	1	Millicent Njoki Ndungu	Female	Emba160	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba160
172	1	Mutua Ndeme	Male	Emba172	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba172
112	1	John Njue Njogu	Male	Emba112	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba112
161	1	Mohammed Salimu Mwalonya	Male	Emba161	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba161
162	1	Monicah Mwendo Ndululu	Female	Emba162	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba162
165	1	Moses Eloloi	Male	Emba165	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba165
178	1	Ngele Mwazighe	Male	Emba178	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba178
104	1	Jane Wairimu Gikonyo	Female	Emba104	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba104
97	1	Jafred Imeli Atsiaya	Male	Emba97	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba97
153	1	Mary Nkirote Mbobua	Female	Emba153	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba153
154	1	Mary Wanjiku	Female	Emba154	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba154
157	1	Michael Odhiambo Muhare	Male	Emba157	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba157
158	1	Michael Oganda Okumu	Male	Emba158	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba158
123	1	Josephine Nzula Muange	Female	Emba123	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba123
94	1	Jacinta Syombua	Female	Emba94	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba94
133	1	Kerani Kilisha Gwandoho	Male	Emba133	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba133
143	1	Lydia Wanja Irungu	Female	Emba143	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba143
127	1	Julius Kyalo Wanjau	Male	Emba127	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba127
168	1	Muruthi Titus Thuo	Male	Emba168	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba168
98	1	James Kyalo Ndumo	Male	Emba98	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba98
169	1	Musyoka Mutunga Musyoki	Male	Emba169	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba169
130	1	Julius Omukonyi Lolo	Male	Emba130	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba130
102	1	Jane Muthoni Kamuyu	Female	Emba102	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba102
171	1	Mutua Inani	Male	Emba171	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba171
163	1	Monicah Nyawira Thiro	Female	Emba163	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba163
110	1	Joan Kigen	Female	Emba110	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba110
176	1	Nanies Kinanu Daniel	Female	Emba176	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba176
121	1	Joseph Ruriga Munyi	Male	Emba121	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba121
174	1	Nahashon Maina Ngatho	Male	Emba174	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba174
177	1	Naomi Kwamboka Aruya	Female	Emba177	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba177
114	1	Joseph Gatundu Kiiru	Male	Emba114	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba114
179	1	Nicholas Muia Wambua	Male	Emba179	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba179
181	1	Olivia Aoko Omollo	Female	Emba181	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba181
93	1	Isaac Njeru Mwangangi	Male	Emba93	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba93
164	1	Moses Awino Okeyo	Male	Emba164	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba164
170	1	Muthoni Mary Kariuki	Female	Emba170	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba170
99	1	James Mwaniki Njuguna	Male	Emba99	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba99
100	1	Jane Karimi Kangethe	Female	Emba100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba100
101	1	Jane Moraa Richard	Female	Emba101	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba101
105	1	Janet Jepkoech Kosgey	Female	Emba105	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba105
106	1	Janeth Nyaboke Masita	Female	Emba106	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba106
107	1	Japheth Wambua Kyengo	Male	Emba107	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba107
151	1	Mary Muthoni Kamau	Female	Emba151	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba151
108	1	Jeniffer Mantu Kimuge	Female	Emba108	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba108
167	1	Moses Kiptanui Siele	Male	Emba167	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba167
109	1	Jennifer Mueni Nzuki	Female	Emba109	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba109
111	1	John Gitau Kamanji	Male	Emba111	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba111
113	1	Johnston Mutuku Mwanza	Male	Emba113	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba113
115	1	Joseph Kilonzo Mbumbu	Male	Emba115	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba115
116	1	Joseph Maina Githau	Male	Emba116	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba116
117	1	Joseph Munene Muria	Male	Emba117	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba117
118	1	Joseph Ndungu Gacugu	Male	Emba118	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba118
119	1	Joseph Njogu Thiru	Male	Emba119	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba119
120	1	Joseph Njoroge Mutugi	Male	Emba120	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba120
122	1	Josephine Muthoni Muhia	Female	Emba122	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba122
155	1	Matayo Oluoch	Male	Emba155	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba155
124	1	Joshua Kioko Mutungi	Male	Emba124	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba124
125	1	Joshua Koech Kipkurui	Male	Emba125	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba125
126	1	Joyce Mutinda Mwololo	Female	Emba126	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba126
128	1	Julius Oduor Okoth	Male	Emba128	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba128
140	1	Lucy Waithera	Female	Emba140	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba140
129	1	Julius Okora Ondieki	Male	Emba129	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba129
95	1	Jacinta Wairimu Njoroge	Female	Emba95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba95
180	1	Njeri Ngochi Bernadette	Female	Emba180	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba180
131	1	Justin Irungu	Male	Emba131	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba131
132	1	Justus Nzioka Mutwiwa	Male	Emba132	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba132
166	1	Moses Kibet Chelugui	Male	Emba166	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba166
134	1	Kithinji Edwin Muthuri	Male	Emba134	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba134
135	1	Lawrence Muchoki Irungu	Male	Emba135	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba135
136	1	Leonora Odera Akongo	Male	Emba136	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba136
137	1	Lilian Bosibori Ochwangi	Female	Emba137	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba137
138	1	Linet Apiyo Oginga	Female	Emba138	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba138
139	1	Linet Mmbone Agesa	Female	Emba139	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba139
141	1	Lucy Wanjiku Chege	Female	Emba141	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba141
142	1	Lydia Odoli Waburiri	Female	Emba142	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba142
173	1	Mwendwa Muvengei	Male	Emba173	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba173
144	1	Maina Kagiri Kibubu	Male	Emba144	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba144
145	1	Maluki Kimotho Mumbo	Male	Emba145	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba145
146	1	Margaret Mbithe Muthoka	Female	Emba146	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba146
147	1	Margaret Muthoni Mwangi	Female	Emba147	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba147
149	1	Martin Masya Musango	Male	Emba149	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba149
150	1	Mary Mueni Masilia	Female	Emba150	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba150
152	1	Mary Mutindi Kimulu	Female	Emba152	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba152
148	1	Martha Kanini Mwau	Female	Emba148	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba148
214	1	Selvestas Juma Omadwa	Male	Emba214	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba214
215	1	Shadrack Gitonga Njeru	Male	Emba215	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba215
156	1	Melisa Atsulu Oluoch	Female	Emba156	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba156
197	1	Richard Chepto Chemweno	Male	Emba197	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba197
231	1	William Mwangi Karimi	Male	Emba231	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba231
182	1	Patrick Karanja Kamuyu	Male	Emba182	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba182
183	1	Patrick Kimatu Kioko	Male	Emba183	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba183
216	1	Silvester Kibiwott Kinyor	Male	Emba216	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba216
198	1	Richard Muendo Kimani	Male	Emba198	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba198
184	1	Paul Kimani Ngarama	Male	Emba184	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba184
185	1	Paul Kisilu Musili	Male	Emba185	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba185
232	1	Zacheus Musungu Kangu	Male	Emba232	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba232
233	1	Zipporah Mwongeli Muteti	Female	Emba233	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba233
217	1	Simon Mungai Mwaura	Male	Emba217	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba217
186	1	Paul Mbuuri	Male	Emba186	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba186
187	1	Paul Mutala Kavita	Male	Emba187	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba187
218	1	Simon Musyoki Ndambuki	Male	Emba218	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba218
199	1	Robert Kangogo Kulei	Male	Emba199	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba199
200	1	Robert Kebande Morema	Male	Emba200	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba200
201	1	Rose Ndungwa Mutinda	Female	Emba201	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba201
202	1	Rose Nyaura	Female	Emba202	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba202
203	1	Roselyne Korongo Kagai	Female	Emba203	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba203
204	1	Rosemary Achando Oluchina	Female	Emba204	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba204
2331	2	CHURCH OF CHRIST IN AFRICA	Male	1400	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_88
205	1	Rosemary Njambi Karugu	Female	Emba205	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba205
219	1	Stanely Gatura Njima	Male	Emba219	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba219
2332	2	ISRAEL ASSEMBLIES OF GOD	Male	18238	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_245
2333	2	JESUS POWER OF PRAISE CHURCH	Male	41515	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_310
220	1	Stanely Mulige Musyoka	Male	Emba220	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba220
1	1	Abdi Omar Shelkh	Male	Emba1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba1
206	1	Ruth Mbula Josphat Mweu	Female	Emba206	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba206
207	1	Sabina Mongina Keriga	Female	Emba207	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba207
7	1	Albert Karani Murithi	Male	Emba7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba7
221	1	Stanley Kamau Gaicuru	Male	Emba221	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba221
2334	2	MARY WANJIKU MUTURI	Female	253714	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_498
2335	2	CHARLES NDICHU MWAURA	Male	353153	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_79
188	1	Peter Maina Wanene	Male	Emba188	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba188
18	1	Annastasia Kemunto Magaki	Female	Emba18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba18
189	1	Peter Njenga Thiru	Male	Emba189	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba189
2336	2	PETER GITHUKA KIRIBA	Male	354911	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_603
222	1	Stephen Ngei Musyoka	Male	Emba222	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba222
208	1	Samuel  Wanjohi Muchiri	Male	Emba208	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba208
26	1	Berita Wanza Kioko	Female	Emba26	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba26
190	1	Peter Thiora M’Inoti	Male	Emba190	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba190
28	1	Boniface Kingoku Ndunda	Male	Emba28	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba28
2337	2	SUSAN WAIRIMU GATOGO	Female	355041	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_739
209	1	Samuel Kimani Nzuki	Male	Emba209	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba209
223	1	Stephen Warui Njagatha	Male	Emba223	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba223
191	1	Peterson Ombego Nyakego	Male	Emba191	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba191
92	1	Idah Crispus Tito	Female	Emba92	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba92
2338	2	EMILY AYUMA AGOI	Female	453152	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_142
192	1	Philemona Namoni Toywa	Female	Emba192	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba192
224	1	Tatu Nuthoni Ali	Female	Emba224	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba224
193	1	Philip Kyaula Mbova	Male	Emba193	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba193
194	1	Rael Kamulu Ngumbi	Female	Emba194	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba194
210	1	Samuel Mwangi Mugo	Male	Emba210	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba210
2339	2	JAMES RUO WANGAI	Male	493596	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_269
225	1	Teresia Waithira Karioki	Female	Emba225	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba225
195	1	Reuben Ngarihiu Ngathia	Male	Emba195	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba195
96	1	Jackline Ngina Muthoka	Female	Emba96	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba96
211	1	Samuel Ngugi Mwaura	Male	Emba211	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba211
2340	2	FRANCIS KINGARA KAMAU	Male	494924	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_173
103	1	Jane Nyambura Gachigo	Female	Emba103	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba103
2341	2	FREDRICK MBURU KIANYA	Male	528223	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_183
212	1	Samuel Ntholi Muoki	Male	Emba212	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba212
2342	2	JOSEPH WATHANGA WAHOME	Male	552840	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_369
226	1	Thomas Muia Mutua	Male	Emba226	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba226
227	1	Titus Keen Mwangi	Male	Emba227	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba227
228	1	Vicky Jeptoo Changwony	Female	Emba228	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba228
2343	2	MARY NJERI WATHANGA	Female	553085	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_479
196	1	Richard - Nyarago	Male	Emba196	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba196
213	1	Samwel Oyioka Kebati	Male	Emba213	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba213
229	1	Virginia Wanjiku Munene	Female	Emba229	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba229
230	1	Wanyoike Kinuthia	Male	Emba230	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Emba230
2344	2	GRACE NDUTA NENE	Male	553557	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_218
2345	2	ALICE WAIRIMU KAMAU	Female	726184	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_13
2346	2	ESTHER WANJIRU MWANGI	Female	762392	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_158
2347	2	SAMUEL MUTURI NJUGUNA	Male	795207	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_688
2348	2	CHARLES KAMAU MWANGI	Male	812994	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_77
2349	2	BEATRICE WANGECI MWANGI	Female	894333	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_53
2350	2	CHEGE MWANGI NGANDU	Male	894371	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_84
2351	2	ALEX ISONI VYALU	Male	899654	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_9
2352	2	ESTHER GATHONI THUKU	Female	953882	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_147
2353	2	MWAURA GAKUO	Male	960088	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_549
2354	2	SERAH WANJIRU KURIA	Female	1105987	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_702
2355	2	AMOS GICHUKI KABIRU	Male	1143318	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_16
2356	2	DAVID NJAAKIO MUYA	Male	1150650	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_113
2357	2	JOSEPH BORO NGENE	Male	1191130	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_341
2358	2	REGINA WAMBUI RUORO	Female	1191443	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_643
2359	2	FRANCIS MAINA MBURU	Male	1191834	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_174
2360	2	LILIAN MUTHONI MUTAHI	Female	1216338	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_425
2361	2	BONIFACE MULI NDAUWA	Male	1219454	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_68
2362	2	VIRGINIA MUTHONI MUNGAI	Female	1271631	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_770
2363	2	GEORGE MBUTHIA NG'ANG'A	Male	1275252	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_198
2364	2	JOHN NDEGWA GITAU	Male	1296830	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_331
2365	2	MARY KIRINGA GICHAGA	Female	1336944	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_472
2366	2	NELSON GACHUHI MWANGI	Male	1385020	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_565
2367	2	MARY WAITHIRA MWANGI	Female	1386493	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_487
2368	2	GABRIEL MWANGANGI	Male	1463821	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_186
2369	2	STEPHEN KIMANI KIRU	Male	1724024	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_720
2370	2	DOMINIC NJIHIA WAINAINA	Male	1815206	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_124
2371	2	SAMSON MWANGI NGOROGE	Male	1815808	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_675
2372	2	JOSPHAT KINYUA TUNGI	Male	1816147	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_375
2373	2	AGNES MUTHONI MIRINGU	Female	1822141	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_6
2374	2	NJERI MWANGI NDUNGO	Female	1836301	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_574
2375	2	MONICAH WANZA KALOKI	Female	1836525	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_539
2376	2	JOSEPH JOHN OLALE	Male	1837094	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_344
2377	2	LUSIAH MBEERE MWAURA	Female	1839659	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_448
2378	2	SHELLMITH NYAKONYU MWENJE	Female	1840225	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_704
2379	2	CHRISTOPHER NDUNGU GITAHI	Male	1848730	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_87
2380	2	NJERI WAITHIRU	Female	1851703	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_575
2381	2	MARY WANJIRU GICHIRI	Female	1858432	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_501
2382	2	ESTHER WANGUI MBURU	Female	1858452	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_154
2383	2	MARY WAMBUI MBURU	Female	1858460	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_491
2384	2	MARY WAIRIMU NGUGI	Female	1858535	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_486
2385	2	SALOME WAMBUI WANJIRU	Female	1858570	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_668
2386	2	JAMES NJOROGE NGANGA	Male	1858636	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_267
2387	2	ELIZABETH NYAKIANDA KIMANI	Female	1858736	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_137
2388	2	JOSEPH MBUTU MURAGE	Male	1858980	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_356
2389	2	ANNAH NJERI GICHERE	Female	1859042	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_28
2390	2	PAUL KABIYO MUTALA	Male	1859061	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_586
2391	2	KIRU KIMANI KAMAU	Male	1859769	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_415
2392	2	GRACE NJERI GITHU	Male	1859934	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_219
2393	2	FESTUS MAINA MWANGI	Male	1860418	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_167
2394	2	CHEGE KURIA GATANA	Male	1860461	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_82
2395	2	JACINTA NJOKI KANYI	Male	1860784	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_246
2396	2	HANNAH WAMBUI NGE'THE	Female	1861060	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_235
2397	2	JOSEPH GICHERO WAHOME	Male	1861207	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_343
2398	2	MWIHAKI PAUL NDUATI	Male	1861405	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_550
2399	2	JEREMIAH MBATAI WAWERU	Male	1861462	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_306
2400	2	ANAH WAITHIRA MAINA	Female	1881866	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_18
2401	2	MARY WANJIRU WAINAINA	Female	1888540	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_503
2402	2	GLADYS MUHEMBI SHIKUTWA	Male	1957098	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_210
2403	2	KIRANGI JAMES NGUGI	Male	1992491	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_414
2404	2	JOHN KIMANI NJUHO	Male	2017388	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_324
2405	2	NANCY WATIRI MWANGI	Female	2024850	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_562
2406	2	JANET WAMBUI KAMANDE	Female	2027652	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_293
2407	2	LUCY NDINDA MUTISYA	Female	2031088	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_435
2408	2	DENIS KARIUKI KIGURU	Male	2274510	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_117
2409	2	ROISELINE NJERI MUGO	Male	2299455	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_650
2410	2	KIGOCHI MWAURA GATHIWI	Male	2335238	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_412
2411	2	JOSEPH KAMAU MWAURA	Male	2336948	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_347
2412	2	GEOFFREY MURIUNGI NKUBITU	Male	2487379	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_190
2413	2	MARY MULI NONE	Female	2573544	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_473
2414	2	JOHN MANYORE GITANGU	Male	2646048	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_327
2415	2	JAMES OHANGA NGIYE	Male	2763146	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_268
2416	2	SAMUEL MURAGE KARURI	Male	2884306	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_687
2417	2	PETER MUGO MWANGI	Male	2886100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_610
2418	2	MARY WAMBUI MACHARIA	Female	2889082	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_490
2419	2	BETH WANJIRU MWANGI	Female	2889661	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_64
2420	2	MARY NJERI WANJIKU	Female	2922402	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_478
2421	2	SAMWEL KAHATO MUNGAI	Male	2948921	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_692
2422	2	WANJIRU MUGWERU	Female	2956296	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_775
2423	2	JECINTA WANJA MATHU	Female	3049585	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_300
2424	2	CHARLES KIARIE MWAURA	Male	3055534	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_78
2425	2	JOSEPH KAMAU KALINDE	Male	3062028	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_346
2426	2	GRACE WAMBUI GICHINGA	Male	3064935	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_221
2427	2	JANE NJERI KAHUGU	Female	3085385	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_276
2428	2	JOHN BOSCO NJUGUNA GITAU	Male	3089990	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_313
2429	2	PETER KAMAU MBURU	Male	3090232	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_605
2430	2	PRICILA WAITHIRA MBIRU	Female	3096749	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_627
2431	2	HANNAH WAMBUI NGANGA	Female	3106409	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_234
2432	2	HANNAH WAIRIMU KAGURU	Female	3110303	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_231
2433	2	EMILY MWIHAKI MUKARIA	Female	3118865	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_143
2434	2	SAMUEL MUIHIA KARIUKI	Male	3128032	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_686
2435	2	DANIEL KIBORORO GICHURU	Male	3184464	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_95
2436	2	KAHAWA UMOJA SELF HELP GROUP	Male	3292583	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_396
2437	2	HENRY MWANGI THAKA	Male	3330149	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_242
2438	2	HANNAH WANGARI MBUGUA	Female	3330507	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_237
2439	2	CHARLES NYAGA MWANGI	Male	3331345	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_80
2440	2	ROSE OPIYO ODONGO	Female	3352932	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_655
2441	2	JOHN MAINA KAMAU	Male	3353771	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_326
2442	2	ESTHER MUTHONI KAMAU	Female	3366865	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_149
2443	2	ESTHER WANJIKU KAHURIA	Female	3369983	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_155
2444	2	JEDIDAH WAIRIMU	Female	3374805	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_301
2445	2	MILLIAM NJERI MUNYUA	Female	3383429	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_526
2446	2	JANE WANJIRA MWANGI	Female	3386061	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_288
2447	2	ALICE NYAGUTHI MICHIRI	Female	3406762	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_12
2448	2	VIRGINIA WARIGIA KIHATO	Female	3420540	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_774
2449	2	JANE NYAMBURA COMBA	Female	3451743	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_280
2450	2	MAGDALINE NYAMBURA KANG'ETHE	Male	3459481	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_454
2451	2	JOHN KAMAU NGUGI	Male	3462239	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_319
2452	2	MONICA MUGURE	Female	3463623	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_529
2453	2	NJOKI  MURITHI	Female	3463777	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_576
2454	2	MARY WANGARI MUNGAI	Female	3463840	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_495
2455	2	RUTH NJERI KAMUYU	Female	3464477	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_660
2456	2	ERNEST KINYUA M. GAKABU	Male	3464883	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_146
2457	2	MARY WAMBUI NJENGA	Female	3465965	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_494
2458	2	JOHN KIMANI KINUTHAI	Male	3472877	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_322
2459	2	DAVID SIMON MUTURI	Male	3480852	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_116
2460	2	ANNE WAIRIMU KARIUKI	Female	3482533	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_31
2461	2	ROBERT NJENGA WAMWEYA	Male	3485321	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_649
2462	2	SALOME WANJIKU KANYI	Female	3508300	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_669
2463	2	KIMANI NENE	Male	3508346	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_413
2464	2	HANNAH WAGIO GITAU	Female	3508793	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_230
2465	2	MICHAEL GIKONYO GATEHI	Male	3509264	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_514
2466	2	JULIANA MBINYO MUASYA	Female	3509570	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_387
2467	2	BENSON KARIAMBAKI KURIA	Male	3509682	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_56
2468	2	ELIZEBA MBOCI TITIMA	Female	3527035	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_140
2469	2	SAMMY CHOMBA MACHARIA	Male	3574475	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_671
2470	2	GRACE NDUTA NDUNGU	Male	3575508	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_217
2471	2	MURIGI KARIUKI	Male	3582053	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_544
2472	2	ROSEMARY NDUTA KINYUMU	Female	3654063	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_656
2473	2	ANASTACIA WAIRIMU MAINA	Female	3694325	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_19
2474	2	ROBERT MURIGI KARIUKI	Male	3697534	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_648
2475	2	SUSAN WANJIKU NDUNGU	Female	3933630	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_744
2476	2	RICHARD MWAURA NDUNGU	Male	4281267	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_647
2477	2	PATRICK NDUNGU WATHINGIRA	Male	4297773	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_583
2478	2	VERONICAH WANJIKU KURIA	Female	4304459	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_765
2479	2	FIDELIS WANJIRU MAINA	Male	4304625	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_169
2480	2	SAMUEL KAHUHU NJENGA	Male	4304917	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_676
2481	2	JOSEPH KINYANJUI NJOROGE	Male	4305430	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_350
2482	2	REGINA WANJIRU MUIRURI	Female	4307020	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_644
2483	2	JOSEPH MUIRURI NDUNGU	Male	4307022	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_360
2484	2	JAMES KIMANI MARIGA	Male	4307614	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_254
2485	2	LUCY MUTHONI WAIKENYA	Female	4307615	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_433
2486	2	JOYCE NJERI MWANGI	Female	4318628	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_378
2487	2	MUTEO WANJOYA KIMANI	Male	4318677	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_545
2488	2	LUCY WAIRIMU MBUGUA	Female	4327462	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_437
2489	2	TERESIA MUKAMI MBUTU	Female	4330164	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_750
2490	2	REWEL KABIU WANYOIKE	Female	4330524	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_646
2491	2	JAMES MUCHIRI KAMAU	Male	4331067	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_257
2492	2	BEATRICE NYAWIRA NDICU	Female	4418362	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_51
2493	2	GEORGE  KARANJA MBUTHI	Male	4418996	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_192
2494	2	JOSEPHINE MUTHONI NJOROGE	Male	4419334	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_372
2495	2	JOSEPH MIGWI KIMANI	Male	4428247	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_358
2496	2	JULIA WANJIRU	Female	4428843	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_385
2497	2	RUTH WANJIKU GITHU	Female	4429325	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_664
2498	2	EUNICE NJOKI WOKABI	Female	4430562	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_159
2499	2	JANE WAITHIRA RIUKI	Female	4430612	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_283
2500	2	PATRICK MURIGI KIRUKA	Male	4431134	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_582
2501	2	ANN WAIRIMU WANYOKE	Female	4432292	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_24
2502	2	DANSON KAMAU KAHOHI	Male	4510896	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_105
2503	2	MARY NJERI MWANGI	Female	4809957	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_477
2504	2	PERIS WAIRIMU RUGU	Female	4813814	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_601
2505	2	REGINA MUTHONI NJOROGE	Female	4814847	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_641
2506	2	TERESIAH ATIENO ANYANGO	Female	4815834	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_752
2507	2	CHEGE KARANJA	Male	4816524	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_81
2508	2	SUSAN WANGUI GITAU	Female	4817806	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_742
2509	2	MUNYAO MASIMBILI	Male	4835683	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_543
2510	2	LUCY WAITHIRA MACHARIA	Female	4835950	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_441
2511	2	FLORENCE WANJIKU NDUATI	Male	4835964	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_171
2512	2	PETER MWANGI	Male	4837775	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_613
2513	2	PETER NICHOLAS KAIRU	Male	4852443	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_616
2514	2	MACHARIA KIMANI	Male	4854500	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_1
2515	2	LUCY WAITHERA MUGURO	Female	4860555	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_439
2516	2	STEPHEN NJUGUNA KIBATHI	Male	4877825	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_732
2517	2	MICHAEL JOHNNY MUSEMBI	Male	5050557	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_517
2518	2	GRACE WANJIKU MWANGIA	Male	5143975	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_223
2519	2	BENSON NYOIKE NJOROGE	Male	5144206	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_60
2520	2	NANCY WANJIRU THUO	Female	5156261	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_561
2521	2	EJIDIO NGANGA GAKARA	Female	5177620	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_128
2522	2	HANNAH WANJIRA KARAU	Female	5178509	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_238
2523	2	PETTERSON NGANGA NJOROGE	Male	5181808	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_622
2524	2	MARGARET NYAMBURA GITUKUI	Female	5188877	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_458
2525	2	JAMES THIONGâ€™O GITAU	Male	5196640	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_270
2526	2	TABITHA WANJIRU KARIUKI	Female	5212409	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_749
2527	2	JOHN NJENGA KARIUKI	Male	5212543	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_334
2528	2	EUNICE WANJIKU CHEGE	Female	5454419	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_161
2529	2	ISMAIL MAINA KANYUGO	Male	5486209	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_244
2530	2	JULIUS WACHIRA KIMENJU	Male	5492858	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_392
2531	2	JAMES MWANGI KINYUA	Male	5494856	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_262
2532	2	HARUN WANJOHI MUNYUA	Male	5559615	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_240
2533	2	SERA WAMBUI CHEGE	Female	5590822	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_701
2534	2	MWANGI EVANS  MUTUA	Male	5615976	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_548
2535	2	HANNAH NJERI KARIUKI	Female	5699990	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_228
2536	2	JANE WANJIRU NDUNG'U	Female	5704911	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_292
2537	2	VERONICA WANJIRU KURIA	Female	5710517	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_761
2538	2	ASENATH WAMUYU MUCHERU	Female	5775518	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_46
2539	2	PETER MWANGI WANJOI	Male	5780548	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_614
2540	2	MARY WANGARI NGOORO	Female	5912618	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_496
2541	2	ANN NYAMBURA MWANGI	Female	5913036	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_22
2542	2	FRANCIS NJARAMBA MUIRURI	Male	5921094	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_177
2543	2	VERONICAH KOKI MUTUA	Female	6072315	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_762
2544	2	JENIPHER ANYANGO MAJIWA	Female	6187594	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_304
2545	2	JANE NJERI KARIUKI	Female	6366533	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_277
2546	2	TIMOTHY KURIA MWANGI	Female	6438183	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_760
2547	2	RAEL KATUMBI MFOYONGO	Female	6440299	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_632
2548	2	SAMSON MAINA KIMANI	Male	6440659	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_674
2549	2	NUNGARI KIMANI	Male	6440701	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_577
2550	2	HANNAH NGENDO WAMWEA	Female	6441758	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_227
2551	2	MARGARET WANJIRU KIBIGO	Female	6442517	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_464
2552	2	LUCY WANJIRU NDUNGU	Female	6442731	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_446
2553	2	JOHN CHEGE MUNIU	Male	6443578	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_314
2554	2	MARY WAIRIMU KARIGI	Female	6443676	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_483
2555	2	HARUN NJATHI MWANGI	Male	6454784	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_239
2556	2	MENAHEM KURIA MWANGI	Female	6485150	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_506
2557	2	FRANSISCA NYANGARISA MATONGO	Male	6559827	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_181
2558	2	PETER KORI NGORO	Male	6635521	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_609
2559	2	JOHN WAWERU KARIUKI	Male	6693068	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_338
2560	2	JOSEPH MUNYUA MBURU	Male	6715475	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_361
2561	2	BETH NYAMBURA MBUTHIA	Female	6851968	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_62
2562	2	MERCY WAMBUI CHEGE	Female	6860803	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_512
2563	2	MARY WAIRIMU NDEGWA	Female	6881432	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_485
2564	2	MARY NYAMBURA GEOFFREY MWANGI	Female	6883201	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_481
2565	2	CHRISTOPHER MUTURI NJUKIA	Female	6894240	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_86
2566	2	JANE WAIRIMU MWANGI	Female	7002561	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_282
2567	2	LUCY NYAMBURA NJENGA	Female	7027758	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_436
2568	2	KESSIAH WANGARI RICHARD MIGWI	Male	7083279	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_408
2569	2	JAMES KIMANI MWANGI	Male	7096629	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_255
2570	2	AGNES WANJIKU NJOROGE	Female	7116306	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_7
2571	2	DANIEL NJONGORO NGANGA	Male	7128476	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_102
2572	2	STEPHEN MIGWI MWENJE	Male	7159017	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_724
2573	2	GEORGE CHUMA KARIUKI	Male	7159140	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_193
2574	2	GRACE MUMBI KANYI	Male	7159158	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_216
2575	2	MARY WANJIRU GITAU	Female	7159232	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_502
2576	2	LUCY MURINGO MWANGI	Female	7159350	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_432
2577	2	JEREMIAH NJOROGE MUCHEKE	Male	7171137	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_307
2578	2	WANJIRU MWANGI	Female	7173528	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_776
2579	2	JOHN KIMANI MUGO	Male	7178226	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_323
2580	2	JACOB MAINA NGANGA	Male	7179324	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_249
2581	2	JOSEPH THUO MUTIIYA	Male	7179717	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_365
2582	2	NELSON KIGURU JOSIAH	Male	7185641	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_566
2583	2	JOYCE WANJIRU WAINAINA	Female	7189623	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_382
2584	2	MARTINA NTHAMBI MATOLO	Male	7273647	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_471
2585	2	ABIGAEL WANJA NGECHA	Female	7276268	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_2
2586	2	MARGARET NYAMBURA	Female	7277217	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_457
2587	2	SHADRACK MACHOGE MARIERA	Male	7316024	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_703
2588	2	JOSEPH WANGONDU KINYUA	Male	7328918	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_367
2589	2	JULIUS CHEGE KIHUNI	Male	7354394	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_388
2590	2	BEATRICE MUMBI KAMAU	Female	7466619	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_50
2591	2	ISHMAEL CHEGE KIMANI	Male	7550388	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_243
2592	2	CHEGE MACHARIA	Male	7564182	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_83
2593	2	RUTH WANJIKU MAIGUA	Female	7564955	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_665
2594	2	GRACE WAITHIRA GICHARU	Male	7570904	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_220
2595	2	GLADYS WAIRIMU KARIUKI	Male	7668809	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_211
2596	2	JERAD WANYOIKE	Male	7698239	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_305
2597	2	ELIZABETH NJOKI KIBIGO	Female	7879148	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_136
2598	2	NANCY WANJIRU MWANGI	Female	7985392	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_559
2599	2	NGANGA KAMAU ITUGI	Male	8060453	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_570
2600	2	JAMES GAITAIGUA	Male	8061298	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_251
2601	2	LYDIA WANGARI WACHIRA	Female	8061489	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_452
2602	2	SALOME NYAMBURA GITAU	Female	8174776	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_666
2603	2	MARGARET WANJIRU GITHINJI	Female	8432025	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_463
2604	2	LOISE WARUIRU NGETHE	Female	8432208	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_431
2605	2	RUTH NJERI MWANIKI	Female	8506607	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_661
2606	2	MARGARET WANJIKU NDIRANGU	Female	8525991	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_462
2607	2	LIVINGSTONE OCHIENGâ€™ ONGER	Female	8536932	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_426
2608	2	MONICAH WANJIRU WAWERU	Female	8574597	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_538
2609	2	JOSEPHAT NGIGI KANOGA	Male	8575863	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_371
2610	2	PETER KAMAU KIMANI	Male	8613301	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_604
2611	2	ELIZABETH BEKE	Female	8779338	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_133
2612	2	RAPHAEL MBURU	Female	8846476	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_635
2613	2	ALBERT RODENYO MBODOKA	Male	8923118	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_8
2614	2	DANIEL KAMAU MAINGI	Male	8956177	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_93
2615	2	JULIA NGENDO MUCHIRI	Female	9056787	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_384
2616	2	JANE WANJIRA NJOGU	Female	9090541	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_289
2617	2	VERONICAH WAMBUI	Female	9137852	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_764
2618	2	DAVID KIUGU GATERO	Male	9142061	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_108
2619	2	ELIJAH OMARA NYAKUNDI	Male	9149247	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_131
2620	2	JAMES MWANGI KIMANI	Male	9153715	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_260
2621	2	JAMES MWANGI KIMANI (TRUSTEE)	Male	9153715x	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_261
2622	2	PATRICK WAKORI	Male	9194982	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_584
2623	2	JOYCE NYAMBURA	Female	9195249	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_381
2624	2	MARY MUTHONI THUMBI	Female	9198406	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_475
2625	2	JOSEPH MUINDI MULI	Male	9225997	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_359
2626	2	ANDREW NJANE CHEGE	Male	9237403	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_20
2627	2	PETER KIGOCHI KAGUNYA	Male	9241813	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_607
2628	2	WILLISON MUHIA CHEGE	Male	9267400	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_779
2629	2	JOSEPH WARUI MUNYUA	Male	9302423	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_368
2630	2	ESTHER NGONYO KIMANI	Female	9346596	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_150
2631	2	DAVID GICHARU KARIUKI	Male	9347211	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_106
2632	2	LEAH WANJIRU KARANJA	Female	9347652	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_420
2633	2	JANE NYAMBURA GITHIRI	Female	9506605	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_281
2634	2	MILKA NJERI NGANGA	Female	9554601	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_523
2635	2	JANE MUMBI KIMANI	Female	9574827	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_273
2636	2	MIKA NJOMO MUNA	Female	9589179	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_522
2637	2	SAMUEL MIGWI WANJIRU	Male	9789042	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_683
2638	2	JANIFER WAMBUI MUTHONI	Female	9789064	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_295
2639	2	KEZIAH WANGARI MWANGI	Male	9789556	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_411
2640	2	PETER NJUGUNA	Male	9789557	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_618
2641	2	FRANCIS MWANGI WAINAINA	Male	9814602	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_175
2642	2	JOHN MWANIKI NDUNGâ€™U	Male	9822249	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_330
2643	2	MARY WACUKA NJOROGE	Female	9822405	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_482
2644	2	ANNE SYOMBUA MUTISYA	Female	9823246	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_30
2645	2	ESTHER WAMBUI JEREMIAH	Female	9824598	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_152
2646	2	DANIEL MAINA MBUGUA	Male	9824979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_97
2647	2	DIVINER KEMUNTO MOCHOGE	Female	9912126	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_122
2648	2	JANE WANJIKU	Female	9926737	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_287
2649	2	STEPHEN NJOROGE	Male	9926933	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_731
2650	2	JOHN NJOROGE KIHIU	Male	9944703	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_335
2651	2	GIPSON KESENWA LODENYO	Male	10070060	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_208
2652	2	JOHN HENRY NGâ€™ANGâ€™A KAGO	Male	10141004	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_318
2653	2	BERNICE NJERI NJARAMBA	Female	10166819	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_61
2654	2	ANN WAIRIMU CHEGE	Female	10177769	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_23
2655	2	VIRGINIA WAIRIMU MUGERA	Female	10319043	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_772
2656	2	JAMES KARANJA KARIUKI	Male	10331414	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_253
2657	2	JANE WANJIRU MWANGI	Female	10366054	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_291
2658	2	VICTORIA NJAMBI KARIUKI	Female	10366196	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_768
2659	2	PETER WACHIRA MUCHONJE	Male	10432200	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_620
2660	2	PENINAH NYAMBURA MURINGI	Male	10433246	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_597
2661	2	DINAH MOKEIRA ANCHOKA	Female	10469799	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_121
2662	2	JESINTA MARY WANGUI	Male	10488149	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_309
2663	2	LUCY WANJIKU NJERI	Female	10550090	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_443
2664	2	JOSEPHINE WAMAITHA MBUGUA	Male	10581387	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_373
2665	2	SAVINA SYOMBUA MATHEKA	Female	10626890	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_700
2666	2	PRISCILLA WANJIRU WAMBUI	Female	10645432	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_629
2667	2	DAVID OGWANKWA OINDO	Male	10661932	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_115
2668	2	RAPHAEL NYORO MWIHIA	Female	10671183	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_636
2669	2	GLADYS ADHIAMBO ONGâ€™ER	Male	10703692	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_209
2670	2	JAVANSON NDUNGU WAIHENYA	Male	10750543	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_298
2671	2	JOHN THUO GALAXY KABUTHA	Male	10787931	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_337
2672	2	JULIA WANJIRU GATHONI	Female	10894261	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_386
2673	2	RUTH WAITHIRA WAINANA	Female	10936117	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_663
2674	2	JANE KARIMI NJURA	Female	10976917	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_272
2675	2	JANE MUTHONI GITHINJI	Female	11149734	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_274
2676	2	DAVID NDEGWA MWANGI	Male	11153963	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_110
2677	2	JANE WANJIRU	Female	11182780	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_290
2678	2	HANNAH NDUTA KIMANI	Female	11183300	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_226
2679	2	RAHAB NJAMBI WAITHIRA	Female	11183607	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_633
2680	2	JOSEPH KIRANGA KARIUKI	Male	11183701	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_351
2681	2	SIMON KAROKI MBUGUA	Male	11190525	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_709
2682	2	FAITH WAMBUI KIURA	Male	11288276	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_164
2683	2	ANN WANJIKU NGUGI	Female	11316146	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_27
2684	2	MICHAEL IRUNGU NDIRANGU	Male	11321318	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_515
2685	2	SUSAN NJERI MAINA	Female	11334442	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_737
2686	2	JANE NJERI MBURU	Female	11355108	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_278
2687	2	SUSAN MBITHE ANIFU	Female	11403475	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_736
2688	2	JARED ANDALE AMESO	Male	11414586	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_296
2689	2	JAMES MANYARA KARIUKI	Male	11460108	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_256
2690	2	MARY NJERI MAINA	Female	11468903	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_476
2691	2	JOHN BOSCO KARIGU	Male	11590253	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_312
2692	2	CHARITY WACHERA KABAIKU	Female	11590589	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_76
2693	2	MARTIN NJAU MWANGI	Male	11590645	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_469
2694	2	JOHN KIBE WAMBUI	Male	11591235	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_320
2695	2	ANTONY KIARIE KAMAU	Male	11591807	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_37
2696	2	MIRIAM NYOKABI NGUGI	Female	11618441	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_528
2697	2	ESTHER WAMBUI WANJIRU	Female	11669858	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_153
2698	2	ELIZABETH KARUANA NDICHU	Female	11724539	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_134
2699	2	JANE WAITHIRA WAINANA	Female	11747978	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_284
2700	2	MARY WAMBUI KIMANJARA	Female	11881081	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_489
2701	2	ROXONAH WAMBUI NJENGA	Female	12499940	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_658
2702	2	SAMUEL MUIGAI WARURU	Male	12499944	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_685
2703	2	SIMON KABERIA WAMBUI	Male	12499965	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_707
2704	2	STEPHEN KIMANI NYUMU	Male	12499998	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_721
2705	2	NICHOLAS MURIUKI MUNYUA	Male	12543619	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_572
2706	2	SAMWEL KIPKORIR KIPRUTO	Male	12642768	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_694
2707	2	PIUS MURIGI COMBA	Male	12762881	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_626
2708	2	SAMMY KURIA NGAREGA	Male	12788924	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_672
2709	2	VIRGINIA WANJIKU KARANJA	Female	12833462	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_773
2710	2	THERESIA MUNYIVA MULI	Female	12867100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_757
2711	2	REBECCA NYAMBURA MWANGI	Female	12945932	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_637
2712	2	STEPHEN MWAURA KARANJA	Male	13030435	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_728
2713	2	BEATRICE JEMO LODENYO	Female	13054859	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_49
2714	2	DANIEL STEPHEN ODHIAMBO ODERO	Male	13056375	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_104
2715	2	STEPHEN KASISYO MUNYAO	Male	13059616	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_719
2716	2	MONICAH NYAMBURA MWANGI	Female	13059618	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_532
2717	2	MARGARET WANJIKU MBUGUA	Female	13060766	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_461
2718	2	JULIUS MWANGI MURIUNGI	Male	13163058	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_390
2719	2	ROSE NJERI WAITHIRA	Female	13163305	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_652
2720	2	JOHN GITONGA MACHANGA	Male	13164233	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_317
2721	2	JASAN KAHOHI MBUTHIA	Male	13220024	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_297
2722	2	MOSES GICHERU KIRAGU	Male	13242334	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_541
2723	2	STEPHEN MURIUKI KINYUA	Male	13321831	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_725
2724	2	HANNAH WAMBUI NGUGI	Female	13392205	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_236
2725	2	JACINTA NYAMBURA CHEGE	Male	13430546	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_247
2726	2	MERCY MUGURE GATHERI	Female	13432324	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_507
2727	2	PURITY WANJIKU KIURA	Female	13565470	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_630
2728	2	AYUB  OMONDI DIANGA	Male	13577038	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_48
2729	2	REGINAH WANGARI KAMAU	Female	13750510	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_645
2730	2	RUTH GACHABI KIURIRE	Female	13795821	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_659
2731	2	BENSON NGUGI WAINANA	Male	13795971	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_59
2732	2	EMILLY WANGARI GITAU	Female	13825330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_141
2733	2	NANCY WANJIRU KIMONDO	Female	13825478	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_558
2734	2	MICHAEL MUTUKU MUOKI	Male	13825558	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_521
2735	2	SIMON KANJERU WAMBUI	Male	13826044	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_708
2736	2	PAUL WAINAINA WARIGIA	Male	13827126	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_594
2737	2	JAMES NDURU NGARI	Male	13828132	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_264
2738	2	CAROLINE WANJA MRAIJI	Female	13871343	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_70
2739	2	JOSEPH NJOROGE MACHARIA	Male	13884036	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_363
2740	2	GEORGE MUNGAI KAMAU	Male	14495628	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_199
2741	2	JOSEPH KAMANDE MWAURA	Male	14497347	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_345
2742	2	HELLEN KWAMBOKA OERI	Male	14608146	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_241
2743	2	REGINA MUTHONI NGATIA	Female	14712598	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_640
2744	2	VIRGINIA MUGURE MUCHIRI	Female	16022323	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_769
2745	2	PERIS WAIRIMU MAKIMEI	Female	16046568	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_600
2746	2	JOSEPH MBUGUA KARIUKI	Male	20179241	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_355
2747	2	MOSES GATHENGE KAHURIA	Male	20320489	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_540
2748	2	DANIEL MWAURA CHOMBA	Male	20332541	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_100
2749	2	VERONICAH NYAMBURA KAMAU	Female	20344711	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_763
2750	2	RAHAB WAIRIMU NJERI	Female	20351438	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_634
2751	2	ONESMUS MWANGI WAMBUI	Male	20948099	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_579
2752	2	VIRGINIA NJOKI NJUI	Female	21004419	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_771
2753	2	ESTHER WANJIKU MAINA	Female	21107740	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_156
2754	2	DANIEL NDUNGU NJENGA	Male	21174856	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_101
2755	2	PETER MUTUA KALOKI	Male	21228905	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_612
2756	2	JOHNSON NGANGA KURIA	Male	21428170	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_339
2757	2	GRACE WANGUI MWANGI	Male	21446076	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_222
2758	2	REBEKAH AKINYI ADERO	Female	21454128	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_638
2759	2	MICHAEL MURIITHI KARAU	Male	21457765	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_520
2760	2	AUGUSTA WANJIRU	Male	21469248	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_47
2761	2	SUSAN WAMBUI NJERI	Female	21469826	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_741
2762	2	FRANCIS NGOTHO KIMANI	Male	21475659	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_176
2763	2	SAMWEL KINUTHIA RUTH	Male	21501421	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_693
2764	2	EUSTUS KIMANI MUKIRI	Male	21502966	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_162
2765	2	TABITHA GATHONI CHEGE	Female	21595122	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_746
2766	2	ALFONCE MUASYA ITHINJI	Male	21648056	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_10
2767	2	PERIS NJERI GITONGA	Female	21721944	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_599
2768	2	JOHN KIMANI GACHOMBA	Male	21726225	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_321
2769	2	ANTHONY KURIA WANJIKU	Male	21742208	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_34
2770	2	TABITHA WAMBUI WAITHIRA	Female	21743225	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_748
2771	2	MARY MUTHONI MUGURE	Female	21747432	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_474
2772	2	ERIC MAINA NJOROGE	Male	21773483	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_145
2773	2	FRANCIS WAITHAKA MUNYUA	Male	21836644	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_180
2774	2	STANLEY KARANJA NYAMBURA	Male	21837912	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_715
2775	2	PETER KIMANI GUURA	Male	21874904	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_608
2776	2	PETER GITHINJI RUGU	Male	21905018	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_602
2777	2	LOISE MUKAMI ITHINJI	Female	21924782	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_430
2778	2	CAROLYNE NYAMBURA WAMBUI	Female	21925157	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_71
2779	2	MARY WANJIKU NGANGA	Female	21934980	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_499
2780	2	SAMWEL MAINA WAITHERA	Male	21964746	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_695
2781	2	LUCY WANJIKU WARIGIA	Female	21978823	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_445
2782	2	GEOFFREY NDUNGU WAIRIMU	Male	22017815	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_191
2783	2	BENSON KIARIE NDUNGU	Male	22044903	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_57
2784	2	JAMES MWANGI MAINA	Male	22118935	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_263
2785	2	PETER WAWERU KARIUKI	Male	22137108	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_621
2786	2	MARY WANJA GACHINA	Female	22151870	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_497
2787	2	CHRISTINE ADHIAMBO OGUTU	Female	22158635	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_85
2788	2	EMMAH WACUKA MWANGI	Female	22217183	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_144
2789	2	DOMINIC MUGO MWANGI	Male	22230769	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_123
2790	2	DAMARIS WANJIRU GACHAU	Female	22240117	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_92
2791	2	ELIJAH GICHUKI GITHAIGA	Male	22242321	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_130
2792	2	FRANCIS WAIGWA WACHIRA	Male	22253623	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_179
2793	2	JULIUS MWANGI RICHARD	Male	22254720	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_391
2794	2	VICTORIA MUTHONI KATUMBA	Female	22269041	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_767
2795	2	DANIEL MAINA MWANGI	Male	22337777	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_98
2796	2	MICHAEL IRUNGU WANGONI	Male	22383381	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_516
2797	2	NANCY NJERI WAINAINA	Female	22383598	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_553
2798	2	MERCY NDUTA WAHU	Female	22479850	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_509
2799	2	SAMUEL KAMAU KARIUKI	Male	22495208	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_677
2800	2	ROSE NYAMBURA NJOROGE	Female	22504012	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_654
2801	2	BENSON MURIUKI MUNYUA	Male	22514756	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_58
2802	2	LUCY WANJIKU KAHUGO	Female	22537348	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_442
2803	2	EUNICE WAIRIMU WAMBUI	Female	22539860	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_160
2804	2	PRISCAH WANJIRU NDUTA	Female	22543739	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_628
2805	2	GERALD MWANGI GUURA	Male	22548306	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_205
2806	2	WANYOIKE JOHN KIHARA	Male	22585374	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_777
2807	2	PAUL MAINA WANJIRU	Male	22586305	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_588
2808	2	PAUL MWANGI CHUMA	Male	22586787	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_591
2809	2	NANCY WAMBUI WANGUI	Female	22589997	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_555
2810	2	JERIM OWUOR ODHIAMBO	Male	22628464	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_308
2811	2	JAMES NGURE KAMAU	Male	22652250	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_266
2812	2	JOHN NDEKEI MWANGI	Male	22657810	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_332
2813	2	REGINA WAMBUI KIMANI	Female	22666257	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_642
2814	2	LOICE WANGUI MWANGI	Female	22698130	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_427
2815	2	NELSON MWANGI NGANGA	Male	22698131	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_568
2816	2	LYDIA NJERI MWANGI	Female	22700642	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_449
2817	2	JOYCE NJERI NYAMBURA	Female	22736039	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_379
2818	2	SALOME NYAMBURA NDUTA	Female	22773302	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_667
2819	2	MICHAEL KAMAU MWANGI	Male	22812150	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_518
2820	2	ANTONY WAMBUGU NGATIA	Male	22870123	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_44
2821	2	MARGRET WANJIKU NGUGI	Female	22884541	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_466
2822	2	LYDIA NYAMBURA BORO	Female	22948507	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_451
2823	2	MILKAH MUTHONI MAINA	Female	22950017	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_524
2824	2	SAMUEL MBURU NJUGUNA	Male	22950063	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_682
2825	2	ALPHAXAD NGIGE WAMBUI	Male	22950723	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_15
2826	2	JULIUS MWANGI GACHUHI	Male	22951128	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_389
2827	2	SAMWEL NGUGI KARIUKI	Male	22951141	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_696
2828	2	NANCY WANJIRU NGORO	Female	22972979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_560
2829	2	MONICAH WAMBUI MBUTHIA	Female	22993620	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_534
2830	2	BETH WANJIRU GATHONI	Female	22994420	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_63
2831	2	STEPHEN NJUGUNA KIMANI	Male	23026237	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_733
2832	2	STEPHEN MURUNDU KIARIE	Male	23028680	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_726
2833	2	NANCY NYAMBURA NJERI	Female	23032010	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_554
2834	2	FELISTER NJOKI	Male	23034420	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_165
2835	2	JOSEPH KIMANI CHEGE	Male	23039844	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_349
2836	2	SIMON MUCHOKI KAHUNGU	Male	23096146	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_710
2837	2	ANTHONY NJOROGE MUKENYI	Male	23109864	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_35
2838	2	ELIZABETH NDAMA WILLY	Female	23114295	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_135
2839	2	DEPHORA WANGARI MUGURE	Female	23136663	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_120
2840	2	JECINTA WAMBUI KIMANI	Female	23137349	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_299
2841	2	JANET WANGARI KIMANI	Female	23137356	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_294
2842	2	GEORGE TITUS OKOTH OWISO	Male	23147287	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_203
2843	2	JOYCE NUNGARI WAIRIMU	Female	23147633	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_380
2844	2	MERCY NJERI NJOKI	Female	23153432	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_510
2845	2	MARY WAMBUI MBURU	Female	23153527	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_492
2846	2	MOSES KIHARA NDUATI	Male	23187170	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_542
2847	2	BONFACE NJOROGE WAMBUI	Male	23253640	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_65
2848	2	ALICE WAMBUI MAINA	Female	23260155	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_14
2849	2	TERESIAH MUMBI WARIGIA	Female	23286287	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_754
2850	2	JACOB MARWA MWIKWABE	Male	23318187	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_250
2851	2	PETER NYOIKE GUCHU	Male	23409408	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_619
2852	2	CATHERINE KANINI MACHARIA	Female	23450915	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_72
2853	2	MICHAEL  WAHOME	Male	23583957	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_513
2854	2	SAMUEL MWAURA MURUCHU	Male	23594685	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_690
2855	2	LEAH WANJIKU MWANGI	Female	23651191	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_419
2856	2	JAMES NG'ANG'A KIRANGI	Male	23833120	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_265
2857	2	NANCY WANGARI	Female	23857895	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_556
2858	2	ANTONY MBUTHI KARANJA	Male	23898859	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_43
2859	2	STEPHEN NGUGI GUURA	Male	23904839	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_730
2860	2	SAMUEL NGURE MACHARIA	Male	23905780	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_691
2861	2	MARY NJOKI KARAGO	Female	23939949	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_480
2862	2	GERALD MWANGI MAINA	Male	23953024	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_206
2863	2	NAOMI ADISA ODIELI	Female	23962318	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_563
2864	2	MERCY NYAWIRA WANGUI	Female	23981896	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_511
2865	2	MARGARET NYOKABI SYOKONYO	Female	24000993	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_459
2866	2	JAMES MUKARIA NJOROGE	Male	24126100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_258
2867	2	JOSEPH MAINA WILSON	Male	24132080	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_354
2868	2	STANLEY MUIRURI GITHAE	Male	24152579	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_716
2869	2	PETER NJOROGE WAINANA	Male	24204098	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_617
2870	2	GEORGE MWANZIA SEKONYO	Male	24204611	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_200
2871	2	PAUL KUNGU WAMBUI	Male	24214138	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_587
2872	2	RACHEAL GATHONI	Female	24231637	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_631
2873	2	DANIEL MWANGI MUNYAO	Male	24251613	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_99
2874	2	JANE MUTHONI NGORO	Female	24273463	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_275
2875	2	DAVID MAINA NDUNGU	Male	24287174	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_109
2876	2	JUDY WANJIRU MUTHONI	Female	24290946	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_383
2877	2	WILSON WAITA MIRUNGU	Male	24309515	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_781
2878	2	JACOB LEWIS MULI	Male	24381915	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_248
2879	2	ELIZABETH WANJIRU MAINA	Female	24386175	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_139
2880	2	SAMUEL KANYUGA KARIAMBAKI	Male	24406404	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_678
2881	2	TABITHA KAVENGI MARY	Female	24429537	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_747
2882	2	ZIPPORAH WANJIKU MIRING'U	Female	24440523	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_784
2883	2	LUCY MWIHAKI WAMBUI	Female	24440607	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_434
2884	2	ANTONY KINYANJUI CHEGE	Male	24453601	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_39
2885	2	CYRUS MOCHONI MACHOGE	Male	24493565	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_89
2886	2	KENEDY MUNGAI WACHIRA	Male	24523863	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_403
2887	2	ALICE AKINYI AGOGO	Female	24570804	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_11
2888	2	JANE NUNGARI NJUGUNA	Female	24625670	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_279
2889	2	JOSEPH WAMBUA MARY	Male	24645241	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_366
2890	2	FLORENCE WAMBUI NJUGUNA	Male	24651933	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_170
2891	2	ESTHER MBUSORO NYAKUNDI	Female	24670286	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_148
2892	2	MONICAH WANJIKU WANGUI	Female	24676279	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_536
2893	2	JOSEPH MESHINO KAMAU	Male	24736238	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_357
2894	2	CATHERINE WANGECHI MWANGI	Female	24755205	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_74
2895	2	GEORGE WATHERU WAMBUI	Male	24845107	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_204
2896	2	DAVID NJOROGE KIRU	Male	24859039	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_114
2897	2	BENARD BANGUA KABATA	Male	24984022	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_54
2898	2	GEORGE KARANJA MUKAMI	Male	25049253	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_197
2899	2	ANN WAITHERA MAINA	Female	25114450	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_25
2900	2	SAMUEL MBUGUA MANYORE	Male	25127346	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_681
2901	2	ESTHER WACUKA KIMONDO	Female	25131958	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_151
2902	2	ANTONY MBURU KAHUHU	Male	25132856	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_42
2903	2	ESTHER WANJIKU NDEGWA	Female	25142461	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_157
2904	2	BENARD WATHIRU WANJIRU	Male	25142586	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_55
2905	2	ANTONY KIMANI WAMBUI	Male	25142854	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_38
2906	2	LUCY WAITHERA WAIRIMU	Female	25145530	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_440
2907	2	GEORGE GITAU WANJIKU	Male	25145582	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_195
2908	2	MONICAH MUMBI WANJIRU	Female	25146185	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_531
2909	2	HANNAH MWIHAKI NDENGUA	Female	25146247	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_225
2910	2	ROSEMARY NJERI MUMBI	Female	25146407	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_657
2911	2	SILVIA MUDUWA OTIENO	Female	25171631	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_705
2912	2	FELIX KHASIBINI NENGANE	Male	25173092	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_166
2913	2	SARAH ANYANGO ALI	Female	25198538	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_697
2914	2	JOSPHAT MWANGI MUGURO	Male	25340261	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_376
2915	2	STEPHEN MATHEKA SAVINA	Male	25344230	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_723
2916	2	PATRICK GITHINJI NGATIA	Male	25388616	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_581
2917	2	PAULINE WAMBUI NGATIA	Male	25493144	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_596
2918	2	MONICAH NYAMBURA WOKABI	Female	25494280	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_533
2919	2	PATRICK WOKABI WANJIKU	Male	25498049	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_585
2920	2	ROSE MBULA NDILA	Female	25506998	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_651
2921	2	YUCKILNE JENIPHER ATIENO	Female	25510449	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_783
2922	2	NAOMI NYAMBURA MUTHONI	Female	25526580	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_564
2923	2	JOSEPH MAGU NDERITU	Male	25527401	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_353
2924	2	MARGRET NJERI KINYANJUI	Female	25528338	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_465
2925	2	LUKE MWANGI MUIRURI	Female	25528741	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_447
2926	2	MUYA PRISCILLA CHEBET	Male	25661417	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_546
2927	2	MONICAH GATHONI WANJIRU	Female	25777037	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_530
2928	2	DAVID NDUNGU KARIUKI	Male	25778218	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_111
2929	2	JOSEPH NJOROGE WAITHIRA	Male	25895143	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_364
2930	2	LILIAN ATIENO OKELLO	Female	25895881	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_424
2931	2	DOREEN AOKO OKELLO	Female	25896019	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_125
2932	2	RUTH NJOKI MAINA	Female	25896955	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_662
2933	2	ANN WAMBUI WANJIRU	Female	25897087	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_26
2934	2	JOSEPH KERU WAMBUI	Male	25906058	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_348
2935	2	TERESIA WAKAHURIA MUTISO	Female	25934644	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_751
2936	2	LUCY WANJIKU NYAMBURA	Female	25949723	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_444
2937	2	TERESIAH MUKAMI NYAMBURA	Female	26072755	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_753
2938	2	FIDELIS WANGARI	Male	26091837	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_168
2939	2	NICHOLAS KITHEKA	Male	26110131	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_571
2940	2	PAULINE NJOKI WANJIRU	Male	26237144	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_595
2941	2	KENNEDY FINHAS KIMANI KARIAMBAKI	Male	26434947	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_405
2942	2	LEAH WAMBUI MWANGI	Female	26585479	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_418
2943	2	MILLICENT NZILANI KINYUA	Female	26621817	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_527
2944	2	STEPHEN NDUACHE CHEGE	Male	26656507	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_729
2945	2	JOYCE MUTHONI KARANJA	Female	26805548	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_377
2946	2	DAMARIS WAMBUI MWAURA	Female	26805826	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_91
2947	2	SALOME WANJIRU MUNYIRI	Female	26854335	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_670
2948	2	BONIFACE KAMAU MUCHIRI	Male	26919148	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_67
2949	2	GODFREY NJAU MUTORA	Male	27128187	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_215
2950	2	JOHN MBURU MUCHIRI	Male	27134726	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_328
2951	2	PAUL NJAU WANJIRU	Male	27344261	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_592
2952	2	JOB MWATHE MUIA	Male	27420516	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_311
2953	2	STEPHEN MWANGI KAMAU	Male	27491716	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_727
2954	2	MONICAH WANJIRU NJERI	Female	27586206	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_537
2955	2	REGINA MUGURE MUTHONI	Female	27625740	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_639
2956	2	MARY WAIRIMU MIRINGU	Female	27625749	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_484
2957	2	MARY WANJIKU WANJOHI	Female	27645465	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_500
2958	2	JOSPHAT KINYUA CHEGE	Male	27673742	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_374
2959	2	SULEIMAN MUCHIRI KAMAU	Male	27680471	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_735
2960	2	MILKAH WATIRI NYAGA	Female	27692001	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_525
2961	2	NELSON MBURU MUNYUA	Male	27775519	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_567
2962	2	JAMLICK KARANJA NDUNGU	Male	27820882	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_271
2963	2	SARAH SELPHAR Â KARANI	Female	27834949	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_698
2964	2	LOISE KARIMI WAMBUI	Female	27850110	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_428
2965	2	GABRIEL NJANGIRU WANJIRU	Male	27850512	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_187
2966	2	JEDIDAH WAMBUI KURIA	Female	27891243	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_302
2967	2	GRACE WANJIRU KABATA	Male	28024233	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_224
2968	2	LEAH WAIGUMO WACHIRA	Female	28069306	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_417
2969	2	SIMON  KARUGA NGUGI	Male	28156784	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_706
2970	2	JOSEPH  MATHENGE WACERA	Male	28216251	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_340
2971	2	ELIZABETH WAMBUI GITHIRI	Female	28237131	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_138
2972	2	ANTHONY WAITHAKA NJERI	Male	28242849	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_36
2973	2	DOUGLAS MBUGUA MAINA	Male	28318028	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_126
2974	2	SAMSON KARIUKI CHUMA	Male	28321846	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_673
2975	2	JANE WANGUI WAIRIMU	Female	28345230	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_286
2976	2	LOISE MUKAMI CHACHA	Female	28381604	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_429
2977	2	MONICAH WANJIKU WAMBUI	Female	28475082	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_535
2978	2	MARIA WANJIKU CHEGE	Female	28562215	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_467
2979	2	JOHN NDUNGU KAMAU	Male	28594382	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_333
2980	2	STEPHEN GITAU WANJIKU	Male	28613569	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_718
2981	2	WILLIAM GITAU NDEGWA	Male	28620804	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_778
2982	2	GEORGE GICHANE MBUTHIA	Male	28620865	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_194
2983	2	SUSAN WANGUI MWANGI	Female	28627536	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_743
2984	2	STEPHEN MAINA WANGECHI	Male	28758572	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_722
2985	2	NICHOLAS WAMBUGU WAIRIMU	Male	28763785	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_573
2986	2	FREDRICK KINYANJUI NYAMBURA	Male	29104952	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_182
2987	2	SAMUEL MWANGANGI ANIPH	Male	29118824	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_689
2988	2	SUSAN NYAMBURA NDUNGE	Female	29146949	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_738
2989	2	LUCY WAITHARA NYAGA	Female	29243984	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_438
2990	2	KELVIN WACHIRA NYAGUTHI	Male	29286762	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_402
2991	2	KEVIN KIMANI NJONJO	Male	29344097	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_410
2992	2	MACHOGE ALEX  NYAMWEYA	Male	29361687	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_453
2993	2	SARAH WAITHERA WAMBUI	Female	29466311	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_699
2994	2	GLADYS WANGARI THUO	Male	29486311	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_212
2995	2	PHILIS WANGARI WANJIRU	Female	29606882	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_623
2996	2	MARY WAMBUI MUCHIRI	Female	29800756	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_493
2997	2	FAITH MUTHONI NYAGA	Male	29863929	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_163
2998	2	THOMAS MBUTHI WAWERU	Female	29997853	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_758
2999	2	ANNE WANGUI MURINGI	Female	30142241	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_32
3000	2	JOSEPHAT KARANJA MUCHIRI	Male	30142877	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_370
3001	2	GEOFFREY KURIA CHEGE	Male	30194991	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_189
3002	2	ANNE NYAMBURA	Female	30206499	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_29
3003	2	DANIEL NJOROGE NJERI	Male	30230536	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_103
3004	2	GEORGE NJUGUNA KANYI	Male	30291857	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_202
3005	2	ELIAS CHEGE KIMANI	Male	30385635	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_129
3006	2	JANE WANGECI MWANGI	Female	30441474	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_285
3007	2	KELVIN KARIUKI NJOKI	Male	30496440	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_398
3008	2	JOHN CHEGE WAMBUI	Male	30702471	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_315
3009	2	STEPHEN ONYANGO AKONGO	Male	30734561	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_734
3010	2	KENNEDY NJERU NGOIRI	Male	30795320	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_406
3011	2	THUMBI NJOROGE	Female	30957687	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_759
3012	2	AMOS GITAU MUTHONI	Male	31157758	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_17
3013	2	GLADYS WANGUI WABARU	Male	31272932	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_213
3014	2	MAUREEN NJERI KIBERA	Female	31314327	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_505
3015	2	STEPHEN CHEGE MUTHONI	Male	31318172	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_717
3016	2	GABRIEL GATHUMA WAMBUI	Male	31329242	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_185
3017	2	BEATRICE WAIRIMU MUTHONI	Female	31346446	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_52
3018	2	PAUL MBUGUA KABATA	Male	31427108	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_589
3019	2	MARGARET WAIRIMU KIMANI	Female	31865925	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_460
3020	2	MARY WANJIRU WAIRIMU	Female	32098468	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_504
3021	2	JOSEPH NDUNG'U MWANIKI	Male	32108238	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_362
3022	2	VERONICAH WANJIKU MBUTHIA	Female	32186107	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_766
3023	2	HANNAH WAITHERA NDICHU	Female	32226364	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_232
3024	2	DENNIS GITAU MUCHIRI	Male	32291349	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_118
3025	2	JOHN KOINE NJENGA KAHUHU	Male	32324725	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_325
3026	2	MARTIN NYOIKE	Male	32335639	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_470
3027	2	KELVIN NDUNGU WANJIRU	Male	32363766	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_401
3028	2	NANCY WANGECHI	Female	32473383	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_557
3029	2	FRANCIS NJOGU IRUNGU	Male	32574912	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_178
3030	2	MICHAEL KARANJA MANYARA	Male	32602594	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_519
3031	2	ANIFU HANNAH KILILO	Female	32645527	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_21
3032	2	KELVIN KINYANJUI WANJIKU	Male	32681144	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_399
3033	2	SAMUEL MAINA KAGOKO	Male	32816155	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_680
3034	2	HANNAH WAMBUI MBURU	Female	33156201	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_233
3035	2	GODFREY NGATIA MUTHONI	Male	33165614	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_214
3036	2	PETER MUNGAI KAHATO	Male	33177841	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_611
3037	2	SUSAN WAIRIMU MWANGI	Female	33252712	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_740
3038	2	GILBERT NJOROGE WANJIRU	Male	33263913	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_207
3039	2	JOHN MWANGI MWAURA	Male	33400739	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_329
3040	2	SUSAN WANJIKU WAWERU	Female	33400919	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_745
3041	2	DAVID KIARIE NJOROGE	Male	33418040	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_107
3042	2	KEVIN  MUTINDA NDUKU	Male	33735100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_409
3043	2	ROSE NUNGARI MWANGI	Female	33815835	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_653
3044	2	GEOFFREY KARIUKI MURINGI	Male	33931963	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_188
3045	2	JAMES MUYA NGINA	Male	34000730	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_259
3046	2	NELSON MWAURA WAMBUI	Male	34017373	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_569
3047	2	LENNOX OMONDI ODIMO	Male	34046067	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_422
3048	2	MARGARET NJERI CHUMA	Female	34107171	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_456
3049	2	JOSEPH KURIA WANJIRU	Male	34249264	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_352
3050	2	PAUL MUIRURI MWANIKI	Male	34297401	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_590
3051	2	DAVID NDUNGU NJENGA	Male	34398913	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_112
3052	2	PIUS KARIUKI GUTHUGA	Male	34463715	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_625
3053	2	DANIEL KAMAU MBUGUA	Male	34474442	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_94
3054	2	PETER NDIRANGU THIONGO	Male	34654134	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_615
3055	2	HANNAH NJERI WANJERU	Female	34737690	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_229
3056	2	SAMUEL MUGWANJA WANGUI	Male	34773085	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_684
3057	2	KENETH KIBATHI CHEGE	Male	34943933	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_404
3058	2	JOHN NJOROGE MWANGI	Male	34992179	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_336
3059	2	ELIJAH WAINAINA NJERI	Male	35068724	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_132
3060	2	MERCY MUTHONI WAMBUI	Female	35476365	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_508
3061	2	JOSEPH CHEGE NJAU	Male	35478246	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_342
3062	2	ANTHONY KINYANJUI MUCHIRI	Male	35478283	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_33
3063	2	DAMARIS ALI LUSALA	Female	35524966	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_90
3064	2	DENNIS NJUGUNA NYAMBURA	Male	35769535	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_119
3065	2	EDWARD KINYUA MURIUKI	Male	35769585	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_127
3066	2	GEORGE NG'ETHE KAMAU	Male	35831235	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_201
3067	2	PAUL NJOROGE NJERI	Male	36074865	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_593
3068	2	WINFRIDAH WANGARI CHEGE	Male	36475993	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_782
3069	2	DANIEL KIMANI MUCHIRI	Male	36628597	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_96
3070	2	KELVIN MUREITHI WACHIRA	Male	36645259	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_400
3071	2	JEFF MATHUKU KARU	Female	36851033	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_303
3072	2	SAMUEL KIMANI WAMBUI	Male	36915086	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_679
3073	2	JOHN GATAMA CHEGE	Male	36919489	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_316
3074	2	BOSCO GITAU KURIA	Male	36960042	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_69
3075	2	ANTONY KURIA KINUTHIA	Male	37146239	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_40
3076	2	MARIAM NJERI MWANGI	Male	37525894	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_468
3077	2	FRANCIS KIMANI NJERI	Male	37602479	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_172
3078	2	MAJALIWA GATI	Male	37741938	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_455
3079	2	MARY WAMBUI CHUMA	Female	37812141	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_488
3080	2	WILSON MUIRURI NGANGA	Male	37817420	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_780
3081	2	LYDIA NJERI NJOROGE	Female	72016191	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_450
3082	2	CATHERINE NJERI WANGUI	Female	110344422	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_73
3083	2	PETER KARIUKI WANJIRU	Male	350220559	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_606
3084	2	SOWETO ACHIEVERS SELF HELP GROUP	Male	Â KAS/DGSD/5/4/2015/5176	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_711
3085	2	MWAMKO FOUNDATION CBO	Male	A8432	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_547
3086	2	ACK ST. THOMAS SOWETO CHURCH	Male	ACK	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_3
3087	2	AFRICAN CHURCH OF SPIRIT	Male	ACS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_4
3088	2	AFRICAN MISSION OF HOLY GHOST CHURCH	Male	AMHG	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_5
3089	2	ST. FRANCIS OF ASISI (SOWETO) CATHOLIC CHURCH	Male	ASISI	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_714
3090	2	NAIROBI CITY COUNTY GOVERNMENT (KAHAWA SOWETO COMMUNITY CENTRE)	Male	COMMCENTRE	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_552
3091	2	CATHOLIC WOMEN ASSOCIATION	Male	CWA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_75
3092	2	THE COMMUNITY HEALTH WORKERS SELF-HELP GROUP SOWETO	Female	DSS/NP/5/4/Vol.6/91/(87)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_755
3093	2	SOWETO KAHAWA MAFUTA TAA GROUP	Male	DSS/NP/S/4 VOL1/93/119	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_713
3094	2	FREE PENTECOSTAL CHURCH OF KENYA	Male	FPCK	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_184
3095	2	KAHAWA HEALTH CENTRE	Male	KAHAWAHCF	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_393
3096	2	KAHAWA PRIMARY SCHOOL	Male	KAHAWAPRI	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_394
3097	2	KENSON WACHIURI	Male	KENSON	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_407
3098	2	KAHAWA SOWETO RESOURCE CENTRE	Male	KSRC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_395
3099	2	LAWRENCE WAINAINA NGUGI	Male	LAWRENCE	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_416
3100	2	LEWIS KAMANDE  NGUGI	Male	LEWIS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_423
3101	2	NAIROBI CITY (Kahawa Soweto Community Centre)   COUNTY GOVERNMENT	Male	NBO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_551
3102	2	P.C.E.A KAHAWA STATION CHURCH	Male	PCEA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_580
3103	2	PENTECOSTAL ASSEMBLIES OF GOD	Male	PENTECOST	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_598
3104	2	SOWETO CATHOLIC CHURCH	Male	SCC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_712
3105	2	ARCH DIOCESE OF NAIROBI ST JOSEPH MUKASA PARISH	Male	STJOSP	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_45
3106	2	KELLY ONYANGO ATIENO	Male	KELLY_ONYANGO_u18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_397
3107	2	PHINHAS KIMANI MWANGI	Male	PHINHAS_u18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_624
3108	2	THE COMMUNITY POPE JOHN XXIII	Female	XXIII	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	kahawa_soweto_756
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

COPY public.interventions (id, intervention_type_id, year, intervention_phase, settlement_id, cluster_id, code) FROM stdin;
1	1	2018	1	1	2	Embakasi_2018_1
2	1	2018	1	2	2	Kahawa Soweto_2018_1
3	1	2018	1	3	2	Kambi Moto_2018_1
4	1	2018	1	4	16	Mathare fire victims_2018_1
5	1	2018	1	5	14	Ex-Grogon_2018_1
6	1	2018	1	6	3	Mji wa Huruma_2018_1
7	1	2018	1	7	2	Redeemed_2018_1
8	1	2018	1	8	8	Maganda_2018_1
9	1	2018	1	9	8	Kisumu Ndogo_2018_1
10	1	2018	1	10	8	Misufini_2018_1
11	1	2018	1	11	8	Kwa Hakatsa_2018_1
12	1	2018	1	12	8	Mwatate_2018_1
13	1	2018	1	13	2	Chaani_2018_1
14	1	2018	1	14	2	Likoni 203_2018_1
15	1	2018	1	15	1	Kibikoni M17E_2018_1
16	1	2018	1	16	1	Muyeye I_2018_1
17	1	2018	1	17	1	Kwa Ndomo_2018_1
18	1	2018	1	18	8	M26 Kibokoni_2018_1
19	1	2018	1	19	4	Jiwe Leupe_2018_1
20	1	2018	1	20	4	Makaburini_2018_1
21	1	2018	1	21	4	Njoro ya Chini_2018_1
22	1	2018	1	22	4	Shingila_2018_1
23	1	2018	1	23	4	Jacaba_2018_1
24	1	2018	1	24	4	Njoro Takatifu_2018_1
25	1	2018	1	25	4	Dingwini_2018_1
26	1	2018	1	26	4	Tabora_2018_1
27	1	2018	1	27	4	Muyeye II_2018_1
28	1	2018	1	28	5	Namu Phase 1_2018_1
29	1	2018	1	29	10	Namu Phase 2_2018_1
30	1	2018	1	30	5	Bulla Riig Phase 1_2018_1
31	1	2018	1	31	10	Bulla Riig Phase 2_2018_1
32	1	2018	1	32	5	Iskadek Phase 1_2018_1
33	1	2018	1	33	10	Iskadek Phase 2_2018_1
34	1	2018	1	34	5	Makhanu Phase 1_2018_1
35	1	2018	1	35	10	Makhanu Phase 2_2018_1
36	1	2018	1	36	5	County Phase 1_2018_1
37	1	2018	1	37	10	County Phase 2_2018_1
38	1	2018	1	38	5	Kaango Mosquito_2018_1
39	1	2018	1	39	1	Kathita_2018_1
40	1	2018	1	40	2	Kimangaru_2018_1
41	1	2018	1	41	1	Gatitu_2018_1
42	1	2018	1	42	1	Kihatha_2018_1
43	1	2018	1	43	1	Kihuyo_2018_1
44	1	2018	1	44	1	Riamukurwe_2018_1
45	1	2018	1	45	1	Ithenguri_2018_1
46	1	2018	1	46	6	Gitathini_2018_1
47	1	2018	1	47	6	Gitero_2018_1
48	1	2018	1	48	6	Chorongi_2018_1
49	1	2018	1	49	6	Kiamwathi_2018_1
50	1	2018	1	50	6	Kiaruhiu_Kariki_2018_1
51	1	2018	1	51	6	Gikomo/Kiawara_2018_1
52	1	2018	1	52	6	Miiri_2018_1
53	1	2018	1	53	11	Ngorano_2018_1
54	1	2018	1	54	11	Giakaibei_2018_1
55	1	2018	1	55	11	Njoguini_2018_1
56	1	2018	1	56	11	Kanjora_2018_1
57	1	2018	1	57	11	Ruruguti_2018_1
58	1	2018	1	58	6	Ihwagi_2018_1
59	1	2018	1	59	1	Kiawara_2018_1
60	1	2018	1	60	2	Umoja_2018_1
61	1	2018	1	61	9	Kasarani A_2018_1
62	1	2018	1	62	9	Kasarani B_2018_1
63	1	2018	1	63	9	Eastleigh_2018_1
64	1	2018	1	64	9	Tarabete_2018_1
65	1	2018	1	65	9	Keringet_2018_1
66	1	2018	1	66	14	Kongasis_2018_1
67	1	2018	1	67	14	Crater Lake_2018_1
68	1	2018	1	68	1	Hill school_2018_1
69	1	2018	1	69	1	Maili Nne_2018_1
70	1	2018	1	70	7	Kuinet_2018_1
71	1	2018	1	71	3	Swahili Village_2018_1
72	1	2018	1	72	3	Majengo Talai_2018_1
73	1	2018	1	73	7	Bondeni_2018_1
74	1	2018	1	74	7	Swahili_2018_1
75	1	2018	1	75	7	Shauri yako_2018_1
76	1	2018	1	76	7	Kaloleni_2018_1
77	1	2018	1	77	7	Shauri Moyo_2018_1
78	1	2018	1	78	7	Kopere_2018_1
79	1	2018	1	79	3	Kambi Somali_2018_1
80	1	2018	1	80	3	Mjini_2018_1
81	1	2018	1	81	1	Amalemba_2018_1
82	1	2018	1	82	6	Mweiga_2018_1
83	2	2020	2	2	18	Kahawa Soweto_2020_2
84	2	2020	2	3	18	Kambi Moto_2020_2
85	2	2020	2	4	18	Mathare fire victims_2020_2
86	2	2020	2	5	18	Ex-Grogon_2020_2
87	2	2020	2	6	18	Mji wa Huruma_2020_2
88	2	2020	2	7	18	Redeemed_2020_2
89	2	2020	2	8	18	Maganda_2020_2
90	2	2020	2	9	18	Kisumu Ndogo_2020_2
91	2	2020	2	10	18	Misufini_2020_2
92	2	2020	2	13	18	Chaani_2020_2
93	2	2020	2	14	18	Likoni 203_2020_2
94	2	2020	2	16	18	Muyeye I_2020_2
95	2	2020	2	48	18	Chorongi_2020_2
96	2	2020	2	49	18	Kiamwathi_2020_2
97	2	2020	2	58	18	Ihwagi_2020_2
98	2	2020	2	60	18	Umoja_2020_2
99	2	2020	2	69	18	Maili Nne_2020_2
100	2	2020	2	79	18	Kambi Somali_2020_2
101	2	2020	2	80	18	Mjini_2020_2
102	2	2020	2	81	18	Amalemba_2020_2
103	2	2020	2	82	18	Mweiga_2020_2
104	2	2020	2	83	18	A thousand street_2020_2
105	1	2020	2	84	17	Aramaget_2020_2
106	2	2020	2	85	18	Aseko/Mlekenyi_2020_2
107	1	2020	2	86	17	Awelo_2020_2
108	2	2020	2	87	18	Bandani_2020_2
109	2	2020	2	88	18	Barwaqo_2020_2
110	2	2020	2	89	18	Bayamangozi_2020_2
111	1	2020	2	90	17	Bondeni_2020_2
112	1	2020	2	91	17	Bondeni_2020_2
113	1	2020	2	92	17	Bora Imani_2020_2
114	1	2020	2	93	17	Bura_2020_2
115	1	2020	2	94	17	Canaani_2020_2
116	1	2020	2	95	17	Carlifornia-Lodwar Municipality_2020_2
117	2	2020	2	96	18	Chebiemit_2020_2
118	2	2020	2	97	18	Chelanga_2020_2
119	2	2020	2	98	18	Cheptongei_2020_2
120	1	2020	2	99	17	Chewani_2020_2
121	1	2020	2	100	17	Dagorretti-Ruthimitu_2020_2
122	2	2020	2	101	18	Diani Complex_2020_2
123	2	2020	2	102	18	Embakasi KCC_2020_2
124	2	2020	2	103	18	Embakasi Village_2020_2
125	2	2020	2	104	18	Faza village_2020_2
126	1	2020	2	105	17	Gathambi_2020_2
127	1	2020	2	106	17	Gatugura (Gatundura)_2020_2
128	1	2020	2	107	17	Getuya_2020_2
129	2	2020	2	108	18	Gichagi_2020_2
130	1	2020	2	109	17	Githogondo_2020_2
131	2	2020	2	110	18	Halane_2020_2
132	2	2020	2	111	18	Hodhan_2020_2
133	2	2020	2	112	18	Hodi Hodi_2020_2
134	1	2020	2	113	17	Hola Mission_2020_2
135	2	2020	2	114	18	Huruma - Ol Kalou_2020_2
136	1	2020	2	115	17	Ithareini_2020_2
137	1	2020	2	116	17	Jam City_2020_2
138	1	2020	2	117	17	Jiw Dendi_2020_2
139	2	2020	2	118	18	Jogoo_2020_2
140	1	2020	2	119	17	Jua kali_2020_2
141	1	2020	2	120	17	Jua Kali_2020_2
142	1	2020	2	121	17	Kabati_2020_2
143	1	2020	2	122	17	Kabichbich_2020_2
144	1	2020	2	123	17	Kagumo_2020_2
145	1	2020	2	124	17	Kaitheri_2020_2
146	1	2020	2	125	17	Kajuka-Lodwar Municipality_2020_2
147	2	2020	2	126	18	Kalolo_2020_2
148	1	2020	2	127	17	Kalundu Misuuni_2020_2
149	1	2020	2	128	17	Kalundu slaughter_2020_2
150	1	2020	2	129	17	Kambi Mawe - Lodwar Municipality_2020_2
151	1	2020	2	130	17	Kampi Wakulima_2020_2
152	1	2020	2	131	17	Kamuiru_2020_2
153	1	2020	2	132	17	Kamuthanga_2020_2
154	1	2020	2	133	17	Kanjeru_2020_2
155	1	2020	2	134	17	Kapcherop_2020_2
156	1	2020	2	135	17	Kapsowar_2020_2
157	2	2020	2	136	18	Karagita_2020_2
158	2	2020	2	137	18	Kathwana_2020_2
159	1	2020	2	138	17	Katorongoto_2020_2
160	2	2020	2	139	18	Kayole Soweto_2020_2
161	2	2020	2	140	18	Keroka Block -B_2020_2
162	1	2020	2	141	17	Kiamburi_2020_2
163	1	2020	2	142	17	Kiandutu_2020_2
164	1	2020	2	143	17	Kiangoma_2020_2
165	2	2020	2	144	18	Kiangombe_2020_2
166	1	2020	2	145	17	Kiangombe_2020_2
167	1	2020	2	146	17	Kianjiru_2020_2
168	1	2020	2	147	17	Kiarukungu_2020_2
169	2	2020	2	148	18	Kiawara_2020_2
170	2	2020	2	149	18	Kibaoni_2020_2
171	1	2020	2	150	17	Kibirigwi_2020_2
172	2	2020	2	151	18	Kibokoni M17E_2020_2
173	2	2020	2	152	18	Kibuye_2020_2
174	1	2020	2	153	17	Kibuyu_2020_2
175	1	2020	2	154	17	Kijiji Cha Chewa_2020_2
176	1	2020	2	155	17	Kijijini(kendu Bay Old town)_2020_2
177	2	2020	2	156	18	Kilimanjaro_2020_2
178	1	2020	2	157	17	Kimunye_2020_2
179	2	2020	2	158	18	Kipkaren  Site & Service_2020_2
180	2	2020	2	159	18	Kipsongo A_2020_2
181	2	2020	2	160	18	Kisumu Ndogo_2020_2
182	2	2020	2	161	18	Kiunga old town_2020_2
183	1	2020	2	162	17	Kwa Mangeli_2020_2
184	2	2020	2	163	18	Kwa Murogi_2020_2
185	1	2020	2	164	17	Kwa Nzomo_2020_2
186	2	2020	2	165	18	Lake View_2020_2
187	2	2020	2	166	18	Landi Matope_2020_2
188	1	2020	2	167	17	Landi Matope (muslim school-Webuye DEB-Rail)_2020_2
189	1	2020	2	168	17	Lokichoggio Informal Settlement-Lokichoggio Town_2020_2
190	1	2020	2	169	17	Lokori Settlement-Lokori Town_2020_2
191	2	2020	2	170	18	London_2020_2
192	1	2020	2	171	17	Lowarengak Informal Settlement-Lowarengak Centre_2020_2
193	2	2020	2	172	18	Lukoye_2020_2
194	1	2020	2	173	17	M27_2020_2
195	2	2020	2	174	18	Maganda_2020_2
196	1	2020	2	175	17	Maisha Matamu_2020_2
197	1	2020	2	176	17	Majengo_2020_2
198	2	2020	2	177	18	Majengo_2020_2
199	1	2020	2	178	17	Majengo Mapya_2020_2
200	1	2020	2	179	17	Makaburini_2020_2
201	2	2020	2	180	18	Makongeni_2020_2
202	1	2020	2	181	17	Malindi ya Ngwena_2020_2
203	2	2020	2	182	18	Manyatta A (Kona Mbaya and Migosi)_2020_2
204	2	2020	2	183	18	Manyatta B_2020_2
205	2	2020	2	184	18	Marimanti_2020_2
206	2	2020	2	185	18	Masogo kayoya_2020_2
207	1	2020	2	186	17	Matharau_2020_2
208	2	2020	2	187	18	Matisi_2020_2
209	2	2020	2	188	18	Matondoni_2020_2
210	1	2020	2	189	17	Mazeras Centre Miwani/Mgumo wa Pasta_2020_2
211	1	2020	2	190	17	Misongeni_2020_2
212	2	2020	2	191	18	Misri_2020_2
213	2	2020	2	192	18	Mitume (Mau Mau)_2020_2
214	2	2020	2	193	18	Mjini_2020_2
215	1	2020	2	194	17	Mjini_2020_2
216	2	2020	2	195	18	Mjini_2020_2
217	2	2020	2	196	18	Mokowe old town_2020_2
218	1	2020	2	197	17	Mororo_2020_2
219	2	2020	2	198	18	Mosoriot_2020_2
220	2	2020	2	199	18	Mtaani_2020_2
221	2	2020	2	200	18	Muhoroni (Sangoro, Swahili, Shauri Yako, Shauri Moyo & Bondeni)_2020_2
222	1	2020	2	201	17	Mukinduri_2020_2
223	1	2020	2	202	17	Muslim village_2020_2
224	1	2020	2	203	17	Mwangaza_2020_2
225	2	2020	2	204	18	Mwanzo Site & Service_2020_2
226	1	2020	2	205	17	Nabute - Lodwar Municipality_2020_2
227	1	2020	2	206	17	Nangeni_2020_2
228	1	2020	2	207	17	Ndhiwa settlement_2020_2
229	1	2020	2	208	17	Ndindiruku_2020_2
230	1	2020	2	209	17	Nginoka Kim-Lokichar Town_2020_2
231	1	2020	2	210	17	Nubian_2020_2
232	1	2020	2	211	17	Nyamurutu_2020_2
233	2	2020	2	212	18	Nyandiwa_2020_2
234	2	2020	2	213	18	Nyawita_2020_2
235	1	2020	2	214	17	Public Works- Lodwar Municipality_2020_2
236	2	2020	2	215	18	Rusinga Old Town_2020_2
237	1	2020	2	216	17	Rwambiti_2020_2
238	2	2020	2	217	18	Salama_2020_2
239	2	2020	2	218	18	Shallattey_2020_2
240	2	2020	2	219	18	Shanti_2020_2
241	1	2020	2	220	17	Shauri (Timboroa Centre)_2020_2
242	2	2020	2	221	18	Shauri Yako_2020_2
243	1	2020	2	222	17	Shauri yako_2020_2
244	2	2020	2	223	18	Shibale_2020_2
245	1	2020	2	224	17	Shimo la Tewa_2020_2
246	1	2020	2	225	17	Slota_2020_2
247	2	2020	2	226	18	Sofia_2020_2
248	1	2020	2	227	17	Soko mjinga_2020_2
249	1	2020	2	228	17	Soweto-Lodwar Municipality_2020_2
250	1	2020	2	229	17	Thiguku_2020_2
251	1	2020	2	230	17	Tiwi Block 12_2020_2
252	1	2020	2	231	17	Town Chini-Lokichar Town_2020_2
253	2	2020	2	232	18	Tuwani_2020_2
254	2	2020	2	233	18	Upper Kariokor_2020_2
255	1	2020	2	234	17	Wachakone_2020_2
256	2	2020	2	235	18	Wagberi_2020_2
257	2	2020	2	236	18	Witu old town_2020_2
258	2	2020	2	237	18	Wiyoni Village_2020_2
259	3	2020	2	1	19	Embakasi_2020_2
260	3	2020	2	2	19	Kahawa Soweto_2020_2
261	3	2020	2	3	19	Kambi Moto_2020_2
262	3	2020	2	73	19	Bondeni_2020_2
263	3	2020	2	75	19	Shauri yako_2020_2
264	3	2020	2	77	19	Shauri Moyo_2020_2
265	3	2020	2	79	19	Kambi Somali_2020_2
266	3	2020	2	80	19	Mjini_2020_2
267	3	2020	2	81	19	Amalemba_2020_2
268	3	2020	2	126	19	Kalolo_2020_2
269	3	2020	2	149	19	Kibaoni_2020_2
270	3	2020	2	89	19	Bayamangozi_2020_2
271	3	2020	2	199	19	Mtaani_2020_2
272	3	2020	2	160	19	Kisumu Ndogo_2020_2
273	3	2020	2	16	19	Muyeye I_2020_2
274	3	2020	2	139	19	Kayole Soweto_2020_2
275	3	2020	2	136	19	Karagita_2020_2
276	3	2020	2	165	19	Lake View_2020_2
277	3	2020	2	170	19	London_2020_2
278	3	2020	2	163	19	Kwa Murogi_2020_2
279	3	2020	2	87	19	Bandani_2020_2
280	3	2020	2	152	19	Kibuye_2020_2
281	3	2020	2	182	19	Manyatta A (Kona Mbaya and Migosi)_2020_2
282	3	2020	2	183	19	Manyatta B_2020_2
283	3	2020	2	200	19	Muhoroni (Sangoro)_2020_2
284	3	2020	2	213	19	Nyawita_2020_2
285	3	2020	2	172	19	Lukoye_2020_2
286	3	2020	2	223	19	Shibale_2020_2
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
-- Data for Name: other_facility; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.other_facility (id, type, name, condition, frequency, type_waste, cost_per_use, number_stances, number_staff, number_phases, size_reserve, rating, number_vehicles, date_install, height, ownership_type, owner, settlement_id, geom) FROM stdin;
1	playground	\N	500			0	0	0		0		0	2022-11-22 23:41:53.213+03	0	Private	test	4	0101000020E6100000209797C544714240C0F3C8941F2CF5BF
2	chiefs_camp	\N	200			0	0	2		0		2	2022-11-22 23:41:53.213+03	0	public	gok	4	0101000020E6100000209797C544714240C0F3C8941F2CF5BF
3	powerline	\N	300			0	0	0	3_phase	0	hv	0	2022-11-22 23:43:00.294+03	0	public	kplc	4	0102000020E61000000A000000F0F7370E96744240C07DA114E1C6F5BF6423B8AA517542400001870FE6DBF5BFD8F4FE9F2D764240C017D3E857F3F5BFF4A27A229576424000D3701B8303F6BF2C3C958516774240808E3E18B917F6BF7074C1177177424040B66B667725F6BFDC00308553784240406905D3C830F6BF109A4AE8D4784240406905D3C830F6BF2CB16965AA79424040D553A59D20F6BFEC5139F2727A4240003272BEC90AF6BF
4	shower	\N	500			0	1	0		0		0	2022-11-22 23:44:06.383+03	0	Private	yrtt	5	0101000020E61000007C148911727842408065FB748101F6BF
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
6	0.01789347926	\N	1	37	\N	01_37	0	0106000020E6100000010000000103000000010000000A000000563C3B96DE7442401D1A9072A2E3F4BF7142F122D9744240C25F4A1DF0E3F4BFA2751411D8744240C6474DAFA6E3F4BFE14E7D89DD7442407F9EA93C56E3F4BFE4C79B9EDD744240FB2E150655E3F4BF8A961AE9DD7442401C11344C6AE3F4BFAB2244F0DD744240C3F6D0576CE3F4BF4A2DB491DE744240B38004729AE3F4BF0688E4A9DE7442400222645AA1E3F4BF563C3B96DE7442401D1A9072A2E3F4BF
7	0.01804118482	\N	1	45	\N	01_45	4	0106000020E6100000010000000103000000010000000B00000060ACBBE9E274424061400F84DCE4F4BFE0B466B4DD744240D5A93CAD29E5F4BFCD67D091DC7442404B2143C3DBE4F4BFBB454AD1E1744240AD96B0FC8CE4F4BFD469FFDFE17442408E04EB1F8CE4F4BF36D0C4EFE174424037BAE4A090E4F4BF6DEC83F4E174424019A6E5FB91E4F4BFFD69D2C8E27442405E94F89CCEE4F4BFBAF922CEE27442401CFC8221D0E4F4BF2A00D9F6E274424049C7C4C1DBE4F4BF60ACBBE9E274424061400F84DCE4F4BF
8	0.01843007952	\N	1	41	\N	01_41	0	0106000020E6100000010000000103000000010000000B000000AED5F4DDE07442409AC358FB47E4F4BF74901A88DB7442406496D68494E4F4BF842CB467DA7442400606FE3047E4F4BFDF8E08C3DF744240798BF0BFF7E3F4BF984DD2D4DF744240B8B723B8F6E3F4BFA7F29DD9DF74424030FCB816F8E3F4BF076A9264E0744240F3C148C51FE4F4BF8C7E55ACE0744240E901954334E4F4BF7927F6B1E07442400927FFDE35E4F4BFCEB131EEE0744240C593691247E4F4BFAED5F4DDE07442409AC358FB47E4F4BF
9	0.01854086057	\N	1	35	\N	01_35	0	0106000020E6100000010000000103000000010000000B000000E14E7D89DD7442407F9EA93C56E3F4BFA2751411D8744240C6474DAFA6E3F4BF19EAA1F5D67442401CCE66AF5AE3F4BF72DE2778DC74424099A368B908E3F4BF3351D18EDC74424014314E6807E3F4BF5011098FDC74424041EE397807E3F4BF05F84A0DDD744240F49782862BE3F4BF8E1E7815DD744240434142DC2DE3F4BFDB7AA083DD744240A6178A514DE3F4BFE4C79B9EDD744240FB2E150655E3F4BFE14E7D89DD7442407F9EA93C56E3F4BF
10	0.01944425825	\N	1	33	\N	01_33	0	0106000020E6100000010000000103000000010000000D000000677A3B7ADB74424026F9056CB8E2F4BFC8868A7EDB744240705C06A7B9E2F4BF8CA89689DB7442400E30AACEBCE2F4BF9AF69E5ADC744240FB7E5E80F8E2F4BFD43ADA61DC744240B3C50A91FAE2F4BF3351D18EDC74424014314E6807E3F4BF72DE2778DC74424099A368B908E3F4BF19EAA1F5D67442401CCE66AF5AE3F4BF2D5E49CFD574424030406EC30BE3F4BFA566825CDB744240A7667D49B8E2F4BF59AC085EDB744240170E2AB8B8E2F4BF86C94F76DB744240E049654DB7E2F4BF677A3B7ADB74424026F9056CB8E2F4BF
11	0.02038564057	\N	1	39	\N	01_39	0	0106000020E6100000010000000103000000010000000B000000DF8E08C3DF744240798BF0BFF7E3F4BF842CB467DA7442400606FE3047E4F4BF7142F122D9744240C25F4A1DF0E3F4BF563C3B96DE7442401D1A9072A2E3F4BF0688E4A9DE7442400222645AA1E3F4BFF8A1E7ABDE744240D1937DEDA1E3F4BF60371ACFDE744240F81DADFAABE3F4BF45E3D2E6DE744240571ADFC0B2E3F4BF15B032D4DF7442400CBE8E8AF6E3F4BF984DD2D4DF744240B8B723B8F6E3F4BFDF8E08C3DF744240798BF0BFF7E3F4BF
12	0.01598738623	\N	1	44	\N	01_44	0	0106000020E61000000100000001030000000100000009000000D469FFDFE17442408E04EB1F8CE4F4BF23F3BEDFE17442406648820D8CE4F4BF19256278E17442405766FF886EE4F4BFA09B676FE1744240638A98F86BE4F4BFC23AE5EFE0744240CF2DCA8E47E4F4BFCEB131EEE0744240C593691247E4F4BFA3AAD56DE6744240B2D97431F8E3F4BF0CDD0163E7744240CE349C6339E4F4BFD469FFDFE17442408E04EB1F8CE4F4BF
13	0.01758333953	\N	1	36	\N	01_36	0	0106000020E6100000010000000103000000010000000A000000E4C79B9EDD744240FB2E150655E3F4BFDB7AA083DD744240A6178A514DE3F4BF8E1E7815DD744240434142DC2DE3F4BF05F84A0DDD744240F49782862BE3F4BF5011098FDC74424041EE397807E3F4BF3351D18EDC74424014314E6807E3F4BFF42E3FB3E17442402985FCE9BAE2F4BF43F6DEBDE17442405201D019B9E2F4BF79A997E4E27442403517017907E3F4BFE4C79B9EDD744240FB2E150655E3F4BF
14	0.01765408413	\N	1	38	\N	01_38	0	0106000020E610000001000000010300000001000000080000000688E4A9DE7442400222645AA1E3F4BF4A2DB491DE744240B38004729AE3F4BFAB2244F0DD744240C3F6D0576CE3F4BF8A961AE9DD7442401C11344C6AE3F4BFE4C79B9EDD744240FB2E150655E3F4BF79A997E4E27442403517017907E3F4BFFFEBB107E4744240FEF6D6E154E3F4BF0688E4A9DE7442400222645AA1E3F4BF
15	0.01786363926	\N	1	34	\N	01_34	0	0106000020E6100000010000000103000000010000000B0000003351D18EDC74424014314E6807E3F4BFD43ADA61DC744240B3C50A91FAE2F4BF9AF69E5ADC744240FB7E5E80F8E2F4BF8CA89689DB7442400E30AACEBCE2F4BFC8868A7EDB744240705C06A7B9E2F4BF677A3B7ADB74424026F9056CB8E2F4BF86C94F76DB744240E049654DB7E2F4BF8283FA96E0744240410CFDAE6AE2F4BF43F6DEBDE17442405201D019B9E2F4BFF42E3FB3E17442402985FCE9BAE2F4BF3351D18EDC74424014314E6807E3F4BF
16	0.01906820091	\N	1	42	\N	01_42	0	0106000020E61000000100000001030000000100000009000000CEB131EEE0744240C593691247E4F4BF7927F6B1E07442400927FFDE35E4F4BF8C7E55ACE0744240E901954334E4F4BF076A9264E0744240F3C148C51FE4F4BFA7F29DD9DF74424030FCB816F8E3F4BF984DD2D4DF744240B8B723B8F6E3F4BF7AB2263BE57442407C93F2A3A6E3F4BFA3AAD56DE6744240B2D97431F8E3F4BFCEB131EEE0744240C593691247E4F4BF
17	0.0191700532	\N	1	46	\N	01_46	0	0106000020E610000001000000010300000001000000090000002A00D9F6E274424049C7C4C1DBE4F4BFBAF922CEE27442401CFC8221D0E4F4BFFD69D2C8E27442405E94F89CCEE4F4BF6DEC83F4E174424019A6E5FB91E4F4BF36D0C4EFE174424037BAE4A090E4F4BFD469FFDFE17442408E04EB1F8CE4F4BF0CDD0163E7744240CE349C6339E4F4BFA54D1E8EE8744240286EA1ED88E4F4BF2A00D9F6E274424049C7C4C1DBE4F4BF
18	0.01943051626	\N	1	40	\N	01_40	0	0106000020E61000000100000001030000000100000009000000984DD2D4DF744240B8B723B8F6E3F4BF15B032D4DF7442400CBE8E8AF6E3F4BF45E3D2E6DE744240571ADFC0B2E3F4BF60371ACFDE744240F81DADFAABE3F4BFF8A1E7ABDE744240D1937DEDA1E3F4BF0688E4A9DE7442400222645AA1E3F4BFFFEBB107E4744240FEF6D6E154E3F4BF7AB2263BE57442407C93F2A3A6E3F4BF984DD2D4DF744240B8B723B8F6E3F4BF
19	0.01746764058	\N	1	48	\N	01_48	0	0106000020E6100000010000000103000000010000000900000080D72EEBE37442406EF75C8821E5F4BF44882378E3744240E35ED7AD00E5F4BF49DA4071E3744240B75A77B6FEE4F4BF659E9E17E37442400AA39F1DE5E4F4BF4C3E4CF8E2744240362EC92BDCE4F4BF2A00D9F6E274424049C7C4C1DBE4F4BFA54D1E8EE8744240286EA1ED88E4F4BFA801EBA2E9744240D1D3CB88D2E4F4BF80D72EEBE37442406EF75C8821E5F4BF
20	0.0176647437	\N	1	50	\N	01_50	0	0106000020E6100000010000000103000000010000000A0000008F6688F8E5744240BDD2645658E5F4BFAF573CDBE474424032661D1E66E5F4BF7BB9C1D8E474424086C9716265E5F4BF679A8641E4744240BE389E303AE5F4BFE613103AE474424002A7050F38E5F4BF39C300F5E374424015E7455624E5F4BF80D72EEBE37442406EF75C8821E5F4BFA801EBA2E9744240D1D3CB88D2E4F4BFD99B7FBCEA744240458F6B691DE5F4BF8F6688F8E5744240BDD2645658E5F4BF
21	0.01673195348	\N	1	28	\N	01_28	5	0106000020E61000000100000001030000000100000005000000FCCDC83FD9744240A5DE2BCD15E2F4BF6EB40645D8744240D3DF1C6CCDE1F4BF1BE3BD99DD744240348EB67F7EE1F4BF458F3586DE7442406BCF11ABCAE1F4BFFCCDC83FD9744240A5DE2BCD15E2F4BF
22	0.0177635945	\N	1	26	\N	01_26	5	0106000020E610000001000000010300000001000000050000006EB40645D87442401FE01C6CCDE1F4BFFC05753CD774424098848A0E81E1F4BFB5136DA5DC7442405B1630CD2FE1F4BF1BE3BD99DD744240348EB67F7EE1F4BF6EB40645D87442401FE01C6CCDE1F4BF
23	0.01836757019	\N	1	24	\N	01_24	5	0106000020E61000000100000001030000000100000006000000FB05753CD774424098848A0E81E1F4BF65C7822DD674424095EDBED932E1F4BF10408198DB74424012FCC9B2E1E0F4BFA2A85DAFDB7442407A3ECE8AE0E0F4BFB5136DA5DC7442405B1630CD2FE1F4BFFB05753CD774424098848A0E81E1F4BF
24	0.01852241564	\N	1	22	\N	01_22	5	0106000020E6100000010000000103000000010000000600000065C7822DD674424095EDBED932E1F4BF897F1420D57442408122EF14E5E0F4BFE40020BBDA7442408E1974DE91E0F4BFA2A85DAFDB7442407A3ECE8AE0E0F4BF10408198DB74424012FCC9B2E1E0F4BF65C7822DD674424095EDBED932E1F4BF
25	0.01983386583	\N	1	18	\N	01_18	5	0106000020E6100000010000000103000000010000000A00000092982C06D474424009B594B993E0F4BFE0E112FED37442408225C15F91E0F4BFBC2E7AA8D3744240C95066967DE0F4BFBEC1C977D37442400B4B1D5572E0F4BF5B4049E4D2744240C4BF5E3C50E0F4BF69CB33D0D2744240449052874AE0F4BFD4C8ECF0D8744240B2203217ECDFF4BFDA9FD22FD9744240C07D6C8912E0F4BF24149AC0D97442409CCC0E2C41E0F4BF92982C06D474424009B594B993E0F4BF
26	0.01953192528	\N	1	20	\N	01_20	5	0106000020E61000000100000001030000000100000005000000897F1420D57442408122EF14E5E0F4BFFC143606D4744240DC2A0DB993E0F4BF24149AC0D97442409CCC0E2C41E0F4BFE40020BBDA7442408E1974DE91E0F4BF897F1420D57442408122EF14E5E0F4BF
27	0.01773317553	\N	1	27	\N	01_27	0	0106000020E6100000010000000103000000010000000700000080508825D974424038CD134317E2F4BF6C81E56ED37442406C3B65A368E2F4BFC278616ED274424048B218DC23E2F4BFF71CAA27D8744240EAD0CE1ECFE1F4BF6EB40645D8744240D3DF1C6CCDE1F4BFFCCDC83FD9744240A5DE2BCD15E2F4BF80508825D974424038CD134317E2F4BF
28	0.01914093927	\N	1	25	\N	01_25	0	0106000020E61000000100000001030000000100000007000000F71CAA27D8744240EAD0CE1ECFE1F4BFC278616ED274424048B218DC23E2F4BFC90E0959D174424025A70C7FD9E1F4BFAA84B71BD77442401E6047FA82E1F4BFFC05753CD774424098848A0E81E1F4BF6EB40645D87442401FE01C6CCDE1F4BFF71CAA27D8744240EAD0CE1ECFE1F4BF
30	0.01998339498	\N	1	23	\N	01_23	0	0106000020E61000000100000001030000000100000007000000AA84B71BD77442401E6047FA82E1F4BFC90E0959D174424025A70C7FD9E1F4BF2B495538D0744240303377168CE1F4BF945C3809D6744240B28652F934E1F4BF65C7822DD674424095EDBED932E1F4BFFB05753CD774424098848A0E81E1F4BFAA84B71BD77442401E6047FA82E1F4BF
31	0.0201555439	\N	1	21	\N	01_21	0	0106000020E61000000100000001030000000100000007000000945C3809D6744240B28652F934E1F4BF2B495538D0744240303377168CE1F4BFD0888117CF74424061F54EA53EE1F4BFFD8F36F8D4744240B6CEBC64E7E0F4BF897F1420D57442408122EF14E5E0F4BF65C7822DD674424095EDBED932E1F4BF945C3809D6744240B28652F934E1F4BF
87	0.01393947561	\N	1	75	\N	01_75	0	0106000020E61000000100000001030000000100000005000000860A4BD0E9744240C4DDF0B031DFF4BF6D187151E7744240DFE17B9549DFF4BFAF918AFEE6744240766BEA77ACDEF4BF182D4A9EE974424050F3222DA2DEF4BF860A4BD0E9744240C4DDF0B031DFF4BF
2	0.01462855989	\N	1	30	\N	01_30	0	0106000020E6100000010000000103000000010000000500000034A42B6BDA74424039558B036BE2F4BFBC1A627DD97442400408AB1B27E2F4BF32C618BDDE74424096CC2759DCE1F4BFB58ABE85DF7442405568C3FA1CE2F4BF34A42B6BDA74424039558B036BE2F4BF
4	0.01696532578	\N	1	32	\N	01_32	2	0106000020E6100000010000000103000000010000000900000086C94F76DB744240E049654DB7E2F4BF19C0EA9DDA744240055F768179E2F4BFAD037594DA74424069E2E0CD76E2F4BFE86EF472DA744240EA10A23C6DE2F4BF34A42B6BDA74424039558B036BE2F4BFB58ABE85DF7442405568C3FA1CE2F4BF7BE589DFDF744240DA1A4DE739E2F4BF8283FA96E0744240410CFDAE6AE2F4BF86C94F76DB744240E049654DB7E2F4BF
5	0.01623471761	\N	1	43	\N	01_43	5	0106000020E6100000010000000103000000010000000B000000BB454AD1E1744240AD96B0FC8CE4F4BFCD67D091DC7442404B2143C3DBE4F4BF74901A88DB7442406496D68494E4F4BFAED5F4DDE07442409AC358FB47E4F4BFCEB131EEE0744240C593691247E4F4BFC23AE5EFE0744240CF2DCA8E47E4F4BFA09B676FE1744240638A98F86BE4F4BF19256278E17442405766FF886EE4F4BF23F3BEDFE17442406648820D8CE4F4BFD469FFDFE17442408E04EB1F8CE4F4BFBB454AD1E1744240AD96B0FC8CE4F4BF
39	0.101783505	\N	1	11	\N	01_11	0	0106000020E610000001000000010300000001000000190000003E5E513ED7744240A6190D70E2DEF4BF743A4045D7744240221B62D1E9DEF4BFF806C842D774424015741FABEFDEF4BF6F501E42D77442407513303DF1DEF4BF3BEF0235D77442404B943E7CF8DEF4BF339E4F1ED7744240AD24A258FFDEF4BF5047ADFED6744240987E4D9F05DFF4BF424E07D7D674424063698D210BDFF4BF35F023C4D67442403645DAFD0CDFF4BFEEB884A8D6744240CD3D64B60FDFF4BF249C7F74D6744240DDE3BA3B13DFF4BF750C7B3CD6744240B2815E9715DFF4BF47A327F8D5744240356C1DAC17DFF4BF65152564D57442405E3B2B2E1CDFF4BFF5E640F5CC744240EE2555EF5DDFF4BF35D6DF78C9744240AECEA22B7ADFF4BFB49E0608C974424012B5C10EC4DEF4BFBBAB411FC9744240FB0AD61AC3DEF4BFACD65E2DCD744240A0B9092DA2DEF4BFCC75FE25CC744240F9B91E7F08DEF4BF7AD71122CE744240213DF80FF8DDF4BF4672C657CF744240DD38CA1B93DEF4BF54068B25D3744240D94D43DE77DEF4BFBEFEB369D67442408F6C327A60DEF4BF3E5E513ED7744240A6190D70E2DEF4BF
40	0.02644534227	\N	1	4	\N	01_04	0	0106000020E610000001000000010300000001000000140000003C2C4246D37442403936542CC2DBF4BFF0BACD66D3744240CF5A38ABF6DBF4BF2E92F4BDD37442401387DE3E83DCF4BF0343035FD3744240ED17D21184DCF4BF48594595D074424099B2DCFC8DDCF4BFBC387090D0744240708EF6168EDCF4BF5C3642B2CF7442402409D821B1DBF4BFC18FF8B1CF744240BFD75EE6B0DBF4BFC641994AD1744240CDAD7AE4ACDBF4BFC68E9E66D274424052BD681BAADBF4BF794C5181D2744240C780B923AADBF4BF1504E48AD2744240CAAEA426AADBF4BF5C0B8DAED2744240FCAD61FCAADBF4BFAD6284D0D274424027444E96ACDBF4BF71D9C1EFD2744240B30AF6E7AEDBF4BF2673520BD3744240748A4FDFB1DBF4BF62C95F22D374424072854865B5DBF4BF648F3634D3744240DB6A795EB9DBF4BFAB044C40D3744240A27DFAABBDDBF4BF3C2C4246D37442403936542CC2DBF4BF
41	0.03015028455	\N	1	3	\N	01_03	0	0106000020E61000000100000001030000000100000006000000BC387090D0744240708EF6168EDCF4BFD9EA87E7CC744240BAA34DDBA1DCF4BF3CEB4308CC744240E256CF18BADBF4BFC18FF8B1CF744240BFD75EE6B0DBF4BF5C3642B2CF7442402409D821B1DBF4BFBC387090D0744240708EF6168EDCF4BF
42	0.04366528955	\N	1	2	\N	01_02	0	0106000020E61000000100000001030000000100000015000000FA498D3DC7744240A6AEEF2EE0DBF4BF0168933DC7744240576C741BDCDBF4BF1FF1AA42C774424051D5F014D8DBF4BF52CCB34CC774424030DDC434D4DBF4BF96B86E5BC774424074C75E93D0DBF4BF77DB7E6EC77442406122A147CDDBF4BF8B0A6C85C7744240218C5266CADBF4BFC6C0A59FC7744240F6B39A01C8DBF4BF99AD86BCC77442407FEF8F28C6DBF4BFEBC658DBC7744240311FD8E6C4DBF4BFF3C059FBC774424010395944C4DBF4BFBE777EF2C87442401DC3CED7C1DBF4BF77607043C9744240E52A910CC1DBF4BF1082950ECA7442402818800EBFDBF4BF3CEB4308CC744240E256CF18BADBF4BFD9EA87E7CC744240BAA34DDBA1DCF4BF569AF8C9C7744240652DBFC9C2DCF4BF21C37F80C7744240CF6788384CDCF4BFEA19AB6DC774424059A614D52DDCF4BF5D9AD969C7744240F3E29EAB27DCF4BFFA498D3DC7744240A6AEEF2EE0DBF4BF
43	0.02665685386	\N	1	7	\N	01_07	0	0106000020E61000000100000001030000000100000015000000DEE9FE36C9744240D1E759A1F9DDF4BF5B4D8832C9744240B9BA33B9F9DDF4BFDD8ECE1DC97442400348F427FADDF4BFAB604604C97442405EABB11FFADDF4BFD4D02CEBC8744240C944D288F9DDF4BFAAA451D9C874424049DB06B1F8DDF4BF14F544D3C874424020B8EA67F8DDF4BF369B48BDC87442401C7DC0C5F6DDF4BFC4A4E2A9C874424026B505AFF4DDF4BF01D7A999C8744240667CF633F2DDF4BFFB461C8DC874424029BCDA67EFDDF4BFB6859B84C8744240644E7060ECDDF4BFA9A96980C874424026024235E9DDF4BFB21E8778C8744240153FC77BDCDDF4BFE6FE0175C87442408B6B90CDD6DDF4BF4793F273C874424066538D17D5DDF4BF3173C36DC8744240DC6ABD1CCBDDF4BF75908A51C8744240B65A62919DDDF4BFA28D711DD074424098B65F0E69DDF4BFF804B1D1D0744240316F9FA9BADDF4BFDEE9FE36C9744240D1E759A1F9DDF4BF
44	0.02116443454	\N	1	6	\N	01_06	0	0106000020E610000001000000010300000001000000080000002EDFC284D4744240FD72C10E38DDF4BF463A0217D1744240CB8D46ED43DDF4BFBC387090D0744240708EF6168EDCF4BF48594595D074424099B2DCFC8DDCF4BF0343035FD3744240ED17D21184DCF4BF2E92F4BDD37442401387DE3E83DCF4BFDDAF24F9D37442402D606EB7E2DCF4BF2EDFC284D4744240FD72C10E38DDF4BF
45	0.08557254978	\N	1	5	\N	01_05	0	0106000020E61000000100000001030000000100000015000000E76D6AF6D47442401A2E59877DDDF4BFFD6BBFFAD4744240C7A7F71B82DDF4BFB3BDE3F8D4744240961957B786DDF4BFEEF5E4F0D47442403A1BD0378BDDF4BF8B7CFDE2D4744240A0C57F7C8FDDF4BFCCE392CFD47442407BF2376693DDF4BF440233B7D47442409FFC62D896DDF4BFC2E68F9AD47442404597D4B999DDF4BF95C37A7AD4744240B3AC81F59BDDF4BF54F6DD57D4744240DB191A7B9DDDF4BF413F6840D474424007CE5C3D9EDDF4BF2FB667A5D37442401AFBDD40A3DDF4BFF804B1D1D0744240316F9FA9BADDF4BFA28D711DD074424098B65F0E69DDF4BF75908A51C8744240B65A62919DDDF4BF569AF8C9C7744240652DBFC9C2DCF4BFD9EA87E7CC744240BAA34DDBA1DCF4BFBC387090D0744240708EF6168EDCF4BF463A0217D1744240CB8D46ED43DDF4BF2EDFC284D4744240FD72C10E38DDF4BFE76D6AF6D47442401A2E59877DDDF4BF
47	0.03776883102	\N	1	52	\N	01_52	5	0106000020E6100000010000000103000000010000001100000095BEAF36DC744240DE897BA4F3DDF4BF5BC7A48EDB744240AA82553CF6DDF4BF8EDCAD84DA7442400B9A3A1E64DDF4BFC56C7AFEE1744240D881B85751DDF4BF7986D6B2E2744240ADB1E031D8DDF4BFF62A2EB5E274424025F458FCD9DDF4BFE7CF2DEAE174424096D65A1EDDDDF4BF334B74DEE1744240CC14AD4CDDDDF4BF2D427628DF74424084E17602E8DDF4BF8DA5ED20DF74424095EA3D20E8DDF4BFBDDBFAC2DD7442407EBFD886EDDDF4BF941B8399DD744240C3BFAC2AEEDDF4BF4EF6C963DD744240B4C3EBFEEEDDF4BF366A99CADC744240D8E9215CF1DDF4BFA54651C6DC7442407F770C6DF1DDF4BF43BD3772DC744240ADEF4DB9F2DDF4BF95BEAF36DC744240DE897BA4F3DDF4BF
48	0.0260250698	\N	1	53	\N	01_53	5	0106000020E6100000010000000103000000010000000C00000039FD7C5FE4744240FAB21C68D3DDF4BFF62A2EB5E274424025F458FCD9DDF4BF7986D6B2E2744240ADB1E031D8DDF4BFC56C7AFEE1744240D881B85751DDF4BF8B38B81EE27442409213BF0651DDF4BF7025256AE7744240EB0E97BA43DDF4BF6EDA4B07E874424062599329C1DDF4BF95509B0BE8744240EC67F0E5C4DDF4BFF85C1EEEE674424018D3D44DC9DDF4BF20DC96CDE674424011B658CEC9DDF4BF8F9A14A0E4744240EAA1EC68D2DDF4BF39FD7C5FE4744240FAB21C68D3DDF4BF
49	0.04050510917	\N	1	54	\N	01_54	5	0106000020E610000001000000010300000001000000120000004FD2FF0BE8744240555463E4C4DDF4BF95509B0BE8744240EC67F0E5C4DDF4BF6EDA4B07E874424062599329C1DDF4BF7025256AE7744240EB0E97BA43DDF4BF9B1652B5EC74424048EB0E6F36DDF4BF4FBFD26EED74424006CB2A9D34DDF4BFF56F3D71F4744240035227B68ADDF4BF88945648F27442408DB23FD994DDF4BF63926C3AF27442409859A31695DDF4BFF5F3F7B4F17442403302B88A97DDF4BFE2E41155EF7442406C4333B2A2DDF4BFA4F8D337EF7442408760743BA3DDF4BF410D8BC7EE74424000167E4AA5DDF4BFD19F087BEC744240B03FD014B0DDF4BF6BCECF2FEC744240B512E375B1DDF4BFD5582479E974424084647F32BEDDF4BFE2BD6747E97442409920F31BBFDDF4BF4FD2FF0BE8744240555463E4C4DDF4BF
50	0.02219732503	\N	1	55	\N	01_55	5	0106000020E61000000100000001030000000100000013000000823F9FA7D774424041AE87A737DEF4BF92B839A5D7744240C78C8D2935DEF4BF47541EA6D7744240F33F91A732DEF4BF97D946AAD77442407B5A0C3330DEF4BFAA2F18B0D7744240A5C031572EDEF4BF954E96B1D7744240F49B1ADD2DDEF4BF538DC5BAD7744240D17FF1EF2BDEF4BF43C2D9BBD774424068B102B62BDEF4BFA7AFC9C8D77442407DD1C4CC29DEF4BF15F00BD8D77442405031B22E28DEF4BF712F36E9D7744240ED3710E726DEF4BF13D1D0FBD77442404EF4C9FE25DEF4BF4F315A0FD8744240B8F7317C25DEF4BF373511A0DA74424045EDAE591BDEF4BFCC3DF3D1DB744240CEEAAB33D4DEF4BFB962ACE2D874424037419B3AF8DEF4BFEA0EDAAFD7744240073C50AF3CDEF4BF510CF7ADD7744240140F13883BDEF4BF823F9FA7D774424041AE87A737DEF4BF
51	0.02349515816	\N	1	70	\N	01_70	5	0106000020E61000000100000001030000000100000014000000EC88BF72DB7442401C70C73ABBDFF4BF34068041DB7442402F056A86BCDFF4BF66E68D20DB744240AE7658B1BCDFF4BF156B3A0FDB7442404A4EECC7BCDFF4BF3F294FDDDA744240D50483FDBBDFF4BF00391CADDA7442407D38B92CBADFF4BF9E83F37FDA744240FB6D4962B7DFF4BF74A21157DA7442408163C4B1B3DFF4BF38339533DA7442405CE50735AFDFF4BFA051EF26DA744240818D03F7ACDFF4BFB0FE7616DA744240A176890BAADFF4BF7D288300DA74424054C47959A4DFF4BFE99753F2D974424045EAC6469EDFF4BF3A82ADE3D97442408D248B5295DFF4BFB962ACE2D874424037419B3AF8DEF4BFCC3DF3D1DB744240CEEAAB33D4DEF4BF0B9D262EDD74424050BA7FA0A6DFF4BF7DE98D1BDD744240A4899157ABDFF4BFB0D43EABDB7442405BE3DB1DB9DFF4BFEC88BF72DB7442401C70C73ABBDFF4BF
52	0.01930572503	\N	1	56	\N	01_56	0	0106000020E610000001000000010300000001000000050000005D8602D6DE7442406466FDCDAFDEF4BFCC3DF3D1DB744240CEEAAB33D4DEF4BF373511A0DA74424045EDAE591BDEF4BFA12EE783DD744240C7EFC7EE0FDEF4BF5D8602D6DE7442406466FDCDAFDEF4BF
53	0.02246257697	\N	1	71	\N	01_71	2	0106000020E61000000100000001030000000100000007000000CC3DF3D1DB744240CEEAAB33D4DEF4BF5D8602D6DE7442406466FDCDAFDEF4BF0FCE7090DF7442406CC7C8A88FDFF4BF7939BB94DF744240D08A5BA993DFF4BF7DE98D1BDD744240A4899157ABDFF4BF0B9D262EDD74424050BA7FA0A6DFF4BFCC3DF3D1DB744240CEEAAB33D4DEF4BF
88	0.01372378012	\N	1	76	\N	01_76	0	0106000020E610000001000000010300000001000000050000001BAA4BF2EC744240CB8357B213DFF4BF860A4BD0E9744240C4DDF0B031DFF4BF182D4A9EE974424050F3222DA2DEF4BF96A8A5F5EB744240AF44E29D94DEF4BF1BAA4BF2EC744240CB8357B213DFF4BF
89	0.01382052013	\N	1	77	\N	01_77	0	0106000020E6100000010000000103000000010000000500000013278A61F0744240DC1235D0F2DEF4BF1BAA4BF2EC744240CB8357B213DFF4BF96A8A5F5EB744240AF44E29D94DEF4BFB1A331D6EE744240FA2D336A8DDEF4BF13278A61F0744240DC1235D0F2DEF4BF
34	0.02147974437	\N	1	14	\N	01_14	0	0106000020E610000001000000010300000001000000050000006A8C0281D374424038BA7AE23FE0F4BF5FDB9302D1744240105D945166E0F4BFAFD1A4BECF744240FB39AEBC82DFF4BFF3D92B6AD2744240896E20EB6DDFF4BF6A8C0281D374424038BA7AE23FE0F4BF
36	0.01960873755	\N	1	10	\N	01_10	0	0106000020E61000000100000001030000000100000015000000BD6D3273D57442400B674A3DCEDDF4BF6EB79E7BD5744240A880CD74D0DDF4BFE45EFB83D57442403500920FD4DDF4BF3B60D88FD5744240EDA7ED4FDBDDF4BFBEFEB369D67442408F6C327A60DEF4BF54068B25D3744240D94D43DE77DEF4BF46AA7829D2744240D9FA62B3D6DDF4BFB4C69824D47442400D46DD4BC6DDF4BF879C8588D47442404E0B3510C3DDF4BF270C55A1D47442404406D042C2DDF4BF11F8BDBED474424091D1329FC1DDF4BF8D5196DCD474424076ADCD96C1DDF4BFD87415FAD47442405F6E8129C2DDF4BF71C67516D5744240B8457753C3DDF4BF632CF930D5744240DA12E30CC5DDF4BF5937A735D5744240FED4E27CC5DDF4BFB307EE48D5744240719C374AC7DDF4BFCB668455D57442401E6778ECC8DDF4BF6FDAB35DD574424096F673FCC9DDF4BFCB7ABF6ED574424056068811CDDDF4BFBD6D3273D57442400B674A3DCEDDF4BF
37	0.02336738705	\N	1	9	\N	01_09	0	0106000020E6100000010000000103000000010000000500000054068B25D3744240D94D43DE77DEF4BF4672C657CF744240DD38CA1B93DEF4BF7AD71122CE744240213DF80FF8DDF4BF46AA7829D2744240D9FA62B3D6DDF4BF54068B25D3744240D94D43DE77DEF4BF
38	0.03384701436	\N	1	12	\N	01_12	0	0106000020E6100000010000000103000000010000000900000035D6DF78C9744240AECEA22B7ADFF4BFF5E640F5CC744240EE2555EF5DDFF4BF5D7B121CCD74424038A4599D7BDFF4BF44A0DF3ECD744240328C0D3996DFF4BF6CE78C7FCE74424008887D678BE0F4BF1B703381CE74424015900DEE8CE0F4BF802CABDECC744240310B3220A6E0F4BF3EC378AAC9744240569CB735CADFF4BF35D6DF78C9744240AECEA22B7ADFF4BF
33	0.02255956851	\N	1	13	\N	01_13	0	0106000020E610000001000000010300000001000000060000005FDB9302D1744240105D945166E0F4BF1B703381CE74424015900DEE8CE0F4BF6CE78C7FCE74424008887D678BE0F4BF44A0DF3ECD744240328C0D3996DFF4BFAFD1A4BECF744240FB39AEBC82DFF4BF5FDB9302D1744240105D945166E0F4BF
58	0.01677462043	\N	1	83	\N	01_83	0	0106000020E61000000100000001030000000100000007000000BA7F05F1E4744240F13ABACE51E0F4BF584C7389E27442403E4722D970E0F4BFD2E9EF63E074424005B1F440C8DFF4BFB089F35FE07442408B809668C7DFF4BFB7993BE8E2744240020FC329AFDFF4BFD86F49EEE2744240117DF829B0DFF4BFBA7F05F1E4744240F13ABACE51E0F4BF
59	0.01739938268	\N	1	93	\N	01_93	0	0106000020E61000000100000001030000000100000007000000DE481518E774424030F6E8DBFEE0F4BFB89FDBCCE47442404F4C4B9D22E1F4BF0314EFA6E2744240C652D8E479E0F4BF584C7389E27442403E4722D970E0F4BFBA7F05F1E4744240F13ABACE51E0F4BFEFEF4402E57442409EFD513957E0F4BFDE481518E774424030F6E8DBFEE0F4BF
60	0.0160834697	\N	1	84	\N	01_84	0	0106000020E61000000100000001030000000100000006000000BD82C262E77442409121AB4032E0F4BF586FB6F3E4744240007613A752E0F4BFD86F49EEE2744240117DF829B0DFF4BFB7993BE8E2744240020FC329AFDFF4BF03F58A69E5744240A39BAE2D97DFF4BFBD82C262E77442409121AB4032E0F4BF
61	0.01740444148	\N	1	94	\N	01_94	2	0106000020E61000000100000001030000000100000007000000C5EEA482E974424057651332D9E0F4BFDE481518E774424030F6E8DBFEE0F4BFEFEF4402E57442409EFD513957E0F4BF586FB6F3E4744240007613A752E0F4BFBD82C262E77442409121AB4032E0F4BFFA0F4368E7744240527004F133E0F4BFC5EEA482E974424057651332D9E0F4BF
62	0.01544252386	\N	1	85	\N	01_85	0	0106000020E61000000100000001030000000100000006000000FA47F1D0E97442406D292C8110E0F4BFFA0F4368E7744240527004F133E0F4BF03F58A69E5744240A39BAE2D97DFF4BF3F6C7BEDE7744240D0586D187FDFF4BFF204FCF4E7744240E8E888E07FDFF4BFFA47F1D0E97442406D292C8110E0F4BF
63	0.01689778696	\N	1	95	\N	01_95	0	0106000020E61000000100000001030000000100000005000000398214EAEB744240809CF4B8B3E0F4BFC5EEA482E974424057651332D9E0F4BFFA0F4368E7744240527004F133E0F4BFFA47F1D0E97442406D292C8110E0F4BF398214EAEB744240809CF4B8B3E0F4BF
64	0.01436734298	\N	1	86	\N	01_86	0	0106000020E61000000100000001030000000100000007000000E55CB439EC74424005A22010EDDFF4BFFA47F1D0E97442406D292C8110E0F4BFF204FCF4E7744240E8E888E07FDFF4BF3F6C7BEDE7744240D0586D187FDFF4BF17556B77EA744240B10ABFC966DFF4BFD6BEA080EA744240E6B08E2767DFF4BFE55CB439EC74424005A22010EDDFF4BF
65	0.01666187704	\N	1	96	\N	01_96	0	0106000020E610000001000000010300000001000000050000006566724DEE74424083C0427F8EE0F4BF398214EAEB744240809CF4B8B3E0F4BFFA47F1D0E97442406D292C8110E0F4BFE55CB439EC74424005A22010EDDFF4BF6566724DEE74424083C0427F8EE0F4BF
66	0.0158220537	\N	1	87	\N	01_87	0	0106000020E61000000100000001030000000100000006000000E3A07500EF7442406B675F38C4DFF4BFE55CB439EC74424005A22010EDDFF4BFD6BEA080EA744240E6B08E2767DFF4BF17556B77EA744240B10ABFC966DFF4BF6A6444B4ED744240F03E1FCA47DFF4BFE3A07500EF7442406B675F38C4DFF4BF
67	0.02068009144	\N	1	88	\N	01_88	0	0106000020E61000000100000001030000000100000005000000CB07C68FF3744240A0B7462481DFF4BFE3A07500EF7442406B675F38C4DFF4BF6A6444B4ED744240F03E1FCA47DFF4BF28529A1DF274424017428A8D1DDFF4BFCB07C68FF3744240A0B7462481DFF4BF
68	0.01782514344	\N	1	97	\N	01_97	0	0106000020E61000000100000001030000000100000005000000335EF0B7F0744240D5B07FD668E0F4BF6566724DEE74424083C0427F8EE0F4BFE55CB439EC74424005A22010EDDFF4BFE3A07500EF7442406B675F38C4DFF4BF335EF0B7F0744240D5B07FD668E0F4BF
69	0.01354448219	\N	1	98	\N	01_98	0	0106000020E61000000100000001030000000100000005000000960FEA04F3744240DAEFD3F944E0F4BF335EF0B7F0744240D5B07FD668E0F4BFE3A07500EF7442406B675F38C4DFF4BF666A2CAFF07442404C533C78ABDFF4BF960FEA04F3744240DAEFD3F944E0F4BF
70	0.01876659989	\N	1	101	\N	01_101	0	0106000020E610000001000000010300000001000000060000003FBA2B90F7744240755E8725FEDFF4BF7A47CC2DF57442401C8EA75969DFF4BF57DC9F08F7744240E30796104EDFF4BF7AD40C4DFB7442409CBF888ABFDFF4BF5C836A29FB74424011A2950DC6DFF4BF3FBA2B90F7744240755E8725FEDFF4BF
71	0.01508252048	\N	1	57	\N	01_57	0	0106000020E61000000100000001030000000100000008000000836593E4DD7442402E0CDA700EDEF4BFB783BD6BDE74424088E3D95A0CDEF4BF984F987EDE74424067715C100CDEF4BF38CEB903E0744240C707010F06DEF4BF8167406DE174424030CFC133A7DEF4BF5F8602D6DE7442401766FDCDAFDEF4BFA12EE783DD744240C7EFC7EE0FDEF4BF836593E4DD7442402E0CDA700EDEF4BF
72	0.01508191772	\N	1	58	\N	01_58	0	0106000020E6100000010000000103000000010000000700000038CEB903E0744240C707010F06DEF4BFCC88FE2EE0744240AEAE0F6405DEF4BF0FEDF336E07442409C779E4405DEF4BFE531229CE274424066D918CEFBDDF4BF300DE8E9E3744240238A250D99DEF4BF8167406DE174424030CFC133A7DEF4BF38CEB903E0744240C707010F06DEF4BF
73	0.01957226494	\N	1	59	\N	01_59	0	0106000020E61000000100000001030000000100000009000000E531229CE274424066D918CEFBDDF4BF9715547BE4744240FF38EB68F4DDF4BF8D3A7DAEE47442402FB3CB9EF3DDF4BF6D51EE6EE5744240F0B581A6F0DDF4BFAF918AFEE6744240766BEA77ACDEF4BF7C727B03E574424088C758F9B4DEF4BFD889D95AE4744240E8827ECDB7DEF4BF300DE8E9E3744240238A250D99DEF4BFE531229CE274424066D918CEFBDDF4BF
74	0.02186825474	\N	1	60	\N	01_60	0	0106000020E6100000010000000103000000010000000C0000006D51EE6EE5744240F0B581A6F0DDF4BF6FCB214EE674424037F9B134EDDDF4BF04ACB19AE6744240F6C43706ECDDF4BF0F5F8F9DE67442407C48F5F8EBDDF4BF8A1C1D2CE87442409F1F4FD4E5DDF4BF039B0932E8744240524FB5BAE5DDF4BFC08A68EBE8744240E27D9F54E2DDF4BF6FF67DF0E8744240E7F0C23CE2DDF4BFCD704019E9744240330F727DE1DDF4BF182D4A9EE974424050F3222DA2DEF4BFAF918AFEE6744240766BEA77ACDEF4BF6D51EE6EE5744240F0B581A6F0DDF4BF
75	0.01726186911	\N	1	61	\N	01_61	2	0106000020E61000000100000001030000000100000008000000CD704019E9744240330F727DE1DDF4BFBCFE041CE974424095477470E1DDF4BFFD416EFFEA744240D3C07093D8DDF4BF6BECA703EB744240E8AD9B7FD8DDF4BF0D17ADB9EB7442406BF43F29D5DDF4BF96A8A5F5EB744240AF44E29D94DEF4BF182D4A9EE974424050F3222DA2DEF4BFCD704019E9744240330F727DE1DDF4BF
76	0.01864203626	\N	1	62	\N	01_62	2	0106000020E6100000010000000103000000010000000A0000000D17ADB9EB7442406BF43F29D5DDF4BFDDB265BAEB7442407A72DD25D5DDF4BFE4E65FDAEC74424008632BDECFDDF4BFDA3528E3EC744240975FF2B4CFDDF4BF6CCE7FABED744240E1DD9608CCDDF4BF3F4C85B2ED7442402BE1A1E7CBDDF4BF3790882EEE74424005EC8BA1C9DDF4BFB1A331D6EE744240FA2D336A8DDEF4BF96A8A5F5EB744240AF44E29D94DEF4BF0D17ADB9EB7442406BF43F29D5DDF4BF
78	0.02783302548	\N	1	69	\N	01_69	0	0106000020E610000001000000010300000001000000070000003E27477F00754240B0971E73CCDEF4BFF1E0E7F0FE7442403B74FA3F15DFF4BFA11E55F3F9744240A0740B07CBDEF4BF8406A993F77442400CEC3B20A7DEF4BF8C3AE564F97442409723AAA976DEF4BF1DEA91A4FA744240D0D1CD5C55DEF4BF3E27477F00754240B0971E73CCDEF4BF
79	0.0332555948	\N	1	68	\N	01_68	0	0106000020E610000001000000010300000001000000060000003E27477F00754240B0971E73CCDEF4BF1DEA91A4FA744240D0D1CD5C55DEF4BF57562D03FC744240B1DE0DD730DEF4BFAE9FEBE3FD7442402EA9EBC2FEDDF4BF31BEFB6F03754240B71FA5E542DEF4BF3E27477F00754240B0971E73CCDEF4BF
80	0.02093451631	\N	1	67	\N	01_67	0	0106000020E6100000010000000103000000010000000B0000008C3AE564F97442409723AAA976DEF4BF8406A993F77442400CEC3B20A7DEF4BFE5F0FA49F57442407EEFE21586DEF4BFCBA10F3AFB7442408EC6A4D0E8DDF4BF60E62436FB7442400578C0A0E8DDF4BFA874BA7CFB74424068F7793EE1DDF4BFDD219683FD7442409FF6A423FADDF4BFAE9FEBE3FD7442402EA9EBC2FEDDF4BF57562D03FC744240B1DE0DD730DEF4BF1DEA91A4FA744240D0D1CD5C55DEF4BF8C3AE564F97442409723AAA976DEF4BF
81	0.01468580241	\N	1	66	\N	01_66	0	0106000020E61000000100000001030000000100000009000000E5F0FA49F57442407EEFE21586DEF4BF20ED8929F47442402E80FED587DEF4BF2A0A60C8F87442402CC171EECADDF4BF35F3D0C6F87442409A7BCEDFCADDF4BF2AB552FBF874424029B10D78C2DDF4BFA874BA7CFB74424068F7793EE1DDF4BF60E62436FB7442400578C0A0E8DDF4BFCBA10F3AFB7442408EC6A4D0E8DDF4BFE5F0FA49F57442407EEFE21586DEF4BF
82	0.01369721584	\N	1	65	\N	01_65	0	0106000020E61000000100000001030000000100000009000000CC4E5A6CF67442409481020BA3DDF4BF2AB552FBF874424029B10D78C2DDF4BF35F3D0C6F87442409A7BCEDFCADDF4BF2A0A60C8F87442402CC171EECADDF4BF20ED8929F47442402E80FED587DEF4BF9D22FCD6F474424072FE685414DEF4BF85133532F67442401EB0FCA4B2DDF4BF81FB4134F6744240B7513DB8B2DDF4BFCC4E5A6CF67442409481020BA3DDF4BF
83	0.02133178375	\N	1	64	\N	01_64	0	0106000020E6100000010000000103000000010000000A000000CC4E5A6CF67442409481020BA3DDF4BF81FB4134F6744240B7513DB8B2DDF4BF85133532F67442401EB0FCA4B2DDF4BF9D22FCD6F474424072FE685414DEF4BF20ED8929F47442402E80FED587DEF4BFAA8F7265F1744240D7607A5B86DEF4BF30A45C2DF374424023E2082FB2DDF4BF2C8CED61F574424079D418D5A7DDF4BF09A8E96AF6744240CC5652F9A2DDF4BFCC4E5A6CF67442409481020BA3DDF4BF
84	0.02074119195	\N	1	72	\N	01_72	0	0106000020E610000001000000010300000001000000060000009FA8C224E2744240FF965A207BDFF4BF7939BB94DF744240D08A5BA993DFF4BF0FCE7090DF7442406CC7C8A88FDFF4BF5F8602D6DE7442401766FDCDAFDEF4BF8167406DE174424030CFC133A7DEF4BF9FA8C224E2744240FF965A207BDFF4BF
85	0.02027696974	\N	1	73	\N	01_73	0	0106000020E61000000100000001030000000100000006000000D889D95AE4744240E8827ECDB7DEF4BFA96AF6ACE4744240561B49E262DFF4BF9FA8C224E2744240FF965A207BDFF4BF8167406DE174424030CFC133A7DEF4BF300DE8E9E3744240238A250D99DEF4BFD889D95AE4744240E8827ECDB7DEF4BF
86	0.01573279995	\N	1	74	\N	01_74	0	0106000020E610000001000000010300000001000000060000006D187151E7744240DFE17B9549DFF4BFA96AF6ACE4744240561B49E262DFF4BFD889D95AE4744240E8827ECDB7DEF4BF7C727B03E574424088C758F9B4DEF4BFAF918AFEE6744240766BEA77ACDEF4BF6D187151E7744240DFE17B9549DFF4BF
55	0.02273286626	\N	1	91	\N	01_91	5	0106000020E61000000100000001030000000100000013000000FD9BC5FEDF744240E4FA03C76BE1F4BF9145DBD8DF744240FCC0FDF56BE1F4BF3A5537B3DF74424016D4D95B6BE1F4BF9647DF8EDF7442407D05C7FC69E1F4BFAF97CF6CDF744240843A4CE267E1F4BFF3E4F44DDF744240CC3F061B65E1F4BF76872533DF744240D04A42BA61E1F4BFD7BE1B1DDF744240C7DA77D75DE1F4BFD76B730CDF744240F0C3828D59E1F4BF0B5E60FBDE744240BCF5920D54E1F4BF4511CDE2DE744240E82949224CE1F4BF4F0EE54ADD74424079BD95BCC8E0F4BFD46BB314DD7442405E5EC447B7E0F4BF64CB2F00E0744240DD037A9691E0F4BFA4F78429E0744240DBB5B2859EE0F4BFD898444CE2744240180E809E49E1F4BF0E215547E074424029FE3C1869E1F4BFCBF2EE23E074424029D932D06AE1F4BFFD9BC5FEDF744240E4FA03C76BE1F4BF
56	0.01818304229	\N	1	82	\N	01_82	0	0106000020E61000000100000001030000000100000006000000584C7389E2744240F14622D970E0F4BF64CB2F00E0744240DD037A9691E0F4BFCE874EC9DD744240E3BDED30E0DFF4BFB089F35FE07442408B809668C7DFF4BFD2E9EF63E074424005B1F440C8DFF4BF584C7389E2744240F14622D970E0F4BF
57	0.01925145614	\N	1	92	\N	01_92	0	0106000020E61000000100000001030000000100000007000000B89FDBCCE47442404F4C4B9D22E1F4BFD898444CE2744240180E809E49E1F4BFA4F78429E0744240DBB5B2859EE0F4BF64CB2F00E0744240DD037A9691E0F4BF584C7389E2744240F14622D970E0F4BF0314EFA6E2744240C652D8E479E0F4BFB89FDBCCE47442404F4C4B9D22E1F4BF
97	0.00459398329	\N	1	80	\N	01_80	0	0106000020E6100000010000000103000000010000000B000000FBB4AC0FF9744240A487C6C3FCDEF4BFA171D4C8F874424040FEE5930ADFF4BF479040A5F87442404261AD8E07DFF4BF6463EBA4F7744240DD67B6CBF1DEF4BF802C78A1F77442406A406A9AEBDEF4BF3CBC1395F77442407B0D265CD5DEF4BF0E986719F874424077341107AFDEF4BFA11E55F3F9744240A0740B07CBDEF4BFB4DACC52F97442405ADA0D56EEDEF4BF57EC1B1DF9744240D29D3625FADEF4BFFBB4AC0FF9744240A487C6C3FCDEF4BF
98	0.00744138828	\N	1	79	\N	01_79	0	0106000020E6100000010000000103000000010000000C0000003CBC1395F77442407B0D265CD5DEF4BFE78F506EF7744240D6CF6F08D6DEF4BF29EB16ABF5744240E9F101DEDDDEF4BF98870014F5744240E3A8F083E3DEF4BF133D92B8F47442401BA188E9D9DEF4BF9B455277F474424041376A0FD3DEF4BFE5F0FA49F57442407EEFE21586DEF4BFB4BE128DF6744240F9B6F84F98DEF4BF8406A993F77442400CEC3B20A7DEF4BFE128F6F1F7744240195D81B2ACDEF4BF0E986719F87442402A341107AFDEF4BF3CBC1395F77442407B0D265CD5DEF4BF
101	0.01889112866	\N	1	47	\N	01_47	0	0106000020E61000000100000001030000000100000005000000E0B466B4DD744240D5A93CAD29E5F4BF4C3E4CF8E2744240362EC92BDCE4F4BF88E88E16E474424063844FAD2EE5F4BF54C5A5F0DE744240A98377467EE5F4BFE0B466B4DD744240D5A93CAD29E5F4BF
32	0.02152405599	\N	1	19	\N	01_19	0	0106000020E61000000100000001030000000100000007000000FD8F36F8D4744240B6CEBC64E7E0F4BFD0888117CF74424061F54EA53EE1F4BFA909C3E3CD74424000F8AF21ECE0F4BF0BDA71DAD374424042B5CB2F96E0F4BFFC143606D4744240DC2A0DB993E0F4BF897F1420D57442408122EF14E5E0F4BFFD8F36F8D4744240B6CEBC64E7E0F4BF
35	0.02207310405	\N	1	8	\N	01_08	0	0106000020E610000001000000010300000001000000150000004CFCBEB1C87442402F3F2FD238DEF4BF4492BDB1C87442402BB8363D35DEF4BF24F122B6C8744240FA373DB331DEF4BFFF09D4BEC87442405B340B4A2EDEF4BFEB5C9BCBC8744240D85D9F162BDEF4BF43422ADCC87442401A69AD2C28DEF4BF344DA0EEC8744240D986ADCE25DEF4BFC3CE1AF0C8744240F8C7249E25DEF4BFE946F206C9744240A742C27A23DEF4BF54122420C9744240DD1CAFCF21DEF4BFDF85163BC9744240AE89E0A720DEF4BFCC75FE25CC744240F9B91E7F08DEF4BFACD65E2DCD744240A0B9092DA2DEF4BFBBAB411FC9744240FB0AD61AC3DEF4BFB49E0608C974424012B5C10EC4DEF4BFEC09D0D7C87442402E2F8C4076DEF4BF0A1683C7C87442407FB552F25BDEF4BF55794EBFC8744240D02D66B44EDEF4BF0DBD3CBFC8744240E02AC7974EDEF4BFE424F6B4C8744240039894023EDEF4BF4CFCBEB1C87442402F3F2FD238DEF4BF
46	0.02263903909	\N	1	51	\N	01_51	5	0106000020E6100000010000000103000000010000001F00000041A7B4CDD774424056BC151105DEF4BF3F326EB8D77442409294582C05DEF4BF269A4EA3D77442401A29FED504DEF4BFD609EA8ED7744240D757B61004DEF4BFBC3DCF7BD77442405FF7E5E102DEF4BF1EEE836AD77442401784D45101DEF4BF2C27815BD77442408333726BFFDDF4BFE894D152D7744240B4FEF6E0FDDDF4BFC0F92F4FD774424053610B3CFDDDF4BFED9BE645D7744240D97DEBD2FADDF4BFB80DE63FD7744240D4FCF140F8DDF4BFA37B663AD7744240061A92E4F4DDF4BFD1F0B539D77442404DDEA878F4DDF4BFF6588194D67442400ECB677D8FDDF4BFF9871A85D67442406B325E1386DDF4BF75FFBC81D67442405E66938282DDF4BFC56A3483D6744240FDC795EC7EDDF4BFA38C9D84D674424061945C227EDDF4BF2B047689D67442408399BC6B7BDDF4BFF3464A94D674424024C1AF1C78DDF4BF67107EA3D6744240C60B0F0F75DDF4BF7308ADB2D6744240B2EC63EC72DDF4BF484B85B6D67442402E6AF66172DDF4BF07C1DDCCD6744240BC6B222670DDF4BFF44CE3E5D67442400C86FB6B6EDDF4BF0222DE00D7744240B4A131406DDDF4BFD310081DD7744240CEE45EAB6CDDF4BFE5F42847D7744240D5A990416CDDF4BF8EDCAD84DA7442400B9A3A1E64DDF4BF5BC7A48EDB744240AA82553CF6DDF4BF41A7B4CDD774424056BC151105DEF4BF
54	0.02168790225	\N	1	81	\N	01_81	5	0106000020E6100000010000000103000000010000001400000064CB2F00E0744240DD037A9691E0F4BFD46BB314DD7442405E5EC447B7E0F4BF707A3BA1DB7442406EE68AA03FE0F4BF635BC765DB744240BC36F0792CE0F4BF59ACC633DB744240202FE65F1CE0F4BFB303921ADB7442401339BA4114E0F4BFDA33CD11DB744240CA5B688F10E0F4BF488D000EDB744240217F6CBB0CE0F4BFC40AB00EDB74424056ECC7A30AE0F4BF95D6430FDB744240A6DDAAE008E0F4BF21CAE710DB74424040ED9AE407E0F4BF453C8E15DB744240BB11141A05E0F4BFF9C6B320DB744240FDC20B8201E0F4BFD68E6630DB7442407932B031FEDFF4BFEEDB3844DB7442406EB22A40FBDFF4BF1C25A05BDB744240D4BD0DC2F8DFF4BF4AD8F875DB7442403436C5C8F6DFF4BF1C188C92DB744240ACC6A662F5DFF4BFCE874EC9DD744240E3BDED30E0DFF4BF64CB2F00E0744240DD037A9691E0F4BF
77	0.02728895207	\N	1	63	\N	01_63	0	0106000020E610000001000000010300000001000000120000003790882EEE74424005EC8BA1C9DDF4BF3009C335EE74424036419E7FC9DDF4BF96216F6FEE744240A32CEB70C8DDF4BFCF22C075EE74424078584553C8DDF4BF3C9B5971EF74424065E652B6C3DDF4BF8680A48CEF744240C3193836C3DDF4BF59679676F0744240F16123ECBEDDF4BFEA5C9878F07442407FFBB6E2BEDDF4BFE74D1754F1744240AC4374DCBADDF4BFDB44D355F1744240296750D4BADDF4BFA2BE3D12F2744240F464EF5FB7DDF4BF9C7A9115F2744240248F5150B7DDF4BF1B6CE56CF274424004246CB6B5DDF4BF14361AF0F27442402071924EB3DDF4BF30A45C2DF374424023E2082FB2DDF4BFAA8F7265F1744240D7607A5B86DEF4BFB1A331D6EE744240FA2D336A8DDEF4BF3790882EEE74424005EC8BA1C9DDF4BF
90	0.01552056588	\N	1	99	\N	01_99	0	0106000020E610000001000000010300000001000000060000002052BD54F574424006B4BBF020E0F4BF960FEA04F3744240DAEFD3F944E0F4BF666A2CAFF07442404C533C78ABDFF4BF0CF1F0FCF2744240F4774B9489DFF4BF5EAAB49EF3744240A8982294B2DFF4BF2052BD54F574424006B4BBF020E0F4BF
91	0.01473123035	\N	1	100	\N	01_100	0	0106000020E610000001000000010300000001000000060000003FBA2B90F7744240755E8725FEDFF4BF2052BD54F574424006B4BBF020E0F4BF5EAAB49EF3744240A8982294B2DFF4BF0CF1F0FCF2744240F4774B9489DFF4BF7A47CC2DF57442401C8EA75969DFF4BF3FBA2B90F7744240755E8725FEDFF4BF
92	0.01548803424	\N	1	103	\N	01_103	0	0106000020E610000001000000010300000001000000060000001DC77184FD744240875866DA57DFF4BFBC6F07AAF874424031A5479510DFF4BF57EC1B1DF9744240D29D3625FADEF4BFA11E55F3F9744240A0740B07CBDEF4BFF1E0E7F0FE7442403B74FA3F15DFF4BF1DC77184FD744240875866DA57DFF4BF
93	0.0192171821	\N	1	102	\N	01_102	0	0106000020E610000001000000010300000001000000060000001DC77184FD744240875866DA57DFF4BF7AD40C4DFB7442409CBF888ABFDFF4BF57DC9F08F7744240E30796104EDFF4BFB7340853F874424099E05E1F33DFF4BFBC6F07AAF874424031A5479510DFF4BF1DC77184FD744240875866DA57DFF4BF
94	0.01397940206	\N	1	89	\N	01_89	0	0106000020E61000000100000001030000000100000005000000CB07C68FF3744240A0B7462481DFF4BF28529A1DF274424017428A8D1DDFF4BF71C756E4F574424087BCBA65F9DEF4BF57DC9F08F7744240E30796104EDFF4BFCB07C68FF3744240A0B7462481DFF4BF
95	0.01692438619	\N	1	78	\N	01_78	0	0106000020E6100000010000000103000000010000000C0000009B455277F474424041376A0FD3DEF4BF80D29F43F47442409FA8D0A2CDDEF4BFC072AB41F4744240AD48E36ECDDEF4BF5596DF81F27442402B769974DEDEF4BF13278A61F0744240DC1235D0F2DEF4BFB1A331D6EE744240FA2D336A8DDEF4BF1E1CD4A3F0744240464D577188DEF4BFAA8F7265F1744240D7607A5B86DEF4BFB5587C7DF3744240BB95057A87DEF4BF20ED8929F47442402E80FED587DEF4BFE5F0FA49F57442407EEFE21586DEF4BF9B455277F474424041376A0FD3DEF4BF
96	0.00563855263	\N	1	90	\N	01_90	0	0106000020E610000001000000010300000001000000070000003C60F2E4F57442407071D492F9DEF4BF6463EBA4F7744240DD67B6CBF1DEF4BFA171D4C8F874424040FEE5930ADFF4BFBC6F07AAF874424031A5479510DFF4BFB7340853F874424099E05E1F33DFF4BF57DC9F08F7744240E30796104EDFF4BF3C60F2E4F57442407071D492F9DEF4BF
99	0.0209089529	\N	1	16	\N	01_16	0	0106000020E61000000100000001030000000100000010000000A2D125DFD4744240821CA1295BDFF4BF0946D6DED674424010B79F2C4BDFF4BF0946D6DED674424010B79F2C4BDFF4BF8F41D806D774424058E0BC5F4ADFF4BF12355B2FD7744240095103644ADFF4BF2A615357D7744240EDCBCA384BDFF4BF91A5B97DD7744240DD8F9AD84CDFF4BFDE3791A1D7744240133EC1384FDFF4BF9D23EEC1D774424024469B4952DFF4BFA75BFBDDD7744240DFD5F9F655DFF4BFB73400F5D774424046B8A7285ADFF4BF1F256506D8744240DEB308C35EDFF4BF92AFB711D8744240992ACFA763DFF4BFD4C8ECF0D8744240B2203217ECDFF4BFA4C715C9D574424068BAC8E41BE0F4BFA2D125DFD4744240821CA1295BDFF4BF
100	0.01806714721	\N	1	15	\N	01_15	0	0106000020E61000000100000001030000000100000006000000F3D92B6AD2744240896E20EB6DDFF4BFA2D125DFD4744240821CA1295BDFF4BFA4C715C9D574424068BAC8E41BE0F4BF6A8C0281D374424038BA7AE23FE0F4BF6A8C0281D374424038BA7AE23FE0F4BFF3D92B6AD2744240896E20EB6DDFF4BF
102	0.0110338466	\N	1	49	\N	01_49	0	0106000020E6100000010000000103000000010000000500000054C5A5F0DE744240A98377467EE5F4BF88E88E16E474424063844FAD2EE5F4BFAF573CDBE474424032661D1E66E5F4BF94328799DF74424045E22326A9E5F4BF54C5A5F0DE744240A98377467EE5F4BF
511	0.215877	\N	2	29	\N	ksoweto_1	6	0106000020E6100000010000000103000000010000000D000000CFE06B5E0F754240153ABCB55213F3BF908194560F754240C68B85D66F13F3BFF3A14E3D0D7542408C6CF2E95814F3BF69346FEF07754240C1FFFCD4F415F3BF154ADD79FE7442406B1102555315F3BFF7E1599600754240488D665DD114F3BF8B0A02350175424018BBC82AD714F3BF6CB3DA1C05754240AC3AA9A7BC13F3BF20CC4E0106754240A6E89BDEBC13F3BF7043EAC6067542404181E9A95B13F3BFE3690992087542401AC594456A13F3BF3583D5930B754240B783C5FB5813F3BFCFE06B5E0F754240153ABCB55213F3BF
512	0.177458	\N	2	28	\N	ksoweto_2	0	0106000020E6100000010000000103000000010000000F00000020CC4E0106754240A6E89BDEBC13F3BF6CB3DA1C05754240AC3AA9A7BC13F3BF8B0A02350175424018BBC82AD714F3BFF7E1599600754240488D665DD114F3BF354B26ACFF7442406D0A85AE0915F3BF04B80A46F4744240672A9FE84714F3BFFCF7E97DF4744240D52689A4D713F3BFD6570DDDF4744240999A83EBCA13F3BFB5DE456DF5744240858F8B1DBB13F3BFDF52FFF8FA744240F0DD6570C613F3BFC580A57901754240DF06918B1413F3BF095089B701754240738A59FF0613F3BF54EA270F077542404B423C0F3E13F3BF7043EAC6067542404181E9A95B13F3BF20CC4E0106754240A6E89BDEBC13F3BF
1	0.01741314263	\N	1	29	\N	01_29	0	0106000020E6100000010000000103000000010000000800000055737051DA74424094C5F58C6CE2F4BFCD5FE9BBD4744240D7E8A0EDC1E2F4BFFAC3EFAED374424077F11ECF79E2F4BFF03EF261D9744240DFD573A228E2F4BF37972964D9744240E924E38228E2F4BFBC1A627DD97442400408AB1B27E2F4BF34A42B6BDA74424039558B036BE2F4BF55737051DA74424094C5F58C6CE2F4BF
3	0.01843881108	\N	1	31	\N	01_31	0	0106000020E6100000010000000103000000010000000D00000086C94F76DB744240E049654DB7E2F4BF59AC085EDB744240170E2AB8B8E2F4BFA566825CDB744240A7667D49B8E2F4BF2D5E49CFD574424030406EC30BE3F4BF0CA48874D5744240C474226EF3E2F4BFDDE8325ED5744240230F1071EDE2F4BFCD5FE9BBD4744240D7E8A0EDC1E2F4BF55737051DA74424094C5F58C6CE2F4BF34A42B6BDA74424039558B036BE2F4BFE86EF472DA744240EA10A23C6DE2F4BFAD037594DA74424069E2E0CD76E2F4BF19C0EA9DDA744240055F768179E2F4BF86C94F76DB744240E049654DB7E2F4BF
29	0.01907001129	\N	1	17	\N	01_17	0	0106000020E6100000010000000103000000010000000A0000000BDA71DAD374424042B5CB2F96E0F4BFA909C3E3CD74424000F8AF21ECE0F4BF802CABDECC744240310B3220A6E0F4BF69CB33D0D2744240449052874AE0F4BF5B4049E4D2744240C4BF5E3C50E0F4BFBEC1C977D37442400B4B1D5572E0F4BFBC2E7AA8D3744240C95066967DE0F4BFE0E112FED37442408225C15F91E0F4BF92982C06D474424009B594B993E0F4BF0BDA71DAD374424042B5CB2F96E0F4BF
513	0.155325	\N	2	27	\N	ksoweto_3	0	0106000020E6100000010000000103000000010000000D000000CFE06B5E0F754240153ABCB55213F3BF3583D5930B754240B783C5FB5813F3BFE3690992087542401AC594456A13F3BF7043EAC6067542404181E9A95B13F3BF54EA270F077542404B423C0F3E13F3BF095089B701754240738A59FF0613F3BF7D40C74103754240BED157D09612F3BFC8BB3C7904754240FF20D11E7412F3BF62301137087542400713F3FD0B12F3BFB22ABC990F7542405A4B57BAA411F3BF7637FB8E10754240DD40E218B111F3BF7154D75F107542407C69514C6F12F3BFCFE06B5E0F754240153ABCB55213F3BF
514	0.19862	\N	2	26	\N	ksoweto_4	0	0106000020E6100000010000000103000000010000000C000000D481B667FA744240E5FCD81D8813F3BF7EC99D28F5744240638261968213F3BF5440675EF474424094FD183F6513F3BFB334BF2EF4744240048FD80D7B12F3BFF4339936F274424095B4435F4B11F3BFCA2E08FEF4744240AB3F0DAB4A11F3BF76047958F67442404E0C0F0C5711F3BF82751B01F7744240ECEBD7EB5A11F3BFE72294A3F774424092D675CF6311F3BF48E6CBB101754240AA3955FB7512F3BF2255291600754240EC84E350EE12F3BFD481B667FA744240E5FCD81D8813F3BF
515	0.124174	\N	2	23	\N	ksoweto_5	0	0106000020E6100000010000000103000000010000000E0000009168D355FD74424084116C3E4F11F3BF0EF85D5BFC744240AEB8AA72E411F3BFE72294A3F774424092D675CF6311F3BF82751B01F7744240ECEBD7EB5A11F3BF76047958F67442404E0C0F0C5711F3BFCA2E08FEF4744240AB3F0DAB4A11F3BFF4339936F274424095B4435F4B11F3BF5DE82EF0F1744240B79700553811F3BFC89128ACF0744240B8A2B8C58D10F3BF5A7D5964F1744240A92E535A6C10F3BFFD169272F77442404BF06E445B10F3BF1375DB5AFA7442404B5968A54210F3BFED6AC667FD744240C9278FCE4510F3BF9168D355FD74424084116C3E4F11F3BF
516	0.210374	\N	2	25	\N	ksoweto_6	0	0106000020E61000000100000001030000000100000010000000714741EC0175424062558F030210F3BFCF482FAC0275424017A066A42910F3BF34CEC194037542409748C8E97910F3BF453455CD057542403B42B04C5010F3BF3614B9300775424073EDD7588610F3BF57F544F309754240F1D8819E0A11F3BF33F7CC2B0C754240F51E929B9211F3BFF9B9564C0775424073B080CED711F3BF48E6CBB101754240AA3955FB7512F3BF0EF85D5BFC744240AEB8AA72E411F3BF9168D355FD74424084116C3E4F11F3BFED6AC667FD744240C9278FCE4510F3BF8A87627CFE7442403CF9C4494B10F3BF35A7A18600754240535909C21210F3BF0F3CECB900754240D147FBFFCC0FF3BF714741EC0175424062558F030210F3BF
517	0.21881	\N	2	24	\N	ksoweto_7	6	0106000020E6100000010000000103000000010000001000000057F544F309754240F1D8819E0A11F3BF3614B9300775424073EDD7588610F3BF453455CD057542403B42B04C5010F3BF34CEC194037542409748C8E97910F3BFCF482FAC0275424017A066A42910F3BF714741EC0175424062558F030210F3BF0F3CECB900754240D147FBFFCC0FF3BFC80A38BC0075424090BB4213A30FF3BF42E3D05B04754240DF6C0A421A0FF3BFA0AF75C608754240F125855F920EF3BFC82281DE0975424021A66449970EF3BF46DB9BF00C75424032E5CF1D380FF3BF7C4025EE0F754240D66E80104211F3BF29F81C3E0F7542400F073F926611F3BF33F7CC2B0C754240F51E929B9211F3BF57F544F309754240F1D8819E0A11F3BF
518	0.175053	\N	2	22	\N	ksoweto_8	0	0106000020E6100000010000000103000000010000000E0000002133C6F4FA7442404B0895AF0A10F3BF7B10BA22FA744240EF2AC8500910F3BF37A00655F7744240DD5362652010F3BF81207020F174424026A4C8643710F3BF8DDCE5EAEF744240630033F21910F3BFA65E1BC0ED744240B178ADAFF10EF3BFF74D02DCED7442400DC6C425BF0EF3BF944463F4F0744240C40265E6F30DF3BFDFA0C76BF3744240EB0E312D270EF3BF893BA3E4F2744240AB8101244B0EF3BF42E50DC1F47442408C4CCFE2910EF3BF76BE4135F8744240A2801E82E20EF3BFD25DE0D0FA74424011C663CB740FF3BF2133C6F4FA7442404B0895AF0A10F3BF
519	0.231865	\N	2	21	\N	ksoweto_9	0	0106000020E6100000010000000103000000010000001500000042E50DC1F47442408C4CCFE2910EF3BF893BA3E4F2744240AB8101244B0EF3BFDFA0C76BF3744240EB0E312D270EF3BF944463F4F0744240C40265E6F30DF3BF553A3480F274424062D869908C0DF3BFC6CC58D6F374424048688515630DF3BF7F14A4DCF474424082A4C7AD540DF3BF16B1B1CDF8744240ED05BDD6370DF3BF69DC3693F97442403DF74EB5640DF3BF6768BDB2FD7442401FE75030F80DF3BF78BFE228FF7442405C13ABD2F20DF3BF77AFCCE5037542406815C66EDE0EF3BFD89122DE0375424071CBB470DF0EF3BF9CBA163A02754240FFBC2A7A110FF3BF1B9B4D1BFF744240C03544978D0FF3BF0AA9B1BEFE744240C33F80D2F30FF3BF3EFB91E5FD744240B66194DE0F10F3BF2133C6F4FA7442404B0895AF0A10F3BFD25DE0D0FA74424011C663CB740FF3BF76BE4135F8744240A2801E82E20EF3BF42E50DC1F47442408C4CCFE2910EF3BF
520	0.146742	\N	2	20	\N	ksoweto_10	0	0106000020E6100000010000000103000000010000000D00000091C7278EF97442409622C07D310DF3BF8B1812F3FC74424042938AE2FA0CF3BF80624337FD744240AB86515C810CF3BF4D5B3C73FE744240104B4EF16C0CF3BF6B2429B5FF744240571B559E760CF3BFB629781808754240BBA82398370EF3BF3711E0DA07754240986A2E92630EF3BF77AFCCE5037542406815C66EDE0EF3BF78BFE228FF7442405C13ABD2F20DF3BF6768BDB2FD7442401FE75030F80DF3BF69DC3693F97442403DF74EB5640DF3BF16B1B1CDF8744240ED05BDD6370DF3BF91C7278EF97442409622C07D310DF3BF
521	0.226987	\N	2	19	\N	ksoweto_11	6	0106000020E6100000010000000103000000010000000F000000CE75FA2DEF74424050C00889CF11F3BF2BB4BD69F17442404CE369EEE611F3BF84E0776AF2744240140E28E67512F3BFA11128B8F27442405837C36BC913F3BF608EC395F27442402785C35F3714F3BFAE547684F1744240DC01CD017714F3BF39071F15E6744240D7891816B413F3BF778E412FE67442408B9AB283A813F3BF203E0220E874424044102C03AD12F3BFC9B9C9A0E8744240D18FEA56AF12F3BF98370019E97442400EF3D4564812F3BFC05070C9E8744240E0099C8D2C12F3BFF3948384E97442408504067C2912F3BFF3EEF661E97442406FBC4D75B211F3BFCE75FA2DEF74424050C00889CF11F3BF
522	0.239571	\N	2	18	\N	ksoweto_12	0	0106000020E61000000100000001030000000100000014000000C62E01DCDE744240A6D9F85FB811F3BF947EE892E07442407D5D9ACE7710F3BF2FA7387FE17442408DD6A0CE5710F3BF9756474EE5744240E3C5CFE84710F3BF4F2E4E87E6744240C2FF50773E10F3BF1BAD5395E7744240F0CBD6532210F3BFA73DB8F9EA744240BF34531DC30FF3BFDE0F3756EC744240DD6B9DAF780FF3BF375B4814ED7442403986ABF6810FF3BF66C26316F074424045CCD6673B11F3BFA1C0747EF0744240E66BDFD25B11F3BF2BB4BD69F17442404CE369EEE611F3BFCE75FA2DEF74424050C00889CF11F3BFF3EEF661E97442406FBC4D75B211F3BF032BA63EE8744240C7D4700BB211F3BFB1254869E2744240FD7D8A9FAE11F3BF8CA41763E1744240F16F4E2DAF11F3BF41C8FAA4E0744240F56D386CAD11F3BF04AAE376E07442402585CFD9BC11F3BFC62E01DCDE744240A6D9F85FB811F3BF
523	0.175122	\N	2	17	\N	ksoweto_13	6	0106000020E61000000100000001030000000100000012000000F3EEF661E97442406FBC4D75B211F3BFF3948384E97442408504067C2912F3BFC05070C9E8744240E0099C8D2C12F3BF98370019E97442400EF3D4564812F3BFC9B9C9A0E8744240D18FEA56AF12F3BF203E0220E874424044102C03AD12F3BF778E412FE67442408B9AB283A813F3BF39071F15E6744240D7891816B413F3BF2154F5F6DB744240BD424D270813F3BF45A2424FDD7442407B9222357A12F3BF98C5931ADE744240E82CF6E6DF11F3BFC62E01DCDE744240A6D9F85FB811F3BF04AAE376E07442402585CFD9BC11F3BF41C8FAA4E0744240F56D386CAD11F3BF8CA41763E1744240F16F4E2DAF11F3BF9FB2F1F0E7744240CD5DDDDDB111F3BF032BA63EE8744240C7D4700BB211F3BFF3EEF661E97442406FBC4D75B211F3BF
524	0.254389	\N	2	16	\N	ksoweto_14	0	0106000020E6100000010000000103000000010000000D000000DCCCE2CCCA744240172D3E4AE311F3BF3404974FCC744240690B2D50AD11F3BF1306E332CD744240A43D55D56E11F3BFA21E4D22CE7442406643EC0B4911F3BF86436013D0744240AF5838F01611F3BF033F74A9D9744240BDA5C4558510F3BFB4CDD5F8DD7442407BBD9C016310F3BF541454C2DE7442408134D3887810F3BFDA089322DD74424055C8D806A011F3BFBEFB6D70DC7442401D5EB7D9CF11F3BF124FDC98DB7442403CA5FBD66712F3BF3277AC71DA7442403312744DED12F3BFDCCCE2CCCA744240172D3E4AE311F3BF
525	0.03199	\N	2	15	\N	ksoweto_15	0	0106000020E610000001000000010300000001000000090000008F28826EFA74424064D95B8DC60CF3BFD13D2BC7F87442403AE0CF84E10CF3BF7D282685F774424094B643A9E70CF3BF2756ED95F6744240C88DF66CED0CF3BF6C5BAC97F4744240089CCC4F810CF3BFC2C07A66FA74424094060186030CF3BF7B9FC881FB7442408844136C3D0CF3BF969EC8B5FA7442403D61D6534A0CF3BF8F28826EFA74424064D95B8DC60CF3BF
526	0.142466	\N	2	14	\N	ksoweto_16	6	0106000020E610000001000000010300000001000000190000006F4B543AEA7442407D7816153F0FF3BF25E64F0AE974424039DF4533870FF3BFB7DE643DE8744240E22F595A9D0FF3BF2D6B91C5E77442406FED7169440FF3BFE8E7B595E77442408FBDEEEFFF0EF3BF78C3CB65E774424097368870BB0EF3BFB3426331E67442405FA9EE8D3A0EF3BF3794AD27E67442400730457F360EF3BF56824479E5744240E37D75E6170EF3BF8AFC2779E5744240020073E0170EF3BFA734488AE47442403C24BE8BE50DF3BFB1372BAFEE74424000067400020DF3BF817C1FAFEE744240351BE5FD010DF3BFF22910B9EE744240526BE91E010DF3BFA38AA6BDEE7442404C1801B8000DF3BFDA75F120EF744240231C9D04F80CF3BFDD21106CEF744240C17F4A44F10CF3BF6C5BAC97F4744240089CCC4F810CF3BF2756ED95F6744240C88DF66CED0CF3BF7D427593F37442403543BD00070DF3BFC1A598D6F17442405F9A7A6B2B0DF3BF63C3DE50F0744240E73FE8105A0DF3BF1F0DC367EB744240439A20B7A60EF3BF07B05E0EEB744240092585DEF30EF3BF6F4B543AEA7442407D7816153F0FF3BF
527	0.259461	\N	2	13	\N	ksoweto_17	0	0106000020E61000000100000001030000000100000011000000A734488AE47442403C24BE8BE50DF3BF43DC2982E5744240873F4CC6190EF3BF3794AD27E67442400730457F360EF3BF78C3CB65E774424097368870BB0EF3BF2D6B91C5E77442406FED7169440FF3BFFCCE7433E8744240D15033A0980FF3BFB7DE643DE8744240E22F595A9D0FF3BF0194DE59E5744240FA3B35C6EA0FF3BF4B27EA18E37442400AD1989FFB0FF3BF3290C431DF74424087D7E00B0B10F3BFF7F0686CDE7442408CC8F65A0D10F3BF1FFC1DC8DA7442406CD443DB2610F3BFEE67CEEFD8744240690ACC623210F3BFBFF45FFAD7744240F8AEACE14410F3BF058C9DECD67442406381646C3510F3BFC9D75248D474424060CFA28E4B0FF3BFA734488AE47442403C24BE8BE50DF3BF
528	0.366522	\N	2	12	\N	ksoweto_18	6	0106000020E6100000010000000103000000010000000C0000003C60C96EEF7442402CACEEBFB709F3BFCF5BCC6EEF744240DECAC9BFB709F3BFC2C07A66FA74424094060186030CF3BFDD21106CEF744240C17F4A44F10CF3BFA38AA6BDEE7442404C1801B8000DF3BFF22910B9EE744240526BE91E010DF3BF817C1FAFEE744240351BE5FD010DF3BF7CAB4378E2744240EE49D31A580AF3BFB2EB0378E27442408EEDF40C580AF3BF262B0478E2744240FADCF10C580AF3BF5EB7FD77E274424039639B0B580AF3BF3C60C96EEF7442402CACEEBFB709F3BF
529	2.875188	\N	2	30	\N	ksoweto_19	2	0106000020E61000000100000001030000000100000012000000B1372BAFEE74424000067400020DF3BFA734488AE47442403C24BE8BE50DF3BFC9D75248D474424060CFA28E4B0FF3BF01E2D999C47442405AA70DB5C80AF3BF1E6986A8C4744240696E45E7C70AF3BF2B4A46ACC2744240699921B83A0AF3BF9E25BFABC27442400D2741913A0AF3BF5AF4BEABC2744240F7B42A913A0AF3BFC4AFBBABC27442407D5142903A0AF3BF772397B2BF744240515832C7DF08F3BF90B793B2BF7442400246A3C5DF08F3BFB179C5B6C47442403DA6ACBEF706F3BF24BE7584CE7442407F298EB12103F3BF3C60C96EEF7442402CACEEBFB709F3BF5EB7FD77E274424039639B0B580AF3BF262B0478E2744240FADCF10C580AF3BFBF5F0178E2744240AA6A140D580AF3BFB1372BAFEE74424000067400020DF3BF
530	0.194637	\N	2	10	\N	ksoweto_20	6	0106000020E6100000010000000103000000010000000B000000D38BF91BCF744240F034316F5D0EF3BF37A2053CD57442409616A62D4C10F3BF68048EBBD474424065C201817510F3BF754D3B73D074424024289217B810F3BF7D43BF14CF744240A5BDE4D3AD10F3BF4F1E41E8CC7442404DF113A76110F3BF46A5EEF1C47442402E6689E2A00FF3BF846821CAC47442404367C184740FF3BFD405FD34C97442404E4782DCD90EF3BF3B96E3FFCD744240E8BAC760530EF3BFD38BF91BCF744240F034316F5D0EF3BF
531	0.171408	\N	2	11	\N	ksoweto_21	0	0106000020E6100000010000000103000000010000000C000000CA7F0BF6BB744240B82EFCD6E710F3BF696E7F4AC2744240C24BF6B1CE0FF3BFE41B2BC7C3744240232CDA33CB0FF3BFC1A09109CC744240288C2D8C9410F3BF9D1DEB95CD744240CF96BD07CB10F3BFCD6C985DCD744240159778D5F010F3BF05230163CC74424064EA51080C11F3BF415DD016CC744240ECC88E1B1611F3BF35391D0ECB744240D709986B3F11F3BF15EA5629CA744240634AF76B7F11F3BF265C2F64C874424073B5D0E5BE11F3BFCA7F0BF6BB744240B82EFCD6E710F3BF
532	0.128112	\N	2	9	\N	ksoweto_22	0	0106000020E6100000010000000103000000010000000A0000000224D6A7B774424099426F35D10FF3BF19BB4B7DB8744240EC43DABC1A0FF3BF5DCD187EB9744240E0CE8C44DE0EF3BF230C4A47BC74424094DF5B5EE20EF3BFF1161A86BE744240A9ABE466FE0EF3BF0438A466C1744240A521CAF2750FF3BFC5475B56C174424076350ACCA00FF3BFDEFC7568BA744240323CD83BD110F3BF22788D8DB47442409C46DBE56B10F3BF0224D6A7B774424099426F35D10FF3BF
533	0.139677	\N	2	8	\N	ksoweto_23	0	0106000020E6100000010000000103000000010000000900000022788D8DB47442409C46DBE56B10F3BF6518E48DAC74424044968BB0E40FF3BF7AC58832B07442406534A05D8B0EF3BFD7750E33B1744240C54C58467D0EF3BFE1B25FBDB7744240DDD6DA2AD70EF3BF5DCD187EB9744240E0CE8C44DE0EF3BF19BB4B7DB8744240EC43DABC1A0FF3BF0224D6A7B774424099426F35D10FF3BF22788D8DB47442409C46DBE56B10F3BF
534	0.189646	\N	2	7	\N	ksoweto_24	0	0106000020E6100000010000000103000000010000000E0000008514DA90BF7442405C7C8F46CD0EF3BFC6DAC299BC74424025F1E12CAB0EF3BF6D5686B8B974424045288B93A70EF3BFB0538A6CB974424004D2115F8F0EF3BF2F3E9366BC744240AE0759F1140EF3BF8B6D5F71C174424021E402C1B10DF3BFA956F6C9CA744240DA97134A5D0DF3BFBC7561FCCB744240C04FECB56E0DF3BF44A24FA8CD7442402A2A4F17F40DF3BF8933E853CD744240C564F56F1F0EF3BF0577B60CC8744240E8392385B30EF3BFF4BDECC1C37442402632E4A84B0FF3BF0AA56491C27442408154B1A54D0FF3BF8514DA90BF7442405C7C8F46CD0EF3BF
535	0.155334	\N	2	6	\N	ksoweto_25	0	0106000020E6100000010000000103000000010000000F0000004F66ECF7BF7442401A45EB4A8C0DF3BF34E74F38BB744240C548ECD1EA0DF3BF79B5E4A5B7744240B5632CE7790EF3BFA90C3441B6744240CEFAF57A870EF3BFE6D90CD1B1744240EA4C1BBB410EF3BFB69DA347B17442401552F507220EF3BFE815CF6EB574424024DFFD3BA20CF3BFCEEF5CAFB5744240DE6E5B01880CF3BFFDADABA7B6744240648C8125950CF3BFD8D2EDF2B7744240CA5A3C72880CF3BF79144019B9744240DE7221E4920CF3BF2BAC520DB9744240AB366CB19D0CF3BFEFF5AEECB9744240DEA9B7C2AC0CF3BF77B4523CBC74424043EC9C39CD0CF3BF4F66ECF7BF7442401A45EB4A8C0DF3BF
536	0.026316	\N	2	5	\N	ksoweto_26	6	0106000020E61000000100000001030000000100000008000000F3251C94CA744240015BC840070DF3BF42D12E2DCA7442406F5D4E6C280DF3BFDAA8FCDBC7744240471637013B0DF3BFF5A87233C67442409963E639EF0CF3BF598C7DDAC574424098DE540AF40CF3BFFCC7D5BAC4744240C61F03DC900CF3BF5D4A6834C8744240663F761A610CF3BFF3251C94CA744240015BC840070DF3BF
537	0.036309	\N	2	3	\N	ksoweto_27	0	0106000020E61000000100000001030000000100000008000000ECADB60BBA7442401256557FF30AF3BF94CB6C1FBC744240626D468A2A0AF3BF6986253EBE744240D8A79AB1320AF3BF256952C6C07442401022935E030BF3BFB773269DBD74424005DC79DB320BF3BF82D69989BC744240F9986E4CEA0AF3BFBCA05B6FBB7442402A83051BFF0AF3BFECADB60BBA7442401256557FF30AF3BF
538	0.07289	\N	2	2	\N	ksoweto_28	0	0106000020E6100000010000000103000000010000000E00000031A9C6ABC2744240FC8CAD943A0AF3BF1E6986A8C4744240696E45E7C70AF3BF1BEB0638C3744240F124F516DC0AF3BF3172059FC37442405D093C9C0D0BF3BF68BDEF68C1744240470DEA53320BF3BF8E1156C6C0744240CC2E0C60030BF3BF3C3651C6C07442401025A55E030BF3BF256952C6C07442401022935E030BF3BF6986253EBE744240D8A79AB1320AF3BF6138741FBC744240F0FB628A2A0AF3BF772397B2BF744240515832C7DF08F3BFC4AFBBABC27442407D5142903A0AF3BF5AF4BEABC2744240F7B42A913A0AF3BF31A9C6ABC2744240FC8CAD943A0AF3BF
539	0.269735	\N	2	4	\N	ksoweto_29	6	0106000020E6100000010000000103000000010000001D0000005B56BA0BBA744240BA65CE80F30AF3BF2A495F6FBB744240F5917E1CFF0AF3BFF07E9D89BC74424011A8E74DEA0AF3BF201C2A9DBD74424023E8F2DC320BF3BFF8B959C6C0744240843B8561030BF3BFCC65F368C1744240EC176355320BF3BF981A099FC37442409B14B59D0D0BF3BF0D156734C874424053DA861A610CF3BFFCC7D5BAC4744240C61F03DC900CF3BF31F8D9BAC4744240A6CF74DD900CF3BF4070D9BAC4744240E71B7CDD900CF3BF943481DAC574424097D6CD0BF40CF3BF30517633C6744240975B5F3BEF0CF3BF0E5100DCC7744240B80AB0023B0DF3BFC98CCED4C0744240A9D5E5D07E0DF3BF800EF0F7BF7442403A39644C8C0DF3BFF9BAE9F7BF7442402C68204B8C0DF3BF4F66ECF7BF7442401A45EB4A8C0DF3BF77B4523CBC74424043EC9C39CD0CF3BFF7A1E53ABC74424095AB9425CD0CF3BF6780DC0DB9744240156FB8BA9D0CF3BFFA96570DB97442408721C1B19D0CF3BFC6BC4319B9744240D5729AE5920CF3BF32A73E19B974424011426CE5920CF3BF79144019B9744240DE7221E4920CF3BFD8D2EDF2B7744240CA5A3C72880CF3BFFDADABA7B6744240648C8125950CF3BFA5AC63AFB574424085B7B601880CF3BF5B56BA0BBA744240BA65CE80F30AF3BF
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

COPY public.road (id, name, "rdNum", "rdClass", width, "rdReserve", "surfaceType", "surfaceCondition", traffic, direction, drainage, "drainageCondition", settlement_id, geom) FROM stdin;
1	2	\N	\N	6	\N	\N	\N	\N	\N	\N	\N	2	0105000020E6100000010000000102000000070000008D915DA8B07442407FB51AFD560EF3BF8580FA12B1744240440761BA5D0EF3BFAB5E79B2B37442404045788F8A0EF3BF337473B6B5744240DEE359F9A60EF3BF27B6FFCCB7744240E05E64F2C30EF3BF85A5D273BC74424079293710CB0EF3BF21FAFD19BF744240ED4CFF0CE80EF3BF
2	3	\N	\N	6	\N	\N	\N	\N	\N	\N	\N	2	0105000020E6100000010000000102000000060000009EBF1B3BB7744240CEBEA616BA0EF3BFA06C77BCBB744240EB1D237F010EF3BF34C95B0BC17442408760EE1C9B0DF3BFDFEA1AFACA744240E5BAC1863F0DF3BF54D94C19CB744240EF8630673E0DF3BFC1F05510CC7442403AB7E381350DF3BF
3	4	\N	\N	6	\N	\N	\N	\N	\N	\N	\N	2	0105000020E61000000100000001020000000700000070C8AF0ECF7442403BB14174150EF3BF3DFDAB8ECE744240D078830F230EF3BFB1788457CC7442409BB190575F0EF3BF577F1C32CC744240AA688151630EF3BFCC774CD1C8744240E7A2F13CBF0EF3BF59717D6AC274424071A0D158A10FF3BFC9245351BA74424079A558120511F3BF
4	5	\N	\N	6	\N	\N	\N	\N	\N	\N	\N	2	0105000020E61000000100000001020000000600000015152597CF7442403430113BF110F3BF036E5EACCE7442403B27D347CE10F3BFF4542D90CC744240BBC54CDD7D10F3BFDEF83796C3744240BC3FEE5DA60FF3BFEC862B78C3744240E001A08CA30FF3BF21FAFD19BF744240ED4CFF0CE80EF3BF
5	6	\N	\N	6	\N	\N	\N	\N	\N	\N	\N	2	0105000020E610000001000000010200000004000000939375DFC374424055971CC1D00AF3BF754A7536D374424021FDCB4F4C0FF3BF1981B957D6744240170A55D55E10F3BF8D4F81C3D67442408522AAC28310F3BF
6	7	\N	\N	6	\N	\N	\N	\N	\N	\N	\N	2	0105000020E61000000100000001020000000A000000A05903EBE0744240908AD4782210F3BFB795BCF6DF744240CE830B956810F3BFC37C9782DF7442400972ADEA8910F3BF20328752DE74424096F8246B6911F3BF496A62F2DD744240473E3067B211F3BF7E75BF2FDD74424086BF2147DD11F3BF37288366DC74424000247C5D6D12F3BF2F90A931DB744240859F178BF612F3BFC11B9130DB7442401CDD5307F712F3BF11878DD3DA7442405460323B2013F3BF
7	8	\N	\N	6	\N	\N	\N	\N	\N	\N	\N	2	0105000020E610000001000000010200000009000000CB5A77AEEC744240AAECC5D7C90EF3BFAF89A0AEED744240B993953B560FF3BF637BE117F174424041A734D33411F3BFDCE0A070F174424089C4540E5211F3BF48931A50F37442406CA607D17912F3BFE6CD0D9DF37442406071B56DB913F3BF651F4B69F3744240429978B13F14F3BF4069857EF27442409C2A11557614F3BF65F9E2DBF17442402919842E9C14F3BF
8	9	\N	\N	6	\N	\N	\N	\N	\N	\N	\N	2	0105000020E61000000100000001020000001000000048722584EF74424068F5C18E5710F3BFCD300B4AF07442401FB18E1C5510F3BF0A418158F0744240D8ECCBEE5410F3BF4D644390F4744240B0BF379C4710F3BFA95C2441F77442408ABE0B8A3D10F3BF77217A85FA744240EF0895CC2510F3BFD393D237FE744240526F4C942B10F3BF2A2359AAFF744240EA4F2CEC0210F3BF9DCAAB1300754240F9746D8A960FF3BF0E28A77902754240CB240559350FF3BF8B962DAE0475424026AE3342F00EF3BFD34A94BE04754240FE225240EE0EF3BF85121C210475424063F075E2D90EF3BFD34A94BE04754240FE225240EE0EF3BF6FFE0BEB08754240390B927C6B0EF3BF1A63AF0B0A754240FE585429480EF3BF
9	10	\N	\N	6	\N	\N	\N	\N	\N	\N	\N	2	0105000020E610000001000000010200000008000000443914DD13754240896F4CD34611F3BF6CC3C871127542406242849E5A11F3BF57BE4FC711754240086938E86311F3BF030CDFCB077542402CAD2C25EF11F3BF9DE922A802754240CE9972D18112F3BF292B6CDB00754240209E27C90013F3BFF50F0EB3FA74424064AB6722A813F3BF7662A18BF4744240BDAFA6499D13F3BF
10	11	\N	\N	9	\N	\N	\N	\N	\N	\N	\N	2	0105000020E61000000100000001020000000D000000912A6E41A8744240C163385BFE0FF3BFC7E0B9EEB274424039B564ACB110F3BF88C46F2DC9744240DE4A54E73012F3BF028E6A6BD1744240F6D5910DB412F3BF6C796FBFD6744240BE2FD9D4FC12F3BFDD99F5BADA7442405EED30B91E13F3BF2BC5ED2BE074424061DC511D7413F3BF26CE90ECE8744240A38B05DAFB13F3BFBA0A1BA5F2744240CF023449AA14F3BFA364D6DFFC74424001BD529F4C15F3BF6206C840FE744240B554C8CE6B15F3BFB3E32A5603754240E3A0FE9CB315F3BF53840CCB0A7542404D1880070116F3BF
11	12	\N	\N	9	\N	\N	\N	\N	\N	\N	\N	2	0105000020E610000001000000010200000020000000DE5DD3BFFF74424037DA6356290CF3BF463C5C49FE7442404701BD86410CF3BFD956321BFE744240B6621E82440CF3BF241A9724FC744240DE5592F7640CF3BF6443C0BEFB744240D81D5199E20CF3BFFE069C3DF974424069D0B3910A0DF3BF8192B1CAF67442400F102051180DF3BF5BEC1628F474424066F158BD2F0DF3BF3FDF80A2F27442408A9E5C90510DF3BF3AFAC396F1744240D3C9F34C750DF3BF68D844EAEF744240FF5A38EBE00DF3BFA3D85DBEEE744240E0BB4586370EF3BFF9B796C8EC7442404B932B1BB10EF3BF351A5B75EC744240E7B897EDFF0EF3BF05011B78EB744240DE43118A570FF3BFE724011BEA744240C17FB044A40FF3BFF12C2137E87442401D35D074DB0FF3BF76E1C92AE6744240E08A60B51110F3BFD62A64E8E3744240BA1BEADC2510F3BFA6C096CEDF74424058BB01EE3310F3BFC15E5EC8DE74424055DF97BB3610F3BF8C2F692CD97442402B4DA0B85E10F3BFFE010777D774424063F619FC7710F3BF84713BEED374424061F09A55B310F3BF5BA8E247CF7442405C1992A5F510F3BF440CBEF9CC74424031A827273411F3BF94D78011CC7442407F1006CE5711F3BF7408372FCB7442408DC6BC1D9611F3BFB95E5D4EC9744240C0040212D811F3BF617B7AB8C8744240D2732BA1EC11F3BFF889E042C874424056EA7FC2FC11F3BFEFCE0A91C774424004BDB2261512F3BF
12	13	\N	\N	12	\N	\N	\N	\N	\N	\N	\N	2	0105000020E61000000100000001020000000B000000F0E85EE4077542405EA452553217F3BF53840CCB0A7542404D1880070116F3BF5AF089AD0F7542407D8C35ACD714F3BF6A228EA612754240057900280714F3BF222BF13C13754240F441E3286D13F3BFA45B1AF0137542401E4FCBF4C511F3BF9D3D18D9137542402BC3302C2C11F3BF59489DDA11754240AEC08FB33E10F3BF78904D8C0E754240D3D9FE28690FF3BF3C32DC110875424033035055C90DF3BF74DB56F5FD744240414CEECBCF0BF3BF
13	15	\N	\N	6	\N	\N	\N	\N	\N	\N	\N	2	0105000020E6100000010000000102000000030000009739B6DA7F74424071E0601EEF03F3BFDAD9A9019B7442400225E70E980DF3BF812C686A9E744240B8B46DFA360FF3BF
14	17	\N	\N	6	\N	\N	\N	\N	\N	\N	\N	2	0105000020E6100000010000000102000000050000005A2C56259D744240A2E5BECDEC0FF3BF621CD49597744240263AF134DF11F3BFC40B72719574424055AC71F7F111F3BF9264E0487F744240773A55B5D80EF3BF5A4ED29F77744240FD939A7E5E0DF3BF
15	18	\N	\N	12	\N	\N	\N	\N	\N	\N	\N	2	0105000020E61000000100000001020000000300000074DB56F5FD744240414CEECBCF0BF3BF61C3A063FD7442404864AD56B30BF3BFD6321597E0744240D18B642BC005F3BF
16	19	\N	\N	6	\N	\N	\N	\N	\N	\N	\N	2	0105000020E610000001000000010200000002000000578A33D49C74424065F4AEABF50DF3BFB8E94EDCB0744240FACDD31BD206F3BF
17	23	\N	\N	12	\N	\N	\N	\N	\N	\N	\N	2	0105000020E6100000010000000102000000070000004FD58691E0744240A943A0D7BC05F3BF5F83BF4BDC744240A03FE4E30005F3BFC036B9C7D27442400EE89B584A03F3BF0C4DDFBACD744240E63CD15F8E02F3BFADA95F11C97442405BDB95B8F101F3BF2D5508CBC4744240F0318FB19301F3BFB9641B55AB744240BC36690A7300F3BF
18	24	\N	\N	9	\N	\N	\N	\N	\N	\N	\N	2	0105000020E610000001000000010200000005000000A3527B41C67442401A9EE630C301F3BF6F044E22CC7442401A066EE05502F3BFF958DB79CF744240477E3966E802F3BF6B4153F3E47442403C2442132D07F3BF420E2793FC744240666D2C0F290CF3BF
19	25	\N	\N	6	\N	\N	\N	\N	\N	\N	\N	2	0105000020E61000000100000001020000000200000067DED26CB07442403F3C6B1C7406F3BF1430CD7E97744240153013522A03F3BF
20	None	\N	\N	\N	\N	\N	average	\N	\N	\N	\N	1	0102000020E610000002000000C3BA4461EE7442407C39690935DDF4BFF875B299D5744240957026F555DDF4BF
21	None	\N	\N	\N	\N	\N	average	\N	\N	\N	\N	1	0102000020E610000002000000022069A9D17442405FE71774BCE2F4BF4CBAD7FDE57442404D801CD811E8F4BF
22	None	\N	\N	\N	\N	\N	average	\N	\N	\N	\N	1	0102000020E61000000200000095D19394C6744240B57A9970BADDF4BFF875B299D5744240957026F555DDF4BF
23	None	\N	\N	\N	\N	\N	average	\N	\N	\N	\N	1	0102000020E610000002000000C3BA4461EE7442407C39690935DDF4BF72B8D60405754240375EB4A968DEF4BF
24	None	\N	\N	\N	\N	\N	average	\N	\N	\N	\N	1	0102000020E610000002000000EA027624FF744240F9F22232A9DFF4BF72B8D60405754240375EB4A968DEF4BF
25	None	\N	\N	\N	\N	\N	average	\N	\N	\N	\N	1	0102000020E610000003000000022069A9D17442405FE71774BCE2F4BF34E86B21C8744240E778C1523CE0F4BF1D1C7F3DC5744240E690E7A298DBF4BF
26	None	\N	\N	\N	\N	\N	average	\N	\N	\N	\N	1	0102000020E6100000020000001D1C7F3DC5744240E690E7A298DBF4BFE27FA35FD37442402B4D69D160DBF4BF
27	Unknown	\N	\N	\N	\N	\N	average	\N	\N	\N	\N	1	0102000020E610000002000000AD88DA92D5744240B41FF92EC3E3F4BF9E67B333E37442401D820F4DE3E2F4BF
28	None	\N	\N	\N	\N	\N	average	\N	\N	\N	\N	1	0102000020E6100000020000004CBAD7FDE57442404D801CD811E8F4BF2AC3A6A9F17442408E7D8A5561E7F4BF
29	None	\N	\N	\N	\N	\N	average	\N	\N	\N	\N	1	0102000020E6100000030000009AFDE6E9DF744240E8ADC91AE7E1F4BF1D2C8D3FD97442400F7ED57F3FE2F4BF28FE5489D174424058A2A409B4E2F4BF
30	None	\N	\N	\N	\N	\N	average	\N	\N	\N	\N	1	0102000020E610000002000000EA027624FF744240F9F22232A9DFF4BFB23A2820DF744240E1B6BC30AAE1F4BF
31	None	\N	\N	\N	\N	\N	average	\N	\N	\N	\N	1	0102000020E6100000040000006F7DC0E6DE74424036F8157799E1F4BF2CCAC1D9D9744240659D083103E0F4BF805E8C0ED67442408D438FAEBCDDF4BFE27FA35FD37442402B4D69D160DBF4BF
32	None	\N	\N	\N	\N	\N	average	\N	\N	\N	\N	1	0102000020E61000000200000017F167ECC67442407811EE7F48DEF4BF805E8C0ED67442408D438FAEBCDDF4BF
33	Unknown	\N	\N	\N	\N	\N	average	\N	\N	\N	\N	1	0102000020E6100000030000002CCAC1D9D9744240659D083103E0F4BFB95F6A14ED7442403E5A088B3FDFF4BF9F515C56F574424021D96C1314DFF4BF
34	None	\N	\N	\N	\N	\N	average	\N	\N	\N	\N	1	0102000020E6100000040000000A20727ED8744240FEA4BEE132DFF4BF20CE6554CC744240B9B8C90195DFF4BF7CFF5524CC744240FBD3EADF6EDFF4BFE325AEB4C7744240B1E6F06F8CDFF4BF
35	None	\N	\N	\N	\N	\N	average	\N	\N	\N	\N	1	0102000020E610000004000000941794C9D67442403598C0DB2CDEF4BF4C25FA64EC7442402C15DA06CDDDF4BFD9E03F77EF74424039B55166C0DDF4BF10DC81E8F2744240A5691D7C72DDF4BF
36	None 	\N	\N	\N	\N	\N	average	\N	\N	\N	\N	1	0102000020E6100000030000006F7DC0E6DE74424036F8157799E1F4BF5EB1B363ED744240113376A3F0E5F4BF2AC3A6A9F17442408E7D8A5561E7F4BF
\.


--
-- Data for Name: road_asset; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.road_asset (id, road_id, asset_type, asset_condition, geom) FROM stdin;
1	1	A	600	0101000020E610000090E7955626A8424080280341B62EE03F
2	1	100	400	0102000020E610000002000000E047219699B4424000EC4EF7C096B03FF8935DC63BD54240002078707EF1933F
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description, isactive) FROM stdin;
5	county_admin	County Administrator. Manages  county staff and approval of data	t
6	county_mon	County M&E. Files M&E reports as required by the project 	t
7	county_staff	County Staff. Create County data	t
8	settlement_sec	Settlement SEC member. Create data	t
9	senior_staff	Ministry senior staff. No edit rights	t
10	sud_staff	Slum Upgrading Department staff. Review and approve county data	t
11	kisip_staff	KISIP  staff. Uploads KISIP data (interventions)	t
12	consultant	Consultant.  Uploads KISIP data (interventions)	t
13	partner_staff	Partner staff. View data. No edit rights	t
14	public	General public. View limited data	t
15	guest	General user. View limited data	t
1	admin	National Administrator. Manages the overall System	t
2	moderator	To be removed	t
3	editor	To be removed	t
4	user	A normal user. Cannot edit anything	t
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

COPY public.settlement (id, name, county_id, settlement_type, geom, area, population, code, description) FROM stdin;
4	Mathare fire victims	47	1	\N	0.78	1950	Nairobi_4	\N
5	Ex-Grogon	47	1	\N	0.41	430	Nairobi_5	\N
7	Redeemed	47	1	\N	0.47	907	Nairobi_7	\N
17	Kwa Ndomo	3	1	\N	2.5	1500	Kilifi_17	\N
20	Makaburini	3	1	\N	6.68	4508	Kilifi_20	\N
21	Njoro ya Chini	3	1	\N	7.8	1800	Kilifi_21	\N
23	Jacaba	3	1	\N	11.51	3640	Kilifi_23	\N
24	Njoro Takatifu	3	1	\N	25.24	1350	Kilifi_24	\N
26	Tabora	3	1	\N	5.88	2408	Kilifi_26	\N
38	Kaango Mosquito	15	1	0103000020E610000001000000110000009A77991EEB004340470B520762F2F5BF3A7E8893DF00434015BFFAFBFFF1F5BFE86F1870D8004340595418BD14F1F5BF382AC02CD5004340759170FF45F0F5BF26856461D0004340DEB3EA3B16EFF5BF4A0675C3CF0043408603B676FBEAF5BF8A4A7FA1100143407336324FF5E6F5BFB8E8F1421F0143409C95AB8C12E6F5BF1B972506600143402D9166CBCCE5F5BF5D82C6C762014340E87B87FC76E6F5BF904CD7323F014340CA4FAE0C38EBF5BF4942B49E3B0143402DFADC6FA9EBF5BF7894896322014340C959908233EEF5BFBBB6B401060143409986060ADAF0F5BFC2DC45A7FA0043408AD5BED087F1F5BFA350D4BFF500434036DE83E7D1F1F5BF9A77991EEB004340470B520762F2F5BF	7	3960	Kitui_38	\N
42	Kihatha	19	1	0103000020E61000000100000007000000AA76F642D8724240B59709D0B9D9DBBFD4F0F32EB871424037224D6A8FD8DBBF359E92BF8C7142404541788D3BD8DBBF0F5AA0538D7142408F3D3B81834DDBBF109010EDCB724240CF4BDD4B344FDBBF8343670DD97242400DD39C21464FDBBFAA76F642D8724240B59709D0B9D9DBBF	21.3	250	Nyeri_42	\N
45	Ithenguri	19	1	0103000020E6100000010000000D00000084B28938587B42403B30178D632BDEBF2E15ECDD4D7B42409B20698B3127DEBFDD442FA72B7B4240D62BA716EC17DEBFFD19A6484B7B4240B1FBF4D2A5F9DDBF00A40524527B4240A80A59B915F3DDBF236DAE50557B4240B88BF0CAB6F0DDBF6A53F0756A7B42407F2813979FE8DDBF6287FFD07A7B424066C473CD5FE2DDBF17DCABEA797B4240028E1637D7E9DDBFF47DE372797B4240360CCE3504EBDDBF1243428E677B424044CD47734912DEBFEC02AB7A5A7B42406FBE11671D2BDEBF84B28938587B42403B30178D632BDEBF	6.3	55	Nyeri_45	\N
50	Kiaruhiu_Kariki	19	1	0103000020E6100000010000001300000092DD8C324796424029A6E69E3948DCBFE9F3E8C2E49542404E901313C31EDCBF740C8D9DE495424075ABC3DBEA1DDCBFEA7B250FF09542400BE6EBDA860DDCBF076830FF49964240AC56A310C10ADCBF99E37F13B39642405D7006034B09DCBF40179494B496424006CB1F2D7309DCBF7590567ECA9642400DE820350615DCBFB6262303CC9642405DC1FB4B5C17DCBF13989AA3CD96424032E96CF2DC19DCBF7008A631CF964240D8B94742411CDCBFBFF3768AD0964240B6007FB0531EDCBF6B1062F7CF96424031AE840ADF1EDCBF999436A1B7964240F1C18506B434DCBF03B7F9294896424056DA87831C48DCBF296DEECF47964240BBD0A42C2748DCBF3D29FE3C479642406E4326923848DCBFCA13BE3947964240A890A9F43848DCBF92DD8C324796424029A6E69E3948DCBF	13.71	306	Nyeri_50	\N
55	Njoguini	19	1	0103000020E6100000010000000D000000C69D038AAC6E424018FE6BBE78DED9BF3C831C9A7B6E4240DBD932A190CAD9BFD25F655E7B6E42404C2DB782E7C9D9BF4C306DB0926E4240C27F48934AB6D9BF1C22A5F5936E4240BADB9C1114B6D9BFA62C8C7F6D6F42404EE40DC858C5D9BF5B2C473E6E6F42403FB0BB14BAC5D9BF24EB90586B6F4240547CD66A88CFD9BFC511B7C96A6F4240808908A34AD1D9BFCD130FA4686F4240F40A3086B5D7D9BF3F70442C676F4240010297B918DCD9BF5141082D666F4240F008A45A6ADCD9BFC69D038AAC6E424018FE6BBE78DED9BF	11.48	90	Nyeri_55	\N
59	Kiawara	19	1	0103000020E6100000010000000B000000EE98766EA1844240107069725BDBDDBF2C8E9D656D844240B3313A943AA3DDBF10A5ADE8A78442402CCDABAA3489DDBF8C4BD990DD844240928F4B6CBE75DDBF6D76DCAAE98442407986817E2B8ADDBF8D7E08410385424013502A3613B6DDBF47DBE089EE8442409188985BF8BDDDBFD3B3911FE18442408BBCF13E15C3DDBF9AACF8AED38442401D56EE8634C8DDBFE781628FC484424035150F11F8CDDDBFEE98766EA1844240107069725BDBDDBF	6	6011	Nyeri_59	\N
51	Gikomo/Kiawara	19	1	\N	21.89	911	Nyeri_51	\N
64	Tarabete	32	1	0103000020E6100000010000000C0000009A53FE0746264240E0E2DBC3BBD9E6BFBB0C64D7DC254240979BD883AACEE6BFCF2511ADD125424029DFFB9EA0CCE6BF6C3944C0CB254240CB05EAD8C0CAE6BF0329654CC325424058F5B0BA03C8E6BFFA6F54C59E2542407C311BD3C1BBE6BFBF23FA2FA325424005CC10F6C2B9E6BF06FCC9A4A5254240105C9E76E5B8E6BF73213692A8254240E46C5C50E8B7E6BF9E528FB1D8254240AFB7F9E765A8E6BF0BBBE12C61264240725BEF03CDD5E6BF9A53FE0746264240E0E2DBC3BBD9E6BF	7.7	1959	Nakuru_64	\N
67	Crater Lake	32	1	0103000020E6100000010000000C00000021495540A71E4240114FE0A1DF6FE8BF5D1FA98B971E4240937A26A36A6FE8BF4206BF8DFE1D424051BE88CFE66AE8BF80C4ED51FD1D4240B681F1CCAD6AE8BF6EFB8630FE1D4240308AB9E8D768E8BFBE20C962031E4240366DACAF015EE8BF9F6CEAB7071E42409B3ED5B30055E8BF1EDD0446091E42402E9644BCD154E8BF265EACC96A1E42403DE27E123E65E8BF0F5B4EC6A71E42409C561A2D846FE8BF34D25183A71E424007587DE7B16FE8BF21495540A71E4240114FE0A1DF6FE8BF	9.48	848	Nakuru_67	\N
70	Kuinet	27	1	0103000020E610000001000000080000009F78EF7297A74140FC78E4D672CEE33F88F2FEFC96A74140B3982B8E97CEE33FAE37C8C3AEA74140E4E07942D1FFE33F3F19D2D0F6A74140D77E135B4B06E43F2BD9612302A84140AEF0A4E339E6E33FD7712D55C9A74140E5113EBBADD1E33F1D91DB36A3A7414003CC91DD35CFE33F9F78EF7297A74140FC78E4D672CEE33F	13.16	700	Uasin Gishu_70	\N
74	Swahili	42	1	0103000020E6100000010000000C000000D362DBF5AA994140504F8E02252BC4BF0F335FB9619941409EABDAB2361AC4BF604A74264A9941407899C11E1DF0C3BF678BB40B5299414019498D280CEAC3BFA2F57992B1994140D57D62F55AE6C3BF58781F92B29941407B7C3387CAE6C3BFDC24CE5EB49941404187E8F1DCEBC3BFE50E15A7C7994140C2FFD3436722C4BFD12B1A1FC7994140608000D68723C4BF974FC45AC399414007EC37B18D24C4BF7FE5418EBA99414047BDDB7BEE26C4BFD362DBF5AA994140504F8E02252BC4BF	4.2	1500	Kisumu_74	\N
79	Kambi Somali	37	1	0103000020E610000001000000090000005459E0C1845F4140A5C0635C7C0CD23FA628956A715F4140127F59C65221D23FAB729B728F5F414054F07C3FEE28D23F157C816B915F41409AD327086E29D23F8D0E28859F5F414030350270CD2AD23F9DA320ECA95F414081DDDE051E2BD23FB1BFC7D5B55F4140B4DAF3A9BC1FD23FCFB99E62B95F41401F2B9498BB15D23F5459E0C1845F4140A5C0635C7C0CD23F	3.4	395	Kakamega_79	\N
75	Shauri yako	42	1	\N	27.73	2500	Kisumu_75	\N
83	A thousand street	43	1	\N	4.03	2727	Homa Bay_83	\N
84	Aramaget	24	1	\N	10.5	626	West Pokot_84	\N
85	Aseko/Mlekenyi	6	1	\N	15.18	3070	Taita Taveta_85	\N
86	Awelo	41	1	\N	30	1179	Siaya_86	\N
87	Bandani	42	1	\N	15	9534	Kisumu_87	\N
88	Barwaqo	8	1	\N	29	2242	Wajir_88	\N
89	Bayamangozi	3	1	\N	25.5	0	Kilifi_89	\N
90	Bondeni	30	1	\N	50	500	Baringo_90	\N
91	Bondeni	32	1	\N	2	0	Nakuru_91	\N
92	Bora Imani	4	1	\N	12	2124	Tana River_92	\N
93	Bura	4	1	\N	27	1726	Tana River_93	\N
94	Canaani	16	1	\N	29	3243	Machakos_94	\N
2	Kahawa Soweto	47	1	0106000020E6100000010000000103000000010000000B00000034677984CE744240CD7E07B32103F3BF19E215E1EA744240457A7C81CE08F3BF88CC2CB5FF7442406F03CE9F760CF3BFAFCA84DE09754240ED75DD4A970EF3BF1D839FF00C7542409EAD481F380FF3BF23E828EE0F7542403922F9114211F3BF12DFFE8E10754240CCEF5A1AB111F3BF48886F5E0F7542404FD934B75213F3BFADDB72EF07754240E18775D6F415F3BF71C0E78DAC744240627A04B2E40FF3BF34677984CE744240CD7E07B32103F3BF	8.694	2	Nairobi_2	\N
3	Kambi Moto	47	1	0103000020E6100000010000000B000000A97D0CD73E704240ABCD5177102CF4BF9F029EE23A704240FB7B324F082CF4BFE8C20B7935704240CD05240CF82BF4BFA22687A335704240EA49DAC07A2BF4BFF9BBCBB635704240B86C1BA7552BF4BF8451DE3B3670424051A3DC636E2AF4BF9A2D77483870424081B80747FF26F4BF8CDE63113E7042408FFB4C9E0727F4BF6F5EB53D417042407409C13D0C27F4BFF69E93D040704240F96D6D0D0F28F4BFA97D0CD73E704240ABCD5177102CF4BF	0.43	698	Nairobi_3	\N
27	Muyeye II	3	1	0103000020E61000000100000012000000F69EF0995E0D44404CAF7E2AF9110AC069B3B804590D44407F8F6B8BB3110AC058B44006570D44400A779DAD9A110AC022B8C807550D4440E02CCFCF81110AC06C5B0EE1540D44400EFED9EC7F110AC07217C8DD3E0D44401EF867F91F060AC0713032B6E60D444070DFB99C59EE09C0E63F68C68D0E44401A8FEDB0C4E809C009D11F1CD20E44404AFC64359DE809C05316C564D50E44407665F79157EA09C03D2C89AB940E444005B294729D020AC071B1728B9F0D4440D9E7EEC8FB100AC0F9ED4D72970D444000D04EF152110AC02A5D9EAF930D44409E6A496A7B110AC08AF02C21900D4440BB28FFB0A1110AC0B1A69ED3890D44409DBA0087E5110AC09AC10531630D444083D5A014F7110AC0F69EF0995E0D44404CAF7E2AF9110AC0	106.54	14250	Kilifi_27	\N
95	Carlifornia-Lodwar Municipality	23	1	\N	8.2	1769	Turkana_95	\N
96	Chebiemit	28	1	\N	10	323	Elgeyo-Marakwet_96	\N
97	Chelanga	1	1	\N	2.124	3804	Mombasa_97	\N
98	Cheptongei	28	1	\N	11.5	874	Elgeyo-Marakwet_98	\N
99	Chewani	4	1	\N	7	1296	Tana River_99	\N
100	Dagorretti-Ruthimitu	22	1	\N	1.2	361	Kiambu_100	\N
101	Diani Complex	2	1	\N	2.01	2201	Kwale _101	\N
104	Faza village	5	1	\N	20	2849	Lamu_104	\N
105	Gathambi	20	1	\N	5.91	245	Kirinyaga_105	\N
106	Gatugura (Gatundura)	20	1	\N	7.85	333	Kirinyaga_106	\N
107	Getuya	20	1	\N	2.25	231	Kirinyaga_107	\N
108	Gichagi	34	1	\N	4.05	4541	Kajiado_108	\N
109	Githogondo	20	1	\N	7.61	1047	Kirinyaga_109	\N
110	Halane	8	1	\N	30	5509	Wajir_110	\N
111	Hodhan	8	1	\N	24	867	Wajir_111	\N
112	Hodi Hodi	1	1	\N	8.548	500	Mombasa_112	\N
113	Hola Mission	4	1	\N	11	1511	Tana River_113	\N
114	Huruma - Ol Kalou	18	1	\N	30	923	Nyandarua_114	\N
115	Ithareini	20	1	\N	9.22	538	Kirinyaga_115	\N
116	Jam City	16	1	\N	6	1124	Machakos_116	\N
117	Jiw Dendi	44	1	\N	36.54	0	Migori_117	\N
118	Jogoo	8	1	\N	27	3776	Wajir_118	\N
119	Jua kali	37	1	\N	2.7	0	Kakamega_119	\N
120	Jua Kali	4	1	\N	6	1763	Tana River_120	\N
121	Kabati	32	1	\N	2	0	Nakuru_121	\N
122	Kabichbich	24	1	\N	7.53	375	West Pokot_122	\N
123	Kagumo	20	1	\N	8.82	1245	Kirinyaga_123	\N
124	Kaitheri	20	1	\N	2.42	396	Kirinyaga_124	\N
125	Kajuka-Lodwar Municipality	23	1	\N	3.5	316	Turkana_125	\N
126	Kalolo	3	1	\N	22	7105	Kilifi_126	\N
127	Kalundu Misuuni	15	1	\N	4.42	1624	Kitui_127	\N
128	Kalundu slaughter	15	1	\N	12.02	1800	Kitui_128	\N
129	Kambi Mawe - Lodwar Municipality	23	1	\N	6.3	638	Turkana_129	\N
130	Kampi Wakulima	30	1	\N	76.4	1500	Baringo_130	\N
131	Kamuiru	20	1	\N	7.9	604	Kirinyaga_131	\N
132	Kamuthanga	20	1	\N	2.8	979	Kirinyaga_132	\N
133	Kanjeru	22	1	\N	1.6	562	Kiambu_133	\N
134	Kapcherop	28	1	\N	9.6	549	Elgeyo-Marakwet_134	\N
135	Kapsowar	28	1	\N	8.8	935	Elgeyo-Marakwet_135	\N
136	Karagita	32	1	\N	30	20255	Nakuru_136	\N
137	Kathwana	13	1	\N	8	265	Tharaka-Nithi_137	\N
138	Katorongoto	30	1	\N	36	1700	Baringo_138	\N
141	Kiamburi	22	1	\N	2.57	1023	Kiambu_141	\N
142	Kiandutu	22	1	\N	40	20000	Kiambu_142	\N
143	Kiangoma	20	1	\N	7.77	561	Kirinyaga_143	\N
144	Kiangombe	22	1	\N	3.5	1000	Kiambu _144	\N
145	Kiangombe	20	1	\N	7.73	223	Kirinyaga_145	\N
146	Kianjiru	20	1	\N	2.78	359	Kirinyaga_146	\N
147	Kiarukungu	20	1	\N	2.47	926	Kirinyaga_147	\N
148	Kiawara	19	1	\N	6	6011	Nyeri_148	\N
149	Kibaoni	3	1	\N	8.6	0	Kilifi_149	\N
150	Kibirigwi	20	1	\N	8.25	630	Kirinyaga_150	\N
151	Kibokoni M17E	3	1	\N	22.3	1077	Kilifi_151	\N
152	Kibuye	42	1	\N	15	606	Kisumu_152	\N
153	Kibuyu	4	1	\N	13	1799	Tana River_153	\N
154	Kijiji Cha Chewa	6	1	\N	3	2196	Taita Taveta_154	\N
155	Kijijini(kendu Bay Old town)	43	1	\N	3.93	3604	Homa Bay_155	\N
156	Kilimanjaro	1	1	\N	1.6	100	Mombasa_156	\N
157	Kimunye	20	1	\N	7.69	994	Kirinyaga_157	\N
158	Kipkaren  Site & Service	27	1	\N	28.2	17676	Uasin Gishu_158	\N
159	Kipsongo A	26	1	\N	27	2098	Trans Nzoia_159	\N
160	Kisumu Ndogo	3	1	\N	22.6	3153	Kilifi_160	\N
161	Kiunga old town	5	1	\N	25	1468	Lamu_161	\N
162	Kwa Mangeli	16	1	\N	3	2813	Machakos_162	\N
163	Kwa Murogi	32	1	\N	65.78	46004	Nakuru_163	\N
164	Kwa Nzomo	16	1	\N	3	1042	Machakos_164	\N
165	Lake View	32	1	\N	26.84	16016	Nakuru_165	\N
166	Landi Matope	39	1	\N	5	761	Bungoma_166	\N
168	Lokichoggio Informal Settlement-Lokichoggio Town	23	1	\N	9.48	1058	Turkana_168	\N
169	Lokori Settlement-Lokori Town	23	1	\N	2.03	1781	Turkana_169	\N
170	London	32	1	\N	43.3	16083	Nakuru_170	\N
171	Lowarengak Informal Settlement-Lowarengak Centre	23	1	\N	14.88	2355	Turkana_171	\N
172	Lukoye	37	1	\N	10	1133	Kakamega_172	\N
173	M27	3	1	\N	10.7	527	Kilifi_173	\N
174	Maganda	1	1	\N	97	5000	Mombasa_174	\N
175	Maisha Matamu	39	1	\N	1	243	Bungoma_175	\N
176	Majengo	34	1	\N	20	1200	Kajiado_176	\N
177	Majengo	12	1	\N	5	2410	Meru_177	\N
178	Majengo Mapya	6	1	\N	23	1267	Taita Taveta_178	\N
179	Makaburini	4	1	\N	11	2584	Tana River_179	\N
180	Makongeni	43	1	\N	4.134	3970	Homa Bay_180	\N
181	Malindi ya Ngwena	4	1	\N	10	1241	Tana River_181	\N
182	Manyatta A (Kona Mbaya and Migosi)	42	1	\N	24	22474	Kisumu_182	\N
183	Manyatta B	42	1	\N	25	45150	Kisumu_183	\N
184	Marimanti	13	1	\N	30	1532	Tharaka-Nithi_184	\N
185	Masogo kayoya	43	1	\N	2.716	1201	Homa Bay_185	\N
186	Matharau	22	1	\N	6.22	976	Kiambu_186	\N
187	Matisi	26	1	\N	28	9882	Trans Nzoia_187	\N
188	Matondoni	5	1	\N	12	2974	Lamu_188	\N
189	Mazeras Centre Miwani/Mgumo wa Pasta	3	1	\N	25	3747	Kilifi_189	\N
190	Misongeni	17	1	\N	16.2	1443	Makueni_190	\N
191	Misri	22	1	\N	9.47	2500	Kiambu _191	\N
192	Mitume (Mau Mau)	26	1	\N	20	22888	Trans Nzoia_192	\N
193	Mjini	39	1	\N	7.52	6597	Bungoma_193	\N
194	Mjini	17	1	\N	10.13	3103	Makueni_194	\N
195	Mjini	12	1	\N	4.63	708	Meru_195	\N
196	Mokowe old town	5	1	\N	20	3166	Lamu_196	\N
197	Mororo	4	1	\N	26	6642	Tana River_197	\N
198	Mosoriot	29	1	\N	26.53	785	Nandi_198	\N
199	Mtaani	3	1	\N	28.4	3897	Kilifi_199	\N
200	Muhoroni (Sangoro, Swahili, Shauri Yako, Shauri Moyo & Bondeni)	42	1	\N	20	3320	Kisumu_200	\N
201	Mukinduri	20	1	\N	15	472	Kirinyaga_201	\N
202	Muslim village	13	1	\N	10	329	Tharaka-Nithi_202	\N
203	Mwangaza	4	1	\N	28	4303	Tana River_203	\N
204	Mwanzo Site & Service	27	1	\N	5.8	22112	Uasin Gishu_204	\N
205	Nabute - Lodwar Municipality	23	1	\N	2.6	326	Turkana_205	\N
206	Nangeni	39	1	\N	6	464	Bungoma_206	\N
207	Ndhiwa settlement	43	1	\N	33.8	17885	Homa Bay_207	\N
208	Ndindiruku	20	1	\N	4.23	2317	Kirinyaga_208	\N
209	Nginoka Kim-Lokichar Town	23	1	\N	7	1006	Turkana_209	\N
210	Nubian	30	1	\N	53	2800	Baringo_210	\N
211	Nyamurutu	32	1	\N	100	0	Nakuru_211	\N
212	Nyandiwa	43	1	\N	8.04	4432	Homa Bay_212	\N
213	Nyawita	42	1	\N	13	11564	Kisumu_213	\N
214	Public Works- Lodwar Municipality	23	1	\N	2.4	735	Turkana_214	\N
215	Rusinga Old Town	43	1	\N	1.825	2725	Homa Bay_215	\N
216	Rwambiti	20	1	\N	6.982	1011	Kirinyaga_216	\N
217	Salama	12	1	\N	3	945	Meru_217	\N
218	Shallattey	8	1	\N	23	702	Wajir_218	\N
219	Shanti	26	1	\N	18	1794	Trans Nzoia_219	\N
220	Shauri (Timboroa Centre)	30	1	\N	44.9	0	Baringo_220	\N
221	Shauri Yako	43	1	\N	7.613	9147	Homa Bay_221	\N
222	Shauri yako	20	1	\N	0.2	292	Kirinyaga_222	\N
223	Shibale	37	1	\N	10	1256	Kakamega_223	\N
224	Shimo la Tewa	26	1	\N	4	549	Trans Nzoia_224	\N
225	Slota	16	1	\N	8	5180	Machakos_225	\N
226	Sofia	43	1	\N	4.3	7793	Homa Bay_226	\N
227	Soko mjinga	17	1	\N	6	727	Makueni_227	\N
228	Soweto-Lodwar Municipality	23	1	\N	12.8	2804	Turkana_228	\N
229	Thiguku	20	1	\N	7.85	743	Kirinyaga_229	\N
230	Tiwi Block 12	2	1	\N	65	2500	Kwale _230	\N
231	Town Chini-Lokichar Town	23	1	\N	13.3	848	Turkana_231	\N
232	Tuwani	26	1	\N	22	16043	Trans Nzoia_232	\N
233	Upper Kariokor	6	1	\N	3	6203	Taita Taveta_233	\N
234	Wachakone	4	1	\N	8	963	Tana River_234	\N
235	Wagberi	8	1	\N	26.5	3823	Wajir_235	\N
236	Witu old town	5	1	\N	15	3698	Lamu_236	\N
237	Wiyoni Village	5	1	\N	20	12099	Lamu_237	\N
10	Misufini	1	1	0103000020E6100000010000000D0000003CD960AB37CA434034477C1CAE0110C068B4546918CA4340CA94C2E4EE0010C0BA628D0603CA43405FAE892084FF0FC03D1A2EEBC3C9434049C1BF3FE1F70FC0F8B7C2A114CA4340CA64771CA5F10FC0B078A17B29CA43404B65707986F10FC0C9EF5CA531CA434081312DD798F10FC016E9424D32CA43404710F4509AF10FC0CA38D3AD38CA4340B947676151F20FC06078B34C3ECA43406E90F7B9F2F20FC0F7E1B73C50CA4340C7115D4326F50FC0071B2CEB4BCA434093953FADF70010C03CD960AB37CA434034477C1CAE0110C0	24.04	1734	Mombasa_10	\N
11	Kwa Hakatsa	1	1	0103000020E6100000010000001F0000001A6BA1DEDCCB4340B3B478A3340310C0DCC693ABAECB43401F8C3A945C0210C02D66363CA2CB43402FC0095F220210C0ABFA7FAB5ACB43401CD9F0A783F80FC0BD7F1D3C5CCB43407ADD2E8C39F80FC086B12AA593CB43405199C55620F40FC0F7E35FC694CB4340083732CD0DF40FC099A336AC96CB4340C818DB13F3F30FC0340FA41098CB434013DFC94DE2F30FC017446B2A99CB4340877C4FE6D6F30FC0C4C9E87B9BCB434084EDD850C4F30FC0509BCC259DCB4340B0C81D79BAF30FC0D6CFE2419FCB4340717332F1B2F30FC00B9EA4D4A1CB43404192DF63AEF30FC0C3809790A3CB4340337FC05EAEF30FC0040C8CD2A5CB4340F3451959B2F30FC0D1C8215BA8CB434040704691BBF30FC0F8B8F15AA9CB43401837BD2DC1F30FC0538B1400ACCB4340CBB7A9D4D9F30FC05CE4955EADCB434011D2C7F4E8F30FC012687655AFCB4340151D094902F40FC0528BCF32B0CB4340F7E9823B0FF40FC054F8C449D8CB4340F569EF67AAF60FC0839B952CD9CB434001194D35BCF60FC0F4D5D2740DCC43406B980CFD54FB0FC0EC4F05E90DCC43407E8C88529BFB0FC078AE79B1FACB4340644740BA840110C0C7A839FEE5CB4340AA8A560BBE0210C055302DB9E2CB4340A38B108CE80210C0241AAFFAE0CB43406F02F737FF0210C01A6BA1DEDCCB4340B3B478A3340310C0	20.9	3000	Mombasa_11	\N
102	Embakasi KCC	47	1	\N	13.2	9616	Nairobi_102	\N
103	Embakasi Village	47	1	\N	2.28	1613	Nairobi_103	\N
139	Kayole Soweto	47	1	\N	30	68805	Nairobi_139	\N
140	Keroka Block -B	46	1	\N	6.2	678	Nyamira_140	\N
167	Landi Matope (muslim school-Webuye DEB-Rail)	39	1	\N	5	761	Bungoma_167	\N
16	Muyeye I	3	1	0103000020E610000001000000190000005180AC298D104440D877699A0F1E0AC01D5D2629801044409CF32B1B0B1E0AC01339B22F41104440962311245D1C0AC0C1F24EE0110E44403572559502FD09C0867F8EC1B10D44405D1AD25C3DE909C0B5C53E9FAE0D4440658B884171E509C0452C28FBBB0D444063FBCFCE36DF09C050E29001DA0D444044370FC179D509C080E33E8A890E44401CEBA612C8C709C0D644E5ADAD0E444072F5E99F3CC609C0FC5CA20B300F44406CA295109DC209C0B7428C4F5F0F44400A9068C9BAC209C07F64B578710F44402BF1A639C7C209C0C566AF3F7D0F4440E90CD5F3D4C209C0C7A178504210444062DD5EB856C609C02281D30BA7104440CFCEB81750C909C04ABD41DEA7104440ACB17F2A68C909C03C9AE390AD10444099E8009170CC09C09031EADE00114440BAA942B6170C0AC0172CE57901114440F6B03FDAD30C0AC090972139FE1044408DA6C28EE90D0AC038864D09FE1044405497D681F90D0AC0CE03BF91BD104440F4D980C5311B0AC03DCE02B794104440A1BA72C60B1E0AC05180AC298D104440D877699A0F1E0AC0	26	5000	Kilifi_16	\N
30	Bulla Riig Phase 1	7	1	0103000020E610000001000000100000005DBE046F00D44340ACC1CF84793EDCBF8FF6D88132D3434069C532D87CFEDBBF7BFE17FC32D34340C8F0AB9C65FCDBBF5275C22D56D34340BEE0E58B5199DBBF5388236080D44340BCDF706B0470DBBF688ECFFE6CD5434075A9026D3E51DBBFF1C7EF768DD54340B4D49B8AEF61DBBFA4D37CBA11D54340AC94CF005FA8DBBFFC316B25E1D44340EBFC4B6B7FC3DBBF7181A09350D4434084201272CD12DCBFCC209FC62DD443407F0C9B60DE25DCBFBF776E8828D44340075F98B6BD28DCBFB3BFA66127D443402EC6D17B5D29DCBF122822DC11D44340FD50429E0735DCBF7E72C77205D44340818EA8BAC13BDCBF5DBE046F00D44340ACC1CF84793EDCBF	351.42	13343	Garissa_30	\N
33	Iskadek Phase 2	7	1	0103000020E6100000010000001D0000006CBC7E0FA7D4434003EDE5F9863BDEBF7C7079F8A6D4434003C24F867C3BDEBF843ECD3EA6D44340C1FD733A283BDEBFFA47F24A55D44340D8207108630CDEBFC756DECC4DD4434032AD5DF562FDDDBFD65301DB4CD44340CF42809249FBDDBFEB964FC74CD44340573A78D01DFBDDBF68C475184CD44340A210005299F9DDBFD906AC004BD443402C8CA9AB2BF7DDBF8A639DC04AD44340D2F12F589DF6DDBF232A196F49D44340834D166EAFF3DDBF82DCCF5949D4434096DD90412FF3DDBFB9157B4A49D44340FF60DAF0D2F2DDBF1A2F85B149D443406B72887BA0F2DDBFD5817C04A3D443404C736D5350CEDDBF344DE2B0A9D44340BC768E9BCBCBDDBFA8CB3DBA93D5434006DCC17275AEDDBF2B9BD96196D54340B437A50378AEDDBFCA3F402AA6D54340225C8E568DAFDDBF2313C2D4AFD543408DB4CE1540B0DDBF676C8C42B1D54340650AD5645CB0DDBFA2C026CEB7D54340542971FD4CB1DDBFC216FE74C4D54340C6CEC2F972B3DDBFA9791E84CDD543408E342F7A14B5DDBF59F250D3D4D5434049D134A167B6DDBF78BDD8A0D3D54340E5E5970914B8DDBF80A9CF77C7D54340F52930D6C3C7DDBF9DFE34157AD543404ED4ACFB7029DEBF6CBC7E0FA7D4434003EDE5F9863BDEBF	203.41	4432	Garissa_33	\N
53	Ngorano	19	1	0103000020E6100000010000000D00000017B186F7448942409489A3B5E6D7DABF413F784EB6884240EDF916838F92DABFB2B1DE2DB088424021E0B93D088DDABFF3BB7C94AE884240E5213006BA89DABF0065F7D70E894240DB9460763A7DDABF39BB57C57A89424098B2780DF786DABF156CEA6C81894240995FE92D5488DABFC2543F50B78942408A7E88560C99DABFA4BE5FA1BE8942406F3E437F519BDABF79CA48F4BE894240B2B0F8BAF09BDABFA9FECB06AB8942400712D66C0DAEDABF0EF103939F89424042EC1D1776B8DABF17B186F7448942409489A3B5E6D7DABF	28.6	128	Nyeri_53	\N
57	Ruruguti	19	1	0103000020E610000001000000170000003A7E0E2F87724240A8E291405734E2BF2CF58DFA1C724240D4AB76B4DB32E2BF55582DB216724240925B6B42B232E2BFD2A3728A0B7242405E6464AB6832E2BF39639AE300724240984842A70332E2BF0203ECBAF67142408D1B2E4FA331E2BF4920C3999D714240B3A1B9FCDB20E2BF57BC832F9D714240110CD2759620E2BF384F3D34A1714240C9FAA4BFB01EE2BF54510758A2714240708BF50E9F1EE2BF3FE70E7C1A7242400E4F9406DB1CE2BF1A61747C1A72424095880C0EDB1CE2BF896DF1E52A724240468EC6851D1EE2BFDA854D88AA7242405C401DEB312AE2BFAB2C5744AB724240FC1D8B48712AE2BF014130E0A87242403912AA37282EE2BFE7AAA611A7724240D28919BCF630E2BFE895A9B1A57242402B45DC821933E2BFAEF7B3AEA4724240E38B19345B33E2BF0EED4634A1724240F5CEEA558133E2BFFC9FD3C39D7242405F34440AA733E2BF197C9D778E72424011135D8D4534E2BF3A7E0E2F87724240A8E291405734E2BF	22.89	535	Nyeri_57	\N
6	Mji wa Huruma	47	1	0103000020E61000000100000012000000D044C416EF694240EA8768FB74A8F3BF973387DEE26942402EE0EAC571A8F3BF1DE178C5E169424042D021386AA8F3BF1924C3A4D269424048C529F4F5A7F3BF066D320BD06942400B8DBA3BC7A7F3BFA8234EF5C06942404C24237420A6F3BF476A2A94CA694240541F8DFE46A2F3BFE8309B3ECE694240F59208204EA2F3BF4C42EA78D76942409EF0572D61A2F3BF088BB57EDC6942409959A7D96DA2F3BF69834F71E66942400096331B93A2F3BFDFE388E3EB694240CD4D99C3A8A2F3BF32CED8B0F869424077DA23F5DFA2F3BFAC326F6FF9694240B0C38FC145A3F3BFE52693B9F66942407D29401E1EA5F3BFB18E9995F2694240F4E4CD7726A7F3BF58BFA9A5EF69424032DB4C6844A8F3BFD044C416EF694240EA8768FB74A8F3BF	2.78	1500	Nairobi_6	\N
15	Kibikoni M17E	3	1	0103000020E610000001000000CB000000127467F3930F4440ADB3BAA8B96609C05AE7B265A70E44404F29A753A26409C072E6929AA50E44406FC70A109E6409C034B89EC3A40E4440E1590F0B9C6409C05391C95D820E4440FB6F2A162F6409C0647BCDF9700E4440366FF224096009C05D0F22E8700E44404466EF6BDE5F09C0E85BB0E4850E4440601FDAA2AF5E09C092706103E80E4440467CF5A3D15F09C046473C85E90E4440F7E480FCDB5F09C0460B3C7FEA0E4440650097B0E25F09C0E4E0CCC6FE0E4440C09B88E56D6009C0C3FEA8A4FF0E4440EF2096D8736009C0B02AF9898D0F44409D33E8FD426409C095CBC87D8F0F44400E716E69506409C05A0D37F08F0F44405F07147C536409C0D48FC1D6930F4440F7C600F1036509C0CBD98FDA940F4440B5FDFEC4766509C0358015DB940F44402E0411B7776509C090CD20DC940F44406525549B796509C011F3ABDD940F444090152D717C6509C07383AFDE940F4440E107F4547E6509C08423B1DF940F4440E6C55D38806509C0A1E5AEE0940F4440D380A81B826509C040C9A8E1940F44406524B5FE836509C016BDA0E2940F4440F8A783E1856509C008C81AE3940F44402368DBD2866509C0FAD294E3940F4440742833C4876509C05F0A85E4940F44406E91A4A6896509C0D436FBE4940F44403B3ABE978A6509C0486371E5940F444005E3D7888B6509C0721BCEE6940F4440CACEE65B8E6509C0696940E7940F44400E60C24C8F6509C0EC2721E8940F44402194792E916509C0EF978FE8940F44407922361F926509C0F007FEE8940F4440D1B0F20F936509C0B4886AE9940F444078339000946509C0010AD7E9940F44406ECA4CF1946509C0879B41EA940F44404241CBE1956509C0F4837BEB940F4440E0BF46B3986509C08437E2EB940F4440C533A6A3996509C05FFC46EC940F444047B005949A6509C0FCD1A9EC940F4440F82046849B6509C098A70CED940F4440A79186749C6509C0347D6FED940F44407A02C7649D6509C0395B2FEE940F44403AD509459F6509C0956CE9EE940F444063AD2D25A16509C0478644EF940F444013183015A26509C02FDBF6EF940F4440C7D5F6F4A36509C0EE164EF0940F4440433DDAE4A46509C0AD52A5F0940F4440E3A4BDD4A56509C0B90D4CF1940F4440645927B4A76509C0836B9FF1940F4440C9BDEBA3A86509C0A46A3EF2940F4440276C1783AA6509C0E1C35BF9940F44408619B5AFD86509C012214AF9940F4440C29DC8D1DA6509C00F9B43F9940F4440FBC5C487DB6509C081143DF9940F4440C0D9A13DDC6509C0A5D32EF9940F444078249EF3DC6509C012A41EF9940F4440CB779AA9DD6509C07366FAF8940F4440F2065515DF6509C07559E6F8940F4440826B51CBDF6509C03A5DD0F8940F44403FC42E81E06509C07560BAF8940F4440D508ED36E16509C08275A2F8940F44402F6ACAECE16509C0DA9B88F8940F444050D4A7A2E26509C0AAC16EF8940F4440252A6658E36509C0C3F852F8940F44407188240EE46509C0AF4135F8940F4440CD0302C4E46509C00CF5F5F7940F444003E37E2FE66509C07A5FD4F7940F4440DE461EE5E66509C0BCDBB0F7940F4440CDC7DC9AE76509C0FD578DF7940F444096489B50E86509C001E567F7940F4440D2BD3A06E96509C04F8340F7940F4440883BDABBE96509C09C2119F7940F444041B97971EA6509C07FE2EDF6940F444059481927EB6509C060A3C2F6940F44404BD7B8DCEB6509C08D7595F6940F4440046F5892EC6509C0B84768F6940F44409706F847ED6509C0AF3006F6940F4440124418B3EE6509C0E724D5F5940F444093D89868EF6509C07F526BF5940F44403C249AD3F06509C0937A34F5940F44409AD21A89F16509C0F4B3FBF4940F4440BE899B3EF26509C0BF4886F4940F4440ACF47DA9F36509C0B32209F4940F44403B826014F56509C0688FCAF3940F4440C93EC2C9F56509C0FCAD45F3940F444081DA8534F76509C0DA5FFFF2940F44408CB9E7E9F76509C0B811B9F2940F44409498499FF86509C00CC372F2940F44404F638C54F96509C0809728F2940F4440BD53EE09FA6509C06A6BDEF1940F4440B62F31BFFA6509C06F6290F1940F44403B319374FB6509C0EF5842F1940F4440721ED629FC6509C07E68A2F0940F4440410A5C94FD6509C0DA924EF0940F444056119F49FE6509C035BDFAEF940F44406718E2FEFE6509C0DCF8A4EF940F44401B2825B4FF6509C044454DEF940F4440212C4969006609C07FA3F3EE940F4440104D8C1E016609C0FF813CEE940F4440E18BF388026609C09013DDED940F444085B2173E036609C020A57DED940F444003D93BF3036609C0FA471CED940F4440220860A8046609C01FFCB8EC940F4440E23F845D056609C08DC153EC940F44403A80A812066609C0756E85EB940F4440E1FDD17C076609C0C3671AEB940F44401C58F631086609C08660AFEA940F44400A9EFBE6086609C0697C40EA940F44408009209C096609C0C097D1E9940F4440AD6025510A6609C063C460E9940F444072C02A060B6609C05002EEE8940F4440D82830BB0B6609C03C407BE8940F4440439135700C6609C0BDA004E8940F4440E50A3B250D6609C0548413E7940F4440700F468F0E6609C089AC1AE6940F4440292232F90F6609C0AEA974E5940F4440D574C2E3106609C0E6191AE5940F444059571E63116609C09CE197E4940F444048F00418126609C025BB13E4940F444047A60ACD126609C06EA58DE3940F44409850F181136609C0939C7DE2940F444074B6BEEB146609C0BBBAF1E1940F4440A17AA5A0156609C02DEA63E1940F44406F478C55166609C0E92AD4E0940F4440DA1C730A176609C0A46B44E0940F444046F259BF176609C0BB311DDF940F444022AB0829196609C0FB3CEEDD940F4440A686B7921A6609C0638DB7DC940F4440A38466FC1B6609C0E75718DC940F4440948A2EB11C6609C06A2279DB940F4440A990F6651D6609C039FED7DA940F4440619FBE1A1E6609C0FDFA8DD9940F444046DF4E841F6609C0AA0AE7D8940F4440B4071739206609C0EB3C3CD8940F44408241DFED206609C02B6F91D7940F4440547BA7A2216609C0B6B2E4D6940F4440C5BD6F57226609C06C7E83D5940F4440B050E1C0236609C04BF5D0D4940F4440AD988A75246609C0488F1AD4940F44403806532A256609C0BC2864D3940F4440775FFCDE256609C005D4ABD2940F444078D5C493266609C058A1EFD1940F444096486E48276609C0AA6E33D1940F4440B1BB17FD276609C01A5F73D0940F44405854E0B1286609C0014FB3CF940F44408BD88966296609C07C61EFCE940F4440216E331B2A6609C03A934FCE940F4440C3D461AD2A6609C0F6C4AFCD940F4440643B903F2B6609C088080ECD940F4440EFBEDDD12B6609C0D95C6ACC940F4440AA360C642C6609C010281FCB940F4440A73769882D6609C0F69E77CA940F4440C6C0971A2E6609C0DB15D0C9940F4440E249C6AC2E6609C00C9E26C9940F44407BDBF43E2F6609C086377BC8940F4440D57523D12F6609C0FFD0CFC7940F444031105263306609C0C47B22C7940F44402AB380F5306609C0D33773C6940F4440C85EAF87316609C0E1F3C3C5940F44403B0ADE19326609C0918E61C4940F4440AE723B3E336609C0336DAEC3940F4440852F6AD0336609C0834C44C2940F444001A6A8F4346609C0F24ED6C0940F44402F420619366609C072611DC0940F4440E51835AB366609C080A8A7BE940F44401EC373CF376609C0AA122EBD940F44400793D1F3386609C0E09EB0BB940F4440BB5F10183A6609C0324E2FBA940F444023526E3C3B6609C09DB66CB9940F4440A53F7ECE3B6609C019ABE3B7940F44406454DCF23C6609C0274D90B5940F444048794AA93E6609C0F9E9C7B4940F4440D294793B3F6609C0A94533B3940F444025C9B85F406609C076C49AB1940F444003231784416609C05383CEB0940F44407F3B2716426609C0035400B0940F44400E7156A8426609C0F91760AE940F444069EDB4CC436609C06AF98FAD940F44402017C55E446609C0AFECBDAC940F4440EF5DF4F0446609C082E417AB940F444028F45215466609C0EBFE6DA9940F44407B9BB139476609C03A1498A8940F444038DFC1CB476609C05E3BC0A7940F4440E53FF15D486609C0A38910A6940F444036015082496609C07FFA5CA4940F4440AAD3AEA64A6609C0A5D7C9A1940F444065293D5D4C6609C0A732ECA0940F4440CBA36CEF4C6609C0A88D0EA0940F4440541E9C814D6609C07DFA2E9F940F4440CAB5EA134E6609C015D36F9D940F44401FBC49384F6609C05F4CCB9A940F44409D73F7EE506609C089F92098940F44402345A5A5526609C0663A5696940F44405A9323CA536609C090DA7095940F44406130535C546609C08F8C8994940F444058EAA1EE546609C000F0BA92940F4440F1492013566609C049B3D191940F4440880C6FA5566609C04E39FF8F940F44403C7DEDC9576609C0127467F3930F4440ADB3BAA8B96609C0	22.26	1364	Kilifi_15	\N
34	Makhanu Phase 1	7	1	0103000020E6100000010000001A000000A711500A55D5434032012EF06355DCBFCC95A3176BD4434035E36A53D653DCBF4BE3F89062D44340397C5CE3024EDCBF70081EF05BD44340283943B17149DCBFABD1D38A5AD44340D6ABA7817B48DCBF7B681A155AD4434055CBDC632A48DCBF1490367C58D44340244653A61047DCBF9DC3FC5A40D44340C19969486135DCBFDFDE38C736D4434085CEBAD8142EDCBFD513D8F53CD543405A7A7A9DE99BDBBFC5A0374F94D5434012984761566BDBBF347CFAA996D543409A72EF770B6ADBBF8941949597D543406AF81C208A69DBBF657F645DEBD54340CCE54136CCA0DBBFCC0A5C6EFAD543408F940FC7E1AADBBFD5F5A46FFAD54340748715249CABDBBF4014BF49FAD54340B1D005F921ACDBBFCD6C3334F2D54340337132301CB6DBBF6111566B98D5434077BA30064C24DCBFCE45C48474D5434028DE23391D50DCBFBC7C8C0D72D5434063514278F552DCBF548C04B86FD543400D043FCB5054DCBF4AB5E81363D54340D79AE285EC54DCBF90EBBA775DD543408A504A3F1C55DCBF3CC86CBB5CD543408D322E812255DCBFA711500A55D5434032012EF06355DCBF	267.73	7648	Garissa_34	\N
1	Embakasi	47	1	0106000020E6100000050000000103000000010000000C00000074901A88DB7442406496D68494E4F4BFFAC3EFAED374424077F11ECF79E2F4BF32C618BDDE74424096CC2759DCE1F4BFB58ABE85DF7442405568C3FA1CE2F4BF7BE589DFDF744240DA1A4DE739E2F4BF0466EC19E07442405A78D96D49E2F4BF8283FA96E0744240410CFDAE6AE2F4BFD99B7FBCEA744240458F6B691DE5F4BFA83FE18ADF744240849104D3A7E5F4BFE0B466B4DD744240D5A93CAD29E5F4BFCD67D091DC7442404B2143C3DBE4F4BF74901A88DB7442406496D68494E4F4BF01030000000100000045000000A2A85DAFDB7442407A3ECE8AE0E0F4BF458F3586DE7442406BCF11ABCAE1F4BF80508825D974424038CD134317E2F4BF6C81E56ED37442406C3B65A368E2F4BFD0888117CF74424061F54EA53EE1F4BF802CABDECC744240310B3220A6E0F4BF3EC378AAC9744240569CB735CADFF4BFE724F6B4C8744240039894023EDEF4BF4CFCBEB1C87442402F3F2FD238DEF4BF4492BDB1C87442402BB8363D35DEF4BF24F122B6C8744240FA373DB331DEF4BFFF09D4BEC87442405B340B4A2EDEF4BFEB5C9BCBC8744240D85D9F162BDEF4BF43422ADCC87442401A69AD2C28DEF4BF344DA0EEC8744240D986ADCE25DEF4BFC3CE1AF0C8744240F8C7249E25DEF4BFE946F206C9744240A742C27A23DEF4BF54122420C9744240DD1CAFCF21DEF4BFC1DA153BC9744240C8CF8CA720DEF4BFD180A2D7C9744240916B57971BDEF4BF9ABA55A1D474424014612543C2DDF4BF11F8BDBED474424091D1329FC1DDF4BF8D5196DCD474424076ADCD96C1DDF4BFD87415FAD47442405F6E8129C2DDF4BF71C67516D5744240B8457753C3DDF4BF632CF930D5744240DA12E30CC5DDF4BF5937A735D5744240FED4E27CC5DDF4BFB307EE48D5744240719C374AC7DDF4BFCB668455D57442401E6778ECC8DDF4BF6FDAB35DD574424096F673FCC9DDF4BFCB7ABF6ED574424056068811CDDDF4BFBD6D3273D57442400B674A3DCEDDF4BF6EB79E7BD5744240A880CD74D0DDF4BF0168FB83D57442406DC3910FD4DDF4BF7C68418FD574424085A6A1F3DADDF4BF222B7724D7744240D44BB0A2D2DEF4BF929C9F32D7744240817A1F4ADBDEF4BF275E513ED77442403A1A0D70E2DEF4BF743A4045D7744240221B62D1E9DEF4BFF806C842D774424015741FABEFDEF4BF6F501E42D77442407513303DF1DEF4BF3BEF0235D77442404B943E7CF8DEF4BF339E4F1ED7744240AD24A258FFDEF4BF5047ADFED6744240987E4D9F05DFF4BF424E07D7D674424063698D210BDFF4BF35F023C4D67442403645DAFD0CDFF4BFEEB884A8D6744240CD3D64B60FDFF4BF249C7F74D6744240DDE3BA3B13DFF4BF7C0C7B3CD6744240B2815E9715DFF4BFF5E640F5CC744240EE2555EF5DDFF4BF44A0DF3ECD744240328C0D3996DFF4BFE2D768AED57442405551CC7254DFF4BF037AB476D67442402685FF584EDFF4BFAD16D7DED6744240BB220C2D4BDFF4BF8F41D806D774424058E0BC5F4ADFF4BF12355B2FD7744240095103644ADFF4BF00D7E241D77442401D48A8C64ADFF4BF2A615357D7744240EDCBCA384BDFF4BF91A5B97DD7744240DD8F9AD84CDFF4BFDE3791A1D7744240133EC1384FDFF4BF9D23EEC1D774424024469B4952DFF4BFA75BFBDDD7744240DFD5F9F655DFF4BFA9A58CDED77442401999721156DFF4BFB73400F5D774424046B8A7285ADFF4BF1F256506D8744240DEB308C35EDFF4BF4EB6B711D87442400EFECEA763DFF4BFD4C8ECF0D8744240B2203217ECDFF4BFDA9FD22FD9744240C07D6C8912E0F4BFA2A85DAFDB7442407A3ECE8AE0E0F4BF010300000001000000680000007DE98D1BDD744240A4899157ABDFF4BFEC88BF72DB7442401C70C73ABBDFF4BF34068041DB7442402F056A86BCDFF4BF68E68D20DB744240AE7658B1BCDFF4BF156B3A0FDB7442404A4EECC7BCDFF4BF3F294FDDDA744240D50483FDBBDFF4BF00391CADDA7442407D38B92CBADFF4BF9E83F37FDA744240FB6D4962B7DFF4BF74A21157DA7442408163C4B1B3DFF4BF38339533DA7442405CE50735AFDFF4BFA051EF26DA744240818D03F7ACDFF4BFB0FE7616DA744240A176890BAADFF4BF7D288300DA74424054C47959A4DFF4BFE99753F2D974424045EAC6469EDFF4BF215DF4ECD97442408C852BFE9ADFF4BF1225C3E8D97442406FA42A6E98DFF4BFB962ACE2D874424037419B3AF8DEF4BF1BA048DFD7744240E8E06EAD59DEF4BFEA0EDAAFD7744240073C50AF3CDEF4BF510CF7ADD7744240140F13883BDEF4BF833F9FA7D774424041AE87A737DEF4BF92B839A5D7744240C78C8D2935DEF4BF47541EA6D7744240F33F91A732DEF4BF97D946AAD77442407B5A0C3330DEF4BFAA2F18B0D7744240A5C031572EDEF4BF954E96B1D7744240F49B1ADD2DDEF4BF538DC5BAD7744240D17FF1EF2BDEF4BF43C2D9BBD774424068B102B62BDEF4BFA7AFC9C8D77442407DD1C4CC29DEF4BF15F00BD8D77442405031B22E28DEF4BF712F36E9D7744240ED3710E726DEF4BF13D1D0FBD77442404EF4C9FE25DEF4BF4F315A0FD8744240B8F7317C25DEF4BF373511A0DA74424045EDAE591BDEF4BFE5A20E09E97442402C3310FCDCDDF4BFF69AE116E97442404B7C880EDEDDF4BF3210E6B8EB744240560FDDADD2DDF4BF7D0D332DEE744240304CC012C8DDF4BF986B412DEE74424080E8AABBC6DDF4BFF5ED67FCF5744240C6B381EFA4DDF4BFB4098729F6744240286B392CA4DDF4BF6CA08F30F6744240DF39DF0CA4DDF4BFF234E756F6744240A83734C1A3DDF4BF6E88E968F67442408F282801A4DDF4BF67E8167DF67442403A29CF48A4DDF4BFD62D04A2F6744240A6B0299EA5DDF4BFFB0FBDBCF67442404DB764E6A6DDF4BF31BEFB6F03754240B71FA5E542DEF4BF5C836A29FB74424011A2950DC6DFF4BF6A604529FB74424047C7CB7FC4DFF4BFA6122282E974424087ADE809D9E0F4BFC5EEA482E974424057651332D9E0F4BFDE481518E774424030F6E8DBFEE0F4BFD898444CE2744240180E809E49E1F4BF11215547E074424029FE3C1869E1F4BFCBF2EE23E074424029D932D06AE1F4BFFD9BC5FEDF744240E4FA03C76BE1F4BF9145DBD8DF744240FCC0FDF56BE1F4BF3A5537B3DF74424016D4D95B6BE1F4BF9647DF8EDF7442407D05C7FC69E1F4BFAF97CF6CDF744240843A4CE267E1F4BFF3E4F44DDF744240CC3F061B65E1F4BF76872533DF744240D04A42BA61E1F4BFD7BE1B1DDF744240C7DA77D75DE1F4BF525E770CDF744240C21C518D59E1F4BF60293F08DF74424046CB603158E1F4BFA45F64FBDE7442402790600D54E1F4BFF482CFE2DE7442402A6B2A224CE1F4BF4B43CDC4DE74424096467D7742E1F4BF39433764DB744240F067C4F82BE0F4BF3127CA33DB7442402168BA5F1CE0F4BF25CB941ADB7442409443974114E0F4BFDA33CD11DB744240CA5B688F10E0F4BF488D000EDB744240217F6CBB0CE0F4BFC40AB00EDB74424056ECC7A30AE0F4BF95D6430FDB744240A6DDAAE008E0F4BF21CAE710DB74424040ED9AE407E0F4BF453C8E15DB744240BB11141A05E0F4BFF278A01ADB744240B8F7807703E0F4BFF9C6B320DB744240FDC20B8201E0F4BFD68E6630DB7442407932B031FEDFF4BFEEDB3844DB7442406EB22A40FBDFF4BF1C25A05BDB744240D4BD0DC2F8DFF4BF4AD8F875DB7442403436C5C8F6DFF4BF49308D92DB744240B5581D63F5DFF4BF051687BEDB744240E18E19BEF3DFF4BFC81BCCBEDB744240D7C67ABBF3DFF4BF6F9903E8DB744240BCE4DD30F2DFF4BFCE874EC9DD744240E3BDED30E0DFF4BFF1CC56E4F5744240377DBC65F9DEF4BF3C60F2E4F57442407071D492F9DEF4BFD16860E8F6744240F60FBC11F5DEF4BF98EF6374F7744240974A69A3F2DEF4BF6463EBA4F7744240DD67B6CBF1DEF4BF802C78A1F77442406A406A9AEBDEF4BF3CBC1395F77442407B0D265CD5DEF4BF9818A088F77442409F397E93D5DEF4BFE78F506EF7744240D6CF6F08D6DEF4BF928E9A51F7744240A48C0C88D6DEF4BF29EB16ABF5744240E9F101DEDDDEF4BFD08EFF13F5744240DBA72584E3DEF4BFC072AB41F4744240AD48E36ECDDEF4BF7939BB94DF744240D08A5BA993DFF4BF7DE98D1BDD744240A4899157ABDFF4BF0103000000010000004A000000D4D02CEBC8744240C944D288F9DDF4BFAAA451D9C874424049DB06B1F8DDF4BF14F544D3C874424020B8EA67F8DDF4BF369B48BDC87442401C7DC0C5F6DDF4BFC4A4E2A9C874424026B505AFF4DDF4BF01D7A999C8744240667CF633F2DDF4BFFB461C8DC874424029BCDA67EFDDF4BFB6859B84C8744240644E7060ECDDF4BFA9A96980C874424026024235E9DDF4BFB21E8778C8744240613FC77BDCDDF4BFE2FE0175C87442408B6B90CDD6DDF4BF75908A51C8744240B65A62919DDDF4BF569AF8C9C7744240652DBFC9C2DCF4BFEC19AB6DC77442405EA614D52DDCF4BF5D9AD969C7744240F3E29EAB27DCF4BFFA498D3DC7744240A6AEEF2EE0DBF4BF0168933DC7744240576C741BDCDBF4BF1FF1AA42C774424051D5F014D8DBF4BF52CCB34CC774424030DDC434D4DBF4BF96B86E5BC774424074C75E93D0DBF4BF77DB7E6EC77442406122A147CDDBF4BF8B0A6C85C7744240218C5266CADBF4BFC6C0A59FC7744240F6B39A01C8DBF4BF99AD86BCC77442407FEF8F28C6DBF4BFEBC658DBC7744240311FD8E6C4DBF4BFA9C259FBC774424065035C44C4DBF4BF8B787EF2C87442405411D0D7C1DBF4BF4A617043C97442408D85920CC1DBF4BF3CEB4308CC744240E256CF18BADBF4BFC18FF8B1CF744240BFD75EE6B0DBF4BF2024D58DD1744240513D983BACDBF4BF245447C0D1744240AB95EFBCABDBF4BF317C9E66D2744240CDBC4A1BAADBF4BF794C5181D2744240C780B923AADBF4BF1504E48AD2744240CAAEA426AADBF4BF5C0B8DAED2744240FCAD61FCAADBF4BFAD6284D0D274424027444E96ACDBF4BF71D9C1EFD2744240B30AF6E7AEDBF4BF2673520BD3744240748A4FDFB1DBF4BF62C95F22D374424072854865B5DBF4BF648F3634D3744240DB6A795EB9DBF4BFAB044C40D3744240A27DFAABBDDBF4BF3C2C4246D37442403936542CC2DBF4BF6F311254D3744240FA84F773D8DBF4BF2E92F4BDD37442401387DE3E83DCF4BFDDAF24F9D37442402D606EB7E2DCF4BF2EDFC284D4744240FD72C10E38DDF4BFE76D6AF6D47442401A2E59877DDDF4BFFD6BBFFAD4744240C7A7F71B82DDF4BFB3BDE3F8D4744240961957B786DDF4BFEEF5E4F0D47442403A1BD0378BDDF4BF8B7CFDE2D4744240A0C57F7C8FDDF4BFCCE392CFD47442407BF2376693DDF4BF440233B7D47442409FFC62D896DDF4BFC2E68F9AD47442404597D4B999DDF4BF95C37A7AD4744240B3AC81F59BDDF4BF54F6DD57D4744240DB191A7B9DDDF4BF413F6840D474424007CE5C3D9EDDF4BF83B1F4FCD374424072DFE56BA0DDF4BF8146DADAD3744240FFA54A86A1DDF4BF2FB667A5D3744240D2FADD40A3DDF4BF5AFB200CD3744240FCBD1436A8DDF4BF54C47C25D1744240C7ECBEF3B7DDF4BF30DD60F7D0744240C5DD8D71B9DDF4BF0959FAF5D07442405194267DB9DDF4BFF804B1D1D0744240316F9FA9BADDF4BF68C0B894D0744240FFA57CA2BCDDF4BFDE7CF655D0744240E8522AAABEDDF4BFDA622EA4C9744240FB273C19F6DDF4BFDAE9FE36C9744240D1E759A1F9DDF4BF5B4D8832C9744240B9BA33B9F9DDF4BFDD8ECE1DC97442400348F427FADDF4BFAB604604C97442405EABB11FFADDF4BFD4D02CEBC8744240C944D288F9DDF4BF01030000000100000044000000BC3DCF7BD77442405FF7E5E102DEF4BF1EEE836AD77442401784D45101DEF4BF2C27815BD77442408333726BFFDDF4BFE894D152D7744240B4FEF6E0FDDDF4BFC0F92F4FD774424053610B3CFDDDF4BFED9BE645D7744240D97DEBD2FADDF4BFB80DE63FD7744240D4FCF140F8DDF4BFA37B663AD7744240061A92E4F4DDF4BFD5F0B539D7744240FCDDA878F4DDF4BFF6588194D67442400ECB677D8FDDF4BFF9871A85D67442406B325E1386DDF4BF75FFBC81D67442405E66938282DDF4BFC56A3483D6744240FDC795EC7EDDF4BFA38C9D84D674424061945C227EDDF4BF2B047689D67442408399BC6B7BDDF4BFF05A4894D6744240138AB01D78DDF4BF67107EA3D6744240C60B0F0F75DDF4BF7308ADB2D6744240B2EC63EC72DDF4BF484B85B6D67442402E6AF66172DDF4BF07C1DDCCD6744240BC6B222670DDF4BFF44CE3E5D67442400C86FB6B6EDDF4BF0222DE00D7744240B4A131406DDDF4BFD310081DD774424082E45EAB6CDDF4BFE5F42847D774424089A990416CDDF4BFB2314963D8744240CEBDFB7769DDF4BF8EDCAD84DA7442400B9A3A1E64DDF4BFC56C7AFEE1744240D881B85751DDF4BF8B38B81EE27442409213BF0651DDF4BF7025256AE7744240EB0E97BA43DDF4BF9B1652B5EC74424048EB0E6F36DDF4BF4FBFD26EED74424006CB2A9D34DDF4BFF56F3D71F4744240035227B68ADDF4BF88945648F27442408DB23FD994DDF4BF51A0752CF1744240E9D18EA499DDF4BFAD56EDAFF07442405F09B5BE9BDDF4BF5E473595F074424052662B329CDDF4BF8B2C2237F0744240E82BB3C89DDDF4BF4701E0D2EF744240E1EDF3799FDDF4BF260239CFEF7442400E4A5EB2A1DDF4BF9EB6465BEF7442402D5A9F5FA3DDF4BFB6D0ED4DEF744240784F0991A3DDF4BFAEA927D7EC744240F7A845B0ACDDF4BFEDB4B452EC744240381D9F9AAEDDF4BF2B42E686E5744240A815F2F8CBDDF4BF9B4AAE5DE57442408EE010ABCCDDF4BF0E1DC492E37442402403336AD4DDF4BF49C1296DE3744240DAE9B10CD5DDF4BFF60AD8B2E2744240E599D831D8DDF4BF0EF8ABCDE1744240AF142E10DCDDF4BF5172F8C2E1744240D4856C3EDCDDF4BF10CA4A89E07442407D51F089E1DDF4BFD976C280E0744240778ECFAEE1DDF4BFC68D040EDF7442400FB3EAF0E7DDF4BF98277EF1DE74424027DF1A6CE8DDF4BF643F0DFEDD744240467B2D88ECDDF4BFC6E0FAC2DD74424006EBDD86EDDDF4BF94208399DD74424059E0B12AEEDDF4BF40FBC963DD7442400FD6F0FEEEDDF4BFFAC13772DC7442407CC652B9F2DDF4BF1AC2AF36DC74424000267FA4F3DDF4BF5BC7A48EDB744240AA82553CF6DDF4BFEE117E5DD974424080E554E5FEDDF4BF6555CE3ED8744240BF18F95103DEF4BF917EB4CDD77442405C02EC1005DEF4BF3F326EB8D77442409294582C05DEF4BF269A4EA3D77442401A29FED504DEF4BFD609EA8ED7744240D757B61004DEF4BFBC3DCF7BD77442405FF7E5E102DEF4BF	9000	1613	Nairobi_1	\N
8	Maganda	1	1	0103000020E610000001000000120000002051170D9DD24340482E7C3C676410C0BE6FA7837DD243407CCB0322086410C073832C92FED14340A38D42E9F86110C066ACE13EFED1434054C29E8CF26110C0F187C3B418D2434005988F84645F10C066984CD91AD2434092523D24385F10C0E8EB981E78D243403E734B44DB5D10C01DE704827BD24340BC8E0ABDE35D10C0C3AA198C7FD24340C9CD0868EF5D10C0E6CB4DFED4D24340A9193752936110C0612A6017D5D2434096F3B96C966110C06E1A0EEAC1D24340B1B830668F6210C038E8AF18C1D24340AC77F7FE996210C05B1F0E05B6D243409B830984296310C0795373BBB3D2434064F39527476310C030484086B2D24340FA37CBCD566310C0B40D07AA9DD24340D67503E9646410C02051170D9DD24340482E7C3C676410C0	97	5000	Mombasa_8	\N
9	Kisumu Ndogo	1	1	0103000020E61000000100000010000000EA24FC8F0BD943406DFE84EFE02910C07315021400D943405294E948C92910C02955B0F3FCD843405F2BB9D8C22910C000D057FDF5D84340EC8ADBB5AD2910C055E91FF4F2D84340D956507EA42910C09CBEA72BC8D84340BC929E01C62810C06FD8D10ACAD84340C00331F3642710C03AEB73D9CED8434077C53922DA2610C0D1C9FD87D3D84340E7E3A67CE22610C0D69EA74DD6D84340960FE56EE72610C0FB9F5C7AD9D8434025844C74EF2610C09AE48EC0E3D84340F6BA016A092710C0BBCD1655E7D843403CBC063F252710C0039EE3F7F5D843404E298006972710C09689BB2315D94340E2B5FE4F542910C0EA24FC8F0BD943406DFE84EFE02910C0	5.99	3000	Mombasa_9	\N
14	Likoni 203	1	1	0103000020E610000001000000120000007A53988FBDD34340FBBA0A79056310C026996F90A2D343402C959FCFA06210C0C2681B08E0D34340F4556A31655A10C0F1BB9E77E1D343405257DFA5445A10C053E6637614D44340CA2F3611555910C09EFC599656D4434088D09C35125910C04BB3978259D443401BFDF2410F5910C062CE91F166D4434058EAF0C4015910C0E6AFA6DF68D4434044A456C71D5910C050177DBE75D4434064F9E29FFF5910C0A148DFF075D44340C133ABFD115A10C0B5E553EA75D443409F1097031E5A10C06F7E483E75D44340BA91D973325A10C0C158788474D443408154E2B6465A10C091095CEE55D443406AF6A553575C10C0E0A5A351F0D343403F91A9F9EA6110C0AA81E4D3CCD3434064058661C76210C07A53988FBDD34340FBBA0A79056310C0	27.55	7058	Mombasa_14	\N
18	M26 Kibokoni	3	1	0103000020E6100000010000000D000000C3B07E86210F4440EC3F46F1AA6509C03F30CB581C0F4440AF6C5342A26509C007A93C82100F4440AD24770C8D6509C0BE7A6D0B0C0F444073044A68816509C02A20A2C1FA0E44402C299C28056509C0E2484E4CFB0E4440C5EFD39ECC6409C08383C4AD120F4440CC54382AFB5E09C02EB3AF70280F4440B5025DBCFB5E09C0A346959E300F4440FB7AD10E215F09C0D7DCC3992F0F4440CB7C90A8AC6309C072337F142A0F4440AA35CF38D66409C01B8EFC94250F444087F804CE646509C0C3B07E86210F4440EC3F46F1AA6509C0	2.227	208	Kilifi_18	\N
12	Mwatate	1	1	0103000020E6100000010000001A000000D5E7D6C65ED0434028C4071C972410C088AD03475CD04340D3645B7F962410C0BEC1944F36D04340F4426B5C372410C0C171352704D04340423C981F8B2310C08DEF2DBF02D04340894C377C852310C0378A668302D043407D1D02536B2310C086A7BF4502D04340C70977C9492310C0DE8A291502D0434091E1305A2F2310C0201D93EC01D0434062BFA663F72210C0FF75ED2A02D0434050F7D8C2F32210C0C956ACF020D04340B930B613ED2110C00D1B926522D04340E0AF0921E92110C0F26CCDF13AD043403454DD01FB2110C0783282583ED0434076CD04D4FD2110C006CD073C3FD0434043B2C090FE2110C0C7BA3E3E3FD0434033CD4A95FE2110C04CD311733FD043402897E001FF2110C0224CF43A46D04340B9D66E73152210C0A58C164347D043407D9EBCEF182210C0D9ABE70848D04340009C028C1B2210C08AC667D148D04340638E5F311E2210C08AA4A7DD4BD043404FBED49E282210C069BBDF5B60D0434006734FBC6E2210C0962E197866D04340DE60F03ED62310C0C639BC2F66D04340BE2034AD582410C0D5E7D6C65ED0434028C4071C972410C0	5.99	2074	Mombasa_12	\N
13	Chaani	1	1	0103000020E610000001000000240000002DE7801482D0434042DBBDDAD62410C053FF6E4B7ED04340F2793D82CA2410C0D1733E937DD0434035408729C82410C02844318378D04340E23A9DA6B72410C0B574FF1672D04340EB1345B4A22410C0421F1BDF6FD04340A43428789B2410C0FCC362EB6BD04340F4A48C948E2410C0CCF7B8246AD04340BAA8B7C9882410C0F86F03196AD04340868E87A3882410C055F27C8468D04340C55F377C832410C0FC4DC2E866D04340E4559F2D7C2410C0CA1CE58F66D043405FBCE3997A2410C0469A150C66D04340B1080A43782410C091BE67D565D04340D30D9E4A772410C0171066AF65D04340DE87F19D762410C0D5AC6F6E63D043402454A6606C2410C0D3E70C015ED04340DCDBDE07F22210C0D63324EB5DD043400AE9B861EA2210C07D38CBE85DD04340164AE78FE92210C035620C025ED04340D479B78FA22210C0BA528B0C66D04340A31FC45A361E10C05145DC6266D043405B58488B2D1E10C0ECD237AF66D04340184909C22B1E10C09892A4BC66D04340BB46A5712B1E10C0FB6ABAB66CD043408E9351691A1E10C0DE9F5D3C86D0434039ECC652F01D10C005A9B31495D043408B13A63BF51D10C04F7C7DA897D043405D3CA5CEF71D10C0875593389BD04340A894B38DFB1D10C07B261548A0D04340AA35386A0E1E10C0DA535316A9D04340A3A9BFA6431E10C035DE454EB4D0434048882734A41E10C06FDEDF7EC5D0434006115A4D062010C0D6E27E80BBD043403293E4C5582410C0ED44AFEEADD04340AE447B53D22410C02DE7801482D0434042DBBDDAD62410C0	10.82	3729	Mombasa_13	\N
19	Jiwe Leupe	3	1	0103000020E61000000100000017000000E6F80EFA290144405158D5F215DD0AC05E574C6CE1004440A4B7847643DC0AC083899B16CD004440D8E93726C1D90AC086C424F8CC004440A9DED113BDD90AC0A8E0E8D1CC004440452C8DF7B7D90AC004605FA1CC0044405D60BEAB7CD90AC09253BF77CC0044404CD7AB5732D90AC0E077B11CE0004440B8A9373919D70AC0C62FEF1143014440A2C3829FF4D20AC032B2BCD85201444017A9028203D30AC04DC114455C0144402560B05F12D30AC08782F2F0660144406BF51A4B87D30AC0BF83DF0C65014440461B696164D40AC0D86ED6ED4A01444098F958B40CDC0AC03F3B56473E0144408F013B4973DC0AC0B7C84B523B014440DADE0A448BDC0AC05E704A40380144400B6DB929A4DC0AC098A7049D3701444065C2B155A9DC0AC00F38BEF6360144408208039AAEDC0AC0364004B83601444060436E95B0DC0AC0080E28D931014440B679C5FBD7DC0AC01DEB112B2B014440EA65C0910CDD0AC0E6F80EFA290144405158D5F215DD0AC0	12.6	1089	Kilifi_19	\N
22	Shingila	3	1	0103000020E61000000100000013000000BAC259576FEE4340A0DDB4E97C0D0DC09161241A6FEE4340B52C971D510D0DC0EA16F8256FEE4340A58FA7AB470D0DC05D8167316FEE43406D01D0893E0D0DC0E529BD3B6FEE43403599FB48360D0DC0AD676C406FEE43402CFC438B320D0DC0F1AD3D8D6FEE43401DE08632F50C0DC0778A36986FEE4340FFAE027AEC0C0DC09FA75A8175EE43404E74A1CEAF0B0DC07841F81E82EE4340997E82F1D7090DC0CAC93ED08DEE4340367B09AEDA090DC0C815C641D4EE4340F77903E3FF090DC01D77993EE0EE4340477AE4CE080A0DC095B08B7AE0EE4340584F2353F00A0DC038D06782E0EE4340452D6582C00B0DC06D878A60DFEE4340BE6A98FE500D0DC0CF8447FACFEE43409538AA795C0D0DC0613A7D5581EE4340417EA0DB7B0D0DC0BAC259576FEE4340A0DDB4E97C0D0DC0	7	545	Kilifi_22	\N
25	Dingwini	3	1	0103000020E6100000010000001200000018DE378E750E4440B1ACCE8DCB7509C009860115640E4440E69B1648BA7509C0B8F460B25F0E4440E7319586B57509C00E9FDD0B5E0E4440C2590FA7B37509C00E5AA815480E444049CEF2208B7509C0FDC383F3470E4440F84FBB66347409C030AF691F480E4440C1F4F0E7FE7309C0FD9B0362480E444079829E1CB57309C058BF54774A0E444032AC53ADF87109C040748486510E444080D72B09F47109C01AB64E27550E4440994D85ECF17109C055246E906C0E444010532571E77109C0BC253C94780E4440DF1DB2E5EC7109C065762772790E444053BD5A7DFA7109C09382554F790E4440F4E6372DAA7209C0F45D88EF780E444014D245D0337309C034ED7F6C760E4440E583473EBE7509C018DE378E750E4440B1ACCE8DCB7509C0	3.34	518	Kilifi_25	\N
28	Namu Phase 1	7	1	0103000020E610000001000000100000008BA5562FFCD343407BE107FA5B8DDEBFD3A12D06FCD34340A9FC322D428DDEBFD2C152D17BD3434014FD45EFFD34DEBFB1FD01576DD343408405B0F31B2ADEBFCA20DAD153D343409BE15196A215DEBFA55B86DF70D34340EED684A66D0BDEBF1C7701F0ADD34340F5BAE3251B07DEBF49EC8C3035D44340238E02C820FEDDBFB20BF6563AD443407F6EABA8D7FDDDBF8162F6314DD443409F9BEA20E3FCDDBFED754EDF3ED54340E3C0442D0F55DEBFB44FE6A23DD54340094A8FFE7656DEBFA36E28A732D54340BCC3B28C395BDEBFA0A0FD4A30D543408269DFB1245CDEBF85A990212ED54340BCDE1706CD5CDEBF8BA5562FFCD343407BE107FA5B8DDEBF	158.5	4928	Garissa_28	\N
29	Namu Phase 2	7	1	0103000020E6100000010000000D000000CBA9664A86D443402D7CA7BCA6EFDEBF905846CEFCD34340DDC918976D8DDEBF6708C797FCD34340B977A581458DDEBFDB7E4FD247D4434065528A13D078DEBF11E2767D49D44340CE7398AC8778DEBFCEE88D704CD4434043978F150E78DEBF23E3C7103FD54340CB5D7D1FE254DEBFE682ECE147D543407B49C8B8C856DEBF997041F757D54340C76BA96C095BDEBFDC7ADD1783D543409ABB85B69666DEBF57F2B24372D54340809FF7D732BBDEBF98B8DB6688D443403B51E8078FEFDEBFCBA9664A86D443402D7CA7BCA6EFDEBF	158.5	4928	Garissa_29	\N
32	Iskadek Phase 1	7	1	0103000020E61000000100000018000000E8C2A2E945D44340BB106A5CD5F3DDBF47D1B4B5CDD34340D895DB71C8A2DDBF2A2D9254CDD34340A2A15AA1D3A1DDBFB7C5C82BCFD34340C9F7E442AE99DDBF341362A5D1D34340ECF650352094DDBF105C4643D5D34340880EC7BDC68CDDBF9617F24021D44340F65D04FA6E27DDBFA7D0E1CB7BD44340DBA2716563B6DCBFCF9B678684D4434016B7AD4370B0DCBF950D7AEB89D44340FB5ACDE0C2ACDCBFE49912968DD443407443937E50AADCBF2793D75A9BD4434021E7C03320A1DCBF39A7E056B5D4434037351C9F8A9EDCBFA7DD5A8FC0D44340CA785B208A9DDCBF1A0CFE4CCAD443400B2F2EB1609DDCBFBEB0D790CDD443407525FD466B9DDCBF4AC2F8A006D54340EC54D9EE4FCCDCBFEF86B3F006D54340D22F3B5AECCDDCBF20AC909FE7D443408CD226CB3C76DDBF0EBD9B56A8D44340727F0309EACDDDBFCEA9432382D44340EE1588A11BEADDBFD8DD190C81D4434075E83E5563EADDBFD88DA20249D44340F6F71492CDF3DDBFE8C2A2E945D44340BB106A5CD5F3DDBF	203.41	4432	Garissa_32	\N
35	Makhanu Phase 2	7	1	0103000020E6100000010000001300000011B9F061DAD44340081F5F34649CDCBF97D44485CBD44340C9A0B6E1B89BDCBF1F4D2507C8D4434028AE3B3F5A9ADCBF72446D6670D4434074DC6903AE58DCBF1504EBA76BD44340EB1964F55954DCBFCC95A3176BD4434035E36A53D653DCBF8941949597D543406AF81C208A69DBBF0074DD0998D543407773061C4769DBBF7806BD8D9AD5434089D9090BD467DBBFFCE07C0F44D64340B794C8BCEB6ADBBF4D8D54996AD643408343ADBF4082DBBFBCDEFC2870D643406128734DA186DBBF11E0B04478D643404D2FDE17038DDBBF518989C6A1D643407A89C81AA4C0DBBFA344BD83A2D64340C3265C5FCAC1DBBF8E8B9652A7D64340C35CBDFD84D9DBBFA5DA5DAA4FD643401493DD758D65DCBF0A9685A1A5D543400C78FE0A6980DCBF11B9F061DAD44340081F5F34649CDCBF	267.73	7648	Garissa_35	\N
36	County Phase 1	7	1	0103000020E61000000100000019000000D9926D8A58D3434043B00F1D4D18DEBFAAE9FF8456D3434024B06E913A18DEBF541B36354FD34340C20450343D13DEBF595FD37C49D34340F7F15157C70EDEBFA6D32B2347D34340FBA7FE13170CDEBF071CD69546D343402D54A5BDE90ADEBF5DD6EFE745D34340AE1B14F97609DEBFC9924DA645D34340B24A4909EB08DEBFD4829A7344D34340F520C6205D06DEBFA107EC2140D34340967D70B827FDDDBF4AEF0F153BD34340D4CDFD3A63F2DDBF5245F6C93AD3434076CA311CC3F1DDBF919C38803AD343403B455FE325F1DDBFD207904539D34340C560320287EEDDBF2239CF3337D3434056D42E871DEADDBFC31438F617D343404A63B28608A6DDBF369AAD2319D343408DF4DA5296A5DDBFEF1C4B80BFD34340E5D3690EEC98DDBF33AAFBCFC0D34340C68786801C99DDBFCEC6EC9DCED3434033D224CB3BA0DDBF0D8A0776CED34340A4A66B283DA1DDBFF04DAFE7CDD343406327B430C0A2DDBFD0C05628C1D34340D82246939CBBDDBF8AD1FF379BD3434025B54B4F76F2DDBFD9926D8A58D3434043B00F1D4D18DEBF	56.31	2517	Garissa_36	\N
37	County Phase 2	7	1	0103000020E610000001000000190000004163CB025CD343406AF9C94D1013DEBFAF554A6556D34340EE4DDE9A7402DEBF85F1D37B56D343402659DD203F02DEBF2EC2484959D343408152A22E99FBDDBF60EDBFF7CBD3434097A265AC9BA3DDBFBD5DF6C0CDD34340B1BCBEF6BDA2DDBF0472B26EF7D3434098DD5F8126ADDDBF137FBE76F9D34340122F2DC011AEDDBFD2CBDD07FBD34340D55BA733C7AEDDBF48BBF683FBD34340B6446C071CAFDDBF865B8F11FCD34340E567C2D17CAFDDBF4C9E878C3AD4434037F0E8AF11DCDDBF971F4CDB3BD443404598E0EE0BDDDDBFC91290B03CD44340591E97E81ADEDDBF9A6B512F3DD443403D4FCFF6BBDEDDBFB37A1B193FD443400BA6004B2AE1DDBF59414D1E3FD443408209434131E1DDBF15017D943FD4434087F006AECFE1DDBF289FC04F40D44340C700CFF523E3DDBFC0B8089640D44340FA8BBDABA3E3DDBF7B11466841D44340870B5A866DE5DDBF607B11514AD44340BE30AE3D62FCDDBFDD46E87949D44340022FC16F03FDDDBF5D0F1D6349D443408E39688314FDDDBF4163CB025CD343406AF9C94D1013DEBF	56.31	2517	Garissa_37	\N
39	Kathita	14	1	0103000020E610000001000000130000004BD5241744B94240D1B7D145B7FDE0BFC86725A542B94240597794238AFDE0BF41F11C093BB942404419C4D258FAE0BF0C7A345C30B94240638745DEA2F1E0BFC9F56CA329B942406F15C3C526ECE0BF111C497927B942401C32209C62EAE0BF777A9AA542B94240C1281B1BBFE6E0BF87D70D7847B942406AB7E4CD19E6E0BF21A524074FB942401814B3AE16E5E0BF02AF8A5151B94240584D4629C8E4E0BFCA3EA6A556B94240CDE0EAF135E6E0BF7CB1954F61B9424056B266FA11E9E0BF4B438CA466B94240F9FC40FF7FEAE0BFF704373D69B9424094373D3B32EBE0BFACF1A17F60B94240414EFD88EEF9E0BFD8BCD17C5FB9424020F4EA8E55FAE0BF3947A13256B94240C05F2311F4FBE0BF00378DB050B9424054A310527DFCE0BF4BD5241744B94240D1B7D145B7FDE0BF	5	1000	Embu_39	\N
40	Kimangaru	14	1	0103000020E61000000100000039000000A21B639657C34240C20E30B5B987E1BF322BF46EF6C242408F8AF31ADF7FE1BF68A17C72F6C242409CABDFF2D87FE1BFABFC5C77F6C24240FDD048E4D07FE1BF0663C87CF6C2424079B2B74EC87FE1BF62897182F6C24240E14280ADBF7FE1BF0C9A8C88F6C24240FF3D60B5B67FE1BF46611F8FF6C242406559255CAD7FE1BF15A44C96F6C2424009661577A37FE1BF88970E9EF6C2424043560B0B997FE1BF9A3910A6F6C242402B2A71908E7FE1BF627D65B5F6C24240827BAE0E7B7FE1BF9B045DA4F7C2424032D61B0D4C7EE1BFACCA17B1F7C24240F4E839093C7EE1BFB4B321BEF7C24240665B63E22B7EE1BF9B25E2CAF7C242400C8E70561C7EE1BFBB0FE8D7F7C24240BF096ABC0C7EE1BF99473AE4F7C24240B53E2D36FE7DE1BFBF4F55F1F7C24240E2CE6E08EF7DE1BFB00496FDF7C242403B86B019E17DE1BF63F63E0AF8C24240308D15F4D27DE1BF3AF7F07DF8C2424028DADABC537DE1BF98BC2B8AF8C24240B23F9B65467DE1BF3FFC2195F8C24240E033C8A33A7DE1BF92B8FCA3F8C24240FC0019102B7DE1BF74E392B1F8C2424035D5EF401D7DE1BFD79EA5BEF8C24240C2876769107DE1BFE02ABACBF8C2424018C66007047DE1BFF92667D2F8C24240ADBA9AE7FD7CE1BF953655D6F8C24240BB828560FA7CE1BFE0D353D9F8C24240B71A87B0F77CE1BF91657AE0F8C24240A8945F6BF17CE1BFDB4152EAF8C242406DBD2410E97CE1BF80D767F4F8C24240B549F8C3E07CE1BFE12B66FEF8C2424043B2A5E1D87CE1BF53513C0BF9C24240B7E35F28CF7CE1BFC3063718F9C24240F3B8B3D0C57CE1BF8FC8BD24F9C24240D811293EBD7CE1BF0768B431F9C24240C3F70AD0B47CE1BF3E55DF46F9C2424045FD689BA77CE1BF7DD1F557F9C2424085DCAA199D7CE1BF75ECAC67F9C24240D96F0690937CE1BFD73CEE76F9C242400BC7416F8A7CE1BF3A98A285F9C24240AD5371C5817CE1BF788F0D94F9C242401FF0486A797CE1BFCC4811A219C34240BBA4EDB0046AE1BF432E14711FC3424040A0A8BC5169E1BF8FACED6D23C34240EC8E4EE2D668E1BF16582D6E34C34240482A367C5E67E1BFDF50010B35C342404D5096AA5C67E1BF37BE3339B2C3424030890885826EE1BF0A71BE26B2C342403FC4E69DE16EE1BF3A2A1A08B2C34240B560C66A456FE1BFFABCB4C0AFC34240925263434C76E1BF57692573ADC3424031CA4B372E7BE1BF2E5729C19EC342405A17C82DD97DE1BFA21B639657C34240C20E30B5B987E1BF	16.97	398	Embu_40	\N
41	Gatitu	19	1	0103000020E610000001000000190000009C5370ABBF7F42408E0C412FE275DDBF2B23C396B27F42400BE4E5E2C873DDBFCB2A7F49AE7F42403923B404F672DDBFE4FE77138B7F42406B8449CFCD69DDBF2CF8BAC5817F42406A9BA4341466DDBF9282C24C727F4240F844CB4DE25FDDBFACA4ADF1587F4240A197C8CEED4DDDBFDFD16E5F597F4240BC6D3A1C1B4DDDBFF5C4ABB2747F4240693D7AD25142DDBFA719C577A67F4240E961186DAC2EDDBF17106877A97F424022805787842DDDBF6ABE28CBB67F424028580F926928DDBF58B36CCAC27F42402DB1F00ADE23DDBFDCB93D3BC47F4240E9D41203C523DDBFF362B42AC77F42404D5221313125DDBF042ABE32CC7F4240D2612669A127DDBFE450175FD17F42403EEBFB39232ADDBF00B056B2D57F4240522C4ED43B2CDDBFEFF65F8AEE7F42407B866DA8073DDDBF2716064DF27F4240A3366826D83FDDBFAEA8EEE7068042405598492D444FDDBFE0BA94E706804240B54AF155C151DDBF64B53828ED7F4240D8CDEAEE2760DDBF231AD891DB7F42408CBD8A8B8E68DDBF9C5370ABBF7F42408E0C412FE275DDBF	19.9	1015	Nyeri_41	\N
43	Kihuyo	19	1	0103000020E610000001000000090000003AC994161C7442405B79D49DD6CCD8BF1957D2AC837342405D64BD0F1FA5D8BFFB8BE1E5E67342403E3AC795138CD8BF6020DF63F2734240BF570E275889D8BF190D4E711974424013EF77254D8FD8BFDC087AF52274424092BCF2C1C090D8BF8BDEBB3F2C7442402EE954892B92D8BFAB3E72CE2D744240F2849E186FBAD8BF3AC994161C7442405B79D49DD6CCD8BF	12.8	220	Nyeri_43	\N
46	Gitathini	19	1	0103000020E610000001000000170000002B5D1C822B77424083AC713AA3F2DBBF7DFBC6BE3B764240998984AD3BDFDBBF8BEF39332E76424058979BF647D7DBBFC01E20662D764240B23C1E8D6DCADBBF550C525B2D764240F979D9804CC9DBBF6262715C2D7642401E874E0DB2C6DBBF6363D75C2D76424028268B6BC7C5DBBF74560A3F2E76424090CBABB954C5DBBF61BABC0665764240B32FE8406FC4DBBF29CC7A600A77424039C26B6B4CCFDBBFF800DF00117742404A7B6F14C3CFDBBFFBF7E8841A774240E0F2AB86E4D0DBBF633519B31D7742404A73B98456D1DBBF09295CB621774240BC42DE57E6D1DBBFBA258C87247742402FFE48EB5CD2DBBFA8944B72277742406F32E67301D3DBBFB77918452A774240D8663FB6A0D3DBBF739FE1B42B7742405F163443FDD3DBBF3A9BFE4F31774240248D806666D5DBBF3BA2AFC43477424081F01989A8D6DBBF16FC4EFE34774240611DC3D349D7DBBFD80122543077424000EDAAB0CAEFDBBF2B5D1C822B77424083AC713AA3F2DBBF	18	485	Nyeri_46	\N
47	Gitero	19	1	0103000020E6100000010000000C0000008046317BCF77424035E460731DD7DCBFD89C710ACE774240489F53327BD6DCBFDF1B19F6CB7742403FE33AF2B9CADCBFCC018A92C9774240DAB47BE938BDDCBF2055E3C3CA774240FEE7F8C2A7BCDCBFDFCD9537347842404EF32ED47CC1DCBFE05212953578424039E75ACD2AC2DCBF07FA93C235784240A5AAF8650CC5DCBFE1824708367842400AF00C2A76C9DCBFA22130B93678424085445CCAA9D4DCBF996CDD703578424076776EF359D5DCBF8046317BCF77424035E460731DD7DCBF	6.56	216	Nyeri_47	\N
48	Chorongi	19	1	0103000020E6100000010000001100000083FFAE9BAC7B4240E58D30E9B8A6DCBF873F096CAB7B4240D362DC7F83A6DCBFBB2B3259A27B4240FB0E62C0309DDCBF8B1DCD5C987B4240DC305604EE92DCBF05C2C4E79B7B4240FAF1328AB28ADCBF4A40A1C69C7B4240E5ED0762158ADCBF1CB01E00BB7B42408B44B8FD5D82DCBF56E51E42BC7B42402E83A6AA6982DCBF2F16F953C37B424029570BE2EA84DCBF84832835CC7B4240F31DD9411088DCBF28585BE0CE7B4240AC3E3FCB1E8ADCBF90F0A12CD47B4240216922732490DCBF65A8995DDD7B4240549A7507979ADCBF1C8EE7ECDC7B42400D4151D02F9BDCBF8FE49326C07B4240375C6C7E0EA2DCBF1D092F5CB67B4240CFD890E264A4DCBF83FFAE9BAC7B4240E58D30E9B8A6DCBF	4.13	147	Nyeri_48	\N
49	Kiamwathi	19	1	0103000020E6100000010000001A000000405D19AF967A42402CC628A92DB2DCBFDB927CEF807A4240C05201B6059EDCBF7409FA8F817A42405FED5F559D9BDCBF241FB192827A4240CDC81CBCBB97DCBF5A2601F4837A424069B00CD86E92DCBF332BCA5E917A4240FCBDFBDF9792DCBF2665BFBDCB7A4240E95DCF822994DCBF46B4DB30D87A424043B4F1C1A394DCBF314C2516D97A424005CEF58DAC94DCBF656FE441DA7A424059B9B0A12095DCBFB4DD5DB4DA7A42408C03C0FAC595DCBF6ACD3154DB7A4240F528C144BB96DCBF6F97FCE1DB7A4240E418ED59B397DCBF44937E8BDC7A4240231831DEF198DCBFA4E8B3DEDC7A424009953C239699DCBF56D8137FDD7A4240BE683EF4109BDCBF3F4DF58CDD7A424005F21272379BDCBFFCA5472ADE7A42400DD155BBF29CDCBF8CB0ED54DE7A424055B35DE76A9DDCBFE4C6F2CADE7A42400BEB4328F99EDCBFCC29D3E8DE7A42401547D4DA819FDCBFDC4E380BDF7A4240568E23CE2EA0DCBF26AD0D2FDF7A42409D4B11A103A1DCBF431D4D40DF7A4240B482FF1D97A1DCBFF298E51DDD7A42404E3F511744AADCBF405D19AF967A42402CC628A92DB2DCBF	12.38	231	Nyeri_49	\N
52	Miiri	19	1	0103000020E6100000010000000900000049EEC85131954240696320AB1BD5DEBFCD14A6620F954240BAF694A076C9DEBFEDDB945F1095424066BE30B945C5DEBFCED6B20D119542400A838CE4F4C3DEBFA011972112954240C7759E2FDFC1DEBF9F47F6F53B954240606482883DBFDEBFC2EF161040954240B01F97CCB8D4DEBF440FE1823C95424082DFD79DD0D4DEBF49EEC85131954240696320AB1BD5DEBF	3.34	116	Nyeri_52	\N
31	Bulla Riig Phase 2	7	1	0103000020E61000000100000011000000C467CB231FD343407D6635D1C105DCBF253B1ED315D24340AD7C9B824D01DCBF33BCE40313D243407074FF7BD9FFDBBFD26D1CFE12D24340CBF0A27DD6FFDBBF3C47A6B713D243406071F71BADCADBBF32BFE9242ED34340A9E9BFC11032DBBF371930DB3BD343401E5AFA00692FDBBF61D73AFCA0D4434003AA020226EBDABF3D736507B6D4434078E30E94CCE8DABF7A155A51C8D443407247C302C2E6DABF628B5D7804D5434084D9E3FCC40CDBBFF546C8766CD54340B11E8E403C51DBBFEF2BE87A6CD54340494B3CCF6751DBBF853235836AD54340167D97EAB352DBBFE3B2A53A5DD54340BC2E723D825ADBBFD151850054D34340DC2677AB8AFDDBBFC467CB231FD343407D6635D1C105DCBF	351.42	13343	Garissa_31	\N
44	Riamukurwe	19	1	0103000020E6100000010000000C0000005F6FCC5AB97C424095A63DF304C4DCBF810592B7B77C4240C4A6D6C675C3DCBF9A9571178A7C4240089E6A91E48FDCBF5AFF174D8A7C4240D607161F8D8DDCBF3CCCDFF2CD7C42406289F71F4676DCBF9CD107F2F67C4240F6FBC1724F7CDCBF9467AA48F97C4240776051DE037FDCBF962E6376037D4240B7FEA22A7296DCBFAC109496037D4240DFB5F1202997DCBF47832F68FB7C4240B75E87F1F0A5DCBF53ACDB3FF87C424087999D05AEA7DCBF5F6FCC5AB97C424095A63DF304C4DCBF	12.5	480	Nyeri_44	\N
56	Kanjora	19	1	0103000020E610000001000000130000006C6E721DB770424090642752C14FDABFA8CD5FE47C70424018633440BC4EDABFD4833F427C70424091354CDD044ADABFF7407F207A704240FE726CCF0C39DABFD4DB34C877704240F2CFD0D09222DABF2D1DD1ED77704240479733B17C1EDABF38C705507F70424042D97A8F3B1DDABF30DB6E3683704240681C0DD6D51CDABF85ECB437877042404D9E83837F1CDABF48506D3B9F70424099529DBB771BDABF7F58EB9CAA704240E2268606881BDABFC635A9E2AC704240268F6839A91BDABF4D5EDCEDC07042406DF18DEC8524DABF81C8D2D9C1704240FE50C759F724DABF8C40B15EC770424099990BDF174EDABF5283E88FC6704240B20DE14A9A4EDABF44BF68F8BF7042407B0B856C1A4FDABF70F3D55DB77042402049BE97BC4FDABF6C6E721DB770424090642752C14FDABF	9.07	184	Nyeri_56	\N
58	Ihwagi	19	1	0103000020E6100000010000000D0000002059A3EDDA924240749170F903A6DCBF872A6FD5B492424037D54E796EA0DCBFF8C3ADB5A6924240DC018956E39ADCBF36E74408A692424008DEB27F5E9ADCBF2FED844EA5924240639A8DC0F38BDCBF56A27039D69242404AFD72D7BF74DCBFF3069A71D792424007E645447174DCBF02EE3574F49242407361703C6D77DCBFF1B5DF9DF4924240277C2E878177DCBFB906BCBCF4924240BBD0028F9077DCBF70898172F59242407B450B17E977DCBFDF609C21FF9242403392581FA284DCBF2059A3EDDA924240749170F903A6DCBF	5.62	172	Nyeri_58	\N
60	Umoja	22	1	0103000020E6100000010000000E000000F46705043D8F42408453394227D7F0BF7B979D2A3A8F4240D992DF651CD7F0BF1F9EB540328F424018ED03C9F6D6F0BF9F415BC9D38E42404011FD45F2C8F0BF7AE1D863F88E4240DA1431E6B4C1F0BF69160F87178F424026E2CB8815C9F0BF9D9247892C8F424042EAAE3C53CEF0BFC01796C32D8F4240CAE8F6F7A4CEF0BF24219ED8328F4240687A994CF7CFF0BF40A135FD338F424070F9D5F143D0F0BFB2D592BA358F4240EC1B5E11D8D0F0BF1753216D368F4240CADCE27752D1F0BFEC4E7DDB378F4240FABEB19D4DD2F0BFF46705043D8F42408453394227D7F0BF	4.83	1752	Kiambu_60	\N
61	Kasarani A	32	1	0103000020E61000000100000021000000CF196FF41BE741404F1F9EE56133D3BFF01930F655E641408C86BB1F15ECD2BF14C91EA453E6414030BA34AA8FE2D2BF561D8B0350E64140DAB11D6153D1D2BF65DE1E2C4FE64140F1546AF427CCD2BF8C744BA74CE641400CE8193A55BBD2BF2ECD36214CE64140C1044830BFB7D2BF83F25B2F4CE641400763CF7467B6D2BF8E04BB9975E641401675CF55E976D2BF32AE3B1C76E641403AC6850D2B76D2BF9C8B8DB87AE64140677AF2930270D2BFC9E0908886E64140B88C77A6706AD2BF178E3E008DE64140823F1DE08467D2BF616D181A9EE64140B489FBE5EB63D2BF2AE07390A5E641407BF03DB37663D2BFD844EE27AFE64140C6BEB7070863D2BFAB9C5070B6E641408723A0240863D2BF59130038C0E64140C7FE992DB963D2BFDA39E1FAC2E641401DEF65D80A64D2BF9E2B3ED1CAE6414017F2F7FAA065D2BF192E727EDAE64140D687F8FB426BD2BFB82B83E4DBE64140C66562A8EF6BD2BF582C210AE6E6414054E87FCCC472D2BFA1B2F358E7E641402368F018BF73D2BF23E591BF68E7414067426E88ADDBD2BF5D9F04AA6AE74140A519F4EC15DFD2BF85F9E71A6DE74140050B5185FDE3D2BFB8DD5E416EE74140BE14E8B5DAE7D2BFE92B478771E74140E751481D62FDD2BF505865C36FE7414084482AB7A002D3BF479F43CD6CE741409A86EEE5F307D3BF2954B95556E741403DB04109112FD3BFCF196FF41BE741404F1F9EE56133D3BF	109.44	17881	Nakuru_61	\N
62	Kasarani B	32	1	0103000020E6100000010000000A000000F3876B5F56E641400AB5CB853316D3BF23C4B7B37DE54140D9CDDC791C04D3BF1E34142FA7E54140BCD48E4AE6A5D2BF4DB8F61649E6414041C4516D6EB4D2BFB8D1867B4AE64140CE8C2A0B7CBAD2BFC6539C344BE64140310C51F876BED2BF9F0A154D51E64140C78F98E2DAE0D2BF798F885453E64140491AE9A203EED2BF0EFB8D2C59E64140C5088109A715D3BFF3876B5F56E641400AB5CB853316D3BF	109.44	17881	Nakuru_62	\N
63	Eastleigh	32	1	0103000020E610000001000000120000008C4A3D2C51E74140C452F3D830FAD3BF00DBD8CA82E64140AA70B450CDBAD3BFAD682BE375E6414059E3729026B1D3BF2B21BFFE73E6414056E0F4A49DAFD3BF18B796956CE6414091B085CB8AA9D3BFD5BCA1C66BE64140BACCE8A7D5A8D3BFE426673079E64140010D49034589D3BFB1EBAE108EE641407EAD3F14FA81D3BFC7E2047F94E641406909D309E87FD3BF9D0DE28365E7414010EFCB049157D3BF3F2B330D67E741405F80FCF50358D3BF73F89EA17EE741406605BE2E2667D3BF203DBAB287E74140AB7B1146566DD3BF761BA56788E74140694676E06EA1D3BF9A2ED81B81E7414072AF497F0DB6D3BF01D6E22164E741408C5F94ADD8F6D3BF29A014735AE7414000584BB2A5F8D3BF8C4A3D2C51E74140C452F3D830FAD3BF	44.76	5798	Nakuru_63	\N
65	Keringet	32	1	0103000020E610000001000000210000004BD0539C0ED941402FBC14C5E26EDBBFB669E1DB06D941406D13F42D5B6EDBBF0684EFA8F4D84140C5668CD91C6DDBBF75F0F294EED841400CB69FCFAB6CDBBFD4ED3709EAD841409301CB44576CDBBFE5AF8963E6D84140CE6A6170136CDBBFB0ED06CFE2D84140EF5249DBD06BDBBF9C6D1C67DFD841403ED88D83916BDBBFE2F6BCBDDBD8414021A1766A4D6BDBBF19034044D8D84140B626ECCB0C6BDBBFA125FAB7D4D84140F58705D0CA6ADBBFBAD979F0D0D841400DC39986846ADBBFD5FA2F8DCDD841407CCDE984456ADBBF0522929FC8D8414029EE92DDE969DBBFE9F19085BFD841408266DC354069DBBF3C26D4E6BCD84140327CC7F90C69DBBFA8B841B6B7D84140A0B1EC7DA768DBBF7F560474B2D841407DE992A84068DBBF40D7BD83B1D84140C0C30D4E2E68DBBF89DA82B6AED84140B124CE84F767DBBF83CD6AB9ACD841406CC79FE9D466DBBFBE28ECF98CD8414063855E68874EDBBF043B235388D84140649A95DB794ADBBFDEB6A6B588D841401513D4A5B648DBBFDE41783291D841404E3E0F108727DBBF9DE18EBA92D84140FEAED906F026DBBF692B76AFF2D841405BBA5428C026DBBFBE76849002D941402F6FD232CC26DBBF20AC049030D941408AF85DF9E24DDBBF7AADA05313D941409504FB97226BDBBFFBC14F6312D94140622B573E076CDBBF1BFF0DB40FD94140FA65A5F8926EDBBF4BD0539C0ED941402FBC14C5E26EDBBF	19.42	1502	Nakuru_65	\N
66	Kongasis	32	1	0103000020E6100000010000000C000000C3BF0E4B3F13424038ADE01E5DC5E1BFA6A23B9F2F134240E8981CC6FFBFE1BF0168069F2F13424006149BB3FFBFE1BF0C1AD4B437134240F25B081BDEABE1BF44C48E203D1342401E51EB1A6F9EE1BFF588F34850134240EE6700AD299EE1BF52C14F37B813424087DFA83B959DE1BF99844B9AB9134240D89DD9B7D29DE1BF223468AEBC1342404305E3703DA0E1BF6A8244ADD6134240E629EC56A9B4E1BF52D0838FD51342407677510C3DB5E1BFC3BF0E4B3F13424038ADE01E5DC5E1BF	21.6	1440	Nakuru_66	\N
68	Hill school	27	1	0103000020E6100000010000000D0000003497B3C0F4A241405E618C738C18DF3F88F34C5EF0A24140F534AD40A119DF3F69C6A7DA6DA241405A484436D139DF3F73EF94136DA24140864BEECE043BDF3F6B89581D92A24140091AA22ECF64DF3F3BF317B094A24140164786436467DF3F7CB235BB99A24140715F4F82736CDF3F5DFB6BAAE0A24140F9DF1D0A8A5ADF3F962AFF7425A341401493C8182B49DF3F98BC60FE1EA3414002EB34CE6D42DF3F6C415B6417A341404B51E9D2803ADF3F349C3C95F7A2414042E2E7905719DF3F3497B3C0F4A241405E618C738C18DF3F	16.19	4000	Uasin Gishu_68	\N
69	Maili Nne	27	1	0103000020E6100000010000000B000000BA665F95F19D4140D4A8E785F907E23F0A74C6F48F9D4140261F12F68414E23FE52058538B9D41406415BFBB1016E23FD7F5164AA39D4140ABC3F45B652AE23FBD1A7054C89D4140704934C1F736E23F800942B8CE9D414002FF4AFFAE38E23FD5BAAE96259E4140EED51E6FDB21E23FF392167F259E4140C15542A77421E23FF3FDBBBC159E4140140FC083190DE23FBC018B13FB9D4140D309D8025209E23FBA665F95F19D4140D4A8E785F907E23F	9.99	1283	Uasin Gishu_69	\N
71	Swahili Village	35	1	0103000020E6100000010000000F0000000BA5116806A34140D7E1B90D77A4D7BF58E633FA01A341403BCC8DC72BA3D7BFC5F6180DF7A24140F904F78FFA9FD7BF48AE1951D3A24140AD02869AA17FD7BF32327D15D3A2414086BD33536D7ED7BF7E021F89DDA2414045A16E70C774D7BF6732FF34E1A241408BD564CC6571D7BF79906C48F0A241408806CCA28463D7BF783AB43AF7A241405CCEE0941F5DD7BFC3B9EA7800A34140E3CE56501C59D7BFFB24340009A341402381831FD75CD7BF854F092930A34140F755CBFBC980D7BF6B0D152521A34140790C48C5779BD7BF45E94F6515A341408D1F90DB6B9FD7BF0BA5116806A34140D7E1B90D77A4D7BF	7.7	2338	Kericho_71	\N
72	Majengo Talai	35	1	0103000020E61000000100000015000000315C4824A7A441405482AAECD81AD7BFBD6309E264A441407445052A760AD7BF8301812C64A441407E5590E1EB09D7BFC93BA6D561A441408934B4B12308D7BF32A49B9D5BA44140B965260C1703D7BF467B411A7BA44140CD0E7B06C3FCD6BF2E872046B9A44140936819CB7EF1D6BFEEA6C2D568A541401DD5E5986CDCD6BF51DFF0A969A54140E518D7C45ADCD6BF9C5E17546CA541406B00CF7321DCD6BF54168AF66DA54140635E0A4BFEDBD6BF7C1CB9E472A5414006FAF23D94DBD6BFCCC73DC077A54140971C50C32BDBD6BFFA619DF57CA5414048742DD835DED6BFD01CA324AAA54140CF12A7C7F5F8D6BF919CE7C3A9A54140C24EA3E1B1F9D6BFEA9063667CA54140246E8CF4FC03D7BF9880A05B75A541405AA90EBE4A05D7BFF6F661506EA54140E8E0F49C9806D7BF1FCA9DA850A541402D9178C0150CD7BF315C4824A7A441405482AAECD81AD7BF	23.12	772	Kericho_72	\N
73	Bondeni	42	1	0103000020E610000001000000140000002D3E80AD5899414095DBAEA32DCAC3BF6C0E716D34994140C8716ED03AC6C3BFB0B4E3C2249941407779BDE4A6B1C3BF27911C0820994140177EE26652ABC3BFCE89507D279941406007F930EB99C3BF98CF493859994140C7B713E4EA45C3BF874BA33F6899414008DF8B980B3DC3BF70F5C3F370994140F1FB6E2DBD38C3BFC7FA4A38799941400AB1189C0A3CC3BFE5A1FF0E7E994140BA279EB6D13EC3BFFA6C1728839941408C19E0906C42C3BF47187005879941406A7C30E6D745C3BFCA7A6E458A9941402DB4D8A73349C3BF3947289793994140C8CC89875155C3BFEB4DCD5FA6994140CB4FF6F1F489C3BFDFF88F06AF994140F5E9B67133A2C3BF06D40E1081994140DDE0643379C2C3BF9F00E6F079994140E6798DC07AC4C3BFCD4B944966994140C5D1DE29DAC9C3BF2D3E80AD5899414095DBAEA32DCAC3BF	13.36	1500	Kisumu_73	\N
301	Shauri Moyo	42	1	0103000020E6100000010000000D000000EBE7EA02829A414008C956D5C130C4BFABCFD5F5149A41404045EA48AC25C4BF2CD5A7BAFF99414059F910DEA1D1C3BFBB95C986009A4140A2A17A40EBCFC3BF47D5CA35189A41406A07044031C7C3BFB9A0D55B3C9A41402CBF8449DACAC3BF47D4AE1AA09A41406135CA987AFDC3BFE8653B9E9F9A414013011910E305C4BF1CE89C4E9F9A4140426077E3A90AC4BF6BDA88FF9D9A41408D01DA93C60DC4BF3388C7D59C9A41407669F792E90FC4BF42175C86899A41409916458B7128C4BFEBE7EA02829A414008C956D5C130C4BF	37.75	850	Kisumu5	\N
77	Shauri Moyo	42	1	0103000020E61000000100000023000000458A6014049A41403100C9DA3EB9C4BF33826CDB019A4140A9FDE2F095B8C4BFB7753145FA9941406ED26B4D55B6C4BF21CA6ECAE99941400E7BFAC570B1C4BF5E760B6AE1994140D0D6631DF4AEC4BFE759E5D6DB9941402ED3A0664CADC4BF98535A0DBF9941409641D16AC0A4C4BF7068321AB4994140E30C432C80A1C4BFE6E5AE268D994140C7A8BEABEF95C4BF39FDF88F6399414028B31EB49689C4BFBE55AFCC52994140148CA9A29C84C4BF69BBAEB62E994140B41F47E7E579C4BF5BF2E4461C9941409DBCEA9C6C74C4BF7B8C3B4EF4984140BBACB5908E68C4BFA9995C5FE49841402DEFE88ED363C4BF98164757E6984140B08958147D57C4BF3599B525C4994140F0A45AB4F23DC4BF740FBC58CC9941403813CB4A1A3DC4BF0B5CC48BD4994140D79A3EE1413CC4BF7C1A6602DC99414098D6F5E47C3BC4BF4EC1EDECE1994140ED97CF5D623BC4BFA1494E46EB99414022DF37FE523BC4BF1FFE004AF7994140880D0F030D3CC4BF4C2C79ED059A414059505298063EC4BF904111C10F9A4140280F63470940C4BF4E8B86D31D9A41404661E400CA43C4BF5C0F2B80339A4140404CF19BE74BC4BFA7C3E8E1349A414001604D4E994CC4BF23DA53703B9A414062FDCB693D50C4BF6D924613519A41400CC36F306C5CC4BF402D539C4D9A4140393B19A9FE6CC4BF6B9BFFD3399A41401749C7528E84C4BF68DD9CB4319A41409C19D5BE848CC4BF51B58463089A4140F0AB8D7305B5C4BF458A6014049A41403100C9DA3EB9C4BF	37.75	850	Kisumu_77	\N
54	Giakaibei	19	1	0103000020E6100000010000000F00000023061B1229944240251F67F83CBDDABFC3F31F691E94424092B62A0373B9DABF0E39BFEF08944240BA0F00E5FFA9DABFA8B24F102A944240861E9AB25188DABF19253CF667944240A404C038EC5CDABF3083F34F9D944240C0017E137564DABFE8216E3AB194424088C822312668DABF31ADA7E6B194424067FA3E82BD68DABFA7656BE2AE9442409072DA673571DABF74BF7A85A994424095762BA04380DABF55200F09A7944240758DAE383E87DABFFD2873FFA59442400B20BCD9278ADABF6884E5658F944240ABE62982F894DABF4BE8783E2A944240A36B869B29BDDABF23061B1229944240251F67F83CBDDABF	16.19	57	Nyeri_54	\N
76	Kaloleni	42	1	0103000020E610000001000000160000001AE238B1546241405711B8C0156DB9BFD2747D9251624140B0EF42D0D66CB9BF6C4B735A306241409E8DCB8C2B60B9BF0BE380081B624140226065ADC131B9BFF87502C7FB6141409763FD8416B2B8BF11F0B7FAFC6141407753CE74CBA9B8BF7E563F610262414047CE74A7BC9FB8BF6B8AB143066241403DCFAFA38098B8BFD579604008624140B81DB34CCD94B8BFE74F31140962414022BB64D84293B8BFBF0D86BB296241403D921F85F778B8BF9F3DD8563C624140F901CF6F6883B8BF36CE48564A624140FDE8C5557A95B8BFE1472ADE4B6241408F29C9BFD899B8BF6E4190574C6241402BCA173A339BB8BF78FF97CE4E6241401BA8B3473CA2B8BFAF88C3614F6241409E2D7256E0A3B8BF7A445B4F57624140E16A2D50DAC1B8BF52A96998716241401ECC02B9A833B9BF968F1ADE7062414099814D31A538B9BFC62FBA7D566241406AC54FB0BC69B9BF1AE238B1546241405711B8C0156DB9BF	7.25	3000	Kisumu_76	\N
78	Kopere	42	1	0103000020E6100000010000000E0000008D233426079741405F3C69D79B1CA5BF94116236DB964140316BF53052F5A2BF57DCA69FD39641405057FE14153AA2BF1A772CAB58974140F7116FB49ABAA2BFFFA1025C5E97414043AFA01F58C0A2BF9EAA2792669741405591096DA0C8A2BF8FC99D3567974140FED9ED2C26C7A3BFDA7B96CB679741405EF7811385BEA4BF2D12F2936797414050BD0CF321CBA4BF632474365D97414013F0881D54D4A4BF34C0D13658974140FC1F97F09BD8A4BFCA89F15055974140150193F712DBA4BF62A3EF7D42974140EB8C27B015EBA4BF8D233426079741405F3C69D79B1CA5BF	21.25	1708	Kisumu_78	\N
80	Mjini	37	1	0103000020E6100000010000000E00000090242BEDCD3E41400B3066B6B024D53F03ABCD1EC93E4140EC3BC4F76926D53F95B367B3BC3E414001EC187F562BD53F57B6E943BC3E4140C70AEBFF832BD53FEA655C2B693E41405533A93C9050D53F0B8CA57E703E4140937EF8527A5BD53FE733F0709A3E4140AF07D966085BD53FC187A2839A3E4140D843D4DB055BD53F3529BECD9A3E414054C42F1BFB5AD53F5F7D451CF73E4140D2033C7B3E4CD53F9054C9030A3F4140483CC1D96045D53F4DE53EC10A3F4140F67D7E985243D53FD8F3964EF63E41404601CFBCF932D53F90242BEDCD3E41400B3066B6B024D53F	8.4	1123	Kakamega_80	\N
81	Amalemba	37	1	0103000020E6100000010000000F0000000328529C5E6041402EB0FFCBC61BD13F5CCB525A5D6041403FE17823711CD13FBE970B59586041401D47239F0833D13F942C9980596041407271F0693736D13FE7F23E1A6F60414026D33A52543ED13F44BB139074604140A8D101D33F3ED13F4B33483B896041408AE477A2383DD13FC0916C21D76041406BB6C96F782ED13F5BDF18C7D76041406A63058FA92AD13F1A30188DD76041409F7DFD098026D13F40594489CD60414051809BB7901CD13F771B6A0CCC6041408FBAAA10D11BD13F5E379FDEAD6041400B0A773BCE1BD13F708A1DE5696041404B889CDAC71BD13F0328529C5E6041402EB0FFCBC61BD13F	3.5	2500	Kakamega_81	\N
82	Mweiga	19	1	0103000020E6100000010000002A000000EE00A05CD273424039D8B194F6ADD4BF5EFAA053CF7342401E60B17FF5ADD4BF6414A904CA7342406B2DBFF3B1ADD4BFD0ADB4B1B5734240B426B157AFACD4BFF6621404AB734240260D257827ACD4BF79191404AB7342406365217827ACD4BFBEA1E28B2B734240B8AFB2DDA48BD4BF75D45DCA11734240831348F5F182D4BF22670DE80D734240F8726D7A7A81D4BF48240FB71A734240FB460D4AD968D4BF5BB47E731D7342402F379B3CB766D4BF9018C5681E734240E165D808F865D4BFC07B2D85527342406F6C79246245D4BF0A18F1B252734240E56F0AA64C45D4BF1E0971E652734240B5DD50BE3A45D4BF42DF77DD557342409DCEBE414044D4BF96148132567342404EEE54B62E44D4BF5D2C60FBA173424058D2105B443AD4BF64211B51A273424005AA954F4B3AD4BF76C66DCDA3734240639CC9AE753AD4BFF831B018A473424062CEB75E803AD4BFDA91F590A5734240A61639E7C13AD4BFA8213ED1A573424048356936CF3AD4BFAA48DD3FA77342408C5FA7FC273BD4BF95331475A77342409BAAB8CF363BD4BFC20152D4A8734240954AE08DA63BD4BF4A3ABAFEA8734240C04A24D1B53BD4BF3857DC48AA7342404561F9E43B3CD4BF965E0F69AA734240D4251A934A3CD4BF32507398AB7342407A093DFDE53CD4BF0A3A5BAFAB734240F3DB7C25F33CD4BFBFCC8DBEAC734240945E268AA23DD4BFF4945DCDAC734240583C1A56AD3DD4BF3C3732B7AD734240FA6055FF6E3ED4BFC9935CBFAD7342409F28FEB7763ED4BF3445047FAE734240802E6099483FD4BF3B243182AE734240968389AB4C3FD4BFE6805113AF734240371E32672C40D4BFF9FD01ADE473424033CE92F7BAA2D4BF547632CBE17342403D9805ED40A5D4BF8333594ED8734240B8732C9954ADD4BFEE00A05CD273424039D8B194F6ADD4BF	19	2500	Nyeri_82	\N
\.


--
-- Data for Name: settlement_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settlement_status (id, settlement_id, no_dwelling, pop_density, ave_hh_size, ave_room_occupancy, ave_plot_size, avg_living_area, prop_permanent, prop_semi, prop_temp, avg_cost_perm, avg_cost_semi, avg_cost_temp, prop_avail_piped_water, dist_piped_water, prop_other_water, prop_conn_elec, prop_conn_other_elec, avg_mon_income, prop_hh_perm_income, prop_hh_income_home, prop_renting, prop_lpg, prop_firewood, prop_kerosene, prop_biogas, prop_elec, avg_mon_rent, hiv_prevalence, prop_food_aid, prop_female_hh, prop_child_hh, main_hazard, hazard_freq, dist_urban_centre, survey_status, encumbrance, ownership, land_owner, occupation_duration, mode_occupation, date_report) FROM stdin;
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
1	2_kenya_county_map.pdf	socio_economic	./public/2_kenya_county_map.pdf	2	Report
2	2_KENYAN_LOGO.png	socio_economic	./public/2_KENYAN_LOGO.png	2	Report
3	2_comments_FM.docx	socio_economic	./public/2_comments_FM.docx	2	Report
4	160_0_Lot_1_Project_Completion_Report_V02_26-06-2020.docx	survey_plan	./public/160_0_Lot_1_Project_Completion_Report_V02_26-06-2020.docx	160	Map
6	1_Activities.docx	socio_economic	./public/1_Activities.docx	1	Report
7	1_socio_economic_report_2019.pdf	socio_economic	./public/1_socio_economic_report_2019.pdf	1	Report
9	1_lpdp.jpg	ldpdp	./public/1_lpdp.jpg	1	Development Plan
\.


--
-- Data for Name: sewer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sewer (id, name, ownership_type, owner, length, number_connections, settlement_id, geom) FROM stdin;
1	Embakasi Sewe	100	EMba	4	3	1	0102000020E610000003000000ACF19F11417542408031600501D2F4BFD4943F38487642400069B003E5BBF4BF485B74CBCF75424000E0594E3AA5F4BF
2	Embaka2	200	nanana	2	4	1	0102000020E6100000030000001C312F2EB9794240C0AEFC6F7362F4BFC8B15030D1794240C0AEFC6F7362F4BF542BB874E379424000F43ACB1461F4BF
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
1	1
9	1
10	1
11	1
12	1
14	2
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, name, email, county_id, password, isactive, phone, "resetPasswordToken", "resetPasswordExpires", avatar) FROM stdin;
2	jane@gmail.com	Jane	jane@gmail.com	8	$2a$08$6G8VibAju4O0D6daiQLz3uP7.opWQvOz0R6tKMOV6NFBauzX1jSj.	f	\N	true	2022-11-03 19:04:08.986+03	\N
1	felix.mutua@gmail.com	Felix Mutua	felix.mutua@gmail.com	1	$2a$08$qRAT9wUQw2aVcrBx7Y9toeKb9hIDVlOuRZfQ36MuFFaOWyfK7AZRy	t	254721770339	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjY5MTEzNjc4LCJleHAiOjE2NjkyMDAwNzh9.39iTymTWngRJYOzryXmGIF8y17EFmpdHI4IBXDDlPkE	2022-11-23 13:41:18.047+03	\N
\.


--
-- Data for Name: water_point; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.water_point (id, name, type, capacity, depth, ownership_type, owner, catchment, price, settlement_id, code, geom) FROM stdin;
1	kwa matangi	\N	3	5	\N	onwer	\N	\N	1	c4d1671a-9d32-4968-95bf-4562b38ba6ce	0101000020E610000038CEBF900C63424000D865B48BB1C4BF
2	Kwa oloo	\N	2	123	\N	Oloo	\N	\N	1	d331d619-d249-4b77-a902-0532ba50d47f	0101000020E6100000A8EC1B0A18774240C0FDF37890C1F5BF
3	water_point	\N	\N	\N	\N	\N	\N	5	1	7	0101000020E6100000245B6855D5744240F342F64230DEF4BF
4	water_point	\N	\N	\N	\N	\N	\N	5	1	11	0101000020E610000062076F67ED74424006EFF62851DFF4BF
5	water_point	\N	\N	\N	\N	\N	\N	0	1	13	0101000020E61000005D7F73A0FE744240BB9915A6EEDFF4BF
\.


--
-- Data for Name: wetland; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wetland (id, name, settlement_id, status, geom) FROM stdin;
\.


--
-- Data for Name: xbeneficiary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.xbeneficiary (id, name, national_id, kra_pin, hh_id, photo, address, intervention_id, settlement_id, intervention_phase, benefit_type_id) FROM stdin;
1	Abdi Ali Isaak	4389049	NA	1	\\x4e41	NA	69	69	1	1
34	David Kiplangat Kipsang	1448838	NA	34	\\x4e41	NA	69	69	1	1
35	David Kunusia	13613215	NA	35	\\x4e41	NA	69	69	1	1
36	Dennis Simeon Odinga	10840510	NA	36	\\x4e41	NA	69	69	1	1
37	Dinah Chebet	10937286	NA	37	\\x4e41	NA	69	69	1	1
38	Dinah Chemase	20960766	NA	38	\\x4e41	NA	69	69	1	1
39	Dominic Andole Mwimani	14552392	NA	39	\\x4e41	NA	69	69	1	1
40	Dorcas Akou Munyes	12424194	NA	40	\\x4e41	NA	69	69	1	1
41	Dorcas Masese Isrita	300709	NA	41	\\x4e41	NA	69	69	1	1
42	Edward K. Chesingil	20043374	NA	42	\\x4e41	NA	69	69	1	1
43	Edward Kemboi Chesingil	20043374	NA	43	\\x4e41	NA	69	69	1	1
44	Elijah Kipkoech Sugut	20697153	NA	44	\\x4e41	NA	69	69	1	1
45	Eliud Kipchumba Keen	27917947	NA	45	\\x4e41	NA	69	69	1	1
46	Eliud Kipkoech Lagat	13202352	NA	46	\\x4e41	NA	69	69	1	1
47	Elizabeth Chepkemboi	563405	NA	47	\\x4e41	NA	69	69	1	1
48	Elizabeth Matsitsa Mwangi	13205654	NA	48	\\x4e41	NA	69	69	1	1
49	Elphas Kipkemboi Ngelechei	7444365	NA	49	\\x4e41	NA	69	69	1	1
50	Emily Jepkemboi Misoi	3264274	NA	50	\\x4e41	NA	69	69	1	1
51	Eric Morara Orina	12898637	NA	51	\\x4e41	NA	69	69	1	1
52	Ernest Kibet	1221030	NA	52	\\x4e41	NA	69	69	1	1
53	Esther Kalunda	22548355	NA	53	\\x4e41	NA	69	69	1	1
54	Esther Ngelel	5602280	NA	54	\\x4e41	NA	69	69	1	1
55	Eunice Njambi Gitau	1230027	NA	55	\\x4e41	NA	69	69	1	1
56	Eunice Wandia Kavinya	20655808	NA	56	\\x4e41	NA	69	69	1	1
57	Eunice Wangoi	8627569	NA	57	\\x4e41	NA	69	69	1	1
58	Fatuma Adan Ali	21301442	NA	58	\\x4e41	NA	69	69	1	1
59	Francis Anari Nyanumba	1634687	NA	59	\\x4e41	NA	69	69	1	1
60	Francis Karanja Kianda	320245	NA	60	\\x4e41	NA	69	69	1	1
61	Francis Kibagendi Mogute	2980079	NA	61	\\x4e41	NA	69	69	1	1
62	Fred Welch Muleshe	9871955	NA	62	\\x4e41	NA	69	69	1	1
63	Getrude Mutoro Wanyonyi	23955645	NA	63	\\x4e41	NA	69	69	1	1
64	Gidion A. Maiyo	3265936	NA	64	\\x4e41	NA	69	69	1	1
65	Gladys Moraa Nyachieo	12877095	NA	65	\\x4e41	NA	69	69	1	1
66	Go For Restoration Of Truth	CHURCH	NA	66	\\x4e41	NA	69	69	1	1
67	Goretty Akinyi Ochieng	13206168	NA	67	\\x4e41	NA	69	69	1	1
68	Grace Colleta	6086699	NA	68	\\x4e41	NA	69	69	1	1
69	Haron Luvisia Makokha	13434856	NA	69	\\x4e41	NA	69	69	1	1
70	Hassan Owgiro Wissack	HASSAN OWGIRO WISSACK	NA	70	\\x4e41	NA	69	69	1	1
71	Hellen Chepkoech Chepkwony	5452746	NA	71	\\x4e41	NA	69	69	1	1
72	Hellen Chepkoechchepkwony	5452746	NA	72	\\x4e41	NA	69	69	1	1
73	Hellenathulumutanda	1899914	NA	73	\\x4e41	NA	69	69	1	1
74	Hellenzipporah Willey	997310	NA	74	\\x4e41	NA	69	69	1	1
75	Henry Kirwa Sambai	1449808	NA	75	\\x4e41	NA	69	69	1	1
76	Hilda Ayuma Samwel	726175	NA	76	\\x4e41	NA	69	69	1	1
77	Hussein Mohamed Muhamud	23875691	NA	77	\\x4e41	NA	69	69	1	1
78	Ibrahim Adanbatelo	3253487	NA	78	\\x4e41	NA	69	69	1	1
79	Ibrahim Aden Ali Dika	23510780	NA	79	\\x4e41	NA	69	69	1	1
80	Ibrahim Edin Konre	1449338	NA	80	\\x4e41	NA	69	69	1	1
81	Ibrahim Hussein Farah	11651948	NA	81	\\x4e41	NA	69	69	1	1
82	Ibrahim Ibrenrobow	9567956	NA	82	\\x4e41	NA	69	69	1	1
83	Ibrahim Wafula Khatete	2086220	NA	83	\\x4e41	NA	69	69	1	1
84	Isaac Adan	838101	NA	84	\\x4e41	NA	69	69	1	1
85	Isaac Kiptepis Chemrokok	5791478	NA	85	\\x4e41	NA	69	69	1	1
86	Isaac N. Njuguna Kimengi	3463082	NA	86	\\x4e41	NA	69	69	1	1
87	Ismael Issak Ibren	12755957	NA	87	\\x4e41	NA	69	69	1	1
88	Issack Hussein Abdula	ISSACK HUSSEIN ABDULA	NA	88	\\x4e41	NA	69	69	1	1
89	Jacob Kipsang Arap Yego	21341278	NA	89	\\x4e41	NA	69	69	1	1
90	James Michori Maina	846866	NA	90	\\x4e41	NA	69	69	1	1
91	James Wathika Gituro	1446766	NA	91	\\x4e41	NA	69	69	1	1
92	Jane Maru	3444018	NA	92	\\x4e41	NA	69	69	1	1
93	Jane Njeri Kaniaru	9252376	NA	93	\\x4e41	NA	69	69	1	1
94	Japheth Kittur Chemaiyo	5303326	NA	94	\\x4e41	NA	69	69	1	1
95	Jaqueline Mukungu Maina	20939812	NA	95	\\x4e41	NA	69	69	1	1
96	Jeniffer Toiyoi Toroitich	3541848	NA	96	\\x4e41	NA	69	69	1	1
97	Jepkurgat Birgen	5300202	NA	97	\\x4e41	NA	69	69	1	1
98	Joel K. Kotutwo	3322434	NA	98	\\x4e41	NA	69	69	1	1
99	Joel Rotich Chirchir	9570345	NA	99	\\x4e41	NA	69	69	1	1
100	John Alex Bore	235238	NA	100	\\x4e41	NA	69	69	1	1
101	John Kimathi Muriuki	11490396	NA	101	\\x4e41	NA	69	69	1	1
102	John Makau Ofisi	977607	NA	102	\\x4e41	NA	69	69	1	1
103	John Masisa Olwanyi	1444297	NA	103	\\x4e41	NA	69	69	1	1
104	John Ogola Okumu	433424/63	NA	104	\\x4e41	NA	69	69	1	1
105	Joseph Chesire Chemuna	4342878	NA	105	\\x4e41	NA	69	69	1	1
106	Joseph Kamau Toro	16064310	NA	106	\\x4e41	NA	69	69	1	1
107	Joseph Kipchumba Kigen	10704708	NA	107	\\x4e41	NA	69	69	1	1
108	Joseph Kiptoo Ruto	8626254	NA	108	\\x4e41	NA	69	69	1	1
109	Joseph Ngetich Langat	6424953	NA	109	\\x4e41	NA	69	69	1	1
110	Joseph Wafula	12878478	NA	110	\\x4e41	NA	69	69	1	1
111	Josephat Kiptarbei Kirwa	253278	NA	111	\\x4e41	NA	69	69	1	1
112	Joshua Kipsang Kibiego	4901812	NA	112	\\x4e41	NA	69	69	1	1
113	Josiah Nyamohanga Kerario	2827045	NA	113	\\x4e41	NA	69	69	1	1
114	Josphine Kerubo	303108	NA	114	\\x4e41	NA	69	69	1	1
115	Joyce Jeruto Kipkore	9865394	NA	115	\\x4e41	NA	69	69	1	1
116	Judith Nabwile Nyongesa	11328244	NA	116	\\x4e41	NA	69	69	1	1
117	Julius Kadima Lanya	6877189	NA	117	\\x4e41	NA	69	69	1	1
118	Julius Kiprop Mosbei	23997064	NA	118	\\x4e41	NA	69	69	1	1
119	Julius Maina Mathenge	723426	NA	119	\\x4e41	NA	69	69	1	1
120	Julius Mwangi Njuguna	726825	NA	120	\\x4e41	NA	69	69	1	1
121	Justus Muriuki Marimi	1234420	NA	121	\\x4e41	NA	69	69	1	1
122	Kalist Ouma Wasike	1226785	NA	122	\\x4e41	NA	69	69	1	1
123	Kennedy Josephat Okonda	10840544	NA	123	\\x4e41	NA	69	69	1	1
124	Khadija Adan Abdi	11193974	NA	124	\\x4e41	NA	69	69	1	1
125	Kimuikey Jonathan Magut	1811331	NA	125	\\x4e41	NA	69	69	1	1
126	Kipkering Arap Keino	1251715	NA	126	\\x4e41	NA	69	69	1	1
127	Kipkosgei Murei	1228408	NA	127	\\x4e41	NA	69	69	1	1
128	Kiprop Philemon Kandie	10376643	NA	128	\\x4e41	NA	69	69	1	1
129	Kiprotich Bitock	1228142	NA	129	\\x4e41	NA	69	69	1	1
130	Kipserem Mutai	1451739	NA	130	\\x4e41	NA	69	69	1	1
131	Leah Jepkemoi Chumo	1279781	NA	131	\\x4e41	NA	69	69	1	1
132	Lucas Barasa	585690	NA	132	\\x4e41	NA	69	69	1	1
133	Lucy Wanjiro	6861967/69	NA	133	\\x4e41	NA	69	69	1	1
134	Luka Kipkoech Bitok	9991259	NA	134	\\x4e41	NA	69	69	1	1
135	Luka Leiyeyo Ole Roimen	10403958	NA	135	\\x4e41	NA	69	69	1	1
136	Maimuna Kakenyankinangaei	9252409	NA	136	\\x4e41	NA	69	69	1	1
137	Marcella Jebatia Kibet	9839874	NA	137	\\x4e41	NA	69	69	1	1
138	Marcella Jebutia Kibet	9839874	NA	138	\\x4e41	NA	69	69	1	1
139	Margaret Njeri Gaithuya	5783344	NA	139	\\x4e41	NA	69	69	1	1
140	Margaret Wambui	839018	NA	140	\\x4e41	NA	69	69	1	1
141	Margaret Wambui Michori	839018	NA	141	\\x4e41	NA	69	69	1	1
142	Margaret Wanjiku Nyuri	1934526	NA	142	\\x4e41	NA	69	69	1	1
143	Mariam Barkale	24009107	NA	143	\\x4e41	NA	69	69	1	1
144	Mary Anyango Mukele	261498	NA	144	\\x4e41	NA	69	69	1	1
145	Mary Chepchirchir Choge	839527	NA	145	\\x4e41	NA	69	69	1	1
146	Mary Nanjala Kayanda	4144676	NA	146	\\x4e41	NA	69	69	1	1
147	Mary Nasmiyu Simiyu	5737822	NA	147	\\x4e41	NA	69	69	1	1
163	Nasambu Rose Wilfrida Ogola	258223	NA	163	\\x4e41	NA	69	69	1	1
164	Nelley Chepchirchir Kebenei	23666910	NA	164	\\x4e41	NA	69	69	1	1
165	Nelly Chepchirchir Kebenei	23666910	NA	165	\\x4e41	NA	69	69	1	1
167	Oliver James Guto	11792847	NA	167	\\x4e41	NA	69	69	1	1
168	Pamellah Toto Papai	4213176	NA	168	\\x4e41	NA	69	69	1	1
169	Patrick Wachira Gitura	12473272	NA	169	\\x4e41	NA	69	69	1	1
170	Paul Kipyego Kosgei	1230441	NA	170	\\x4e41	NA	69	69	1	1
171	Paul Kivisi Musanga	1170732	NA	171	\\x4e41	NA	69	69	1	1
172	Paul Kosgei Kutto	6846836	NA	172	\\x4e41	NA	69	69	1	1
173	Paul Ronoh Kurgat	8333364	NA	173	\\x4e41	NA	69	69	1	1
174	Peter Kirwa Kebenei	1108234	NA	174	\\x4e41	NA	69	69	1	1
175	Peter Wabwire Okuku	10121546	NA	175	\\x4e41	NA	69	69	1	1
176	Philip K. Kosgey	21617017	NA	176	\\x4e41	NA	69	69	1	1
177	Philip Kipkemei Murei	1233584	NA	177	\\x4e41	NA	69	69	1	1
178	Philip Kipketer Kosgei	21617017	NA	178	\\x4e41	NA	69	69	1	1
179	Philip Mulogosi	7968673	NA	179	\\x4e41	NA	69	69	1	1
180	Pius Wamalwa Munialo	976253	NA	180	\\x4e41	NA	69	69	1	1
181	Rachel Muthoni Gacheru	12948021	NA	181	\\x4e41	NA	69	69	1	1
182	Regina Jerotich Kemboi	12878784	NA	182	\\x4e41	NA	69	69	1	1
183	Robert Tinega Zakayo	407460	NA	183	\\x4e41	NA	69	69	1	1
184	Ronald Kipkech Kipterei	13069317	NA	184	\\x4e41	NA	69	69	1	1
185	Sadia Hussein Ali	1182928	NA	185	\\x4e41	NA	69	69	1	1
186	Saine Kimeli John	10761914	NA	186	\\x4e41	NA	69	69	1	1
187	Salima Mohamed Hassan	25953310	NA	187	\\x4e41	NA	69	69	1	1
188	Sammy Mirikau Mukolwe	1228691	NA	188	\\x4e41	NA	69	69	1	1
189	Sammy Ndiema Kalinjonya	27815172	NA	189	\\x4e41	NA	69	69	1	1
190	Samson Kipkosgei Tuwei	3295383	NA	190	\\x4e41	NA	69	69	1	1
191	Samuel Kiplel Kirwa	11121582	NA	191	\\x4e41	NA	69	69	1	1
192	Samwelwaruguwanyoike	10183470	NA	192	\\x4e41	NA	69	69	1	1
193	Sarah Cherono Cheruiyot	1237386	NA	193	\\x4e41	NA	69	69	1	1
194	Sarah Imbogo	9169424	NA	194	\\x4e41	NA	69	69	1	1
195	Sarah Jeruto Sammy	6860030	NA	195	\\x4e41	NA	69	69	1	1
196	Sefania Salambo	8715817	NA	196	\\x4e41	NA	69	69	1	1
197	Shadrack Kingetich	20337474	NA	197	\\x4e41	NA	69	69	1	1
198	Shaphan Lunani Makunda	8837489	NA	198	\\x4e41	NA	69	69	1	1
199	Simeon Agwata Nyamagwa	304333	NA	199	\\x4e41	NA	69	69	1	1
200	Simon Kipkemboi	4638347	NA	200	\\x4e41	NA	69	69	1	1
201	Simon Kitum Chemweno	1225750	NA	201	\\x4e41	NA	69	69	1	1
202	Sofia Anyango Ogutu	14453703	NA	202	\\x4e41	NA	69	69	1	1
203	Solomon Ihachi Chibelenje	57670882	NA	203	\\x4e41	NA	69	69	1	1
204	Stephen Angwenyi Nyamweya	10013600	NA	204	\\x4e41	NA	69	69	1	1
205	Stephen Koech	13206399	NA	205	\\x4e41	NA	69	69	1	1
206	Susan Arua Chuma	12642986	NA	206	\\x4e41	NA	69	69	1	1
207	Susana Jelamai Mutai	8327224	NA	207	\\x4e41	NA	69	69	1	1
208	Teresa Chemenjo Lelei	3999338	NA	208	\\x4e41	NA	69	69	1	1
209	William Kiprop Ronoh	11604311	NA	209	\\x4e41	NA	69	69	1	1
210	William Ndinya Omollo	1097291	NA	210	\\x4e41	NA	69	69	1	1
211	William Omweri	6117612	NA	211	\\x4e41	NA	69	69	1	1
212	William Wanjohi Mureithi	7456816	NA	212	\\x4e41	NA	69	69	1	1
213	Willymina Ngaira Magotsi	5632689	NA	213	\\x4e41	NA	69	69	1	1
214	Wilson K  C  Chelimo	6597192	NA	214	\\x4e41	NA	69	69	1	1
215	Wilson K. Rono	12464743	NA	215	\\x4e41	NA	69	69	1	1
216	Wilson Kimosibei Ngisirei	6857261	NA	216	\\x4e41	NA	69	69	1	1
217	Wilson Kiptanui Ronoh	12464743	NA	217	\\x4e41	NA	69	69	1	1
2	Abdikadir Shiekh Mohamed	5071335	NA	2	\\x4e41	NA	69	69	1	1
3	Abdullah Hassan Haji Hussein	5964784	NA	3	\\x4e41	NA	69	69	1	1
4	Abraham K. Chesire	4125821	NA	4	\\x4e41	NA	69	69	1	1
6	Achilles Kimurgor Ngeny	5932469	NA	6	\\x4e41	NA	69	69	1	1
7	Aden Ali Dika	1232826	NA	7	\\x4e41	NA	69	69	1	1
8	Agnes Wanini Kaniu	2338898	NA	8	\\x4e41	NA	69	69	1	1
9	Alfred Matundura Mochere	25065871	NA	9	\\x4e41	NA	69	69	1	1
10	Ali Adan Osman	1232667	NA	10	\\x4e41	NA	69	69	1	1
11	Ali Ahmed Warsama	134906	NA	11	\\x4e41	NA	69	69	1	1
12	Ali Hassan Isack	27671099	NA	12	\\x4e41	NA	69	69	1	1
13	Anastasia Jepngetich Masai	11605041	NA	13	\\x4e41	NA	69	69	1	1
14	Anjalina Kanda Rotich	3138704	NA	14	\\x4e41	NA	69	69	1	1
15	Anorld Maswai Ngeywo	1156124	NA	15	\\x4e41	NA	69	69	1	1
16	Bahati P. Ag. Elijah	BAHATI P. AG. ELIJAH	NA	16	\\x4e41	NA	69	69	1	1
17	Bernard Kipkoech Langat	24172010	NA	17	\\x4e41	NA	69	69	1	1
18	Berry Auma Yuaya	5981073	NA	18	\\x4e41	NA	69	69	1	1
19	Bishar Omar Mohamed	20935326	NA	19	\\x4e41	NA	69	69	1	1
20	Boniface Pepela Matofari	10747462	NA	20	\\x4e41	NA	69	69	1	1
21	Catherine Ipaliopagala	4384977	NA	21	\\x4e41	NA	69	69	1	1
22	Charles Chonjo Makokha	22575998	NA	22	\\x4e41	NA	69	69	1	1
23	Charles K. A. Ruto	12553722	NA	23	\\x4e41	NA	69	69	1	1
24	Christine Chepketer Barno	8762878	NA	24	\\x4e41	NA	69	69	1	1
25	Clement Kharunda Siahi	10659532	NA	25	\\x4e41	NA	69	69	1	1
26	Clement Kibirgen Serem	723044	NA	26	\\x4e41	NA	69	69	1	1
27	Daniel Kipchirchir Koros	1226151	NA	27	\\x4e41	NA	69	69	1	1
28	Daniel Liyula Muliru	DANIEL LIYULA MULIRU	NA	28	\\x4e41	NA	69	69	1	1
29	Daniel Ngetich	877620	NA	29	\\x4e41	NA	69	69	1	1
30	Daniel Tiliareng’ Kibowen	336891	NA	30	\\x4e41	NA	69	69	1	1
31	David Berech Kebenei	6578457	NA	31	\\x4e41	NA	69	69	1	1
32	David Karanja	847843	NA	32	\\x4e41	NA	69	69	1	1
33	David Kipkoech Cherus	9604644	NA	33	\\x4e41	NA	69	69	1	1
148	Mary Wanjiku	1446626	NA	148	\\x4e41	NA	69	69	1	1
149	Mathew Kibet Kimurua	287818	NA	149	\\x4e41	NA	69	69	1	1
150	Maxwell Misoga	20005587	NA	150	\\x4e41	NA	69	69	1	1
151	Milca Ogolla	1232405	NA	151	\\x4e41	NA	69	69	1	1
152	Milka Toroitich Lutia	283556	NA	152	\\x4e41	NA	69	69	1	1
153	Mohamed Abdi Osman	13004986	NA	153	\\x4e41	NA	69	69	1	1
154	Mohamed Ali Ego	16078279	NA	154	\\x4e41	NA	69	69	1	1
155	Mohamed Alioido	1450336	NA	155	\\x4e41	NA	69	69	1	1
156	Moses Arap Yego	3937265	NA	156	\\x4e41	NA	69	69	1	1
157	Moses Kamau Wangari	25282290	NA	157	\\x4e41	NA	69	69	1	1
158	Moses Kemboi Kiprono	1785730	NA	158	\\x4e41	NA	69	69	1	1
159	Moses Kemboin Kiprono	1785730	NA	159	\\x4e41	NA	69	69	1	1
160	Moses Kipsang Murei	448736	NA	160	\\x4e41	NA	69	69	1	1
161	Mwangi Njoroge Bahati P. Ag. Elijah	725677	NA	161	\\x4e41	NA	69	69	1	1
162	Nahashon Kiptum Samoei	22455986	NA	162	\\x4e41	NA	69	69	1	1
166	Nelson Adeya Kisali	11167521	NA	166	\\x4e41	NA	69	69	1	1
218	Yegon Dominic Kipngetich	22415513	NA	218	\\x4e41	NA	69	69	1	1
219	Zacchaus Omai Juma	22767364	NA	219	\\x4e41	NA	69	69	1	1
5	Hassan Adanabdi	10760454	NA	5	\\x4e41	NA	69	69	1	1
\.


--
-- Name: beneficiary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.beneficiary_id_seq', 483, false);


--
-- Name: beneficiary_id_seq1; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.beneficiary_id_seq1', 1789, true);


--
-- Name: beneficiary_parcel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.beneficiary_parcel_id_seq', 1055, true);


--
-- Name: benefit_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.benefit_type_id_seq', 8, true);


--
-- Name: cluster_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cluster_id_seq', 3, true);


--
-- Name: county_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.county_id_seq', 47, true);


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

SELECT pg_catalog.setval('public.education_facility_id_seq', 73, true);


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

SELECT pg_catalog.setval('public.health_facility_id_seq', 69, true);


--
-- Name: households_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.households_id_seq', 3341, true);


--
-- Name: intervention_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.intervention_type_id_seq', 1, false);


--
-- Name: interventions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.interventions_id_seq', 286, true);


--
-- Name: landuse_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.landuse_type_id_seq', 1, false);


--
-- Name: lot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lot_id_seq', 10, true);


--
-- Name: other_facility_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.other_facility_id_seq', 4, true);


--
-- Name: ownership_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ownership_type_id_seq', 1, false);


--
-- Name: parcel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.parcel_id_seq', 579, true);


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
-- Name: road_asset_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.road_asset_id_seq', 2, true);


--
-- Name: road_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.road_id_seq', 36, true);


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

SELECT pg_catalog.setval('public.settlement_id_seq', 401, true);


--
-- Name: settlement_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settlement_status_id_seq', 1, true);


--
-- Name: settlement_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settlement_type_id_seq', 1, false);


--
-- Name: settlement_uploads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settlement_uploads_id_seq', 9, true);


--
-- Name: sewer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sewer_id_seq', 2, true);


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

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: water_point_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.water_point_id_seq', 5, true);


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
-- Name: benefit_type benefit_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.benefit_type
    ADD CONSTRAINT benefit_type_pkey PRIMARY KEY (id);


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
-- Name: education_facility education_facility_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.education_facility
    ADD CONSTRAINT education_facility_code_key UNIQUE (code);


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
-- Name: health_facility health_facility_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.health_facility
    ADD CONSTRAINT health_facility_code_key UNIQUE (code);


--
-- Name: health_facility health_facility_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.health_facility
    ADD CONSTRAINT health_facility_pkey PRIMARY KEY (id);


--
-- Name: households households_national_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.households
    ADD CONSTRAINT households_national_id_key UNIQUE (national_id);


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
-- Name: other_facility other_facility_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_facility
    ADD CONSTRAINT other_facility_pkey PRIMARY KEY (id);


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
-- Name: road_asset road_asset_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.road_asset
    ADD CONSTRAINT road_asset_pkey PRIMARY KEY (id);


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
-- Name: settlement settlement_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement
    ADD CONSTRAINT settlement_code_key UNIQUE (code);


--
-- Name: settlement settlement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement
    ADD CONSTRAINT settlement_pkey PRIMARY KEY (id);


--
-- Name: settlement_status settlement_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement_status
    ADD CONSTRAINT settlement_status_pkey PRIMARY KEY (id);


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
-- Name: water_point water_point_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.water_point
    ADD CONSTRAINT water_point_code_key UNIQUE (code);


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
-- Name: xbeneficiary xbeneficiary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.xbeneficiary
    ADD CONSTRAINT xbeneficiary_pkey PRIMARY KEY (id);


--
-- Name: household_pkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX household_pkey ON public.households USING btree (id);


--
-- Name: intervention_pkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX intervention_pkey ON public.interventions USING btree (id);


--
-- Name: settlement_pcode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX settlement_pcode ON public.settlement USING btree (code);


--
-- Name: water_facility_pkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX water_facility_pkey ON public.water_point USING btree (id);


--
-- Name: beneficiary beneficiary_benefit_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary
    ADD CONSTRAINT beneficiary_benefit_type_id_fkey FOREIGN KEY (benefit_type_id) REFERENCES public.benefit_type(id) ON UPDATE CASCADE;


--
-- Name: beneficiary_parcel beneficiary_parcel_beneficiary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary_parcel
    ADD CONSTRAINT beneficiary_parcel_beneficiary_id_fkey FOREIGN KEY (beneficiary_id) REFERENCES public.beneficiary(id) ON UPDATE CASCADE;


--
-- Name: beneficiary_parcel beneficiary_parcel_parcel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary_parcel
    ADD CONSTRAINT beneficiary_parcel_parcel_id_fkey FOREIGN KEY (parcel_id) REFERENCES public.parcel(id) ON UPDATE CASCADE;


--
-- Name: beneficiary_parcel beneficiary_parcel_settlement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary_parcel
    ADD CONSTRAINT beneficiary_parcel_settlement_id_fkey FOREIGN KEY (settlement_id) REFERENCES public.settlement(id) ON UPDATE CASCADE;


--
-- Name: beneficiary beneficiary_settlement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary
    ADD CONSTRAINT beneficiary_settlement_id_fkey FOREIGN KEY (settlement_id) REFERENCES public.settlement(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cluster cluster_lot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cluster
    ADD CONSTRAINT cluster_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lot(id) ON UPDATE CASCADE;


--
-- Name: education_facility education_facility_settlement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.education_facility
    ADD CONSTRAINT education_facility_settlement_id_fkey FOREIGN KEY (settlement_id) REFERENCES public.settlement(id) ON UPDATE CASCADE;


--
-- Name: health_facility health_facility_settlement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.health_facility
    ADD CONSTRAINT health_facility_settlement_id_fkey FOREIGN KEY (settlement_id) REFERENCES public.settlement(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: households households_settlement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.households
    ADD CONSTRAINT households_settlement_id_fkey FOREIGN KEY (settlement_id) REFERENCES public.settlement(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: interventions interventions_cluster_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interventions
    ADD CONSTRAINT interventions_cluster_id_fkey FOREIGN KEY (cluster_id) REFERENCES public.cluster(id) ON UPDATE CASCADE;


--
-- Name: interventions interventions_intervention_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interventions
    ADD CONSTRAINT interventions_intervention_type_id_fkey FOREIGN KEY (intervention_type_id) REFERENCES public.intervention_type(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: interventions interventions_settlement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interventions
    ADD CONSTRAINT interventions_settlement_id_fkey FOREIGN KEY (settlement_id) REFERENCES public.settlement(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: other_facility other_facility_settlement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_facility
    ADD CONSTRAINT other_facility_settlement_id_fkey FOREIGN KEY (settlement_id) REFERENCES public.settlement(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: road_asset road_asset_road_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.road_asset
    ADD CONSTRAINT road_asset_road_id_fkey FOREIGN KEY (road_id) REFERENCES public.road(id) ON UPDATE CASCADE;


--
-- Name: road road_settlement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.road
    ADD CONSTRAINT road_settlement_id_fkey FOREIGN KEY (settlement_id) REFERENCES public.settlement(id) ON UPDATE CASCADE;


--
-- Name: sewer sewer_settlement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sewer
    ADD CONSTRAINT sewer_settlement_id_fkey FOREIGN KEY (settlement_id) REFERENCES public.settlement(id) ON UPDATE CASCADE;


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
-- Name: water_point water_point_settlement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.water_point
    ADD CONSTRAINT water_point_settlement_id_fkey FOREIGN KEY (settlement_id) REFERENCES public.settlement(id) ON UPDATE CASCADE;


--
-- PostgreSQL database dump complete
--

