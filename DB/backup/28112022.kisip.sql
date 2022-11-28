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
    length_stay integer,
    ownership_status character varying(255),
    photo bytea,
    age_00_04 integer,
    age_05_09 integer,
    age_10_14 integer,
    age_15_19 integer,
    age_20_24 integer,
    age_24_29 integer,
    age_30_34 integer,
    age_35_39 integer,
    age_40_44 integer,
    age_45_49 integer,
    age_50_54 integer,
    age_55_59 integer,
    age_60_64 integer,
    age_65_69 integer,
    age_70_plus integer,
    hh_size integer,
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
    sanitation character varying(255),
    source_water character varying(255),
    mode_transport character varying(255),
    access_health character varying(255),
    handwashing character varying(255),
    solid_waste character varying(255),
    code character varying(255) NOT NULL,
    len integer
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

COPY public.households (id, settlement_id, name, gender, national_id, kra_pin, marital_status, education_level, residence_type, length_stay, ownership_status, photo, age_00_04, age_05_09, age_10_14, age_15_19, age_20_24, age_24_29, age_30_34, age_35_39, age_40_44, age_45_49, age_50_54, age_55_59, age_60_64, age_65_69, age_70_plus, hh_size, terminally_ill, ph_disabled, orphans, ment_disabled, hearing_disabled, visual_disabled, emp_status, income_level, type_structure, struct_owner, rent_payable, address, sanitation, source_water, mode_transport, access_health, handwashing, solid_waste, code, len) FROM stdin;
1	85	John Muimi Kinyanjui	Male	74810541	\N	Widowed	secondary	\N	24	tenant	\N	1	0	1	2	1	1	1	1	1	2	0	2	0	1	0	14	0	2	\N	0	1	0	student	0_5000	\N	\N	11000_15000	\N	none	river	matatu	mission	with_water_and_soap	river	13def18e-9d06-4716-a346-cf51431ce634	\N
2	227	Michael Gacheri Yego	Male	25094532	\N	Single	secondary	\N	6	plot_Owner	\N	1	1	1	2	2	0	2	1	1	2	1	0	2	0	0	16	2	1	\N	0	1	1	unemployed	>20000	\N	\N	0_5000	\N	VIP	river	bicycle	chemist	with_water_and_soap	private_collector	64391893-fb75-4841-9391-247f5248d975	\N
3	192	Rebecca Kaberia Omondi	Female	45612977	\N	married	secondary	\N	4	plot_Owner	\N	0	2	0	0	0	2	1	0	0	1	2	1	0	1	2	12	1	2	\N	1	0	1	casual	16000_20000	\N	\N	11000_15000	\N	flush	vendor	matatu	chemist	with_water_and_soap	dumpsite	dadf1896-b472-427a-baba-3986971b3727	\N
4	55	Roger Kogo Warui	Male	87028966	\N	Single	university	\N	20	structure_owner	\N	2	0	1	0	0	0	0	2	2	1	1	0	0	2	0	11	0	0	\N	1	1	0	not_applicable	6000_10000	\N	\N	11000_15000	\N	flush	vendor	matatu	mission	water_only	dumpsite	c9a09aa6-8f51-4064-98c4-bc86c05578b3	\N
5	192	Robert Obuya Kiptum	Male	72329609	\N	Seperated	none	\N	26	plot_Owner	\N	2	1	1	1	2	2	2	1	0	1	2	0	1	2	2	20	1	0	\N	0	1	0	civil_servant	16000_20000	\N	\N	0_5000	\N	pit_latrine	river	car	traditional	with_water_and_soap	private_collector	d03b41c1-474d-41d2-a04e-246c103a2573	\N
6	151	Larry Kemboi Omweri	Male	38015059	\N	Cohabiting	college	\N	21	tenant	\N	1	0	0	0	2	0	0	2	2	2	2	2	0	0	0	13	2	0	\N	0	1	0	unemployed	6000_10000	\N	\N	0_5000	\N	communal	none	walk	public	with_water_and_soap	private_collector	2ab03104-02be-412c-b644-a0d72b8fc2f6	\N
7	6	Julie Nur Ngui	Female	18508825	\N	married	college	\N	12	tenant	\N	0	2	0	1	0	2	0	2	0	2	1	2	0	1	0	13	0	0	\N	1	1	1	self	0_5000	\N	\N	16000_20000	\N	none	vendor	car	private	none	dumpsite	4f688f9e-aa22-4531-81d4-e37276280c98	\N
8	218	Kaitlyn Wamalwa Ndichu	Female	68223021	\N	Seperated	college	\N	38	plot_Owner	\N	0	2	1	0	1	1	2	1	2	0	2	2	0	0	2	16	0	0	\N	1	0	1	not_applicable	6000_10000	\N	\N	>20000	\N	flush	none	walk	chemist	water_only	dumpsite	631c70cc-b7d9-4714-a580-3042ddf7083c	\N
9	149	Lisa Wangui Ngala	Female	78162577	\N	Widowed	secondary	\N	26	tenant	\N	2	2	1	2	1	1	2	1	0	2	2	0	1	2	0	19	1	2	\N	1	0	0	private	16000_20000	\N	\N	0_5000	\N	none	rainwater	car	mission	water_only	bins	59274c3b-e28d-4d81-bf62-056c224cb047	\N
10	143	Shelly Ndambuki Koskei	Female	72887930	\N	married	primary	\N	22	plot_Owner	\N	2	2	2	0	2	1	1	2	1	2	0	0	2	0	2	19	1	0	\N	0	1	1	not_applicable	11000_15000	\N	\N	>20000	\N	communal	shallow_well	walk	mission	with_water_and_soap	dumpsite	09278317-60f7-408e-8065-1e8290c714f5	\N
11	137	Anthony Amondi Wasonga	Male	33440765	\N	married	university	\N	2	structure_owner	\N	1	2	2	1	2	2	0	0	1	0	1	2	0	1	2	17	1	2	\N	0	0	1	self	11000_15000	\N	\N	>20000	\N	pit_latrine	river	boda	public	none	dumpsite	e2b408db-bd7b-4260-97c4-78e9d639acbc	\N
12	174	Shane Mwololo Apondi	Male	62384325	\N	married	primary	\N	26	structure_owner	\N	0	2	2	0	2	0	0	1	2	1	1	0	0	0	2	13	0	2	\N	0	0	0	private	16000_20000	\N	\N	0_5000	\N	pit_latrine	rainwater	train	traditional	none	bins	a2dccd01-0f0c-4440-887b-1663324fbf4f	\N
13	148	Amanda Gacheri Kairu	Female	87203069	\N	married	secondary	\N	17	plot_Owner	\N	2	0	0	1	1	2	0	0	1	1	0	1	0	2	2	13	2	2	\N	0	0	1	self	11000_15000	\N	\N	0_5000	\N	communal	river	car	private	with_water_and_soap	river	531ee0c7-1971-44fd-ae77-27988046cfe5	\N
14	138	Denise Muuo Nzomo	Female	01018247	\N	married	college	\N	16	tenant	\N	2	1	1	2	0	2	2	2	2	1	2	2	1	2	1	23	1	2	\N	0	1	1	civil_servant	>20000	\N	\N	>20000	\N	VIP	shallow_well	walk	mission	water_only	bins	8651add3-85ff-4fde-9b1c-bfce8b70a268	\N
15	22	Nicholas Wahome Kipleting	Male	31623857	\N	married	none	\N	21	structure_owner	\N	1	2	0	1	2	0	0	1	0	0	2	1	1	1	2	14	0	1	\N	1	0	0	unemployed	11000_15000	\N	\N	0_5000	\N	VIP	rainwater	matatu	private	with_water_and_soap	dumpsite	56253a18-9b07-4a3d-8777-bbc0750d3edb	\N
16	203	Jaime Anyona Ngina	Female	17181924	\N	Cohabiting	secondary	\N	19	tenant	\N	1	1	1	1	0	0	2	1	1	1	1	0	1	0	2	13	1	1	\N	1	1	0	private	6000_10000	\N	\N	16000_20000	\N	flush	river	matatu	public	water_only	bins	57d6cc04-8d86-4ce3-940a-c7bfb4331b2b	\N
17	163	Kevin Ndoro Achola	Male	37829427	\N	Widowed	none	\N	40	tenant	\N	0	0	0	0	2	0	0	1	0	0	1	2	2	1	1	10	1	2	\N	0	1	0	private	11000_15000	\N	\N	11000_15000	\N	VIP	rainwater	car	traditional	none	private_collector	e1b29dd5-811e-4114-bf27-845b30ef0e49	\N
18	233	Heidi Issa Mutungi	Female	20359619	\N	Single	none	\N	10	plot_Owner	\N	1	0	1	0	0	2	0	2	1	2	0	0	1	1	1	12	0	2	\N	0	0	0	unemployed	6000_10000	\N	\N	11000_15000	\N	communal	rainwater	boda	traditional	none	bins	76cb2031-fed9-4412-ac5d-26fefa95a416	\N
19	39	Robert Njiru Jerono	Male	72396521	\N	married	college	\N	9	tenant	\N	0	2	1	0	2	1	2	2	1	2	1	2	1	1	1	19	2	2	\N	0	0	1	student	0_5000	\N	\N	6000_10000	\N	none	shallow_well	matatu	private	with_water_and_soap	river	42832c85-1a67-4a52-a026-e35c8d710206	\N
20	77	Scott Obare Kipchumba	Male	77858541	\N	married	primary	\N	2	tenant	\N	2	0	1	2	0	1	2	1	2	2	1	0	0	2	0	16	0	0	\N	0	1	0	unemployed	11000_15000	\N	\N	11000_15000	\N	communal	river	matatu	traditional	with_water_and_soap	dumpsite	91a3c91c-c644-4ed7-8e2c-697aa0689c70	\N
21	30	Samuel Maingi Sidi	Male	62376382	\N	Seperated	university	\N	9	plot_Owner	\N	2	1	1	2	1	2	2	0	2	0	2	2	2	0	2	21	1	0	\N	1	1	1	not_applicable	>20000	\N	\N	11000_15000	\N	none	none	bicycle	chemist	water_only	river	7f10c93a-998b-456e-a3e8-ce0c7d888ed0	\N
22	162	Tom Onyiego Mukhwana	Male	74743091	\N	Single	secondary	\N	1	structure_owner	\N	2	0	2	0	1	2	2	1	1	0	1	1	1	1	1	16	1	0	\N	0	0	1	student	16000_20000	\N	\N	16000_20000	\N	VIP	river	car	public	none	bins	c5fa00a5-8fbb-4f6b-bd8a-c71be938f84e	\N
23	115	Lorraine Kombe Muthoni	Female	03477217	\N	Widowed	primary	\N	30	structure_owner	\N	1	0	1	2	2	0	2	2	0	1	1	0	2	1	1	16	1	0	\N	1	0	0	casual	6000_10000	\N	\N	6000_10000	\N	flush	shallow_well	bicycle	chemist	water_only	river	c93a0d69-c525-449f-b14d-7841bd8f40fd	\N
24	65	Kelly Musau Wasike	Female	81938199	\N	Single	secondary	\N	6	structure_owner	\N	2	2	2	1	0	1	1	0	0	2	2	1	2	2	1	19	2	0	\N	1	0	1	civil_servant	>20000	\N	\N	16000_20000	\N	pit_latrine	river	bicycle	private	none	dumpsite	23088010-5029-4094-a626-3c616060b558	\N
25	56	Melissa Mutanu Ombasa	Female	79581823	\N	Seperated	primary	\N	12	plot_Owner	\N	0	1	1	1	0	1	1	2	0	0	0	1	1	0	2	11	2	2	\N	0	0	0	civil_servant	>20000	\N	\N	11000_15000	\N	communal	none	boda	public	water_only	dumpsite	6b4213aa-2c0b-452b-91cd-eabcad64b7c9	\N
26	127	Angela Wangui Kombo	Female	88542413	\N	Seperated	primary	\N	26	plot_Owner	\N	2	1	0	0	1	2	1	0	0	1	0	0	1	0	2	11	0	1	\N	1	0	1	private	0_5000	\N	\N	>20000	\N	none	vendor	bicycle	public	with_water_and_soap	dumpsite	465f80de-d52e-4753-80f2-c59c12ecd87b	\N
27	46	Timothy Yaa Njue	Male	37889040	\N	Single	university	\N	4	plot_Owner	\N	0	1	2	0	1	1	0	0	0	1	0	2	0	0	0	8	0	2	\N	0	0	1	casual	>20000	\N	\N	11000_15000	\N	flush	none	car	public	none	dumpsite	84837e4a-f660-4615-b72c-13a6dfee9a90	\N
28	224	Elizabeth Fundi Nabwire	Female	10669951	\N	Seperated	college	\N	14	plot_Owner	\N	0	0	1	0	1	1	2	1	0	0	0	1	1	1	1	10	1	2	\N	1	0	0	private	16000_20000	\N	\N	>20000	\N	pit_latrine	river	bicycle	chemist	with_water_and_soap	river	0b8d45c5-2f29-404c-be49-7319cb8fbc49	\N
29	19	Natalie Nderitu Makena	Female	30771682	\N	Single	primary	\N	24	plot_Owner	\N	0	0	0	1	2	0	0	0	1	1	1	2	0	0	2	10	0	1	\N	0	0	1	student	11000_15000	\N	\N	6000_10000	\N	none	none	train	chemist	water_only	river	edbe8eca-a793-457b-8ab5-fe1b3660e162	\N
30	192	Brandon Kassim Chebet	Male	38138771	\N	Cohabiting	university	\N	9	plot_Owner	\N	2	1	1	2	1	0	0	1	2	1	2	2	0	1	1	17	0	1	\N	1	1	0	casual	>20000	\N	\N	6000_10000	\N	pit_latrine	river	car	public	with_water_and_soap	private_collector	8e9b1c28-e9bc-41ea-b80f-aaf0ab97b511	\N
31	227	John Godana Galgalo	Male	64782141	\N	Seperated	university	\N	11	structure_owner	\N	0	1	0	2	2	2	0	2	1	1	0	1	1	0	0	13	1	1	\N	0	1	1	casual	11000_15000	\N	\N	6000_10000	\N	VIP	river	boda	mission	none	river	07158eb7-522b-41eb-997d-25028fa42da6	\N
32	156	Douglas Muimi Mmbone	Male	55798664	\N	Cohabiting	primary	\N	13	tenant	\N	1	0	2	1	2	1	0	0	1	0	2	1	2	2	0	15	1	2	\N	0	1	0	civil_servant	0_5000	\N	\N	>20000	\N	flush	shallow_well	train	mission	with_water_and_soap	river	d74e6320-0d1a-49fe-8a3e-fc98b8ff62e6	\N
33	19	Joseph Nyambura Achieng	Male	07334500	\N	Cohabiting	secondary	\N	1	plot_Owner	\N	0	1	2	0	0	1	1	2	2	2	1	1	0	2	1	16	1	1	\N	0	0	0	not_applicable	0_5000	\N	\N	6000_10000	\N	none	none	bicycle	mission	with_water_and_soap	bins	752d730b-712b-49b4-9335-10fe62000b8f	\N
34	165	Mark Gitahi Aluoch	Male	45348931	\N	Widowed	primary	\N	7	plot_Owner	\N	2	0	0	0	1	1	1	2	0	2	2	2	0	2	0	15	1	2	\N	1	1	1	private	11000_15000	\N	\N	6000_10000	\N	flush	vendor	boda	mission	with_water_and_soap	private_collector	2e546e32-6e13-4657-98ec-91685c6d3a97	\N
35	34	Eric Kasyoka Samwel	Male	66808727	\N	Single	college	\N	10	structure_owner	\N	0	2	0	1	1	2	1	0	2	2	1	1	2	1	2	18	1	0	\N	1	1	1	private	11000_15000	\N	\N	16000_20000	\N	communal	none	walk	public	water_only	private_collector	aff285f8-645f-41ba-9452-d690c5cf7648	\N
36	192	Monica Krop Mogaka	Female	27782479	\N	Widowed	none	\N	31	plot_Owner	\N	0	2	0	0	1	1	1	0	2	0	2	0	2	2	2	15	1	0	\N	0	0	0	self	0_5000	\N	\N	11000_15000	\N	pit_latrine	shallow_well	bicycle	public	water_only	bins	ad126d0a-d74b-411c-9e3c-b8db2acd6d67	\N
37	148	Gregory Yegon Mawira	Male	21424727	\N	Seperated	secondary	\N	14	tenant	\N	0	2	1	0	0	1	1	2	1	1	0	1	1	2	2	15	1	0	\N	0	1	0	private	0_5000	\N	\N	0_5000	\N	flush	river	walk	private	with_water_and_soap	private_collector	894e6d92-36f3-4e34-b8c6-f3966b9592e4	\N
38	129	Michele Adongo Mutuma	Female	62639142	\N	Single	primary	\N	24	structure_owner	\N	1	1	1	2	0	0	1	0	2	2	0	1	0	0	2	13	0	0	\N	0	0	0	student	0_5000	\N	\N	11000_15000	\N	none	none	walk	traditional	water_only	river	80975da6-d238-433e-b125-6c1ef28bd117	\N
39	57	Amy Kitheka Mwanzia	Female	27306071	\N	Widowed	college	\N	32	structure_owner	\N	1	1	1	1	0	2	2	2	2	2	2	2	1	2	1	22	1	1	\N	1	0	1	civil_servant	11000_15000	\N	\N	6000_10000	\N	VIP	rainwater	train	public	none	dumpsite	0ceea4cc-11b5-4ee0-bb33-adf49f02b9dc	\N
40	30	David Onditi Pkemoi	Male	54959532	\N	Seperated	secondary	\N	22	plot_Owner	\N	0	1	2	0	0	0	1	2	0	2	1	2	0	1	0	12	1	2	\N	0	1	1	self	6000_10000	\N	\N	0_5000	\N	flush	vendor	train	other	none	dumpsite	c4e5b939-227e-4da0-8e5e-01e9539f54aa	\N
41	177	Benjamin Kageha Wabwile	Male	04640904	\N	Single	secondary	\N	33	structure_owner	\N	0	0	1	0	0	2	1	0	0	1	2	2	2	1	1	13	2	1	\N	1	1	0	unemployed	>20000	\N	\N	0_5000	\N	communal	river	bicycle	traditional	none	private_collector	9f64583b-9075-44ec-8ccc-f499f8cac370	\N
42	91	Katherine Weru Syombua	Female	04124409	\N	Seperated	none	\N	29	tenant	\N	1	2	1	0	1	1	1	1	0	0	0	0	0	0	1	9	0	1	\N	0	1	1	private	6000_10000	\N	\N	6000_10000	\N	VIP	river	matatu	public	with_water_and_soap	river	dc0dc36f-553e-4168-8a50-82f0634e8e6a	\N
43	52	Christopher Muya Miriti	Male	01716162	\N	Seperated	secondary	\N	8	structure_owner	\N	1	1	1	1	0	2	1	2	2	0	2	1	1	2	2	19	1	2	\N	1	1	0	not_applicable	0_5000	\N	\N	11000_15000	\N	pit_latrine	none	bicycle	traditional	none	dumpsite	a994007c-516e-403e-8dea-eaf3a35dce77	\N
44	87	Amy Ngui Ngugi	Female	22795393	\N	Single	primary	\N	26	tenant	\N	0	0	1	2	2	0	2	2	2	1	0	0	1	2	1	16	0	2	\N	1	0	1	civil_servant	>20000	\N	\N	6000_10000	\N	pit_latrine	none	matatu	traditional	none	private_collector	6a5d7b78-c830-446d-a39b-3db2dd38d1c1	\N
45	178	Brandy Cheruiyot Abdinoor	Female	18266125	\N	Single	university	\N	19	plot_Owner	\N	2	1	0	1	2	1	1	2	0	0	0	2	2	1	1	16	2	2	\N	0	1	0	private	11000_15000	\N	\N	6000_10000	\N	none	none	walk	mission	none	private_collector	68ea443d-dcec-4f59-974d-d363b381ee07	\N
46	164	Kristi Muhia Nthenya	Female	31702360	\N	Widowed	secondary	\N	13	structure_owner	\N	1	2	2	0	0	2	0	0	1	1	2	2	0	2	1	16	0	2	\N	1	1	1	casual	0_5000	\N	\N	>20000	\N	none	river	car	mission	none	dumpsite	958a6e27-d5d2-4df4-baac-d323ff5d94b1	\N
47	49	Grace Muhumed Sammy	Female	74496409	\N	married	primary	\N	10	tenant	\N	2	1	2	1	2	1	2	0	1	0	2	1	2	0	1	18	1	1	\N	0	0	1	student	6000_10000	\N	\N	11000_15000	\N	none	rainwater	boda	public	with_water_and_soap	river	699dfc77-06ac-4280-a733-5ebbe700036d	\N
48	125	Dana Kiio Nafuna	Female	64308040	\N	married	primary	\N	28	tenant	\N	2	2	2	2	0	1	1	2	0	1	0	1	2	2	0	18	2	2	\N	1	0	1	not_applicable	11000_15000	\N	\N	6000_10000	\N	pit_latrine	none	boda	private	water_only	dumpsite	69bde44e-3ac6-4ef6-99c2-c2fdb1965720	\N
49	182	Joseph Bii Wangui	Male	42034874	\N	Cohabiting	college	\N	0	tenant	\N	0	2	1	0	0	1	2	1	0	0	1	1	0	1	1	11	0	2	\N	1	1	0	unemployed	11000_15000	\N	\N	0_5000	\N	communal	rainwater	car	public	none	bins	ff16ae95-9995-4abd-bed9-7ad4ef783b3d	\N
50	121	Christopher Gatwiri Misiko	Male	82622919	\N	Seperated	none	\N	29	tenant	\N	0	2	0	1	1	0	0	2	0	2	2	2	2	2	0	16	0	1	\N	0	0	0	self	6000_10000	\N	\N	16000_20000	\N	flush	shallow_well	car	mission	water_only	private_collector	58abcf11-9c40-4186-8958-7566133a5c48	\N
51	185	Jimmy Mucheru Yusuf	Male	36738247	\N	Cohabiting	college	\N	5	tenant	\N	1	2	0	2	2	1	2	0	2	2	0	1	1	2	2	20	1	0	\N	0	1	0	casual	16000_20000	\N	\N	6000_10000	\N	VIP	shallow_well	boda	private	with_water_and_soap	river	b454baff-f0ab-429b-a732-44e376c95686	\N
52	3	Jennifer Thoya Ratemo	Female	40593196	\N	Single	college	\N	32	tenant	\N	1	0	2	1	1	1	1	1	0	1	2	1	2	1	0	15	2	2	\N	1	0	1	civil_servant	11000_15000	\N	\N	16000_20000	\N	none	piped	walk	private	with_water_and_soap	bins	9fce4dcf-5d4d-48ab-89f7-2b850cf66328	\N
53	75	Megan Ogada Chai	Female	82532960	\N	Cohabiting	none	\N	31	structure_owner	\N	0	0	1	2	0	1	2	2	2	2	1	2	0	2	2	19	1	1	\N	0	0	1	student	11000_15000	\N	\N	16000_20000	\N	none	piped	matatu	private	none	private_collector	44c09198-67bf-480b-9873-cdb00d2f6ddc	\N
54	3	Amanda Wabomba Mayaka	Female	00219931	\N	Seperated	university	\N	34	structure_owner	\N	2	1	0	0	1	2	0	2	0	2	0	1	1	1	2	15	1	1	\N	1	1	0	student	16000_20000	\N	\N	11000_15000	\N	none	river	car	private	with_water_and_soap	bins	eede00c4-321e-4353-aa09-619a28ebafe2	\N
55	18	Emily Ngure Ratemo	Female	77356435	\N	Cohabiting	university	\N	8	tenant	\N	1	0	2	1	2	2	1	2	2	0	0	2	1	1	0	17	2	0	\N	0	0	1	civil_servant	11000_15000	\N	\N	16000_20000	\N	pit_latrine	piped	matatu	private	with_water_and_soap	bins	9cd11a51-c29b-408c-9c8d-efa8a35ef671	\N
56	76	Mark Korir John	Male	03872674	\N	Seperated	primary	\N	0	tenant	\N	1	2	1	1	2	2	2	1	1	0	2	1	0	0	2	18	0	2	\N	1	1	1	civil_servant	>20000	\N	\N	16000_20000	\N	communal	piped	boda	traditional	water_only	river	8efd27a9-4d68-4efb-83db-db3191ee0467	\N
57	10	Natasha Mwangi Karuga	Female	58758387	\N	Seperated	none	\N	14	structure_owner	\N	0	1	2	0	2	0	2	1	2	2	1	0	2	2	0	17	2	0	\N	0	1	0	private	0_5000	\N	\N	16000_20000	\N	communal	piped	train	public	with_water_and_soap	river	6940b56c-198d-4a10-ac5a-53140ab2e078	\N
58	99	Pamela Nyambane Muiruri	Female	78133332	\N	Seperated	secondary	\N	28	plot_Owner	\N	2	2	0	0	0	1	0	1	2	1	1	1	1	1	2	15	1	0	\N	0	1	0	student	>20000	\N	\N	0_5000	\N	pit_latrine	none	boda	public	with_water_and_soap	bins	e10d770b-e56f-4e91-9c4c-537f7ecdb5ae	\N
59	218	Isaac Zawadi Benson	Male	08473569	\N	Single	university	\N	24	plot_Owner	\N	1	2	2	2	1	2	0	2	1	1	2	0	2	2	1	21	1	0	\N	1	0	0	student	16000_20000	\N	\N	0_5000	\N	none	none	train	chemist	with_water_and_soap	dumpsite	d2ba3bc5-393a-43c5-b36d-b4c17c5872f8	\N
60	152	Calvin Issack Waweru	Male	52408267	\N	Cohabiting	university	\N	4	plot_Owner	\N	0	2	0	2	2	1	0	1	0	1	1	0	2	1	1	14	2	0	\N	0	1	1	self	16000_20000	\N	\N	16000_20000	\N	VIP	river	walk	private	none	private_collector	55a0bbd6-83f0-4741-a0e1-de46968578a5	\N
61	22	Robert Muriungi Kalume	Male	83334330	\N	married	university	\N	8	tenant	\N	1	2	2	2	2	0	2	2	0	2	2	2	2	2	1	24	0	1	\N	0	0	0	private	16000_20000	\N	\N	16000_20000	\N	communal	piped	bicycle	mission	with_water_and_soap	dumpsite	a8f062d1-9d6b-4d6d-9d9f-92165e48222c	\N
62	235	Joseph Kasyoka Njau	Male	62631751	\N	Widowed	primary	\N	20	tenant	\N	2	2	1	1	2	1	0	1	2	0	0	2	2	0	2	18	2	0	\N	0	0	1	self	0_5000	\N	\N	0_5000	\N	pit_latrine	rainwater	train	mission	with_water_and_soap	river	108cd162-dd61-46d7-a4ed-3d5fbf3768e2	\N
63	187	Clayton Nyakundi Adam	Male	14041037	\N	Cohabiting	university	\N	21	structure_owner	\N	2	0	1	2	0	2	0	2	1	0	0	0	1	2	1	14	2	1	\N	1	1	0	casual	0_5000	\N	\N	6000_10000	\N	none	shallow_well	boda	private	water_only	dumpsite	aaad084b-5920-4746-90bd-8ff970675090	\N
64	128	Megan Chepkoech Jepkorir	Female	61980419	\N	Seperated	none	\N	8	structure_owner	\N	0	1	2	0	0	1	2	0	2	1	1	0	2	2	0	14	1	0	\N	0	1	1	student	>20000	\N	\N	11000_15000	\N	flush	shallow_well	walk	private	water_only	private_collector	e8d8f0ff-9167-487a-bad4-7a1de758ec10	\N
65	51	John Chepkwemoi Nyaboke	Male	81071812	\N	Seperated	primary	\N	36	structure_owner	\N	1	1	0	0	1	1	0	1	0	1	0	0	0	1	0	7	0	1	\N	0	1	1	private	0_5000	\N	\N	16000_20000	\N	flush	river	matatu	other	none	river	dab09882-f3e9-4261-8e29-70a5d9d6924b	\N
66	84	Christopher Ngaruiya Mugure	Male	16171240	\N	Single	secondary	\N	3	tenant	\N	2	1	1	0	2	2	0	0	1	1	0	1	0	0	2	13	2	1	\N	0	1	1	student	>20000	\N	\N	0_5000	\N	flush	vendor	boda	chemist	with_water_and_soap	dumpsite	39f463da-9d48-4180-b6d9-8ac1c42c08ff	\N
67	186	Sherri Maitha Atieno	Female	43160595	\N	Widowed	secondary	\N	10	structure_owner	\N	2	2	0	2	1	0	1	2	2	1	0	0	0	2	1	16	1	0	\N	1	0	0	casual	11000_15000	\N	\N	6000_10000	\N	VIP	none	car	mission	with_water_and_soap	dumpsite	78af19f2-514a-4c4e-9f19-5a31db540b84	\N
68	46	Jason Barongo Chepchumba	Male	69049043	\N	Widowed	university	\N	8	structure_owner	\N	1	2	0	0	2	0	2	1	2	0	0	0	0	1	2	13	0	0	\N	0	0	0	unemployed	6000_10000	\N	\N	0_5000	\N	communal	rainwater	bicycle	chemist	none	private_collector	82408df0-834f-4ee7-ae3c-182aa261d68c	\N
69	77	Cynthia Kariuki Dennis	Female	39129647	\N	Single	none	\N	36	structure_owner	\N	2	1	2	0	0	1	2	0	2	1	0	0	1	2	2	16	1	0	\N	1	0	1	student	0_5000	\N	\N	>20000	\N	VIP	shallow_well	matatu	traditional	water_only	private_collector	42e77944-13cd-4d4a-aaf0-5a4143edbad9	\N
70	145	Randall Naserian Nkirote	Male	73151044	\N	Single	university	\N	30	tenant	\N	1	2	0	1	1	2	1	2	0	2	2	1	0	1	0	16	2	1	\N	0	0	0	self	16000_20000	\N	\N	0_5000	\N	pit_latrine	vendor	boda	private	none	river	0886a51c-aa44-41bb-9cb1-a949c220ef0f	\N
71	29	Christina Mahamud Lewa	Female	64667088	\N	Widowed	secondary	\N	25	structure_owner	\N	1	0	2	1	2	1	0	0	1	1	1	0	2	1	2	15	0	1	\N	0	1	1	casual	16000_20000	\N	\N	11000_15000	\N	communal	none	car	traditional	with_water_and_soap	river	8cd3847e-ebaa-4741-9e0d-eed938427278	\N
72	204	Carol Orwa Langat	Female	11379584	\N	Single	primary	\N	16	structure_owner	\N	0	2	2	1	1	1	2	0	1	2	1	0	2	1	1	17	1	2	\N	1	0	0	not_applicable	>20000	\N	\N	6000_10000	\N	none	vendor	bicycle	public	with_water_and_soap	river	6da809bf-1424-4184-93d8-0d92bbc28b18	\N
73	133	Steven Odiwuor Wambura	Male	83964584	\N	Seperated	university	\N	27	structure_owner	\N	2	1	1	0	2	2	2	2	0	1	2	2	2	0	0	19	0	0	\N	0	0	0	private	0_5000	\N	\N	11000_15000	\N	none	none	matatu	public	none	river	24660297-0a0e-4c9f-b491-6e0fb9b8a973	\N
74	91	Jorge Kiboi Kang'ethe	Male	35550772	\N	married	college	\N	39	tenant	\N	2	1	2	1	2	0	1	1	0	1	2	2	1	2	2	20	0	1	\N	1	0	1	not_applicable	6000_10000	\N	\N	0_5000	\N	flush	piped	car	traditional	none	river	cf8a0038-10fb-4800-8e2e-726025015933	\N
75	221	Adam Kaloki Mohamed	Male	38511059	\N	Widowed	primary	\N	26	structure_owner	\N	1	0	2	0	0	0	2	2	2	2	2	0	2	2	2	19	0	2	\N	0	1	0	civil_servant	6000_10000	\N	\N	0_5000	\N	VIP	none	matatu	mission	none	private_collector	f048bec2-4e4f-4ee6-8634-5b626467968c	\N
76	140	Matthew Muraguri Murangiri	Male	53053996	\N	Cohabiting	university	\N	23	structure_owner	\N	2	1	1	0	2	1	1	2	2	1	2	1	0	0	2	18	2	0	\N	0	0	0	casual	>20000	\N	\N	16000_20000	\N	VIP	piped	boda	mission	none	bins	0a6881fb-7527-4a6f-8198-3287cf90e9ab	\N
77	185	Debra Moseti Masese	Female	49280166	\N	Single	secondary	\N	28	plot_Owner	\N	2	2	1	1	0	2	0	1	0	1	2	0	1	0	2	15	2	1	\N	0	1	0	student	0_5000	\N	\N	>20000	\N	communal	shallow_well	walk	chemist	water_only	bins	5d3fb580-3969-4a51-99a3-e8f872fab4df	\N
78	45	Robert Nelima Makena	Male	27262376	\N	Widowed	university	\N	32	tenant	\N	1	2	2	1	1	1	0	0	2	1	0	1	2	0	1	15	0	0	\N	1	1	0	civil_servant	>20000	\N	\N	16000_20000	\N	none	rainwater	walk	private	none	river	549cf085-3221-417f-83a9-65992abbe3b2	\N
79	52	Melissa Atieno Mutio	Female	89644159	\N	Cohabiting	secondary	\N	18	plot_Owner	\N	0	1	0	0	2	0	2	0	2	2	0	0	0	1	2	12	2	2	\N	0	1	1	not_applicable	11000_15000	\N	\N	>20000	\N	communal	piped	bicycle	mission	with_water_and_soap	bins	488ca42d-1f15-47ad-be13-ac1754d2380a	\N
80	121	Mary Kalama Muthike	Female	29526788	\N	Seperated	university	\N	15	tenant	\N	0	1	1	1	0	0	1	1	2	1	0	0	1	2	1	12	0	2	\N	1	0	0	civil_servant	16000_20000	\N	\N	>20000	\N	communal	vendor	boda	private	water_only	bins	5b4ce6c3-e998-4188-9d58-f234610a5117	\N
81	40	Jeremy Gedi Ngome	Male	49238197	\N	Seperated	secondary	\N	22	plot_Owner	\N	1	1	2	0	0	1	1	2	1	0	2	2	1	2	1	17	1	1	\N	1	1	0	not_applicable	16000_20000	\N	\N	6000_10000	\N	VIP	rainwater	walk	mission	with_water_and_soap	bins	37ed8678-a3ad-475e-a872-5abce6013b42	\N
82	220	Brandon Chepkemoi Jeruto	Male	32367002	\N	Single	university	\N	22	plot_Owner	\N	0	2	0	1	1	0	0	2	1	1	1	2	1	2	2	16	0	2	\N	1	1	0	self	>20000	\N	\N	11000_15000	\N	pit_latrine	vendor	boda	public	with_water_and_soap	bins	67361381-fed8-4c1c-9c0e-9ebc6f6f0db1	\N
83	153	Carl Naliaka Kabiru	Male	39269007	\N	Cohabiting	none	\N	20	plot_Owner	\N	1	0	1	0	2	0	1	0	1	0	2	1	0	0	0	9	2	1	\N	0	0	0	not_applicable	0_5000	\N	\N	0_5000	\N	flush	piped	bicycle	private	water_only	dumpsite	c8f54918-5dbc-49b5-b53d-b059b2043923	\N
84	22	Lisa Muthama Ngumbao	Female	39198067	\N	Cohabiting	secondary	\N	38	tenant	\N	2	0	0	2	1	0	0	2	2	1	0	2	0	0	0	12	1	1	\N	0	1	0	casual	11000_15000	\N	\N	16000_20000	\N	none	shallow_well	boda	private	none	private_collector	004104d7-ddf4-476a-94e6-6f66cf59645a	\N
85	137	Vanessa Mati Nyongesa	Female	38927939	\N	Single	none	\N	17	plot_Owner	\N	0	2	1	2	1	1	2	1	2	0	2	2	0	1	0	17	2	0	\N	0	0	0	private	11000_15000	\N	\N	16000_20000	\N	none	river	boda	mission	with_water_and_soap	bins	78f6f02f-26a9-4d3d-946b-538000307643	\N
86	236	George Samuel Mahat	Male	08173828	\N	married	none	\N	20	structure_owner	\N	0	1	2	2	0	2	0	2	1	0	2	1	1	0	1	15	2	1	\N	1	1	1	not_applicable	0_5000	\N	\N	>20000	\N	VIP	piped	walk	mission	none	dumpsite	586fe2b5-b3f3-405e-bb37-0df5953e9420	\N
87	193	Kyle Nakhumicha Kiema	Male	29147796	\N	Widowed	primary	\N	14	tenant	\N	1	0	1	1	1	0	1	2	0	2	1	1	0	1	0	12	1	1	\N	0	0	1	private	11000_15000	\N	\N	0_5000	\N	none	none	walk	mission	water_only	dumpsite	ef826a27-d0f7-4ecd-803c-b5463c744056	\N
88	122	Anthony Kariuki Mutwiri	Male	19722640	\N	Single	primary	\N	9	tenant	\N	2	2	0	0	1	2	2	2	0	0	0	1	0	1	2	15	0	1	\N	0	1	1	casual	16000_20000	\N	\N	6000_10000	\N	pit_latrine	none	train	chemist	water_only	dumpsite	600b404f-fbfd-4f7d-b42a-48346b7aaa72	\N
89	86	Sarah Achieng Jepleting	Female	24963989	\N	Seperated	primary	\N	21	tenant	\N	2	2	0	2	1	0	2	2	2	2	2	1	0	2	2	22	2	1	\N	0	1	0	civil_servant	0_5000	\N	\N	6000_10000	\N	pit_latrine	rainwater	matatu	public	water_only	river	7079929f-ee43-4baa-ae57-897106499085	\N
90	32	Jacqueline Mohammed Etyang	Female	70225267	\N	Widowed	secondary	\N	35	plot_Owner	\N	2	0	0	0	0	0	0	1	2	2	0	2	2	0	2	13	1	2	\N	1	1	1	not_applicable	11000_15000	\N	\N	>20000	\N	VIP	vendor	bicycle	mission	with_water_and_soap	dumpsite	a6044997-f84d-4c73-8f63-3ec8cf0b8f38	\N
91	85	Lauren Kandie Cherotich	Female	21312675	\N	Widowed	college	\N	22	structure_owner	\N	2	1	1	1	2	1	1	0	0	0	0	0	1	1	2	13	2	0	\N	0	0	1	unemployed	6000_10000	\N	\N	11000_15000	\N	none	vendor	walk	other	with_water_and_soap	dumpsite	3485e277-c6ea-41f9-91c7-4cf01269d8a5	\N
92	221	Erik Mwongela Kithinji	Male	63297589	\N	Widowed	primary	\N	26	structure_owner	\N	2	0	2	0	2	0	2	2	1	1	1	2	2	0	0	17	2	2	\N	0	0	1	civil_servant	16000_20000	\N	\N	16000_20000	\N	communal	piped	walk	public	water_only	private_collector	49d746e4-925f-41b5-b348-7a8ee37eabf1	\N
93	64	Ethan Chirchir Gatimu	Male	09206253	\N	married	university	\N	1	structure_owner	\N	0	2	0	2	2	1	0	1	1	0	2	1	1	0	1	14	1	2	\N	1	0	1	not_applicable	0_5000	\N	\N	0_5000	\N	flush	shallow_well	car	other	none	bins	d8c5db02-404f-4d0f-b1f1-8db8e7ddf396	\N
94	21	James Jacob Ngeno	Male	64535432	\N	Cohabiting	secondary	\N	37	tenant	\N	2	1	0	2	1	1	1	1	2	0	0	1	2	2	0	16	0	0	\N	1	0	0	private	11000_15000	\N	\N	6000_10000	\N	pit_latrine	shallow_well	train	chemist	water_only	dumpsite	9e878820-1df0-4649-9d17-cc7ee1765ddf	\N
95	40	Jason Wanjiku Jimale	Male	10279919	\N	Seperated	secondary	\N	22	tenant	\N	1	1	2	2	0	2	2	2	0	1	2	2	0	0	1	18	0	2	\N	1	0	1	unemployed	16000_20000	\N	\N	0_5000	\N	flush	river	boda	mission	with_water_and_soap	river	0e52aa5c-6461-4f80-8adf-98f295c02e77	\N
96	161	Hannah Maithya Ngei	Female	62490719	\N	Widowed	primary	\N	4	structure_owner	\N	1	2	0	2	0	2	0	1	0	2	0	1	0	2	2	15	0	0	\N	0	1	0	unemployed	16000_20000	\N	\N	11000_15000	\N	none	none	boda	traditional	none	private_collector	52860f64-034b-4f5e-8e5e-7a152fe9be6f	\N
97	231	Michael Bii Koome	Male	30015272	\N	married	none	\N	17	structure_owner	\N	2	1	2	0	0	1	1	0	1	2	2	0	0	2	1	15	1	2	\N	0	0	0	unemployed	11000_15000	\N	\N	0_5000	\N	flush	piped	bicycle	public	water_only	river	f612157c-6fd5-4143-973b-07f992f79895	\N
98	177	Billy Elijah Mulei	Male	02402441	\N	Seperated	college	\N	12	plot_Owner	\N	2	2	1	1	0	1	2	2	1	0	0	2	1	1	0	16	1	0	\N	1	1	0	private	11000_15000	\N	\N	16000_20000	\N	VIP	piped	bicycle	private	water_only	river	f083d68f-8060-42c6-8f35-dd1416f6e108	\N
99	145	Jeff Koech Jemutai	Male	46091201	\N	Widowed	college	\N	20	plot_Owner	\N	1	2	2	1	0	2	0	2	2	0	1	2	0	1	1	17	1	2	\N	1	1	1	casual	0_5000	\N	\N	6000_10000	\N	flush	piped	walk	public	water_only	river	fae94178-b67d-4d15-b7e4-ddb352ddc877	\N
100	61	Jessica Okemwa Njagi	Female	28935662	\N	Cohabiting	university	\N	10	tenant	\N	2	0	0	2	1	1	0	0	0	1	0	0	0	1	0	8	1	2	\N	0	0	1	unemployed	11000_15000	\N	\N	>20000	\N	flush	shallow_well	boda	mission	with_water_and_soap	private_collector	5a981e25-1e54-47e5-b2a2-761e1809ad0e	\N
101	73	Stanley Karimi Mwololo	Male	77772211	\N	Widowed	none	\N	3	tenant	\N	0	2	2	1	0	0	0	0	1	0	0	2	1	2	0	11	0	0	\N	1	0	0	unemployed	11000_15000	\N	\N	16000_20000	\N	flush	vendor	walk	traditional	none	dumpsite	d027bc04-0591-4471-b7c7-90b54e4f88d6	\N
102	216	Joseph Joel Kilonzo	Male	10617140	\N	Seperated	college	\N	37	tenant	\N	2	0	2	0	2	1	2	2	0	2	1	0	0	1	0	15	1	2	\N	0	1	1	civil_servant	>20000	\N	\N	6000_10000	\N	VIP	shallow_well	train	chemist	none	dumpsite	d9901c5f-fed5-4fd7-855e-2ce91285e106	\N
103	125	Danielle Muthini Bashir	Female	52409731	\N	Single	university	\N	5	structure_owner	\N	0	2	0	2	1	1	2	1	1	1	2	1	1	2	0	17	0	2	\N	0	0	0	private	6000_10000	\N	\N	11000_15000	\N	pit_latrine	vendor	car	other	water_only	river	a1c908fe-96cc-403d-9eb3-5cb94dd331c1	\N
104	126	Jeremiah Mwenda Saidi	Male	34861493	\N	Widowed	primary	\N	8	tenant	\N	2	2	2	1	0	2	0	1	2	1	1	1	2	2	2	21	1	0	\N	1	0	1	civil_servant	0_5000	\N	\N	0_5000	\N	VIP	piped	train	public	with_water_and_soap	bins	20ff0c0e-8570-4adf-af29-2e7cbb886246	\N
105	178	Kelly Issa Odoyo	Female	52218978	\N	married	primary	\N	30	structure_owner	\N	1	2	1	1	2	2	1	1	2	1	2	2	1	2	2	23	0	0	\N	0	1	0	unemployed	16000_20000	\N	\N	6000_10000	\N	communal	shallow_well	car	chemist	none	river	be66889d-321a-4119-88d5-5088db866f3e	\N
106	99	Teresa Ndanu Farah	Female	81301354	\N	Single	none	\N	34	tenant	\N	2	2	1	1	1	1	1	1	2	2	0	2	0	1	1	18	2	0	\N	0	0	1	casual	0_5000	\N	\N	>20000	\N	flush	shallow_well	bicycle	public	water_only	river	cd2b8708-d046-41a9-8e7e-f76cdfd22a12	\N
107	17	Melissa Kuria Godana	Female	59756189	\N	Widowed	none	\N	11	structure_owner	\N	2	0	2	1	2	1	0	2	2	0	0	2	0	1	0	15	1	1	\N	1	1	0	private	0_5000	\N	\N	6000_10000	\N	communal	piped	car	traditional	with_water_and_soap	dumpsite	45c7811e-c499-4a34-9dd5-23fd85bea665	\N
108	146	Amanda Awadh Wakio	Female	05656990	\N	married	university	\N	11	structure_owner	\N	0	2	2	1	1	2	0	1	0	1	0	0	1	2	0	13	2	2	\N	1	0	0	casual	11000_15000	\N	\N	0_5000	\N	none	piped	boda	private	water_only	river	f3f9a4a0-8b25-4b84-9a80-7e4e72f6fead	\N
109	52	Robert Mwaka Mwita	Male	66210751	\N	Single	university	\N	8	plot_Owner	\N	2	0	1	1	1	2	2	2	0	2	0	1	0	1	2	17	2	1	\N	1	1	1	unemployed	0_5000	\N	\N	11000_15000	\N	pit_latrine	river	walk	other	none	river	f956acb5-3ef1-423f-a7b4-98bc07cff55d	\N
110	144	Michael Ondiek Mwenda	Male	30288163	\N	Widowed	secondary	\N	10	structure_owner	\N	0	2	1	2	2	1	2	1	1	2	0	2	1	0	2	19	2	0	\N	0	0	1	casual	6000_10000	\N	\N	6000_10000	\N	communal	rainwater	boda	private	none	bins	9a93dceb-b121-4b0d-8848-46158cc53693	\N
111	173	Nicole Mohammed Mawira	Female	72051949	\N	Widowed	university	\N	27	structure_owner	\N	1	1	0	2	1	2	2	0	0	0	2	0	0	0	1	12	1	1	\N	1	0	0	not_applicable	6000_10000	\N	\N	16000_20000	\N	flush	rainwater	train	other	water_only	bins	f1a3bedc-8e85-42f6-a9fc-2faa49f685f0	\N
112	175	Laura Mati Wangechi	Female	60322146	\N	married	university	\N	14	structure_owner	\N	0	0	1	0	0	2	1	0	2	2	2	1	1	1	2	15	0	2	\N	0	0	0	civil_servant	>20000	\N	\N	0_5000	\N	pit_latrine	piped	boda	private	water_only	dumpsite	98d8ad1a-c83b-4e9e-96b8-4a7e14bf623f	\N
113	128	Kenneth Kipyegon Muhonja	Male	85819541	\N	Single	college	\N	18	structure_owner	\N	1	1	0	1	2	0	2	0	2	0	0	2	1	0	0	12	2	0	\N	1	0	1	casual	11000_15000	\N	\N	11000_15000	\N	flush	piped	train	private	none	bins	aa33ee92-96de-47c5-bba3-4a32a409c739	\N
114	145	Sandra Gathogo Jelagat	Female	22519654	\N	Cohabiting	university	\N	4	structure_owner	\N	0	1	0	1	1	1	2	1	1	2	2	0	0	1	1	14	1	1	\N	1	1	0	casual	6000_10000	\N	\N	16000_20000	\N	none	river	matatu	mission	water_only	river	129b82e4-9010-45a9-999e-bd6df7cb1d95	\N
115	170	Jose Wanyama Galgallo	Male	76286764	\N	Widowed	college	\N	32	plot_Owner	\N	1	0	0	0	0	0	1	2	2	0	2	0	2	1	2	13	1	1	\N	1	1	1	civil_servant	>20000	\N	\N	6000_10000	\N	VIP	shallow_well	train	chemist	water_only	dumpsite	bf3a4df0-1dd0-4c40-a50d-ae6e682e03cc	\N
116	5	Terri Awadh Mutisya	Female	58446065	\N	Single	university	\N	14	structure_owner	\N	2	0	2	1	1	1	2	0	0	2	0	1	0	1	1	14	2	0	\N	0	0	0	unemployed	11000_15000	\N	\N	6000_10000	\N	VIP	shallow_well	walk	traditional	water_only	river	f4c1b6b7-f656-4cff-a8a6-631bf8f544aa	\N
117	24	John Wamalwa Ismail	Male	71337950	\N	Single	university	\N	11	tenant	\N	1	1	1	1	1	0	2	0	2	2	1	2	2	1	2	19	2	0	\N	1	0	1	not_applicable	0_5000	\N	\N	11000_15000	\N	none	river	car	mission	water_only	river	8455c3b9-6c35-4cf5-aa27-213cf1eb4607	\N
118	201	David Munene Wamuyu	Male	30331346	\N	Single	college	\N	1	plot_Owner	\N	2	1	2	2	2	0	2	1	1	2	1	1	2	2	0	21	2	1	\N	0	1	1	unemployed	>20000	\N	\N	16000_20000	\N	communal	river	bicycle	other	none	dumpsite	f7fdfa71-baf6-4f65-b007-0f2229e5a8bc	\N
119	164	Lindsay Gakii Oduori	Female	21089297	\N	Cohabiting	university	\N	15	plot_Owner	\N	2	2	1	1	0	2	1	2	2	0	1	0	0	1	2	17	0	2	\N	0	1	1	not_applicable	6000_10000	\N	\N	16000_20000	\N	flush	piped	train	mission	water_only	river	87ca0652-d258-4f76-ad81-6826bd2f5604	\N
120	196	Dwayne Mawia Mangale	Male	08333821	\N	Seperated	secondary	\N	38	structure_owner	\N	0	2	0	2	1	0	1	1	1	2	0	1	1	1	2	15	0	0	\N	0	0	1	student	0_5000	\N	\N	>20000	\N	pit_latrine	shallow_well	walk	other	with_water_and_soap	dumpsite	7b9485ad-75d5-4ed0-82e8-940f8610832a	\N
121	16	Molly Wabomba Bett	Female	22687147	\N	Seperated	college	\N	31	plot_Owner	\N	1	1	2	2	2	2	1	0	0	0	1	0	1	2	2	17	2	1	\N	1	1	1	self	6000_10000	\N	\N	11000_15000	\N	pit_latrine	shallow_well	bicycle	public	with_water_and_soap	bins	ec1370a8-7598-4cf3-80a5-4274fe8e116f	\N
122	121	Susan Oduor Opondo	Female	28538260	\N	Cohabiting	university	\N	40	tenant	\N	0	2	0	2	2	2	1	2	2	0	2	0	0	0	0	15	2	1	\N	1	0	0	student	0_5000	\N	\N	11000_15000	\N	none	vendor	train	private	water_only	river	8ba7aee1-289b-4a6f-878c-91bfe1aabea5	\N
123	182	Angela Gachanja Njambi	Female	69517443	\N	Widowed	secondary	\N	37	plot_Owner	\N	0	0	0	0	1	1	1	0	2	2	1	0	0	0	2	10	1	0	\N	0	1	1	private	16000_20000	\N	\N	0_5000	\N	communal	shallow_well	walk	other	with_water_and_soap	river	5b4f0f16-2455-4799-8ff2-a73c8666f060	\N
124	146	David Jepkogei Mbula	Male	46841725	\N	Seperated	secondary	\N	39	structure_owner	\N	2	1	2	2	0	0	0	0	2	2	2	0	1	0	0	14	1	2	\N	1	0	0	civil_servant	6000_10000	\N	\N	11000_15000	\N	VIP	rainwater	matatu	other	water_only	dumpsite	fd4af23e-9968-4117-863d-7cc1a7982f97	\N
125	196	Kelly Jepkirui Wabomba	Female	60584156	\N	Seperated	college	\N	40	tenant	\N	2	1	2	2	0	0	1	1	1	1	2	2	1	0	1	17	2	1	\N	0	1	0	private	>20000	\N	\N	11000_15000	\N	none	shallow_well	bicycle	traditional	water_only	river	a428b50e-808e-4789-8c83-1f904c866eb8	\N
126	197	Keith Halake Mutune	Male	79191886	\N	married	university	\N	8	structure_owner	\N	2	1	0	1	1	2	2	0	0	2	0	1	1	1	1	15	2	0	\N	1	1	0	not_applicable	11000_15000	\N	\N	>20000	\N	flush	none	walk	chemist	water_only	bins	cfab5af0-c264-4fbb-95c0-32f578316728	\N
127	154	Kyle Suleiman Abdalla	Male	23931155	\N	Single	primary	\N	2	plot_Owner	\N	1	2	1	2	2	1	0	1	0	1	0	0	2	1	0	14	2	2	\N	0	0	0	private	0_5000	\N	\N	>20000	\N	communal	rainwater	bicycle	public	water_only	dumpsite	069bd9b7-e9e7-4531-b05f-3034e5246c56	\N
128	219	Richard Abdow Ruto	Male	68961987	\N	Seperated	primary	\N	26	plot_Owner	\N	0	2	0	2	0	0	1	0	0	0	2	0	2	0	2	11	2	2	\N	1	1	1	private	6000_10000	\N	\N	0_5000	\N	pit_latrine	piped	bicycle	traditional	with_water_and_soap	private_collector	dbb4daad-840c-4713-ba30-58f33c4fbd41	\N
129	196	Shawn Munguti Wanjiku	Male	33795487	\N	Single	secondary	\N	22	plot_Owner	\N	1	0	2	2	0	0	1	0	2	2	0	0	0	0	1	11	1	0	\N	1	1	1	not_applicable	16000_20000	\N	\N	11000_15000	\N	communal	vendor	walk	other	with_water_and_soap	river	b48cdca7-a853-4837-9dc5-209124e8cba1	\N
130	28	Melinda Bulle Omweri	Female	52142524	\N	Cohabiting	secondary	\N	5	tenant	\N	2	0	1	1	2	2	2	0	0	0	1	0	0	1	1	13	0	2	\N	1	0	0	self	0_5000	\N	\N	6000_10000	\N	VIP	none	matatu	public	with_water_and_soap	bins	093bb176-1ba8-46e6-8dd7-dd8e0d0e9cd7	\N
131	28	Brittany Abdullahi Chege	Female	35920959	\N	Cohabiting	primary	\N	4	tenant	\N	1	0	0	1	2	2	1	2	2	2	1	1	0	0	1	16	0	1	\N	0	0	1	private	11000_15000	\N	\N	6000_10000	\N	none	piped	car	private	water_only	dumpsite	0f0f6f0c-8899-4068-955b-8b2620f38c32	\N
132	93	Alvin Njihia Mureithi	Male	25267070	\N	Widowed	secondary	\N	36	tenant	\N	1	1	2	0	0	0	0	1	2	1	0	0	1	1	2	12	0	2	\N	0	0	1	private	16000_20000	\N	\N	>20000	\N	VIP	shallow_well	bicycle	traditional	none	bins	ce8b3d1b-ea13-44fd-afdb-cc77d7102a37	\N
133	161	Michael Cheboi Lagat	Male	23219984	\N	Seperated	university	\N	37	structure_owner	\N	0	1	1	2	2	1	2	2	1	0	0	2	0	2	2	18	2	2	\N	1	0	0	not_applicable	16000_20000	\N	\N	6000_10000	\N	pit_latrine	none	train	public	with_water_and_soap	dumpsite	b90bff59-a20e-436f-b5b6-d053ba35d3fd	\N
134	211	Dawn Njoka Akello	Female	06145545	\N	married	university	\N	9	plot_Owner	\N	2	0	2	2	0	0	0	1	0	1	2	1	2	1	2	16	1	0	\N	0	0	1	unemployed	>20000	\N	\N	16000_20000	\N	pit_latrine	river	walk	traditional	with_water_and_soap	river	40eaa96e-4008-4fd3-958a-328771a9f6c4	\N
135	158	Jill John Nyangau	Female	20639155	\N	married	primary	\N	26	tenant	\N	1	0	1	2	0	0	0	2	2	0	0	2	0	1	1	12	0	1	\N	0	1	1	unemployed	>20000	\N	\N	0_5000	\N	none	none	matatu	chemist	water_only	private_collector	381fbdfa-4123-4287-89fa-6edf6c587709	\N
136	47	Brian Mutheu Sang	Male	16501437	\N	Cohabiting	secondary	\N	40	plot_Owner	\N	1	0	2	1	1	0	1	0	1	0	1	2	1	0	2	13	1	2	\N	1	1	0	civil_servant	16000_20000	\N	\N	>20000	\N	flush	river	walk	other	none	bins	dc998f96-92b7-4847-83c5-e506feb2aca5	\N
137	172	Gary Mulwa Ogutu	Male	31842315	\N	Seperated	none	\N	24	structure_owner	\N	2	1	0	1	1	1	2	1	0	2	1	1	0	2	0	15	0	1	\N	0	0	1	student	>20000	\N	\N	11000_15000	\N	VIP	vendor	boda	chemist	water_only	bins	a0cfe36d-c906-4ccf-94e2-d400dd9776e3	\N
138	96	Mary Kimaru Simon	Female	01668632	\N	Seperated	secondary	\N	8	tenant	\N	2	0	0	1	2	1	1	0	2	1	1	1	1	1	2	16	0	0	\N	1	0	0	unemployed	0_5000	\N	\N	11000_15000	\N	communal	piped	matatu	private	water_only	private_collector	530267e5-c857-4f82-afef-b85670201766	\N
139	205	Jesse Yatich Dennis	Male	09644553	\N	married	university	\N	15	structure_owner	\N	1	2	2	0	1	0	2	1	2	0	1	1	2	0	2	17	2	2	\N	0	0	0	not_applicable	>20000	\N	\N	>20000	\N	flush	shallow_well	train	other	none	bins	9f02054e-a30f-496a-adfd-62aa7bd24965	\N
140	226	Patrick Onditi Gachoki	Male	10570473	\N	married	secondary	\N	12	plot_Owner	\N	0	1	2	2	1	1	2	0	1	1	0	0	0	0	1	12	2	0	\N	0	1	0	self	6000_10000	\N	\N	16000_20000	\N	flush	none	matatu	mission	water_only	private_collector	332a07d6-8f6f-447a-aac1-012c2419bdc4	\N
141	204	Christine Munene Muinde	Female	64699625	\N	Widowed	secondary	\N	15	structure_owner	\N	0	2	0	1	0	0	1	1	2	0	1	2	2	0	2	14	1	0	\N	0	1	0	student	0_5000	\N	\N	16000_20000	\N	communal	none	bicycle	traditional	with_water_and_soap	dumpsite	93228983-8cd8-4fad-94da-201750d918b9	\N
142	137	Gregory Limo Ismail	Male	76392415	\N	Seperated	college	\N	24	tenant	\N	0	1	2	2	2	2	1	0	1	2	0	2	1	2	0	18	1	1	\N	1	1	1	not_applicable	0_5000	\N	\N	>20000	\N	none	rainwater	walk	public	water_only	dumpsite	ea9f02f6-75d3-4c5e-b02c-2077ef5ebc51	\N
143	103	Juan Mwanzia Kobia	Male	71778543	\N	Single	none	\N	10	plot_Owner	\N	0	0	1	1	2	0	1	1	2	2	1	2	0	0	0	13	1	2	\N	0	0	1	self	>20000	\N	\N	11000_15000	\N	pit_latrine	none	matatu	other	none	private_collector	2bcef535-8cfd-4760-a458-da4efc2d04cc	\N
144	151	Joshua Kiboi Kung'u	Male	08155037	\N	Widowed	none	\N	2	tenant	\N	1	1	1	1	1	0	0	2	0	0	1	0	2	0	2	12	2	2	\N	1	1	0	student	11000_15000	\N	\N	16000_20000	\N	none	vendor	matatu	chemist	water_only	private_collector	7e2e4b84-c522-4df1-b49b-45dc16467e0e	\N
145	14	Aaron Lewa Munguti	Male	49752907	\N	Widowed	university	\N	21	plot_Owner	\N	2	0	0	2	1	1	1	2	2	2	1	0	0	0	1	15	1	2	\N	1	0	1	private	16000_20000	\N	\N	6000_10000	\N	communal	piped	walk	chemist	none	river	4f939a2b-94df-441a-b3f8-d3949ba55a8e	\N
146	118	Tina Mugure Kithome	Female	03955719	\N	married	primary	\N	27	tenant	\N	2	1	2	1	0	1	2	1	1	2	2	2	2	1	1	21	2	1	\N	1	0	1	casual	11000_15000	\N	\N	6000_10000	\N	none	shallow_well	matatu	public	none	bins	2006abaa-2162-46fa-b7ee-fda033318c64	\N
147	123	Donna Ronoh Mutie	Female	69256294	\N	Cohabiting	university	\N	19	plot_Owner	\N	0	2	0	1	0	1	0	2	1	0	0	1	0	0	0	8	2	0	\N	0	0	1	private	11000_15000	\N	\N	16000_20000	\N	flush	rainwater	train	chemist	with_water_and_soap	private_collector	5f5c0ee6-21f3-41cf-b1e2-47f43b3999a3	\N
148	220	Daniel Kabui Adhiambo	Male	07008481	\N	married	secondary	\N	28	structure_owner	\N	1	2	0	0	1	0	0	2	0	1	2	1	2	1	1	14	1	0	\N	1	1	1	casual	16000_20000	\N	\N	16000_20000	\N	communal	none	matatu	private	none	river	81f3adad-3d3d-4cc8-9832-61be0e7454f5	\N
149	146	Kevin Saidi Ali	Male	48284133	\N	Widowed	none	\N	29	structure_owner	\N	2	1	2	0	1	0	1	0	0	0	1	0	1	1	0	10	0	0	\N	0	0	0	private	6000_10000	\N	\N	6000_10000	\N	none	shallow_well	train	private	with_water_and_soap	river	b832b428-2789-453b-ad25-f40e86a169e4	\N
150	42	Jorge Kassim Murage	Male	14248691	\N	Single	college	\N	1	tenant	\N	2	2	0	0	0	2	0	2	2	0	0	0	1	1	0	12	0	1	\N	1	0	0	casual	16000_20000	\N	\N	6000_10000	\N	flush	rainwater	boda	public	with_water_and_soap	dumpsite	028c18d2-468b-4c44-876d-8cc850e55db9	\N
151	177	Nicholas Adhiambo Kimanzi	Male	62052597	\N	Widowed	college	\N	5	structure_owner	\N	2	2	0	2	2	0	0	2	1	1	2	1	2	2	2	21	2	1	\N	0	0	0	civil_servant	6000_10000	\N	\N	6000_10000	\N	none	vendor	matatu	mission	with_water_and_soap	private_collector	21fb15af-da7c-4342-bcd3-9b575c6bd04f	\N
152	126	Christopher Amondi Hassan	Male	83718066	\N	Cohabiting	secondary	\N	22	plot_Owner	\N	2	1	0	0	0	0	1	2	2	2	0	2	0	0	0	12	1	2	\N	0	1	1	student	11000_15000	\N	\N	6000_10000	\N	VIP	piped	walk	traditional	none	bins	d0d4a94c-07b6-4619-b75c-763165e4f5bb	\N
153	104	Howard Mutia Wakio	Male	28250913	\N	married	college	\N	22	structure_owner	\N	2	1	0	2	0	2	1	0	2	1	1	0	2	0	2	16	2	2	\N	1	1	0	casual	>20000	\N	\N	11000_15000	\N	VIP	river	matatu	private	with_water_and_soap	dumpsite	73147e34-9ac0-4e3e-8e78-e8afc68ee098	\N
154	208	Madison Kiptui Mwinzi	Female	26048858	\N	Single	none	\N	40	structure_owner	\N	1	0	1	0	1	2	1	0	1	0	2	1	2	0	1	13	2	1	\N	1	0	0	casual	16000_20000	\N	\N	11000_15000	\N	communal	piped	matatu	traditional	none	private_collector	2e4c2ed9-a147-459f-9ce3-de6588318d43	\N
155	158	Nicole Mohamed Auma	Female	03383889	\N	Cohabiting	college	\N	10	tenant	\N	1	0	2	2	2	0	1	1	2	2	0	1	0	0	2	16	0	1	\N	1	0	0	civil_servant	>20000	\N	\N	6000_10000	\N	communal	river	matatu	mission	none	dumpsite	2af8f9cd-4e99-4a95-88db-d27dd4f924ae	\N
156	237	Jason Safari Gati	Male	63096810	\N	married	university	\N	12	plot_Owner	\N	1	2	2	1	2	2	1	1	1	0	0	1	1	0	1	16	0	2	\N	1	0	0	not_applicable	11000_15000	\N	\N	0_5000	\N	flush	shallow_well	walk	chemist	water_only	dumpsite	5669f4bc-4b35-4952-9b62-cd4c0e07b841	\N
157	183	David Onditi Munguti	Male	25723652	\N	Seperated	college	\N	25	structure_owner	\N	0	0	2	1	1	1	2	2	2	2	0	1	0	2	0	16	2	0	\N	0	0	0	not_applicable	16000_20000	\N	\N	11000_15000	\N	communal	river	matatu	traditional	water_only	river	97db3a35-1a2a-43d0-be80-98cb402a21a2	\N
158	176	Nathan Kiiru Wangui	Male	27994666	\N	Widowed	college	\N	26	plot_Owner	\N	1	2	2	1	1	1	0	1	2	1	1	1	2	1	1	18	2	2	\N	1	0	1	self	6000_10000	\N	\N	11000_15000	\N	VIP	piped	car	other	water_only	private_collector	44861f5c-390c-4e9f-947f-707536dde9e2	\N
159	224	Eric Bett Kirimi	Male	62246344	\N	Cohabiting	secondary	\N	1	structure_owner	\N	1	2	0	1	2	0	0	1	2	1	2	1	2	1	2	18	1	2	\N	1	0	0	unemployed	>20000	\N	\N	11000_15000	\N	pit_latrine	none	walk	chemist	with_water_and_soap	river	9b77a490-7646-46df-b9d4-d1aedc6fa2a7	\N
160	180	Robert Okuku Juma	Male	52334645	\N	married	primary	\N	4	plot_Owner	\N	0	0	0	2	1	2	0	1	1	1	2	0	1	1	1	13	1	2	\N	0	0	1	self	16000_20000	\N	\N	6000_10000	\N	pit_latrine	piped	matatu	chemist	with_water_and_soap	bins	ed2a8195-e7ce-4acf-b434-cb9ada755f45	\N
161	100	Tamara Nandwa Maranga	Female	08339584	\N	Seperated	none	\N	38	plot_Owner	\N	0	1	0	2	0	0	0	1	0	0	0	1	1	0	2	8	2	0	\N	1	0	1	self	>20000	\N	\N	0_5000	\N	none	none	train	traditional	none	private_collector	3aed1e87-9055-4050-8243-d593734d3216	\N
162	130	Jessica Aloo Ogada	Female	42835796	\N	Widowed	primary	\N	29	plot_Owner	\N	1	0	1	0	0	2	2	0	1	2	1	2	1	0	0	13	2	1	\N	1	0	0	self	16000_20000	\N	\N	11000_15000	\N	flush	none	car	private	none	bins	e7475227-abe7-48e5-8d74-7fdda9a0cf43	\N
163	86	Christopher Mutuma Chepkorir	Male	82329814	\N	Single	primary	\N	31	tenant	\N	1	0	1	0	1	2	0	1	0	0	1	1	1	1	1	11	1	0	\N	1	0	1	casual	6000_10000	\N	\N	0_5000	\N	communal	shallow_well	boda	other	with_water_and_soap	river	6063e8bd-d0cd-45ee-b1d0-a3849fd6395e	\N
164	227	Collin Wamboi Kaberia	Male	87798002	\N	Single	none	\N	34	plot_Owner	\N	2	2	1	2	1	0	0	2	1	0	1	1	2	2	0	17	0	1	\N	1	1	1	not_applicable	16000_20000	\N	\N	6000_10000	\N	flush	none	walk	traditional	none	dumpsite	88fbbdec-72f2-4f0f-ad21-609ef3883677	\N
165	158	Tammy Kiio Robert	Female	72419094	\N	Seperated	secondary	\N	19	plot_Owner	\N	2	0	0	2	0	1	0	0	2	2	1	2	0	0	1	13	2	0	\N	1	1	0	self	>20000	\N	\N	6000_10000	\N	flush	river	walk	mission	with_water_and_soap	private_collector	dbab71c4-4d4c-4be3-bde0-c201febc4afc	\N
166	86	Stephanie Oduori Chemutai	Female	66352427	\N	Widowed	university	\N	9	plot_Owner	\N	2	0	1	2	0	1	0	2	2	0	0	2	1	1	0	14	2	1	\N	1	1	0	not_applicable	0_5000	\N	\N	16000_20000	\N	pit_latrine	shallow_well	walk	chemist	with_water_and_soap	private_collector	a1f7ca37-6e2a-4d38-b70e-a5e62e2b3437	\N
167	123	Austin Mukami Joshua	Male	51229378	\N	Widowed	primary	\N	11	plot_Owner	\N	0	2	0	0	2	2	1	2	2	1	2	0	1	2	1	18	1	1	\N	0	1	0	private	16000_20000	\N	\N	0_5000	\N	flush	none	train	other	with_water_and_soap	river	b3aae1bb-b8aa-4974-b2af-cc574b78c773	\N
168	114	Denise Wanyonyi Mwamburi	Female	63888295	\N	Single	none	\N	28	plot_Owner	\N	1	0	1	0	0	1	0	0	0	2	2	1	2	1	1	12	2	2	\N	1	1	0	unemployed	>20000	\N	\N	16000_20000	\N	communal	shallow_well	train	public	none	dumpsite	80893571-083c-4992-9fbc-eef13398c6a2	\N
169	229	Charles Wangui Waithaka	Male	23343810	\N	Cohabiting	none	\N	32	tenant	\N	2	2	0	1	1	0	0	0	1	2	2	2	2	2	2	19	2	2	\N	1	1	1	civil_servant	0_5000	\N	\N	11000_15000	\N	none	river	walk	mission	with_water_and_soap	bins	98f332d5-3632-44b4-bb4c-17b3b002dc52	\N
170	217	Steven Njihia Abdulla	Male	66768603	\N	Single	none	\N	1	structure_owner	\N	2	1	0	0	0	2	0	0	0	0	1	1	2	0	0	9	2	0	\N	0	1	1	civil_servant	6000_10000	\N	\N	16000_20000	\N	VIP	shallow_well	bicycle	chemist	with_water_and_soap	bins	0a8d4000-55c7-404e-9ea3-04e6ad3d1b8a	\N
171	179	Kelly Jeptoo Jeptoo	Female	79658560	\N	Single	college	\N	13	structure_owner	\N	1	2	0	2	2	0	2	0	1	2	0	1	0	0	0	13	2	2	\N	1	1	1	self	16000_20000	\N	\N	11000_15000	\N	pit_latrine	none	boda	chemist	water_only	bins	cb68980c-b2fe-4744-9e10-ecf286620b4e	\N
172	210	Trevor Thomas Githaiga	Male	18462311	\N	married	secondary	\N	31	plot_Owner	\N	1	1	2	1	1	2	1	1	2	1	1	1	2	0	0	17	2	1	\N	1	1	0	student	11000_15000	\N	\N	11000_15000	\N	none	piped	boda	traditional	with_water_and_soap	bins	79074b2a-b5ab-4600-8e13-ee2427ed9997	\N
173	186	Kristine Nyang'au Gure	Female	60618241	\N	Widowed	secondary	\N	10	tenant	\N	2	0	0	1	2	2	0	2	0	2	1	0	1	0	1	14	0	0	\N	0	0	0	private	0_5000	\N	\N	16000_20000	\N	none	rainwater	walk	private	water_only	bins	d3369ff2-64a2-40ec-a04e-692c3db3058e	\N
174	37	Cassandra Mongare Toroitich	Female	76825213	\N	Single	none	\N	22	structure_owner	\N	1	0	0	1	1	0	1	2	2	0	2	0	2	2	1	15	2	1	\N	0	1	0	not_applicable	>20000	\N	\N	>20000	\N	none	rainwater	car	public	with_water_and_soap	river	63335213-e64b-4568-8d03-7912786a2cd6	\N
175	202	Katherine Mahat Abdi	Female	06862996	\N	married	secondary	\N	17	tenant	\N	1	2	1	0	1	2	1	2	0	0	1	0	0	0	1	12	1	0	\N	1	0	1	civil_servant	11000_15000	\N	\N	11000_15000	\N	VIP	river	boda	mission	with_water_and_soap	dumpsite	338fe1ea-83a9-4fb9-bfe6-64ecfe785b93	\N
176	36	Julie Omar Musa	Female	81150445	\N	married	university	\N	15	tenant	\N	1	2	0	1	1	0	0	2	1	1	0	2	2	0	0	13	2	2	\N	1	1	0	student	16000_20000	\N	\N	11000_15000	\N	none	river	walk	traditional	water_only	bins	9eaf38c4-911b-4094-b2fd-0628a9a6aa1d	\N
177	88	Sharon Otieno Kiprop	Female	08154838	\N	married	none	\N	1	plot_Owner	\N	1	0	1	0	0	1	1	1	2	0	1	1	0	2	1	12	0	1	\N	1	0	0	self	6000_10000	\N	\N	0_5000	\N	none	shallow_well	walk	public	with_water_and_soap	private_collector	7ec65818-bfba-46ba-b2d7-6ad31d1615f2	\N
178	34	Kevin Okemwa Ismail	Male	33834581	\N	Single	secondary	\N	34	tenant	\N	2	0	1	1	0	2	2	1	2	0	0	0	0	0	0	11	1	2	\N	0	0	1	self	>20000	\N	\N	0_5000	\N	none	river	train	traditional	water_only	bins	19bd3201-e104-4b13-a515-bfe5e4091e37	\N
179	167	Christina Ojiambo Kathambi	Female	18293460	\N	Seperated	primary	\N	28	tenant	\N	2	2	0	1	1	1	0	2	2	1	0	2	2	2	1	19	2	1	\N	1	1	0	student	11000_15000	\N	\N	>20000	\N	pit_latrine	vendor	walk	chemist	none	private_collector	33ab643e-d4d1-4f17-98d1-05d08d418ce4	\N
180	85	Victoria Kimemia Deng	Female	33296741	\N	married	college	\N	7	plot_Owner	\N	1	2	1	0	1	1	2	2	0	1	0	2	0	0	1	14	1	0	\N	0	0	0	private	>20000	\N	\N	0_5000	\N	none	river	car	chemist	with_water_and_soap	river	1570769e-4f51-41b9-a9ba-e1938616fbb4	\N
181	220	Kelly Mulongo Musili	Female	77385326	\N	Widowed	university	\N	38	plot_Owner	\N	0	0	0	2	2	2	0	1	1	0	2	0	1	0	0	11	2	0	\N	0	0	1	student	6000_10000	\N	\N	>20000	\N	flush	rainwater	car	public	water_only	private_collector	a8ca1012-0723-4d40-af49-459752f6fee2	\N
182	110	Samantha Issack Muhoro	Female	28799566	\N	Widowed	university	\N	36	structure_owner	\N	2	2	0	0	1	2	0	2	1	2	1	2	0	2	1	18	0	2	\N	1	0	1	student	16000_20000	\N	\N	16000_20000	\N	flush	shallow_well	bicycle	traditional	with_water_and_soap	dumpsite	ab97746c-f8cf-46b4-aa8e-1143b985362b	\N
183	24	Cameron Kung'u Mwamburi	Male	68506149	\N	Seperated	primary	\N	19	structure_owner	\N	2	0	1	0	2	0	2	2	1	0	1	0	1	2	1	15	1	0	\N	1	0	0	private	11000_15000	\N	\N	>20000	\N	communal	none	car	private	with_water_and_soap	private_collector	b8e605a9-8b03-44fc-897e-ec43482326f5	\N
184	115	Jason Njogu Omar	Male	61132052	\N	married	university	\N	24	tenant	\N	2	0	2	0	2	2	0	0	0	1	1	1	0	1	0	12	2	1	\N	1	0	1	civil_servant	11000_15000	\N	\N	0_5000	\N	communal	piped	train	private	none	dumpsite	d6946744-3d3a-4a60-8f09-0da500526f7b	\N
185	6	Robert Muhoro Owiti	Male	28308626	\N	Seperated	secondary	\N	32	plot_Owner	\N	2	0	0	1	1	2	0	2	0	0	0	0	0	1	1	10	1	2	\N	0	0	1	student	6000_10000	\N	\N	0_5000	\N	communal	piped	matatu	traditional	with_water_and_soap	dumpsite	9e08e517-27c1-4311-b0b5-2bf526521d92	\N
186	59	Nicholas Moraa Wamalwa	Male	49829936	\N	Widowed	none	\N	7	structure_owner	\N	2	1	0	1	0	1	1	0	2	2	1	2	2	1	0	16	2	2	\N	0	0	1	unemployed	0_5000	\N	\N	>20000	\N	communal	river	car	public	water_only	bins	c8419218-f78b-4a1a-a171-967563a859a0	\N
187	217	Richard Mueni Ngaruiya	Male	73357442	\N	Single	secondary	\N	34	plot_Owner	\N	0	0	0	1	0	1	0	0	2	2	2	2	0	2	1	13	1	0	\N	0	0	0	not_applicable	11000_15000	\N	\N	>20000	\N	pit_latrine	none	train	private	none	private_collector	bc4ed648-6d30-4012-b1f0-75f1db597aef	\N
188	99	Melinda Gichuki Ondieki	Female	24726308	\N	Single	primary	\N	3	plot_Owner	\N	0	2	1	0	1	2	0	2	1	1	1	1	0	1	2	15	0	1	\N	0	1	0	student	>20000	\N	\N	>20000	\N	none	rainwater	boda	traditional	water_only	river	7ec81c6e-09ab-4609-ac08-d1528ef82058	\N
189	88	Harry Okuku Mogire	Male	51355905	\N	Single	primary	\N	7	structure_owner	\N	2	1	2	0	1	1	0	2	2	0	2	1	2	0	1	17	2	0	\N	1	0	0	civil_servant	16000_20000	\N	\N	0_5000	\N	communal	shallow_well	walk	mission	with_water_and_soap	river	8ad1dd3c-1010-4b0e-81f4-62f3e88909f8	\N
190	163	Ruth Jepkemboi Mumbe	Female	81118759	\N	Cohabiting	none	\N	9	plot_Owner	\N	0	1	2	2	1	0	1	1	0	2	2	2	0	0	1	15	0	1	\N	1	1	0	private	11000_15000	\N	\N	16000_20000	\N	communal	none	train	private	with_water_and_soap	river	914c7a5c-b493-4d54-8f48-bedb949f5217	\N
191	59	Dorothy Mukundi Juma	Female	89051379	\N	Widowed	college	\N	22	plot_Owner	\N	2	0	0	1	1	1	1	2	1	1	0	1	0	1	2	14	0	1	\N	0	0	0	private	11000_15000	\N	\N	>20000	\N	pit_latrine	none	walk	public	with_water_and_soap	private_collector	fdfcbd1b-7876-41ee-b272-accbedf3286d	\N
192	61	Kayla Abdi Kioko	Female	30446795	\N	Widowed	college	\N	6	plot_Owner	\N	1	2	2	1	2	0	2	0	1	2	1	2	1	0	0	17	0	2	\N	0	0	0	unemployed	>20000	\N	\N	16000_20000	\N	none	none	walk	traditional	with_water_and_soap	bins	f8356e15-88ae-4d40-9ff6-b8c3c9f5cafa	\N
193	22	Daniel Kagendo Ojiambo	Male	29443148	\N	married	primary	\N	27	plot_Owner	\N	0	2	2	0	1	0	2	0	1	0	0	2	1	2	0	13	0	2	\N	0	1	1	self	11000_15000	\N	\N	6000_10000	\N	flush	none	matatu	chemist	water_only	private_collector	e3bff601-7a2c-4f8b-b533-8328e418651d	\N
194	150	Gwendolyn Kendi Changawa	Female	26157029	\N	Seperated	college	\N	40	structure_owner	\N	1	1	2	2	1	0	2	1	1	2	2	2	0	1	0	18	0	2	\N	1	1	1	unemployed	16000_20000	\N	\N	11000_15000	\N	flush	rainwater	train	traditional	water_only	bins	0e8847b6-546a-4fc8-b356-c7f1bd2af9bd	\N
195	19	Sandy Kamene Koome	Female	44519152	\N	Single	secondary	\N	20	tenant	\N	2	0	1	2	1	1	2	1	0	0	1	2	2	2	1	18	1	2	\N	0	1	0	not_applicable	16000_20000	\N	\N	6000_10000	\N	flush	none	bicycle	traditional	water_only	private_collector	bf29299f-6179-475d-8026-f1e2a0fb17b0	\N
196	185	Cindy Oloo Adongo	Female	28281625	\N	married	primary	\N	3	plot_Owner	\N	2	2	1	0	2	1	0	2	0	0	2	1	1	2	2	18	2	2	\N	0	0	1	private	6000_10000	\N	\N	16000_20000	\N	VIP	vendor	car	chemist	with_water_and_soap	bins	72775ba8-4e87-4259-ab12-74550fd31b5f	\N
197	185	Tonya Mutiso Kibiwot	Female	25017348	\N	married	none	\N	28	structure_owner	\N	0	0	0	0	2	2	0	0	1	0	2	0	0	1	1	9	1	2	\N	1	1	0	self	>20000	\N	\N	0_5000	\N	communal	river	bicycle	public	none	private_collector	c7d828cf-b808-49d1-a49b-2beef8845c95	\N
198	46	Edward Jepkoech Muriithi	Male	62639907	\N	Single	university	\N	6	tenant	\N	0	0	0	2	2	0	2	2	2	1	1	2	1	1	0	16	2	2	\N	1	0	0	private	0_5000	\N	\N	>20000	\N	pit_latrine	river	car	other	none	bins	ebf51f52-65ec-478d-abb3-d1be92cd25b2	\N
199	121	Erica Sakwa Ndinda	Female	10676509	\N	married	university	\N	25	tenant	\N	2	2	0	1	2	2	0	1	1	2	2	1	2	0	1	19	2	2	\N	1	1	1	casual	0_5000	\N	\N	16000_20000	\N	flush	shallow_well	matatu	private	water_only	dumpsite	770f185c-9743-4717-980a-a546450c19b0	\N
200	156	Kathryn Odoyo Muriungi	Female	53086032	\N	Single	none	\N	4	plot_Owner	\N	2	1	1	2	0	0	2	1	2	0	2	0	2	2	2	19	0	0	\N	1	1	0	private	16000_20000	\N	\N	16000_20000	\N	communal	rainwater	train	chemist	with_water_and_soap	bins	d53e4332-183a-4690-a38b-c104cc9b9b5e	\N
201	207	Robin Khisa Mayaka	Female	39559429	\N	married	none	\N	15	plot_Owner	\N	1	2	1	1	0	2	1	2	1	1	1	1	0	2	2	18	2	1	\N	1	0	0	self	>20000	\N	\N	16000_20000	\N	pit_latrine	river	walk	other	none	river	9b69964b-8aae-4c21-825d-bfce47abd5d5	\N
202	203	Christopher Wesonga Chesire	Male	05950559	\N	Cohabiting	college	\N	17	tenant	\N	2	2	2	0	2	0	2	1	1	1	1	0	0	2	0	16	2	0	\N	1	1	1	private	>20000	\N	\N	0_5000	\N	VIP	river	car	public	with_water_and_soap	private_collector	824be1ef-afdb-400d-aeef-8405b5ffed20	\N
203	86	Dana Bonaya Ogada	Female	00258258	\N	married	primary	\N	18	structure_owner	\N	1	0	2	2	1	1	1	2	2	1	0	1	0	1	2	17	0	1	\N	1	1	1	unemployed	11000_15000	\N	\N	16000_20000	\N	none	none	bicycle	other	none	bins	307671e8-750a-49ab-b7bd-aa9690b3a6a4	\N
204	35	Ashley Kundu Adhiambo	Female	57608433	\N	Single	secondary	\N	14	plot_Owner	\N	0	2	0	1	1	1	2	2	0	1	0	2	0	1	1	14	0	2	\N	1	0	1	private	16000_20000	\N	\N	6000_10000	\N	VIP	piped	matatu	private	with_water_and_soap	dumpsite	47508248-b3d0-4228-bcf9-3801e49d7b98	\N
205	88	Andrew Muriuki Muya	Male	69549522	\N	Single	college	\N	3	structure_owner	\N	0	1	1	2	2	2	1	0	1	1	2	1	1	1	0	16	0	2	\N	0	1	0	self	0_5000	\N	\N	>20000	\N	VIP	vendor	bicycle	traditional	water_only	river	dc5999af-b7e2-46b2-855a-db9856c3f5ff	\N
206	212	Sarah Nyangau Muriungi	Female	04047484	\N	Single	none	\N	12	structure_owner	\N	2	2	0	2	0	0	2	2	1	0	2	0	2	1	2	18	1	1	\N	1	1	0	student	0_5000	\N	\N	0_5000	\N	communal	shallow_well	train	private	water_only	private_collector	433fb1f2-0338-4e4b-b9e0-10be58a52ea9	\N
207	183	Jason Muriuki Lumumba	Male	15571305	\N	Cohabiting	college	\N	21	plot_Owner	\N	2	1	0	1	0	0	2	0	0	2	1	2	0	0	0	11	2	0	\N	0	0	0	not_applicable	6000_10000	\N	\N	11000_15000	\N	pit_latrine	vendor	train	private	with_water_and_soap	dumpsite	2e367d10-2cbf-4ff1-9c71-090a0fecf843	\N
208	160	Daniel Muriungi Nyamweya	Male	58933246	\N	Seperated	university	\N	1	structure_owner	\N	1	1	1	2	0	0	2	0	1	1	1	0	2	2	2	16	1	1	\N	1	0	1	private	>20000	\N	\N	>20000	\N	VIP	river	walk	traditional	none	dumpsite	e44c33b4-1a9f-42d8-b153-717985f0d378	\N
209	189	Emily Kimeli Keya	Female	42947159	\N	Seperated	secondary	\N	33	structure_owner	\N	0	2	0	2	0	1	2	2	2	2	2	0	2	0	1	18	1	1	\N	1	0	1	student	6000_10000	\N	\N	6000_10000	\N	communal	vendor	boda	public	with_water_and_soap	private_collector	943de5e6-0e1c-4fe0-9a78-8378cc2f8657	\N
210	132	Jason Keitany Mayaka	Male	14004722	\N	married	secondary	\N	16	tenant	\N	0	1	1	0	1	1	1	2	1	0	1	0	0	0	2	11	1	2	\N	0	0	1	student	16000_20000	\N	\N	16000_20000	\N	pit_latrine	rainwater	bicycle	chemist	water_only	bins	7084a32b-fe65-4c09-a8a3-f9ec489d64fb	\N
211	175	Scott Murunga Chege	Male	31823274	\N	Single	none	\N	36	plot_Owner	\N	0	0	1	1	2	2	0	1	0	2	2	0	1	2	1	15	1	2	\N	1	1	0	not_applicable	16000_20000	\N	\N	>20000	\N	none	rainwater	walk	public	with_water_and_soap	bins	5733f3e1-b87f-49c7-8a71-60ba4fe5cfd6	\N
212	64	Daniel Mbaka Koech	Male	71318444	\N	Widowed	secondary	\N	20	tenant	\N	0	2	2	1	0	2	1	0	2	0	1	0	1	1	1	14	1	2	\N	1	0	1	student	11000_15000	\N	\N	6000_10000	\N	communal	piped	walk	other	water_only	dumpsite	b10602bd-ab05-4725-92c0-bdda56249273	\N
213	187	Amanda Mboya Muteti	Female	62892221	\N	Single	primary	\N	0	tenant	\N	1	2	1	2	0	0	0	2	1	0	1	2	2	2	2	18	0	0	\N	1	1	1	student	11000_15000	\N	\N	16000_20000	\N	none	piped	car	public	with_water_and_soap	private_collector	2318d728-8083-49ff-8fcc-7771452b7195	\N
214	222	Melissa Wanga Ngome	Female	20868479	\N	Single	secondary	\N	38	structure_owner	\N	1	2	1	1	1	0	1	1	1	1	2	2	0	1	0	15	2	0	\N	1	0	1	not_applicable	>20000	\N	\N	16000_20000	\N	flush	rainwater	walk	other	water_only	bins	741d8fcf-fab8-4c4c-9ceb-1190981dfc17	\N
215	71	Theresa Wario Karuga	Female	06336938	\N	Widowed	primary	\N	27	structure_owner	\N	0	1	1	0	0	0	1	0	0	1	0	2	2	0	0	8	0	0	\N	1	1	0	student	16000_20000	\N	\N	6000_10000	\N	none	vendor	train	mission	none	river	e359c942-fc01-4454-85bf-2ec470faf896	\N
216	99	Travis Githinji Karuga	Male	12355691	\N	Seperated	none	\N	23	structure_owner	\N	0	1	1	1	2	2	2	2	2	1	0	2	2	0	0	18	1	2	\N	1	1	0	civil_servant	0_5000	\N	\N	0_5000	\N	pit_latrine	vendor	train	private	water_only	dumpsite	af6936e0-bcff-45a0-8094-4798a1fdcaee	\N
217	77	Jennifer Makungu Nyamawi	Female	21742909	\N	Widowed	college	\N	5	tenant	\N	2	1	2	1	2	0	0	0	0	1	1	0	1	1	2	14	2	2	\N	0	0	0	civil_servant	>20000	\N	\N	0_5000	\N	none	piped	boda	public	none	bins	85541807-910e-4891-839b-a454cc28ad32	\N
218	224	Cristian Gachanja Kithome	Male	86950713	\N	Seperated	primary	\N	2	structure_owner	\N	0	0	2	1	0	1	2	2	2	0	1	0	1	0	0	12	2	0	\N	0	0	0	civil_servant	16000_20000	\N	\N	6000_10000	\N	none	rainwater	bicycle	other	none	private_collector	0aa15e2c-c0e2-430c-8192-6c437fb58adc	\N
219	53	Rachael Kuria Yegon	Female	44383166	\N	Cohabiting	primary	\N	13	plot_Owner	\N	0	2	1	1	2	0	2	0	2	1	2	1	1	2	0	17	1	2	\N	0	0	1	self	16000_20000	\N	\N	6000_10000	\N	pit_latrine	piped	walk	mission	water_only	bins	7466eb57-2158-4178-85f7-4d99bd6b3ad9	\N
220	135	Kristen Mauti Nyangau	Female	47962896	\N	Seperated	primary	\N	6	tenant	\N	1	1	0	2	1	0	0	1	2	0	0	1	1	0	1	11	0	0	\N	0	0	0	student	16000_20000	\N	\N	>20000	\N	VIP	vendor	matatu	other	with_water_and_soap	private_collector	a81afdfc-e0ee-4f4d-ab28-e3b7bc3859b7	\N
221	229	James Musyoka Wanjala	Male	36056429	\N	Single	primary	\N	27	structure_owner	\N	0	0	2	0	1	0	2	1	0	1	1	0	2	1	1	12	1	0	\N	0	0	1	private	11000_15000	\N	\N	6000_10000	\N	none	piped	boda	other	with_water_and_soap	dumpsite	35b4082c-ee16-4c7f-8fd3-7f9ed6154438	\N
222	91	Tammy Martin Karimi	Female	83505698	\N	Seperated	primary	\N	8	tenant	\N	2	2	2	1	0	0	2	1	2	2	1	0	1	1	0	17	1	0	\N	1	0	1	civil_servant	>20000	\N	\N	16000_20000	\N	VIP	piped	train	traditional	with_water_and_soap	dumpsite	37e42059-53e8-4155-8280-03746abbdbb9	\N
223	125	Martha Nyambura Muya	Female	04608571	\N	Seperated	university	\N	1	structure_owner	\N	2	2	2	0	2	0	0	1	2	1	1	1	2	0	2	18	1	0	\N	1	0	1	private	0_5000	\N	\N	>20000	\N	VIP	none	walk	traditional	with_water_and_soap	dumpsite	9eb47866-2a69-4404-9ec8-1f46d3d73cc5	\N
224	125	John Yego Mutisya	Male	56831379	\N	Widowed	none	\N	7	structure_owner	\N	2	2	2	0	2	2	2	0	2	2	0	0	2	2	1	21	1	0	\N	0	0	0	self	6000_10000	\N	\N	6000_10000	\N	none	piped	boda	chemist	none	private_collector	3f207f87-62e5-47ca-af27-7d7cbcfa8965	\N
225	118	Robert Muoki Tirop	Male	43133997	\N	Widowed	university	\N	38	tenant	\N	1	1	0	0	2	2	1	0	0	0	1	2	2	1	0	13	0	0	\N	0	1	1	civil_servant	>20000	\N	\N	>20000	\N	flush	rainwater	boda	public	with_water_and_soap	dumpsite	4285d578-cc83-48aa-8f26-172a499e67b3	\N
226	170	Shannon Sila Ouko	Female	86309489	\N	Seperated	primary	\N	35	plot_Owner	\N	0	2	2	2	1	0	2	1	2	2	0	0	1	1	2	18	1	2	\N	1	1	0	private	16000_20000	\N	\N	0_5000	\N	none	vendor	boda	other	water_only	bins	191c86a4-4f5a-4146-bdac-5e601dce289f	\N
227	172	Christy Wario Kadzo	Female	54721517	\N	Single	university	\N	32	tenant	\N	0	1	2	1	0	2	1	1	1	1	1	2	1	0	0	14	1	1	\N	0	0	1	student	>20000	\N	\N	6000_10000	\N	flush	rainwater	train	mission	with_water_and_soap	dumpsite	849e49d2-21a4-46e2-b647-7a7f85d0e526	\N
228	88	Rachel Ooko Mokua	Female	02678266	\N	Cohabiting	university	\N	29	structure_owner	\N	0	1	2	1	1	0	2	1	1	2	0	0	2	0	2	15	1	1	\N	1	1	0	casual	16000_20000	\N	\N	>20000	\N	pit_latrine	shallow_well	walk	chemist	with_water_and_soap	dumpsite	35c3e0df-a3cd-4785-ad9a-09d02f636b4b	\N
229	180	Taylor Chepkoech Nthiga	Female	14465478	\N	Seperated	college	\N	26	tenant	\N	1	1	1	2	1	0	1	1	2	2	2	0	0	0	0	14	2	2	\N	0	1	1	civil_servant	0_5000	\N	\N	0_5000	\N	flush	piped	walk	public	with_water_and_soap	bins	fafaf61c-422e-4086-9479-69cca511fe29	\N
230	57	Joseph Ndinda Ambani	Male	04022015	\N	Seperated	university	\N	31	tenant	\N	0	2	0	1	0	2	0	0	0	0	2	0	1	1	1	10	2	2	\N	1	1	0	student	11000_15000	\N	\N	0_5000	\N	none	vendor	car	mission	water_only	river	86a28a39-2cfb-42c3-8248-60a37f93f46d	\N
231	71	Omar Gathogo Soita	Male	33036378	\N	Seperated	none	\N	22	plot_Owner	\N	0	1	0	2	1	2	2	0	1	1	0	1	1	1	0	13	0	2	\N	0	0	1	unemployed	6000_10000	\N	\N	0_5000	\N	pit_latrine	river	boda	other	none	dumpsite	54df79ef-6638-4c29-a2c5-f62e0f6ea36d	\N
232	203	Eric Mulinge Serem	Male	76892325	\N	Cohabiting	primary	\N	3	tenant	\N	1	2	1	0	2	2	2	0	0	1	0	1	1	1	1	15	0	0	\N	0	0	1	self	>20000	\N	\N	11000_15000	\N	communal	shallow_well	walk	public	water_only	dumpsite	b32e867d-4c2f-48d2-a4f7-b2864a6cc976	\N
233	20	William Mwende Katana	Male	84494159	\N	Seperated	secondary	\N	34	plot_Owner	\N	2	0	0	0	0	2	2	1	1	1	2	2	1	1	2	17	1	1	\N	0	1	0	unemployed	0_5000	\N	\N	0_5000	\N	flush	none	bicycle	public	none	river	a5bd5a23-3d97-416f-959c-49355e2bb2eb	\N
234	217	Miranda Mbatha Murigi	Female	81010163	\N	Widowed	secondary	\N	10	structure_owner	\N	1	1	0	2	1	2	1	2	1	1	2	2	0	2	0	18	2	1	\N	0	1	1	not_applicable	16000_20000	\N	\N	0_5000	\N	none	shallow_well	matatu	public	with_water_and_soap	bins	bea789c4-1a5f-4670-978a-39b6eaa34e5d	\N
235	57	Jennifer Nzai Biwott	Female	45695830	\N	Widowed	secondary	\N	40	plot_Owner	\N	0	1	2	0	1	2	0	1	1	1	1	0	0	2	2	14	1	2	\N	0	0	0	unemployed	11000_15000	\N	\N	16000_20000	\N	VIP	shallow_well	boda	other	with_water_and_soap	dumpsite	1cdfe9e2-e104-45e6-a20d-0228e413700b	\N
236	147	Jeffrey Nzau Athman	Male	30201069	\N	Cohabiting	primary	\N	35	structure_owner	\N	2	0	2	0	1	2	0	1	0	2	1	2	2	1	1	17	0	0	\N	1	0	1	not_applicable	0_5000	\N	\N	6000_10000	\N	flush	none	car	public	none	river	819a6157-9698-4fdc-aa9d-fa355ad2ea75	\N
237	120	Donald Muthee Musili	Male	89698615	\N	Single	secondary	\N	35	structure_owner	\N	2	0	2	0	2	0	1	1	0	1	1	2	1	2	0	15	2	0	\N	0	0	1	unemployed	11000_15000	\N	\N	0_5000	\N	VIP	river	car	other	with_water_and_soap	bins	98b4c8f2-ba22-4e3b-8334-63709231049c	\N
238	125	Charles Kipngeno Masinde	Male	64697045	\N	Widowed	primary	\N	12	tenant	\N	2	2	0	2	2	2	0	1	0	0	1	0	0	1	0	13	0	0	\N	1	1	1	unemployed	6000_10000	\N	\N	6000_10000	\N	VIP	river	walk	other	water_only	private_collector	e2fb5306-f828-4309-a784-7e5c932e126e	\N
239	218	Shannon Waweru Koros	Female	36785755	\N	Seperated	college	\N	18	tenant	\N	2	1	2	0	2	0	1	1	1	0	2	2	2	1	0	17	2	1	\N	0	0	0	not_applicable	0_5000	\N	\N	16000_20000	\N	pit_latrine	rainwater	car	other	none	dumpsite	682f04f2-fa93-4b89-859d-d82499581394	\N
240	61	Scott William Murage	Male	53859121	\N	Single	college	\N	19	structure_owner	\N	1	2	0	0	0	2	2	1	0	1	0	1	2	2	2	16	1	2	\N	0	0	0	student	16000_20000	\N	\N	6000_10000	\N	VIP	vendor	train	other	with_water_and_soap	dumpsite	7685e983-9075-4c01-90e0-3d4641b8f4c7	\N
241	100	Matthew Kimeli Philip	Male	79876003	\N	Widowed	college	\N	40	structure_owner	\N	2	1	2	0	0	2	2	1	1	2	0	2	1	2	1	19	0	0	\N	1	1	1	self	>20000	\N	\N	0_5000	\N	none	river	train	traditional	water_only	private_collector	4ed5d4bb-a228-40b8-8dbf-d779ec3c6492	\N
242	193	Christine Mwongela Ndegwa	Female	06633926	\N	Seperated	primary	\N	31	plot_Owner	\N	0	1	1	2	1	2	2	1	1	2	0	2	1	0	1	17	1	1	\N	0	1	1	unemployed	6000_10000	\N	\N	6000_10000	\N	pit_latrine	river	car	traditional	with_water_and_soap	private_collector	c8ad8f66-9402-4673-82d0-35f5a2d14dce	\N
243	29	Anthony Mumbe Kennedy	Male	36139716	\N	married	none	\N	8	plot_Owner	\N	2	2	1	2	0	0	2	0	2	2	2	2	2	2	1	22	2	1	\N	0	0	1	civil_servant	16000_20000	\N	\N	11000_15000	\N	flush	vendor	bicycle	private	none	dumpsite	089b4174-0ba2-4b54-ad50-71aff3e52649	\N
244	15	Steven Masinde Mumbua	Male	44998259	\N	married	secondary	\N	2	tenant	\N	0	0	1	2	0	0	1	1	2	0	0	1	0	0	1	9	2	0	\N	0	1	0	unemployed	16000_20000	\N	\N	0_5000	\N	flush	shallow_well	boda	mission	water_only	dumpsite	c531918b-da80-4e74-a387-2b5601559859	\N
245	130	Dean Kakai Kiplangat	Male	80402810	\N	Seperated	primary	\N	13	tenant	\N	0	2	0	2	2	0	0	1	1	1	0	2	0	0	2	13	2	0	\N	0	1	1	self	11000_15000	\N	\N	>20000	\N	communal	piped	car	traditional	water_only	bins	74d0e5d2-7b40-4c4b-a6a5-c0408f26dbe0	\N
246	95	Dominique Rugut Munyua	Female	36309165	\N	Widowed	secondary	\N	6	tenant	\N	2	0	0	1	2	1	2	2	2	0	2	2	2	2	0	20	2	2	\N	0	0	0	self	16000_20000	\N	\N	16000_20000	\N	flush	none	boda	chemist	with_water_and_soap	bins	9e9c3843-7498-43ab-81e6-d951bd4a5a3b	\N
247	107	David Chebon Ndiema	Male	05705035	\N	Widowed	secondary	\N	27	plot_Owner	\N	2	1	2	0	0	1	1	0	0	0	1	2	0	2	1	13	2	2	\N	1	0	0	not_applicable	0_5000	\N	\N	>20000	\N	flush	shallow_well	car	mission	none	private_collector	c8c3062c-f0c3-431e-88b0-eb966830fbfa	\N
248	160	Thomas Misiko Kinuthia	Male	38047438	\N	married	university	\N	20	plot_Owner	\N	0	2	2	2	2	0	1	1	1	0	0	1	0	1	1	14	2	2	\N	0	0	0	casual	16000_20000	\N	\N	>20000	\N	none	piped	train	private	water_only	river	fb617247-0acb-4b21-bddb-8b477e7185eb	\N
249	199	Pamela Momanyi Ombati	Female	29491820	\N	married	college	\N	3	tenant	\N	0	1	1	1	1	0	0	1	1	0	0	0	1	1	2	10	2	0	\N	0	0	0	self	0_5000	\N	\N	0_5000	\N	flush	shallow_well	boda	private	with_water_and_soap	dumpsite	5b704654-5780-4a60-879f-088567e45d4d	\N
250	39	Jacqueline Jemutai Muya	Female	32450691	\N	Single	primary	\N	24	structure_owner	\N	0	2	1	0	1	2	2	0	1	2	0	1	0	1	2	15	1	1	\N	0	1	0	civil_servant	16000_20000	\N	\N	6000_10000	\N	none	vendor	boda	private	water_only	dumpsite	f0bcb0f5-c37c-4d32-b2da-73870df29574	\N
251	38	Lisa Kiprono Saruni	Female	80678898	\N	married	college	\N	8	tenant	\N	1	1	1	2	2	1	2	2	2	0	0	0	1	0	0	15	0	0	\N	1	0	0	not_applicable	16000_20000	\N	\N	0_5000	\N	flush	none	matatu	public	none	river	f81e469c-0b94-4a97-ad77-30e694f0f569	\N
252	59	Melissa Tuwei Muuo	Female	12504237	\N	Cohabiting	secondary	\N	23	tenant	\N	0	0	1	1	1	1	1	1	1	1	2	0	1	2	0	13	2	1	\N	1	1	1	not_applicable	0_5000	\N	\N	0_5000	\N	communal	river	matatu	public	none	dumpsite	4277a2b4-6d2e-4089-ad50-9c67c88d7a30	\N
253	14	Thomas Kirimi Mutanu	Male	07827339	\N	Single	none	\N	20	structure_owner	\N	2	0	0	2	1	1	2	0	0	2	1	2	2	2	2	19	0	0	\N	1	0	0	not_applicable	>20000	\N	\N	16000_20000	\N	none	piped	matatu	traditional	none	river	a1d9b7b9-8d93-43a4-8088-408c362b80a9	\N
254	27	Alexis Kipleting Jepkogei	Female	48869514	\N	Single	secondary	\N	38	plot_Owner	\N	0	1	1	0	1	2	1	2	0	1	2	0	1	0	1	13	0	2	\N	1	0	1	student	6000_10000	\N	\N	>20000	\N	pit_latrine	shallow_well	bicycle	public	none	river	3be0217a-1f38-490f-8740-3aa4da7bfd70	\N
255	82	Kurt Wanjohi Cheruiyot	Male	58728272	\N	Cohabiting	primary	\N	1	plot_Owner	\N	0	1	1	2	0	0	2	0	2	0	1	0	1	0	1	11	2	2	\N	1	0	0	private	11000_15000	\N	\N	6000_10000	\N	VIP	piped	matatu	private	with_water_and_soap	dumpsite	943fa7b3-46f1-4bfe-8f9f-8784800f47ef	\N
256	14	Derek Chesang Kimeu	Male	45963785	\N	Cohabiting	none	\N	29	tenant	\N	0	1	0	0	2	0	2	1	1	1	1	2	1	1	2	15	2	2	\N	0	0	0	not_applicable	>20000	\N	\N	16000_20000	\N	communal	vendor	boda	other	none	river	c53b7396-acc0-4757-bb91-6c5fe663fe4f	\N
257	56	Zachary Kiprono Mutinda	Male	44880173	\N	married	university	\N	14	tenant	\N	0	0	2	2	1	1	1	0	2	2	0	2	2	0	2	17	1	0	\N	0	1	0	not_applicable	16000_20000	\N	\N	16000_20000	\N	flush	none	matatu	private	with_water_and_soap	river	1f51851f-f01c-4a47-bbe9-b216443f767a	\N
258	237	Cindy Mulei Mutiso	Female	21459601	\N	married	primary	\N	16	tenant	\N	1	0	0	2	1	1	0	2	1	2	1	0	1	1	1	14	1	1	\N	1	1	0	not_applicable	0_5000	\N	\N	6000_10000	\N	pit_latrine	rainwater	boda	private	none	private_collector	925e54ba-33d8-44a2-a31d-92aebd19ead1	\N
259	24	Christopher Kipchirchir Apiyo	Male	31011336	\N	Cohabiting	secondary	\N	20	plot_Owner	\N	0	1	1	0	2	1	0	2	2	2	2	2	2	1	1	19	0	0	\N	1	0	0	self	16000_20000	\N	\N	11000_15000	\N	none	river	boda	mission	none	bins	315fe47e-08ea-4401-8005-5619205e5157	\N
260	228	Lori Obara Tirop	Female	52870230	\N	Widowed	primary	\N	36	tenant	\N	2	1	2	1	1	0	0	2	2	1	0	0	1	2	2	17	0	0	\N	1	1	0	not_applicable	16000_20000	\N	\N	0_5000	\N	none	piped	car	traditional	none	bins	12496723-b14e-4063-a55b-3dbf3a550261	\N
261	20	Mario Ndege Kimeli	Male	35163562	\N	Widowed	university	\N	21	plot_Owner	\N	1	0	0	1	1	2	1	1	1	1	1	0	2	1	0	13	1	1	\N	1	1	0	casual	6000_10000	\N	\N	>20000	\N	flush	shallow_well	boda	private	none	private_collector	20564984-bd6b-44e8-8e49-f8a4cc04ccea	\N
262	39	Amanda Gichuhi Kingori	Female	66253895	\N	Single	secondary	\N	20	plot_Owner	\N	1	1	2	2	1	0	0	2	2	1	2	1	2	1	1	19	2	2	\N	0	1	1	student	16000_20000	\N	\N	6000_10000	\N	VIP	piped	matatu	traditional	with_water_and_soap	river	71c0b471-f21e-491b-bc75-ab354be95741	\N
263	225	Deborah Issa Soita	Female	12171088	\N	Seperated	secondary	\N	34	structure_owner	\N	1	2	0	1	0	2	1	2	2	1	0	2	2	0	1	17	2	2	\N	0	0	1	not_applicable	6000_10000	\N	\N	>20000	\N	flush	river	walk	other	water_only	private_collector	b43db7e6-bcc2-4f72-9904-07a48726a9cd	\N
264	119	Patrick Kimaru Obuya	Male	25326804	\N	Seperated	college	\N	21	plot_Owner	\N	0	1	2	2	0	2	2	0	2	2	2	2	1	1	1	20	1	2	\N	0	1	0	casual	>20000	\N	\N	>20000	\N	communal	piped	train	traditional	water_only	bins	4fabbc9e-a01a-4c4a-8b92-74fb18ed408e	\N
265	198	Daniel Saidi Ndwiga	Male	78692504	\N	Widowed	none	\N	15	structure_owner	\N	1	1	0	2	2	1	0	0	1	0	0	2	2	0	1	13	0	1	\N	1	0	0	civil_servant	>20000	\N	\N	16000_20000	\N	pit_latrine	shallow_well	walk	traditional	with_water_and_soap	dumpsite	133db74f-279b-4824-be89-a8ab590eeb16	\N
266	1	Sarah Jumba Saidi	Female	63661999	\N	Single	none	\N	3	structure_owner	\N	1	0	1	1	1	1	1	1	0	2	2	1	2	2	0	16	2	1	\N	1	0	0	casual	0_5000	\N	\N	16000_20000	\N	none	river	bicycle	public	with_water_and_soap	dumpsite	48697eb9-5185-4b5c-9966-afd4da0e7943	\N
267	301	Michelle Kombe Khalif	Female	71695824	\N	Seperated	university	\N	24	plot_Owner	\N	2	1	1	2	0	2	0	0	0	0	1	0	2	2	0	13	2	2	\N	1	1	0	self	11000_15000	\N	\N	11000_15000	\N	VIP	none	bicycle	other	water_only	bins	f2105434-0d80-499e-8510-7599166b219b	\N
268	17	Laurie Obara Gathogo	Female	17781956	\N	Cohabiting	college	\N	30	structure_owner	\N	0	0	2	1	0	1	2	1	2	2	2	0	0	0	1	14	1	2	\N	0	1	1	self	16000_20000	\N	\N	16000_20000	\N	none	piped	walk	traditional	with_water_and_soap	dumpsite	825c67b6-0b93-47f0-9203-b8f7c9d6c467	\N
269	68	Timothy Joseph Wanga	Male	60710394	\N	Cohabiting	secondary	\N	33	structure_owner	\N	2	1	1	0	2	0	1	1	1	0	2	1	0	0	1	13	0	1	\N	1	0	0	casual	>20000	\N	\N	6000_10000	\N	communal	none	car	chemist	water_only	private_collector	c402da92-0ad1-4743-80e9-7e250d80d6fa	\N
270	49	Bailey Adow Waithera	Female	35069785	\N	Seperated	primary	\N	10	structure_owner	\N	1	0	0	2	1	1	1	1	0	0	1	2	1	2	2	15	2	2	\N	1	1	0	civil_servant	6000_10000	\N	\N	16000_20000	\N	none	vendor	matatu	public	none	dumpsite	b6e041d4-edac-4ef7-9815-ce71582c04dc	\N
271	22	Jim Akoth Kiprono	Male	58158334	\N	Seperated	none	\N	35	tenant	\N	2	1	0	2	1	0	2	0	1	2	0	1	1	0	1	14	1	2	\N	0	1	1	casual	11000_15000	\N	\N	0_5000	\N	communal	river	train	private	water_only	private_collector	d750baba-5ad9-4db9-93f6-0bfbe21035d2	\N
272	137	Joseph Baya Jillo	Male	86955309	\N	Seperated	primary	\N	36	tenant	\N	2	2	1	1	1	1	0	0	1	0	0	0	1	0	0	10	0	0	\N	0	0	0	unemployed	>20000	\N	\N	0_5000	\N	flush	river	bicycle	chemist	water_only	river	0afc34ff-6816-4566-9318-dd9ed15041f1	\N
273	32	Lauren Tsuma Kendi	Female	18533750	\N	Cohabiting	none	\N	1	structure_owner	\N	0	1	0	0	1	1	2	0	2	1	0	0	0	0	2	10	0	0	\N	0	0	0	casual	6000_10000	\N	\N	6000_10000	\N	communal	none	car	chemist	with_water_and_soap	river	a8a1e508-3606-4bd9-9e2f-ce7121554124	\N
274	165	Christopher Kuria Dennis	Male	38908965	\N	Widowed	none	\N	9	tenant	\N	1	2	1	2	2	2	0	1	1	0	2	2	1	0	1	18	2	0	\N	0	1	1	private	>20000	\N	\N	11000_15000	\N	flush	none	matatu	other	with_water_and_soap	private_collector	61a82a63-d8e9-4ea0-ada1-e4d49284771f	\N
275	205	Jeffery Saitoti Kimutai	Male	73246805	\N	Widowed	none	\N	1	plot_Owner	\N	1	0	0	1	0	0	0	1	0	2	0	0	2	1	1	9	1	2	\N	0	1	0	civil_servant	16000_20000	\N	\N	16000_20000	\N	none	rainwater	train	mission	with_water_and_soap	private_collector	eda802fb-ad64-46d7-a49a-c15ece4c76f5	\N
276	213	Dana Mmbone Chepkoech	Female	37689340	\N	Widowed	primary	\N	39	tenant	\N	0	2	0	0	2	2	1	1	0	2	1	2	0	1	0	14	0	0	\N	1	0	1	private	>20000	\N	\N	>20000	\N	none	vendor	matatu	public	with_water_and_soap	private_collector	b3504f28-e245-42ec-87ed-847d364b1a34	\N
277	39	Patricia Jemeli Njoroge	Female	22576153	\N	Widowed	university	\N	12	tenant	\N	1	0	2	2	0	0	0	0	1	2	2	0	2	1	1	14	2	0	\N	1	1	1	self	16000_20000	\N	\N	11000_15000	\N	VIP	piped	train	mission	water_only	private_collector	f3f1dd23-62ad-42bc-bca1-be9c76c0c2c7	\N
278	165	Robert Ondari Chepkorir	Male	80207175	\N	Cohabiting	primary	\N	35	tenant	\N	0	2	0	1	2	0	0	2	1	2	1	1	0	0	0	12	2	0	\N	0	1	1	student	>20000	\N	\N	16000_20000	\N	none	rainwater	bicycle	traditional	none	dumpsite	fbbdacfd-3f68-4685-96a9-d98a2e0a3d24	\N
279	67	Leon Chepngetich Kipkemei	Male	00253935	\N	Seperated	primary	\N	34	tenant	\N	1	1	2	0	0	0	0	2	2	0	0	0	1	0	1	10	2	1	\N	1	1	0	not_applicable	>20000	\N	\N	11000_15000	\N	pit_latrine	river	bicycle	private	with_water_and_soap	bins	693c6e69-2363-43c6-83cd-6f756904ff2e	\N
280	96	Allen Musyoki Chepkemoi	Male	20741267	\N	Cohabiting	none	\N	37	plot_Owner	\N	2	0	2	1	1	2	2	2	0	2	0	1	0	2	1	18	2	0	\N	1	0	1	student	11000_15000	\N	\N	6000_10000	\N	pit_latrine	rainwater	bicycle	mission	with_water_and_soap	bins	6ab3ef73-f22b-4342-8ab0-a4a3c87e96fe	\N
281	116	Devin Sidi Opondo	Male	72179575	\N	Single	secondary	\N	31	tenant	\N	0	2	2	1	1	2	2	0	0	2	0	1	0	2	2	17	0	1	\N	1	1	0	private	>20000	\N	\N	>20000	\N	flush	rainwater	boda	mission	with_water_and_soap	dumpsite	54547838-a3e1-4935-b27a-93bb36bb71f0	\N
282	188	Nicholas Wamalwa Wangare	Male	02569996	\N	Single	none	\N	5	tenant	\N	0	2	0	1	0	0	0	0	1	1	2	0	0	0	0	7	2	2	\N	1	1	1	private	11000_15000	\N	\N	11000_15000	\N	communal	piped	walk	public	water_only	bins	4251bcd9-4f81-45bc-8c2e-a6fcdc3c8c45	\N
283	230	Alec Kithome Osman	Male	83933406	\N	Seperated	secondary	\N	25	structure_owner	\N	1	2	0	0	1	1	1	0	1	0	1	0	0	1	2	11	2	0	\N	0	0	1	civil_servant	>20000	\N	\N	0_5000	\N	none	none	matatu	chemist	with_water_and_soap	private_collector	5c88f9a4-cc39-4eae-9821-bc4fd1692383	\N
284	188	Elizabeth Mbae Waruguru	Female	86647944	\N	Cohabiting	university	\N	39	plot_Owner	\N	0	2	1	2	0	0	2	2	1	1	2	1	2	2	0	18	2	1	\N	1	1	0	not_applicable	16000_20000	\N	\N	16000_20000	\N	flush	none	boda	private	water_only	private_collector	d11aed28-4b27-4535-ac12-d24d62239aed	\N
285	218	Maria Vaati Maweu	Female	66768725	\N	Widowed	university	\N	36	structure_owner	\N	1	0	2	1	1	2	1	1	1	1	0	2	0	1	0	14	2	0	\N	0	1	1	unemployed	6000_10000	\N	\N	11000_15000	\N	communal	vendor	car	traditional	none	river	be478234-e7b9-49ac-91aa-ef0a0501a7d1	\N
286	235	John Karwitha Anyango	Male	51513149	\N	married	secondary	\N	39	structure_owner	\N	1	0	2	1	1	0	2	0	2	1	1	2	0	0	0	13	0	2	\N	0	1	1	unemployed	0_5000	\N	\N	11000_15000	\N	communal	none	train	private	water_only	private_collector	4e0e2664-a7fc-4838-a227-83662778fe40	\N
287	58	Brian Chebon Mwathi	Male	69505464	\N	Widowed	primary	\N	31	tenant	\N	1	0	1	2	2	2	1	1	2	1	0	2	2	0	2	19	0	1	\N	0	0	0	private	16000_20000	\N	\N	>20000	\N	pit_latrine	rainwater	bicycle	other	none	river	856ba194-5f78-4461-a5e7-ebc89d4ec024	\N
288	159	Eduardo Ochola Noor	Male	03826858	\N	Single	university	\N	21	tenant	\N	1	1	0	2	1	1	0	1	0	0	0	1	1	2	1	12	0	2	\N	1	0	1	self	16000_20000	\N	\N	16000_20000	\N	none	vendor	bicycle	other	with_water_and_soap	river	3d8d9230-06f5-437c-8ed2-cd8767271e24	\N
289	185	Peter Mule Ayieko	Male	19982842	\N	Cohabiting	primary	\N	15	tenant	\N	0	1	0	2	1	2	1	0	1	2	0	0	0	0	1	11	2	0	\N	1	0	1	student	6000_10000	\N	\N	6000_10000	\N	VIP	shallow_well	train	private	none	bins	7acc1b42-b86c-40ea-831d-9f55fc2cf5d6	\N
290	35	Wanda Bosire Kiogora	Female	59963061	\N	married	none	\N	3	tenant	\N	2	1	1	1	1	1	0	2	0	0	2	0	0	2	0	13	2	2	\N	1	0	0	private	0_5000	\N	\N	>20000	\N	communal	piped	car	traditional	none	dumpsite	a35317cc-4fff-45a4-92cc-1a10cb58252c	\N
291	87	John Mwongela Ndunda	Male	21218756	\N	Widowed	primary	\N	31	tenant	\N	2	1	2	0	2	2	2	1	0	0	0	0	0	1	2	15	1	1	\N	1	0	1	private	0_5000	\N	\N	>20000	\N	VIP	shallow_well	train	private	with_water_and_soap	dumpsite	7f39d063-3d5b-4fd3-a59a-6543287f6d8e	\N
292	29	Matthew Kemei Obare	Male	58367082	\N	Widowed	college	\N	10	plot_Owner	\N	2	0	1	1	1	0	1	2	1	1	2	0	2	1	1	16	1	1	\N	0	0	1	unemployed	11000_15000	\N	\N	0_5000	\N	flush	river	matatu	chemist	with_water_and_soap	river	1d8a827f-a7a5-41f9-9409-c6e85bcfc226	\N
293	176	Michael Gachanja Kungu	Male	75543336	\N	married	primary	\N	36	structure_owner	\N	0	1	2	2	0	0	0	2	1	0	0	0	1	1	0	10	2	1	\N	0	1	1	student	>20000	\N	\N	16000_20000	\N	pit_latrine	none	matatu	public	with_water_and_soap	dumpsite	4ab36747-d9ae-47b2-a456-1d77c5de8687	\N
294	91	Shawn Ndiwa Mayaka	Male	58743110	\N	Seperated	university	\N	15	tenant	\N	0	2	1	1	1	1	2	2	0	2	0	2	1	1	2	18	0	0	\N	0	1	1	student	0_5000	\N	\N	0_5000	\N	flush	river	walk	mission	water_only	dumpsite	0ac2ad74-baaf-446a-9144-6f13d581ba84	\N
295	53	Jon Mundia Wanje	Male	17951768	\N	Widowed	none	\N	31	plot_Owner	\N	0	0	0	0	2	1	1	0	0	0	1	1	2	2	0	10	0	2	\N	0	1	1	private	11000_15000	\N	\N	6000_10000	\N	communal	none	matatu	traditional	none	bins	dafa3eff-ffc4-4d1e-94dd-8007246be3fa	\N
296	148	Kelsey Chesang Bonaya	Female	06159304	\N	Single	primary	\N	28	plot_Owner	\N	2	1	2	1	0	0	2	2	1	1	2	2	1	1	0	18	0	0	\N	0	1	0	private	0_5000	\N	\N	>20000	\N	flush	none	boda	traditional	water_only	bins	59e28e34-23d7-4f74-8440-1a7268fff61d	\N
297	27	Kevin Wanjohi Muturi	Male	63382521	\N	Single	university	\N	30	structure_owner	\N	0	0	0	0	0	2	0	1	1	1	1	1	2	1	1	11	0	1	\N	1	0	1	casual	11000_15000	\N	\N	>20000	\N	flush	river	car	mission	water_only	private_collector	972f6ee2-6ede-40ec-872b-315d8573dcb9	\N
298	13	Donald George Gachoki	Male	06198386	\N	Single	primary	\N	27	tenant	\N	0	2	0	2	0	0	2	2	1	0	0	0	2	0	2	13	1	1	\N	1	1	1	not_applicable	11000_15000	\N	\N	16000_20000	\N	flush	piped	boda	traditional	none	dumpsite	b342f8e2-9fe3-4108-ae62-0c5a9ce23dd7	\N
299	45	Sierra Abubakar Kalekye	Female	14279733	\N	Widowed	none	\N	21	structure_owner	\N	1	1	0	0	0	0	1	2	0	2	0	1	2	1	2	13	2	0	\N	1	0	0	civil_servant	6000_10000	\N	\N	11000_15000	\N	none	shallow_well	boda	other	with_water_and_soap	bins	e1fe76cb-7ac4-4c3a-8cf6-e0971675558e	\N
300	121	Kendra Ambani Nyang'au	Female	07617378	\N	Single	secondary	\N	9	plot_Owner	\N	0	1	2	2	2	1	1	2	1	1	2	1	1	2	0	19	2	0	\N	1	0	1	student	>20000	\N	\N	>20000	\N	communal	shallow_well	bicycle	other	with_water_and_soap	bins	48299d97-fb90-4d68-9d55-8e457d9e7d60	\N
301	53	Lisa Ngei Ogola	Female	84603450	\N	married	university	\N	30	plot_Owner	\N	1	2	0	1	2	1	2	0	2	2	1	0	2	2	0	18	1	2	\N	1	0	0	unemployed	11000_15000	\N	\N	6000_10000	\N	none	river	boda	public	none	bins	3d98d4f6-c482-4733-8b12-010a10c7a626	\N
302	170	Daniel Kyalo Omwenga	Male	19732252	\N	married	university	\N	9	structure_owner	\N	0	0	2	2	1	2	2	0	0	2	0	2	0	0	2	15	0	0	\N	0	0	0	self	11000_15000	\N	\N	0_5000	\N	communal	piped	walk	mission	none	river	829a67b9-257c-493b-8f14-71721007dbee	\N
303	140	Christopher Chebon Omari	Male	38346466	\N	Seperated	university	\N	26	structure_owner	\N	2	1	0	1	2	0	1	2	1	0	2	1	0	0	0	13	1	1	\N	0	0	0	not_applicable	11000_15000	\N	\N	11000_15000	\N	pit_latrine	river	bicycle	private	none	dumpsite	8cef17fd-d41e-4e34-8168-f8d184ea5ec3	\N
304	172	Laura Muraya Mumbe	Female	15827537	\N	Widowed	none	\N	27	plot_Owner	\N	0	2	2	0	0	0	1	0	1	2	2	1	2	2	2	17	0	0	\N	0	0	1	private	6000_10000	\N	\N	>20000	\N	pit_latrine	piped	matatu	chemist	none	private_collector	e46004e0-b987-406a-aa15-6db2cdadb854	\N
305	210	Nathan Adan Mutia	Male	05603808	\N	Widowed	primary	\N	5	plot_Owner	\N	2	2	1	0	1	1	1	0	2	1	2	0	2	1	2	18	2	1	\N	1	1	1	civil_servant	0_5000	\N	\N	16000_20000	\N	flush	river	boda	mission	with_water_and_soap	bins	2f56e86c-7936-47f8-a911-5fd758ee3765	\N
306	150	Holly Ondari Thoya	Female	69501353	\N	Widowed	none	\N	7	tenant	\N	2	0	0	1	0	0	2	2	0	2	0	2	1	1	1	14	1	2	\N	1	0	0	casual	>20000	\N	\N	16000_20000	\N	flush	rainwater	matatu	private	water_only	private_collector	c4370595-7c07-483e-9e9f-1b18fb1cf64d	\N
307	161	Charles Alio Maalim	Male	74107195	\N	Widowed	none	\N	10	tenant	\N	1	0	0	2	1	1	2	1	0	0	1	0	0	0	1	10	0	0	\N	0	0	0	private	6000_10000	\N	\N	0_5000	\N	VIP	vendor	car	private	water_only	bins	c2b09b5a-6787-4d3f-b1e4-a7e6e77a4b17	\N
308	196	Juan Mwendwa Mutanu	Male	10822195	\N	Cohabiting	primary	\N	39	plot_Owner	\N	1	0	1	0	0	2	2	2	2	2	0	0	0	0	2	14	1	1	\N	0	1	1	self	16000_20000	\N	\N	11000_15000	\N	flush	none	matatu	other	water_only	river	81394c8b-f6fc-449c-bf5e-5d710fbc6f12	\N
309	203	Ashley Guyo Musyimi	Female	61070687	\N	married	primary	\N	30	plot_Owner	\N	0	0	2	0	1	0	0	1	1	1	1	0	1	2	2	12	2	1	\N	1	1	0	student	16000_20000	\N	\N	6000_10000	\N	none	piped	boda	private	water_only	bins	b5235728-ced9-4e08-b4d7-e6a6c031a6ac	\N
310	168	Angel Muimi Gona	Male	33856178	\N	married	secondary	\N	25	tenant	\N	0	0	2	1	2	2	2	2	0	2	2	0	2	2	0	19	0	2	\N	1	0	0	private	16000_20000	\N	\N	>20000	\N	pit_latrine	shallow_well	walk	chemist	water_only	private_collector	87facb95-0e74-4491-ab68-4d5a88d75c29	\N
311	211	Randy Obuya Ekiru	Male	41108585	\N	Cohabiting	university	\N	31	plot_Owner	\N	1	1	1	1	2	1	1	2	0	2	0	0	0	0	0	12	1	2	\N	1	1	0	student	>20000	\N	\N	16000_20000	\N	VIP	none	matatu	chemist	with_water_and_soap	dumpsite	39a553c9-2cce-41ae-a955-15fb28df3912	\N
312	215	Steven Kirui Kahindi	Male	67174132	\N	Widowed	secondary	\N	32	plot_Owner	\N	1	2	2	1	2	2	1	2	1	2	2	0	2	0	1	21	0	2	\N	1	1	0	casual	6000_10000	\N	\N	16000_20000	\N	pit_latrine	none	bicycle	chemist	none	bins	b2b69850-fee0-487d-a5c4-1700a3118db8	\N
313	50	Teresa Wahome Kadzo	Female	86327512	\N	Seperated	university	\N	27	structure_owner	\N	1	1	2	0	1	0	2	1	0	0	2	2	2	1	0	15	1	2	\N	1	1	1	not_applicable	>20000	\N	\N	16000_20000	\N	pit_latrine	river	train	chemist	none	private_collector	47887fe4-0d3d-48a5-a9be-7f63d01b10ec	\N
314	9	Yvette Mose Mbuvi	Female	08733561	\N	Widowed	primary	\N	0	tenant	\N	0	0	2	2	2	2	2	1	0	1	1	2	0	1	1	17	2	1	\N	0	1	1	private	>20000	\N	\N	11000_15000	\N	pit_latrine	river	bicycle	other	water_only	bins	f641dbfe-b43e-43c3-a939-32654ba83fcf	\N
315	188	Tiffany Njuguna Mwololo	Female	37143191	\N	Cohabiting	none	\N	40	plot_Owner	\N	1	2	1	0	1	2	1	0	2	0	0	1	1	2	0	14	1	0	\N	0	0	0	not_applicable	0_5000	\N	\N	11000_15000	\N	pit_latrine	rainwater	train	public	with_water_and_soap	bins	655f7e10-dc2b-4252-8b2c-e33be35f190e	\N
316	163	Brady Owino Benard	Male	12952445	\N	Cohabiting	secondary	\N	28	plot_Owner	\N	2	0	1	0	1	0	0	1	0	0	1	1	1	1	1	10	2	1	\N	0	0	0	student	16000_20000	\N	\N	>20000	\N	flush	vendor	bicycle	chemist	none	dumpsite	16bec8b4-e644-4c05-863b-7802077b44ce	\N
317	70	Michael Ismail Nyawa	Male	47794156	\N	Widowed	primary	\N	34	plot_Owner	\N	2	2	1	2	0	2	1	1	0	1	1	1	1	0	1	16	0	0	\N	1	1	1	private	16000_20000	\N	\N	16000_20000	\N	communal	piped	train	mission	water_only	private_collector	5910ed96-e013-4d2c-a233-283302b05544	\N
318	207	Allison Wanyoike Guyo	Female	59338267	\N	Widowed	college	\N	35	tenant	\N	0	0	1	0	2	1	1	0	0	0	2	1	1	1	2	12	2	1	\N	1	0	0	private	>20000	\N	\N	11000_15000	\N	communal	vendor	bicycle	chemist	none	dumpsite	bcb0939b-d3f2-4c2b-9ae0-0abce7731eb9	\N
319	86	Kathleen Yussuf Gichana	Female	84470507	\N	Widowed	none	\N	28	tenant	\N	0	1	2	2	2	1	0	0	1	2	2	1	0	1	0	15	2	1	\N	0	1	1	unemployed	16000_20000	\N	\N	6000_10000	\N	communal	vendor	train	other	with_water_and_soap	dumpsite	d44a0b16-df2a-4fc9-be7d-81d776c8dcd5	\N
320	233	Brooke Mbuvi Yator	Female	17189549	\N	Cohabiting	university	\N	28	plot_Owner	\N	1	2	1	0	0	0	0	0	2	1	1	0	2	1	2	13	0	2	\N	0	1	1	casual	6000_10000	\N	\N	0_5000	\N	flush	rainwater	matatu	public	none	private_collector	112c8e15-f6dc-4443-852c-117c809cd750	\N
321	14	Derrick Samoei Ratemo	Male	73072032	\N	Seperated	primary	\N	30	plot_Owner	\N	1	0	0	1	0	1	0	2	0	1	0	2	0	1	1	10	1	0	\N	0	1	1	unemployed	6000_10000	\N	\N	11000_15000	\N	VIP	rainwater	boda	traditional	water_only	dumpsite	69daefba-a13b-45ee-b452-cefefec639ea	\N
322	134	William Wabomba Kisilu	Male	43419489	\N	married	secondary	\N	25	plot_Owner	\N	2	0	1	1	2	2	1	1	1	0	1	2	0	1	1	16	0	0	\N	0	0	1	unemployed	16000_20000	\N	\N	16000_20000	\N	flush	piped	train	mission	none	dumpsite	7f4c4bd7-898f-41c7-93c3-2de2b1639c91	\N
323	190	Kristine Menza Roba	Female	29418159	\N	Single	university	\N	6	structure_owner	\N	0	1	1	1	2	0	1	1	1	1	1	1	2	2	1	16	2	1	\N	0	0	1	unemployed	11000_15000	\N	\N	0_5000	\N	pit_latrine	vendor	boda	public	none	private_collector	a47fbb1d-99e6-4dac-afa9-2fc93a247899	\N
324	104	David Mwema Mbatha	Male	26488319	\N	Cohabiting	secondary	\N	8	structure_owner	\N	1	1	1	0	1	0	0	0	0	2	2	1	2	0	1	12	2	2	\N	1	0	0	not_applicable	16000_20000	\N	\N	6000_10000	\N	VIP	river	car	traditional	with_water_and_soap	bins	07c9c7b0-1da4-4a99-a58c-99e1fafd7efd	\N
325	41	Victor Eyanae Njeru	Male	46550330	\N	Cohabiting	secondary	\N	20	structure_owner	\N	0	0	0	0	0	0	2	2	0	1	0	1	0	2	1	9	2	2	\N	0	0	0	student	>20000	\N	\N	16000_20000	\N	pit_latrine	none	car	mission	with_water_and_soap	dumpsite	f5968095-98db-4c2d-b1d1-ff0f4cb3c52d	\N
326	231	Matthew Minayo Oyugi	Male	65779692	\N	Single	university	\N	3	tenant	\N	2	2	2	1	2	2	1	0	1	2	2	2	2	0	0	21	2	0	\N	0	1	1	unemployed	11000_15000	\N	\N	0_5000	\N	communal	none	walk	chemist	water_only	bins	85b12c7a-1d2d-4b98-82d8-b7fd54ffe03d	\N
327	152	Philip Murugi Kairu	Male	49682941	\N	Widowed	none	\N	18	structure_owner	\N	0	1	1	2	1	2	2	0	2	1	0	0	2	2	2	18	1	2	\N	1	1	1	not_applicable	6000_10000	\N	\N	>20000	\N	VIP	rainwater	train	mission	none	private_collector	f9b00374-0984-48ca-b98c-c76cf1eb5d05	\N
328	220	Alicia Mukhwana Jepkorir	Female	52378053	\N	Seperated	primary	\N	18	tenant	\N	2	2	0	0	0	2	1	0	1	2	0	2	0	0	2	14	0	0	\N	1	1	0	civil_servant	>20000	\N	\N	0_5000	\N	pit_latrine	none	car	public	none	bins	d2518121-e096-4c15-8173-38be02dee706	\N
329	227	Brenda Jomo Otieno	Female	61848409	\N	Seperated	primary	\N	8	structure_owner	\N	2	0	0	1	0	2	2	2	2	1	0	0	0	1	2	15	0	2	\N	1	0	1	self	16000_20000	\N	\N	6000_10000	\N	VIP	shallow_well	bicycle	chemist	with_water_and_soap	bins	b3c653c9-85a1-4932-bc91-f0e9e88d156d	\N
330	222	Connie Mutwiri Gachoki	Female	09268173	\N	Widowed	primary	\N	19	tenant	\N	1	2	2	2	0	1	0	1	1	2	0	1	0	2	0	15	2	0	\N	1	0	0	self	16000_20000	\N	\N	>20000	\N	pit_latrine	vendor	train	private	with_water_and_soap	dumpsite	4966d4e0-616f-41e5-a6c5-1a81c7343fa8	\N
331	94	Michele Adhiambo Mwema	Female	38431398	\N	Single	primary	\N	10	tenant	\N	1	1	0	0	1	0	2	0	2	0	1	2	1	1	1	13	0	2	\N	1	1	1	civil_servant	16000_20000	\N	\N	11000_15000	\N	VIP	rainwater	walk	mission	with_water_and_soap	dumpsite	8f203c9b-72c2-4e77-8ff9-1d4df14137d3	\N
332	161	Joe Gachanja Joel	Male	57627605	\N	Single	secondary	\N	26	tenant	\N	2	2	0	1	1	0	0	0	1	2	1	2	2	2	0	16	1	0	\N	0	0	0	not_applicable	>20000	\N	\N	6000_10000	\N	none	rainwater	walk	public	with_water_and_soap	private_collector	a4b71213-aaa2-4e7f-baaf-f023b5f770b3	\N
333	231	Kimberly Kaingu Masika	Female	00452863	\N	Single	secondary	\N	27	structure_owner	\N	0	2	0	0	2	1	2	2	0	2	0	2	0	1	0	14	0	0	\N	1	0	1	unemployed	11000_15000	\N	\N	6000_10000	\N	flush	shallow_well	bicycle	private	water_only	dumpsite	36f834c3-9163-4bd2-bab3-55e69994fb47	\N
334	59	Ashley Hillow Abdirahman	Female	79235339	\N	Single	primary	\N	16	tenant	\N	1	0	1	1	0	1	0	2	0	2	2	1	1	1	2	15	0	0	\N	0	0	1	civil_servant	0_5000	\N	\N	6000_10000	\N	communal	river	matatu	other	none	private_collector	766c08c0-22bf-4497-be67-1af5d580d05d	\N
335	7	Jeanette Tuwei Ronoh	Female	77577644	\N	Widowed	university	\N	15	tenant	\N	1	1	2	1	2	0	0	1	0	1	1	0	1	0	0	11	0	0	\N	0	0	1	unemployed	>20000	\N	\N	0_5000	\N	flush	vendor	walk	mission	water_only	private_collector	8e0a6081-764f-41ff-9075-48c4cce71c00	\N
336	59	Devin Munga Limo	Male	79034032	\N	Single	none	\N	1	plot_Owner	\N	0	0	0	1	2	0	0	0	1	1	1	0	2	2	2	12	2	2	\N	1	0	1	unemployed	6000_10000	\N	\N	11000_15000	\N	flush	piped	train	chemist	with_water_and_soap	bins	f2e3612a-ffe9-4df3-b6db-27d0c2a62364	\N
337	77	Matthew Chepngeno Kiprono	Male	83924202	\N	married	secondary	\N	2	plot_Owner	\N	1	1	0	1	2	1	0	0	2	0	2	2	2	0	1	15	2	1	\N	0	0	1	civil_servant	>20000	\N	\N	16000_20000	\N	communal	shallow_well	bicycle	traditional	water_only	river	8065f4f5-6041-47ca-8ba5-7faa6cfa06ea	\N
338	153	Debra Ronoh Evans	Female	59514615	\N	Single	university	\N	8	structure_owner	\N	0	1	1	1	1	2	0	0	0	1	2	0	0	0	1	10	0	2	\N	1	1	1	casual	0_5000	\N	\N	6000_10000	\N	flush	vendor	matatu	public	with_water_and_soap	dumpsite	4df58012-729a-4529-80bf-c0ba01c08e60	\N
339	46	Thomas Chepkirui Maranga	Male	25204246	\N	married	primary	\N	25	structure_owner	\N	1	1	1	1	0	2	1	2	2	1	2	0	0	0	1	15	1	0	\N	1	1	1	student	6000_10000	\N	\N	11000_15000	\N	flush	none	matatu	private	water_only	private_collector	123ae760-9e90-4a0c-9056-645214a9e74c	\N
340	163	Emily Ogada Kazungu	Female	01966272	\N	Cohabiting	university	\N	35	plot_Owner	\N	1	0	1	1	2	2	1	0	2	1	0	2	1	2	1	17	2	2	\N	0	0	1	not_applicable	6000_10000	\N	\N	11000_15000	\N	pit_latrine	rainwater	boda	traditional	none	bins	39c18859-09d6-4f49-9c0e-c50924fc7f3d	\N
341	140	Stephanie Atieno Abuga	Female	35059242	\N	Seperated	college	\N	33	structure_owner	\N	2	0	2	1	1	0	1	1	2	1	1	1	2	1	1	17	1	0	\N	0	1	0	unemployed	>20000	\N	\N	0_5000	\N	pit_latrine	vendor	boda	mission	with_water_and_soap	dumpsite	157832e2-b19e-4b5e-a208-0e8e9652065b	\N
342	78	Kyle Mutethia Wanjugu	Male	27107009	\N	Seperated	secondary	\N	34	tenant	\N	1	2	0	1	0	0	0	1	1	2	0	1	2	0	0	11	1	1	\N	0	1	0	not_applicable	6000_10000	\N	\N	6000_10000	\N	communal	river	boda	mission	water_only	bins	46bd21cb-a0a7-41b9-a04b-3a27159aa353	\N
343	74	Rebekah Hussein Kazungu	Female	23455105	\N	Single	college	\N	22	plot_Owner	\N	2	2	2	1	1	0	2	2	0	2	1	0	1	2	2	20	1	1	\N	1	0	0	not_applicable	6000_10000	\N	\N	>20000	\N	VIP	vendor	matatu	traditional	none	river	cad06fa1-be16-40da-bebe-fa2b380097ac	\N
344	160	Stephanie Maiyo Robi	Female	28211345	\N	Widowed	none	\N	19	structure_owner	\N	0	1	2	0	1	0	0	0	0	0	0	0	2	1	0	7	2	0	\N	1	0	0	private	>20000	\N	\N	0_5000	\N	pit_latrine	rainwater	matatu	traditional	water_only	river	633edc90-6126-4650-8335-389525eff18c	\N
345	17	Jacob Muindi Wambura	Male	76118975	\N	Cohabiting	secondary	\N	39	structure_owner	\N	2	2	1	0	0	2	1	0	2	1	2	0	0	0	2	15	2	2	\N	1	0	1	casual	6000_10000	\N	\N	11000_15000	\N	none	shallow_well	boda	public	water_only	bins	90761adf-1d2b-4da4-98c5-5395a0f9e2b9	\N
346	5	Thomas Odera Kalekye	Male	81445917	\N	Widowed	college	\N	32	plot_Owner	\N	2	0	1	0	0	1	1	1	2	2	1	1	0	2	0	14	2	1	\N	0	0	0	student	>20000	\N	\N	>20000	\N	flush	rainwater	matatu	other	water_only	bins	a4542b44-d642-4829-9d2f-d294da28caa0	\N
347	64	Shannon Mwema Odhiambo	Female	36052170	\N	Seperated	none	\N	27	plot_Owner	\N	2	2	1	0	0	2	0	1	1	1	1	2	2	1	0	16	1	0	\N	1	0	1	self	6000_10000	\N	\N	6000_10000	\N	none	shallow_well	car	public	with_water_and_soap	river	11c8bde4-4be9-4511-8282-0715caa30d01	\N
348	222	John Wakio Kipkorir	Male	19263214	\N	married	university	\N	37	plot_Owner	\N	0	1	2	1	1	1	0	2	0	0	0	1	0	1	0	10	1	1	\N	1	0	1	self	>20000	\N	\N	0_5000	\N	communal	rainwater	walk	other	none	river	cc9a41dd-4f86-4158-bbd7-d3eb694212fc	\N
349	172	Mark Vaati Chemtai	Male	14821429	\N	married	primary	\N	35	tenant	\N	2	1	2	2	2	2	2	0	0	0	0	2	1	1	1	18	1	2	\N	1	0	1	private	6000_10000	\N	\N	0_5000	\N	none	piped	bicycle	private	water_only	private_collector	422cd2da-2c5d-46e8-b6a9-6687bff63dbd	\N
350	137	Evelyn Ogeto Mwakio	Female	86049479	\N	Widowed	secondary	\N	10	tenant	\N	2	0	1	0	2	2	1	2	2	0	2	2	2	1	1	20	0	2	\N	1	0	1	civil_servant	16000_20000	\N	\N	11000_15000	\N	VIP	none	walk	other	none	river	548b4c9a-a817-4555-891b-9fe606447cd3	\N
351	142	Jessica Mnangat Amina	Female	59983912	\N	married	university	\N	36	structure_owner	\N	2	2	1	1	1	0	0	1	1	1	0	0	2	0	2	14	0	2	\N	1	0	0	not_applicable	11000_15000	\N	\N	16000_20000	\N	none	rainwater	matatu	public	with_water_and_soap	private_collector	34654961-5d0d-4c32-a5c3-fd9e8bb7be5d	\N
352	166	Perry Kiprono Wasike	Male	84070774	\N	Cohabiting	university	\N	14	structure_owner	\N	2	1	1	2	0	0	2	2	1	1	2	0	0	1	1	16	1	0	\N	1	1	0	unemployed	>20000	\N	\N	16000_20000	\N	flush	river	matatu	chemist	none	private_collector	2600ba29-e755-4806-adc9-6554140908bc	\N
353	184	Brandon Pkemoi Mbaabu	Male	23432841	\N	Cohabiting	primary	\N	37	plot_Owner	\N	2	1	2	2	1	1	2	1	2	0	0	0	0	0	0	14	1	2	\N	1	0	1	self	>20000	\N	\N	16000_20000	\N	VIP	rainwater	bicycle	traditional	none	bins	431208d7-ca7e-4f50-b24d-438c87bcb757	\N
354	149	David Muinde Kiio	Male	73973278	\N	Widowed	university	\N	23	structure_owner	\N	0	0	1	1	1	0	0	2	2	1	2	0	1	0	1	12	2	2	\N	1	1	1	civil_servant	16000_20000	\N	\N	11000_15000	\N	communal	none	bicycle	public	water_only	private_collector	b570d369-76f7-412d-ac43-b3943ac54cd4	\N
355	196	Daniel Nandwa Kibiwott	Male	71267719	\N	Widowed	primary	\N	22	tenant	\N	1	2	0	2	1	2	1	1	1	2	2	1	0	1	0	17	2	2	\N	1	0	0	private	16000_20000	\N	\N	11000_15000	\N	none	rainwater	boda	public	with_water_and_soap	river	a8e46b31-6864-4f1c-a7a7-3bf4c79c9191	\N
356	3	Morgan Huka Francis	Female	89810966	\N	Cohabiting	secondary	\N	0	structure_owner	\N	2	0	1	2	0	0	2	0	2	1	1	1	0	2	2	16	1	0	\N	0	0	1	not_applicable	0_5000	\N	\N	>20000	\N	communal	river	bicycle	private	none	private_collector	59c87e17-045b-4da2-bef9-0ebfbb8253e6	\N
357	185	Benjamin Samwel Kanja	Male	69615588	\N	Single	none	\N	9	plot_Owner	\N	1	2	2	2	0	2	0	1	2	1	1	2	1	2	1	20	1	2	\N	0	1	1	unemployed	6000_10000	\N	\N	16000_20000	\N	none	shallow_well	matatu	other	water_only	bins	8f22b3db-befc-4ade-845a-022e9781a965	\N
358	63	Paula Omondi Munyiva	Female	63162512	\N	married	none	\N	21	plot_Owner	\N	2	1	1	0	2	2	0	0	1	2	1	1	0	0	2	15	2	0	\N	0	1	1	casual	11000_15000	\N	\N	0_5000	\N	pit_latrine	piped	car	private	none	river	d5f5e4d1-637e-434b-972e-6c9c90cd41d9	\N
359	70	Lisa Adan Anyona	Female	43079610	\N	Single	none	\N	6	tenant	\N	1	0	1	0	2	1	1	1	1	0	0	1	0	2	2	13	0	0	\N	1	0	0	private	16000_20000	\N	\N	0_5000	\N	none	shallow_well	matatu	chemist	with_water_and_soap	dumpsite	218ff67e-bb60-42df-9263-df8fb609b667	\N
360	187	John Kimani Kabiru	Male	03789341	\N	Widowed	secondary	\N	11	structure_owner	\N	2	1	1	0	2	2	1	1	2	2	1	1	2	2	2	22	2	2	\N	0	1	0	not_applicable	0_5000	\N	\N	0_5000	\N	none	vendor	bicycle	public	with_water_and_soap	private_collector	001990f2-6eda-406e-8f2d-809b81f1da41	\N
361	15	John Muthomi Mutembei	Male	47606420	\N	married	university	\N	21	plot_Owner	\N	2	0	2	2	0	1	2	2	1	0	0	0	0	2	1	15	1	0	\N	1	0	1	student	11000_15000	\N	\N	>20000	\N	pit_latrine	shallow_well	car	public	none	dumpsite	a5f0f103-f5a0-4349-940a-0ffc8edcaf35	\N
362	196	Robert Maranga Thuo	Male	74545990	\N	Cohabiting	secondary	\N	40	structure_owner	\N	1	1	2	1	2	0	1	1	2	1	0	0	1	1	2	16	1	2	\N	1	1	1	unemployed	16000_20000	\N	\N	6000_10000	\N	communal	vendor	boda	private	none	dumpsite	16751c53-6282-4b96-b33b-baca8214b9a3	\N
363	17	Alexandra Cherono Nyaboke	Female	64926439	\N	married	university	\N	22	tenant	\N	1	2	1	0	2	0	1	0	1	0	1	0	0	1	2	12	2	1	\N	0	0	1	private	0_5000	\N	\N	0_5000	\N	VIP	vendor	train	public	water_only	private_collector	6042af72-6b21-463c-8af0-4f1d6418775e	\N
364	45	Melissa Mwanza Mbuthia	Female	35572343	\N	Widowed	secondary	\N	40	plot_Owner	\N	2	1	0	2	2	1	1	0	2	0	0	2	1	0	1	15	2	2	\N	0	0	0	self	16000_20000	\N	\N	11000_15000	\N	communal	shallow_well	train	mission	with_water_and_soap	dumpsite	c75739e5-867a-44b9-b260-74fc1eb2beed	\N
365	54	Charles Adam Muhia	Male	20278002	\N	Cohabiting	none	\N	12	tenant	\N	2	2	2	1	2	0	1	2	0	1	1	0	0	1	1	16	1	1	\N	1	0	0	casual	0_5000	\N	\N	16000_20000	\N	pit_latrine	vendor	walk	mission	water_only	bins	929f855e-a46c-497a-8a28-32663844cf78	\N
366	131	Jordan Naliaka Lemayian	Male	57966379	\N	married	none	\N	12	structure_owner	\N	2	2	1	1	2	1	0	0	2	0	1	0	2	0	0	14	2	0	\N	1	0	1	casual	11000_15000	\N	\N	0_5000	\N	flush	shallow_well	train	mission	water_only	bins	e1c6ae66-8f32-4609-bc21-29fc69c9f4fa	\N
367	167	Joshua Mucheru Wanza	Male	53205543	\N	Single	secondary	\N	21	plot_Owner	\N	1	2	1	1	0	2	0	2	1	0	1	1	2	2	0	16	0	1	\N	0	0	1	self	11000_15000	\N	\N	0_5000	\N	flush	piped	train	public	water_only	private_collector	71bd6f99-2c78-4ec3-9bc9-696e7729521c	\N
368	46	Breanna Mogire Mawira	Female	09670559	\N	Seperated	secondary	\N	15	plot_Owner	\N	2	0	1	0	2	0	0	0	1	1	1	2	2	1	1	14	1	1	\N	0	0	1	unemployed	0_5000	\N	\N	11000_15000	\N	pit_latrine	shallow_well	boda	public	with_water_and_soap	private_collector	2fafc242-4e7b-41db-bff9-00ed80cdebf1	\N
369	192	Stacey Nyakundi Kasyoka	Female	42757393	\N	Seperated	none	\N	21	structure_owner	\N	0	1	1	2	0	1	1	1	0	1	2	2	0	2	2	16	0	2	\N	0	0	0	self	11000_15000	\N	\N	6000_10000	\N	none	piped	walk	public	none	private_collector	8f2d1c76-23c6-46bd-96d2-775b1f144db7	\N
370	46	Zachary Mahat Chesire	Male	21022917	\N	Cohabiting	university	\N	19	structure_owner	\N	2	2	2	0	0	1	2	0	0	0	2	2	2	0	2	17	1	0	\N	1	0	0	not_applicable	6000_10000	\N	\N	6000_10000	\N	flush	rainwater	boda	public	with_water_and_soap	private_collector	8dcba7c2-7963-41f6-b15b-b832e804e9e9	\N
371	90	Michele Kazungu Marwa	Female	80203719	\N	Single	college	\N	1	plot_Owner	\N	0	0	0	2	0	0	1	2	2	2	2	2	2	2	1	18	2	2	\N	1	1	1	unemployed	16000_20000	\N	\N	16000_20000	\N	flush	rainwater	train	other	with_water_and_soap	bins	386e8f26-b2ad-4a0d-b0ea-9bdc0cbc101c	\N
372	217	Samantha Waithaka Musya	Female	56635858	\N	Seperated	college	\N	11	structure_owner	\N	1	0	0	0	1	0	1	1	0	2	1	0	1	2	2	12	2	2	\N	1	0	1	casual	16000_20000	\N	\N	>20000	\N	flush	shallow_well	boda	traditional	with_water_and_soap	dumpsite	5965db68-3245-40a1-8019-4ff6cd940f22	\N
373	107	Tina Koros Okuku	Female	23632504	\N	Widowed	university	\N	26	tenant	\N	2	2	0	1	2	0	2	1	1	2	1	2	1	2	1	20	1	1	\N	0	0	1	private	16000_20000	\N	\N	>20000	\N	VIP	shallow_well	matatu	other	water_only	bins	2ef910a8-aa34-46b4-9db7-b7e643f70586	\N
374	95	Michael Murigi Kiragu	Male	71593164	\N	Seperated	primary	\N	16	structure_owner	\N	1	1	1	1	0	0	0	0	2	1	0	2	2	2	1	14	1	0	\N	1	0	0	self	11000_15000	\N	\N	6000_10000	\N	flush	piped	matatu	traditional	none	dumpsite	de8935d5-3499-4b56-a5c2-80e49a2d4c85	\N
375	64	Darrell Simiyu Bahati	Male	15188418	\N	Seperated	primary	\N	14	tenant	\N	2	0	2	0	0	1	2	2	2	2	1	0	2	2	0	18	1	2	\N	1	1	1	private	6000_10000	\N	\N	0_5000	\N	none	vendor	walk	mission	none	river	d9f0452d-daad-455a-acb9-2419c5cc06cd	\N
376	7	Jason Kimani Misiko	Male	03246620	\N	Widowed	none	\N	26	tenant	\N	0	0	2	0	2	0	1	2	1	0	1	0	2	0	2	13	2	2	\N	1	1	0	casual	6000_10000	\N	\N	6000_10000	\N	none	river	walk	traditional	with_water_and_soap	dumpsite	79709f66-16a6-4f63-86ba-b783316d4398	\N
377	99	Kristi Kungu Kendi	Female	80262599	\N	Single	none	\N	35	plot_Owner	\N	1	1	2	2	1	1	2	1	2	1	2	1	0	2	0	19	1	2	\N	1	1	1	private	0_5000	\N	\N	11000_15000	\N	flush	piped	matatu	other	water_only	bins	90d5990b-d8a3-4d18-804b-4c011e3b4307	\N
378	90	William Mwema Kipngetich	Male	34385932	\N	Seperated	college	\N	9	structure_owner	\N	0	0	1	2	0	0	0	0	1	1	1	2	2	1	0	11	1	0	\N	0	0	1	not_applicable	0_5000	\N	\N	0_5000	\N	communal	vendor	walk	mission	water_only	bins	d462dac3-61f9-4902-a29e-5310414d9100	\N
379	49	Andrew Musyoki Kituku	Male	69554829	\N	married	none	\N	30	plot_Owner	\N	0	2	1	1	0	1	1	0	1	0	1	0	1	0	2	11	2	1	\N	0	1	1	casual	6000_10000	\N	\N	6000_10000	\N	pit_latrine	river	matatu	mission	none	dumpsite	030c867d-85b4-41fb-987e-c0a6e2c391cb	\N
380	54	Mark Yaa Andrew	Male	03129794	\N	Cohabiting	primary	\N	9	structure_owner	\N	0	1	0	0	0	2	0	0	2	1	2	0	1	0	0	9	1	2	\N	0	1	1	private	6000_10000	\N	\N	6000_10000	\N	flush	rainwater	boda	traditional	water_only	river	d643683e-5e8e-4a44-831d-73471e3f99e3	\N
381	206	Wayne Chirchir Apondi	Male	45402205	\N	Widowed	none	\N	15	tenant	\N	1	2	0	0	2	1	1	2	1	0	0	2	0	0	2	14	0	0	\N	0	0	0	unemployed	0_5000	\N	\N	11000_15000	\N	VIP	piped	boda	public	water_only	river	9e148ae9-723c-4ee2-98af-2d57da0c0f4e	\N
382	198	Donna Oyugi Mwirigi	Female	49651295	\N	Seperated	none	\N	2	structure_owner	\N	0	1	0	1	0	2	2	2	1	2	2	1	2	2	1	19	2	0	\N	0	1	1	student	>20000	\N	\N	11000_15000	\N	none	rainwater	car	chemist	with_water_and_soap	river	e2b6ef3a-6b22-4177-a179-2c8251fc2faa	\N
383	160	Dale Cheruto Mutemi	Male	57887445	\N	Single	university	\N	18	structure_owner	\N	2	1	0	0	0	0	1	0	0	1	1	0	1	0	2	9	1	1	\N	1	0	1	self	11000_15000	\N	\N	>20000	\N	pit_latrine	vendor	train	traditional	water_only	private_collector	39c04ea1-5340-4f66-b131-1adb3c90c288	\N
384	25	Thomas Mbui Owuor	Male	26014244	\N	Single	secondary	\N	38	tenant	\N	2	1	1	2	0	0	1	1	2	0	1	2	2	1	1	17	1	1	\N	1	1	1	casual	6000_10000	\N	\N	16000_20000	\N	none	none	walk	private	none	dumpsite	83ddf243-7166-44f4-84f4-ddd1e124242a	\N
385	149	Benjamin Maiyo Mbaabu	Male	25447331	\N	Seperated	primary	\N	34	structure_owner	\N	2	2	2	2	1	2	0	1	0	1	2	2	2	2	1	22	0	2	\N	0	0	0	casual	0_5000	\N	\N	16000_20000	\N	flush	river	matatu	other	none	bins	3a31179d-c617-4c19-b8c4-b6047fa8ae43	\N
386	193	Deborah Ayuma Kassim	Female	34201001	\N	Seperated	none	\N	2	plot_Owner	\N	0	2	2	2	0	1	2	2	1	1	0	2	1	2	0	18	1	2	\N	1	0	1	civil_servant	0_5000	\N	\N	6000_10000	\N	none	shallow_well	walk	public	water_only	bins	a519ccac-ffaf-4d8e-aa8b-4e2386694ecf	\N
387	94	Brandon Ekal Kithinji	Male	29163989	\N	Seperated	secondary	\N	33	tenant	\N	2	2	0	2	1	2	1	2	1	0	0	1	1	2	1	18	2	1	\N	1	1	1	private	6000_10000	\N	\N	>20000	\N	pit_latrine	none	car	public	none	dumpsite	4317bb28-d14e-4471-b6e7-aeca4b793b50	\N
388	93	Marissa Kipsang Nyangau	Female	37269541	\N	Widowed	none	\N	3	structure_owner	\N	0	1	1	2	2	2	1	0	2	2	0	1	2	2	2	20	0	2	\N	1	1	0	private	0_5000	\N	\N	11000_15000	\N	flush	shallow_well	matatu	chemist	with_water_and_soap	bins	c97183c8-f5a5-4fcc-9aab-5e5857fab575	\N
389	120	Sonia Ireri Nasambu	Female	50353194	\N	married	none	\N	39	structure_owner	\N	0	2	0	0	1	1	1	2	1	1	2	0	0	1	0	12	0	0	\N	1	0	0	civil_servant	>20000	\N	\N	16000_20000	\N	pit_latrine	river	train	other	with_water_and_soap	dumpsite	555b9be8-b1fd-4e8d-accf-c7695e0da33f	\N
390	140	Debra Odira Kaimenyi	Female	51676485	\N	Single	primary	\N	3	tenant	\N	0	0	0	0	1	1	1	0	1	1	0	2	2	0	1	10	1	2	\N	0	0	1	student	11000_15000	\N	\N	11000_15000	\N	none	piped	train	mission	none	bins	a0afdf71-d577-40db-a8b9-e458546bd479	\N
391	229	Xavier Tarus Ondieki	Male	86284480	\N	Seperated	none	\N	24	structure_owner	\N	2	2	1	0	2	1	1	0	2	2	1	2	1	0	0	17	2	1	\N	0	0	0	student	16000_20000	\N	\N	16000_20000	\N	communal	shallow_well	boda	other	with_water_and_soap	bins	7c11f7ad-8dd0-476c-a09c-26b01b40c3b8	\N
392	94	Christine Ngumbao Wasike	Female	53215733	\N	Single	college	\N	7	plot_Owner	\N	2	1	1	0	1	0	2	2	2	1	0	2	1	0	0	15	1	0	\N	1	0	0	private	6000_10000	\N	\N	>20000	\N	pit_latrine	vendor	car	traditional	water_only	bins	b1eb366f-e316-4bdd-87b1-cf032dc879cd	\N
393	46	Sonia Obuya Barongo	Female	11534351	\N	married	secondary	\N	20	tenant	\N	2	0	2	0	2	2	1	1	1	0	0	2	0	1	0	14	2	0	\N	1	0	1	civil_servant	16000_20000	\N	\N	>20000	\N	VIP	rainwater	matatu	traditional	none	river	25f9e183-4e08-4ddb-8a63-5d835a420b31	\N
394	176	Jeremy Kassim Gicheru	Male	14189124	\N	Widowed	primary	\N	24	tenant	\N	0	0	0	0	1	2	2	2	0	1	0	0	1	2	0	11	2	0	\N	0	0	0	unemployed	11000_15000	\N	\N	0_5000	\N	VIP	vendor	walk	traditional	water_only	dumpsite	81d77583-84a1-42a3-b17d-1dd61387c11f	\N
395	27	Kyle Musimbi Ondiek	Male	41653232	\N	Seperated	primary	\N	23	tenant	\N	0	2	0	2	2	2	1	0	2	2	1	1	2	1	2	20	1	2	\N	0	0	0	self	16000_20000	\N	\N	>20000	\N	pit_latrine	shallow_well	car	traditional	none	private_collector	c5923cd2-24d9-4e2b-8ef8-3fc5c85e1868	\N
396	200	Tonya Njau Omweri	Female	29306031	\N	Widowed	primary	\N	4	tenant	\N	2	0	0	1	2	2	1	1	1	0	2	0	1	1	1	15	0	1	\N	0	0	0	not_applicable	0_5000	\N	\N	>20000	\N	flush	vendor	bicycle	public	with_water_and_soap	bins	8ee2609f-6bb2-4efb-afd7-607cd816942d	\N
397	146	Monica Okumu Oduor	Female	55244571	\N	Cohabiting	secondary	\N	35	plot_Owner	\N	2	2	0	1	0	0	2	0	1	0	0	0	0	0	0	8	2	2	\N	0	1	1	civil_servant	>20000	\N	\N	16000_20000	\N	communal	vendor	walk	private	water_only	bins	e942add0-d7ef-4540-9ef6-2bddac01cfd2	\N
398	86	Erica Mukoya Joel	Female	19403679	\N	Cohabiting	secondary	\N	39	tenant	\N	0	1	1	1	2	1	1	1	0	0	0	0	1	1	0	10	2	1	\N	0	1	1	not_applicable	11000_15000	\N	\N	16000_20000	\N	none	river	train	other	water_only	river	346a0679-609f-442a-a658-8f1ccad61107	\N
399	193	Eric Kalama Mangale	Male	82024962	\N	Single	university	\N	7	tenant	\N	2	0	2	1	1	2	1	1	0	0	2	0	1	0	1	14	2	2	\N	0	1	0	self	>20000	\N	\N	>20000	\N	VIP	river	train	traditional	with_water_and_soap	bins	996d5565-cf7f-476d-8e13-c1d63ae1f9b9	\N
400	202	Bradley Ndwiga Sidi	Male	58181039	\N	Seperated	college	\N	20	structure_owner	\N	2	1	2	1	2	1	0	1	0	0	1	2	1	0	0	14	1	2	\N	0	1	1	civil_servant	11000_15000	\N	\N	>20000	\N	none	rainwater	train	private	none	private_collector	0763da18-ae26-4226-b266-242fc3b9f4b1	\N
653	178	Douglas Gichuru Ngala	Male	46675224	\N	Cohabiting	none	\N	27	plot_Owner	\N	2	1	0	2	2	2	2	0	2	2	2	1	2	0	0	20	0	1	\N	1	1	0	private	0_5000	\N	\N	0_5000	\N	none	none	boda	other	water_only	bins	8c809765-ccb3-40fe-8f46-8f5e2148c226	\N
401	35	Samantha Maroa Ooko	Female	80618944	\N	Seperated	primary	\N	17	structure_owner	\N	0	1	1	1	0	2	0	2	0	2	0	0	2	0	2	13	0	0	\N	1	0	0	student	16000_20000	\N	\N	11000_15000	\N	communal	vendor	bicycle	private	none	dumpsite	35c388a4-a2c6-4cca-9c80-5be40ad31971	\N
402	58	Stephanie Kiti Godana	Female	27230498	\N	married	none	\N	22	tenant	\N	0	1	2	1	2	2	1	0	2	2	0	1	0	1	0	15	1	1	\N	1	0	0	casual	>20000	\N	\N	6000_10000	\N	communal	piped	walk	public	with_water_and_soap	river	42f7f6dc-1aa8-4e47-84e3-cc0901162b37	\N
403	212	Jeffery Nyang'au Cherono	Male	31534521	\N	married	university	\N	19	structure_owner	\N	0	0	1	0	2	0	0	1	1	2	0	0	2	2	1	12	0	0	\N	0	0	0	private	11000_15000	\N	\N	6000_10000	\N	VIP	none	matatu	chemist	with_water_and_soap	bins	0ab5c40c-5383-450c-8574-4029463ff4a4	\N
404	152	Deborah Maghanga Thoya	Female	10840729	\N	Cohabiting	primary	\N	26	plot_Owner	\N	0	2	2	2	2	2	2	0	2	1	1	1	1	2	1	21	0	1	\N	1	0	1	unemployed	0_5000	\N	\N	>20000	\N	pit_latrine	vendor	bicycle	traditional	with_water_and_soap	private_collector	589d5b64-2300-49d0-a0e0-206dd3a516ca	\N
405	171	Kathryn Kinuthia Tuwei	Female	30256909	\N	Seperated	university	\N	25	structure_owner	\N	2	0	2	1	0	0	0	2	0	0	0	1	1	1	1	11	1	2	\N	0	1	1	civil_servant	6000_10000	\N	\N	0_5000	\N	flush	shallow_well	walk	other	with_water_and_soap	bins	c762d108-a24f-48b4-b8cd-d73606f52fd3	\N
406	57	James Nzioka Biwott	Male	68113950	\N	married	university	\N	1	tenant	\N	1	1	0	0	2	2	0	0	1	2	2	2	0	0	1	14	0	2	\N	0	0	1	unemployed	0_5000	\N	\N	6000_10000	\N	VIP	vendor	walk	public	with_water_and_soap	private_collector	b41ccd26-ef9d-41ea-9e79-e1a30aeefa4a	\N
407	98	Christopher Too Kiragu	Male	33536025	\N	Single	university	\N	24	structure_owner	\N	0	1	0	0	1	0	1	1	0	0	1	1	0	0	0	6	2	1	\N	1	0	0	casual	11000_15000	\N	\N	11000_15000	\N	VIP	piped	boda	private	none	private_collector	94a7898d-be1a-4eb2-a58f-c416c5e8f28a	\N
408	206	Barry Ndolo Shikuku	Male	19412302	\N	married	secondary	\N	40	tenant	\N	0	2	1	2	2	0	1	2	0	1	2	2	0	2	1	18	0	1	\N	0	1	1	self	6000_10000	\N	\N	>20000	\N	none	none	walk	mission	with_water_and_soap	private_collector	587c67fe-5669-4bf9-ba7e-f0534afd60f5	\N
409	90	Danielle Wanjiku Chebii	Female	31399328	\N	Cohabiting	none	\N	27	plot_Owner	\N	0	1	2	1	0	2	0	1	1	2	0	2	0	1	1	14	2	0	\N	0	0	1	not_applicable	6000_10000	\N	\N	16000_20000	\N	pit_latrine	vendor	boda	traditional	with_water_and_soap	dumpsite	ee4f1650-5bfd-462e-82ad-a9909ffeff11	\N
410	74	Meagan Kiptum Njiru	Female	74598856	\N	Cohabiting	none	\N	18	tenant	\N	1	0	2	1	2	0	2	2	0	0	0	2	2	1	0	15	0	1	\N	1	1	1	unemployed	6000_10000	\N	\N	6000_10000	\N	none	none	boda	other	none	river	b9aca28a-0e36-41c3-ac8c-504664e092f3	\N
411	181	Casey Were Njau	Male	04441822	\N	married	college	\N	28	tenant	\N	1	0	1	0	1	2	0	2	2	0	0	1	0	1	2	13	1	2	\N	0	1	1	private	>20000	\N	\N	6000_10000	\N	flush	vendor	boda	other	none	bins	84357fff-35cb-420c-becc-1c919c1325aa	\N
412	105	Brittany Kipkirui Ngome	Female	03297443	\N	Seperated	university	\N	18	structure_owner	\N	2	2	2	0	0	0	0	2	1	1	1	2	1	1	2	17	0	0	\N	1	1	0	self	6000_10000	\N	\N	0_5000	\N	communal	shallow_well	boda	chemist	with_water_and_soap	bins	a5a9a920-f854-4be4-ae6e-c93739a6770c	\N
413	7	Curtis Munguti Duba	Male	18649281	\N	Widowed	primary	\N	17	tenant	\N	0	2	2	2	2	1	2	0	1	1	1	1	2	1	0	18	0	0	\N	0	0	0	student	11000_15000	\N	\N	0_5000	\N	pit_latrine	rainwater	car	traditional	none	river	fa9fed79-ca34-4ad8-ba01-101cb12dcac0	\N
414	94	Tamara Wachira Muthuri	Female	71868103	\N	married	university	\N	39	structure_owner	\N	2	0	0	0	0	2	2	0	1	1	1	2	1	0	0	12	0	0	\N	0	0	1	civil_servant	>20000	\N	\N	0_5000	\N	none	river	train	private	with_water_and_soap	river	1fcc1388-fc63-4637-a995-9e89bcb73c10	\N
415	127	Sydney Muindi Mugo	Female	05855988	\N	Cohabiting	secondary	\N	20	structure_owner	\N	0	2	2	0	1	1	1	2	2	2	2	2	1	2	2	22	1	0	\N	0	0	0	casual	6000_10000	\N	\N	6000_10000	\N	none	none	train	private	none	private_collector	99e684c5-bcb4-4cb6-bd9b-f2d5e658d040	\N
416	46	Yvonne Katana Nyamai	Female	76895297	\N	Cohabiting	secondary	\N	30	plot_Owner	\N	0	0	1	0	1	2	2	0	1	2	0	2	0	1	2	14	1	0	\N	1	0	0	unemployed	16000_20000	\N	\N	0_5000	\N	flush	piped	car	private	water_only	bins	00fac78e-f596-4ea6-9fa6-fda832be2b64	\N
417	208	James Ekitela Oginga	Male	52208598	\N	Widowed	college	\N	35	plot_Owner	\N	0	2	1	2	0	2	0	1	1	1	0	1	1	0	1	13	0	0	\N	0	1	0	unemployed	11000_15000	\N	\N	11000_15000	\N	pit_latrine	river	matatu	traditional	water_only	dumpsite	7d75eb5a-a2ac-4f8d-a9f9-81603db4facb	\N
418	162	Brandi Chepkorir Nyawira	Female	44927817	\N	Widowed	primary	\N	26	plot_Owner	\N	0	0	0	1	2	0	1	2	2	0	2	2	0	1	2	15	1	1	\N	0	0	0	civil_servant	16000_20000	\N	\N	6000_10000	\N	communal	none	train	mission	water_only	dumpsite	a1a8ad66-97d0-47f8-8f48-9083ac9f034f	\N
419	119	Cheryl Michael Samuel	Female	43589622	\N	Widowed	university	\N	19	structure_owner	\N	2	0	1	0	0	1	0	0	1	2	0	0	1	1	1	10	2	1	\N	0	0	1	civil_servant	11000_15000	\N	\N	16000_20000	\N	communal	piped	car	private	water_only	dumpsite	3741b6cc-f739-4efc-9da9-60db7354f8b5	\N
420	167	Amanda Sidi Wanjala	Female	54072896	\N	married	college	\N	22	plot_Owner	\N	0	0	1	2	2	0	1	0	0	2	0	2	1	0	1	12	0	0	\N	1	0	1	student	16000_20000	\N	\N	>20000	\N	VIP	rainwater	matatu	public	with_water_and_soap	river	035d33e6-8649-49e9-94d9-4b2e28f9ae70	\N
421	230	Travis Jacob Nzioki	Male	38361091	\N	Single	none	\N	39	structure_owner	\N	0	0	0	0	2	1	2	2	2	2	2	0	1	1	2	17	2	1	\N	0	1	1	civil_servant	>20000	\N	\N	0_5000	\N	none	piped	bicycle	chemist	with_water_and_soap	private_collector	81eccc49-28bb-4f9f-ac01-f6d335b0815c	\N
422	12	Joshua Musila Bosibori	Male	82624635	\N	Widowed	primary	\N	0	structure_owner	\N	1	1	0	0	2	1	0	2	0	2	0	2	0	1	1	13	0	0	\N	0	0	0	self	>20000	\N	\N	16000_20000	\N	flush	river	walk	other	none	river	141a37cd-f0f3-4e7f-8d91-a0cd35e0c849	\N
423	160	Maurice Kipyego Nzai	Male	56444618	\N	Seperated	university	\N	35	plot_Owner	\N	2	0	1	1	0	0	0	1	0	2	0	1	1	1	2	12	2	1	\N	1	1	1	private	6000_10000	\N	\N	11000_15000	\N	VIP	shallow_well	train	mission	water_only	dumpsite	9843b652-2f4f-4ded-8aef-36d0901c1c55	\N
424	170	Mackenzie Mukhwana Kinya	Female	48825711	\N	Widowed	secondary	\N	4	tenant	\N	2	2	0	1	0	0	1	1	0	1	2	1	2	1	0	14	1	2	\N	0	1	0	casual	0_5000	\N	\N	11000_15000	\N	flush	piped	boda	traditional	water_only	bins	e122d784-f54c-41fd-b396-6f4686c03ff5	\N
425	174	Alexandra Wambua Nyawa	Female	43844547	\N	married	university	\N	2	tenant	\N	2	2	0	1	2	1	0	2	2	2	1	2	0	2	2	21	1	0	\N	0	0	0	student	11000_15000	\N	\N	16000_20000	\N	VIP	vendor	car	other	with_water_and_soap	bins	5ca3453d-2bc6-41eb-954d-4a5c4225ad2f	\N
426	147	James Okinyi Jacob	Male	86794731	\N	Widowed	secondary	\N	9	plot_Owner	\N	2	2	1	2	1	1	0	1	2	0	2	2	1	2	2	21	1	0	\N	0	1	0	not_applicable	0_5000	\N	\N	16000_20000	\N	pit_latrine	river	boda	other	with_water_and_soap	dumpsite	a7a0886a-ff80-462d-8e13-b986a36313a7	\N
427	2	Michael Maghanga Odhiambo	Male	04181805	\N	Seperated	university	\N	35	structure_owner	\N	1	2	2	2	2	1	0	1	1	0	1	1	0	2	1	17	1	0	\N	0	0	1	unemployed	0_5000	\N	\N	11000_15000	\N	flush	river	walk	chemist	with_water_and_soap	dumpsite	edb0e2b9-8732-4346-a279-c1ee4bc2ef28	\N
428	29	Michael Njoka Mwanza	Male	85251479	\N	Seperated	secondary	\N	17	plot_Owner	\N	1	2	1	0	0	0	1	2	1	1	2	2	0	1	0	14	2	2	\N	0	1	0	casual	>20000	\N	\N	0_5000	\N	pit_latrine	piped	walk	private	none	private_collector	9689b930-de1a-4742-8ed6-3c4ed6a5de4f	\N
429	6	Aaron Muendo Wayua	Male	45990269	\N	Cohabiting	college	\N	23	structure_owner	\N	1	0	1	1	2	2	2	0	2	2	1	1	1	1	0	17	2	0	\N	0	0	0	private	11000_15000	\N	\N	0_5000	\N	none	none	walk	private	with_water_and_soap	private_collector	448d9473-fc1f-4282-9de8-61ed5ffd6d08	\N
430	220	Karen Cheptoo Nzioki	Female	11814680	\N	married	secondary	\N	39	tenant	\N	0	1	2	0	2	1	0	0	0	2	2	1	1	2	0	14	2	2	\N	0	0	1	self	6000_10000	\N	\N	11000_15000	\N	VIP	none	matatu	public	with_water_and_soap	bins	b98e48a7-0e6e-4de9-acdb-9107b5d12d84	\N
431	176	Matthew Ronoh Kipruto	Male	00510288	\N	Seperated	primary	\N	24	structure_owner	\N	2	1	1	2	2	2	0	0	2	1	0	2	2	2	2	21	0	2	\N	1	0	0	unemployed	11000_15000	\N	\N	0_5000	\N	pit_latrine	none	matatu	chemist	none	river	11e4dac1-e459-48e1-923f-4c6fc3714bd0	\N
432	213	Ashley Fundi Wako	Female	89075135	\N	Widowed	college	\N	29	tenant	\N	1	2	0	1	0	2	2	2	1	0	1	1	0	0	1	14	0	1	\N	0	0	1	private	16000_20000	\N	\N	16000_20000	\N	VIP	none	matatu	traditional	water_only	private_collector	e4e81cf0-c97b-4ce4-a1ed-bd683cd60bab	\N
433	26	Jason Gachoki Chepchumba	Male	46902809	\N	married	university	\N	9	structure_owner	\N	2	1	0	2	2	0	0	0	1	1	1	0	1	1	1	13	2	0	\N	0	0	0	student	6000_10000	\N	\N	16000_20000	\N	flush	rainwater	car	mission	none	dumpsite	b12ed599-3403-4673-827a-bcf12d8e0411	\N
434	94	Tommy Situma Mwania	Male	78984535	\N	Widowed	primary	\N	8	plot_Owner	\N	2	2	0	2	0	2	2	2	1	0	0	2	2	0	2	19	0	2	\N	0	0	0	student	16000_20000	\N	\N	6000_10000	\N	pit_latrine	rainwater	car	chemist	water_only	dumpsite	150184a8-94fa-42bd-9567-bd5c968a3e94	\N
435	146	Chad Ochieng Kirwa	Male	50083569	\N	Single	secondary	\N	23	tenant	\N	0	1	0	1	0	2	0	2	2	2	1	0	2	0	2	15	2	2	\N	1	0	0	self	11000_15000	\N	\N	16000_20000	\N	communal	rainwater	boda	private	none	private_collector	eae138d3-7329-418b-99a3-5eea0c12e38f	\N
436	117	Randall Naliaka Muchai	Male	20003802	\N	married	none	\N	2	plot_Owner	\N	2	0	2	1	1	1	0	1	2	1	1	2	1	2	0	17	2	2	\N	1	0	1	civil_servant	11000_15000	\N	\N	0_5000	\N	communal	piped	matatu	private	with_water_and_soap	private_collector	a435f424-d8db-4ba6-b6ab-dd203f05ded0	\N
437	108	Tara Nyabuti Ogeto	Female	42350678	\N	Widowed	none	\N	30	tenant	\N	0	0	1	2	0	2	2	2	0	1	0	2	1	0	0	13	1	0	\N	0	0	1	student	11000_15000	\N	\N	11000_15000	\N	none	rainwater	bicycle	traditional	water_only	dumpsite	87b8e7b3-5bde-4abc-a3d2-ebeef1b9b9b8	\N
438	62	Lucas Mukiri Mong'are	Male	33563126	\N	married	university	\N	35	tenant	\N	0	2	0	1	1	1	1	1	1	1	1	1	1	0	0	12	0	1	\N	0	1	1	student	16000_20000	\N	\N	>20000	\N	flush	vendor	walk	private	water_only	dumpsite	d0f45863-9ab6-48cd-b1a2-af56de0c4d2e	\N
439	220	Kevin Kitsao Nyaboke	Male	07392836	\N	Seperated	secondary	\N	8	structure_owner	\N	0	2	2	0	1	0	0	1	0	1	0	2	1	1	1	12	0	2	\N	0	1	0	civil_servant	16000_20000	\N	\N	11000_15000	\N	pit_latrine	vendor	bicycle	mission	water_only	river	c53f0984-4440-4fcf-9d40-ea54f34473f9	\N
440	161	Philip Kiptoo Kingori	Male	84356356	\N	Single	college	\N	9	tenant	\N	0	0	0	1	0	0	0	1	0	0	1	0	1	1	1	6	2	1	\N	0	0	0	civil_servant	11000_15000	\N	\N	>20000	\N	VIP	river	bicycle	other	none	river	fad46d11-7416-4749-8a60-32c59c9e5126	\N
441	194	Mark Ombati Kibet	Male	63604396	\N	married	university	\N	4	structure_owner	\N	1	2	0	2	1	1	2	1	2	0	1	0	0	1	0	14	0	1	\N	1	0	0	civil_servant	>20000	\N	\N	16000_20000	\N	communal	shallow_well	bicycle	other	with_water_and_soap	bins	2f8a90e8-5413-4a02-8b6f-8c61fb12f619	\N
442	96	Patricia Samuel Aluoch	Female	17461672	\N	Single	none	\N	5	plot_Owner	\N	1	0	0	0	1	2	2	1	2	1	2	0	1	2	0	15	2	1	\N	1	0	0	casual	16000_20000	\N	\N	0_5000	\N	none	shallow_well	matatu	private	water_only	private_collector	0e426d21-952b-4e77-808a-1de7054601ab	\N
443	171	James Baraza Wachira	Male	19921797	\N	married	college	\N	16	structure_owner	\N	0	2	1	1	0	0	0	1	2	0	1	2	0	2	0	12	1	0	\N	0	1	0	civil_servant	0_5000	\N	\N	0_5000	\N	pit_latrine	none	boda	public	with_water_and_soap	bins	89b65928-8bce-44d7-88b4-08af94a6fde1	\N
444	228	Maria Kipkemei Kiti	Female	82232822	\N	Seperated	none	\N	36	tenant	\N	2	0	0	2	1	0	1	1	1	1	2	2	2	2	0	17	0	1	\N	0	1	0	student	6000_10000	\N	\N	16000_20000	\N	VIP	none	boda	chemist	water_only	private_collector	6b5be757-57d3-48d5-9f12-a9083a010088	\N
445	91	Breanna Kipchirchir Nyanchama	Female	07125897	\N	married	primary	\N	25	structure_owner	\N	0	2	2	0	2	0	2	1	0	1	0	2	2	1	1	16	0	1	\N	1	0	0	civil_servant	16000_20000	\N	\N	11000_15000	\N	none	rainwater	bicycle	traditional	with_water_and_soap	dumpsite	463f1664-8916-41c1-b9ef-ea07324613cf	\N
446	131	Rachel Mukami Mwirigi	Female	14982477	\N	Cohabiting	secondary	\N	17	plot_Owner	\N	2	1	0	0	1	1	0	1	1	2	2	1	0	2	2	16	2	2	\N	1	0	0	civil_servant	6000_10000	\N	\N	6000_10000	\N	none	none	walk	other	water_only	private_collector	aded01e6-6a33-4718-b1e8-d343140a7fef	\N
447	84	Angela Kogo Wasike	Female	02983542	\N	Cohabiting	primary	\N	28	tenant	\N	2	2	0	0	1	0	2	0	0	1	1	1	2	2	0	14	1	2	\N	0	1	0	private	6000_10000	\N	\N	11000_15000	\N	flush	shallow_well	bicycle	traditional	water_only	private_collector	bc26353b-aca5-44cf-97d5-aac26233bc30	\N
448	209	Michael Nyamawi Eyanae	Male	52370837	\N	Cohabiting	primary	\N	30	tenant	\N	1	0	1	0	0	1	2	0	0	2	2	2	2	0	2	15	1	0	\N	0	1	0	civil_servant	0_5000	\N	\N	0_5000	\N	communal	none	car	mission	water_only	river	b654f674-9ecf-415c-83fc-8c6c16ad945b	\N
449	301	Scott Munguti Makungu	Male	28818963	\N	Single	primary	\N	24	tenant	\N	2	2	1	2	1	0	0	1	0	0	0	2	1	0	1	13	2	0	\N	0	1	0	casual	16000_20000	\N	\N	6000_10000	\N	none	shallow_well	car	chemist	none	river	f90daf13-d862-4ddc-9cf8-63fedb0aeb8e	\N
450	107	Derek Kipyegon Onditi	Male	86459559	\N	Cohabiting	none	\N	32	structure_owner	\N	1	1	2	1	2	2	2	1	0	0	1	1	2	0	0	16	0	2	\N	0	1	1	self	>20000	\N	\N	6000_10000	\N	pit_latrine	rainwater	bicycle	private	water_only	dumpsite	9f1c34d4-f758-49a3-92dc-d1bed58c6da1	\N
451	12	Stephen Bulle Okinyi	Male	45442576	\N	Widowed	none	\N	30	plot_Owner	\N	2	0	1	2	2	1	2	0	0	0	0	2	1	2	1	16	2	1	\N	1	1	0	unemployed	6000_10000	\N	\N	11000_15000	\N	communal	rainwater	walk	public	none	bins	13e4a38c-f6b6-4572-b80a-dcc029618f69	\N
452	131	Rachel Okello Bundi	Female	58291245	\N	Single	secondary	\N	15	plot_Owner	\N	1	0	2	0	0	0	1	1	0	2	0	0	1	2	1	11	1	2	\N	0	1	0	private	>20000	\N	\N	11000_15000	\N	pit_latrine	piped	matatu	chemist	none	river	f649fe05-47cb-4d39-bf63-dbc1c0d4a889	\N
453	24	Valerie Ochola Wanja	Female	00427557	\N	Widowed	college	\N	6	plot_Owner	\N	0	1	0	0	2	0	2	1	2	1	1	1	2	1	1	15	2	0	\N	1	1	0	unemployed	>20000	\N	\N	>20000	\N	none	river	car	chemist	with_water_and_soap	bins	c6aae283-49c3-4b81-afb8-57527bd504b3	\N
454	199	Heather Richard Mawia	Female	18327913	\N	Widowed	primary	\N	29	structure_owner	\N	0	0	0	2	2	2	2	2	2	0	0	1	1	1	0	15	1	2	\N	1	1	0	civil_servant	6000_10000	\N	\N	>20000	\N	none	vendor	walk	mission	with_water_and_soap	river	4cb49db6-22b0-4195-b9dc-3108ad3983c8	\N
455	215	Nicole Kipkemei Kiema	Female	13615402	\N	Single	primary	\N	39	plot_Owner	\N	2	0	2	2	1	1	2	1	2	1	1	1	2	2	0	20	1	0	\N	1	1	0	casual	11000_15000	\N	\N	11000_15000	\N	none	vendor	train	other	none	river	b2b9b64b-c3f3-4f2e-9adc-2353bb539fee	\N
456	231	Jennifer Maroa Odongo	Female	55138901	\N	Seperated	none	\N	25	structure_owner	\N	0	1	2	2	2	1	2	0	1	1	0	0	2	1	2	17	0	0	\N	1	1	1	student	6000_10000	\N	\N	>20000	\N	VIP	piped	matatu	mission	water_only	river	3bd712f8-e84f-4de0-97f5-5c1bf0396e82	\N
457	56	Cheryl Makena Chepngeno	Female	47090466	\N	married	secondary	\N	26	tenant	\N	1	0	0	2	0	1	0	2	0	0	1	2	1	2	1	13	0	2	\N	0	1	0	private	0_5000	\N	\N	6000_10000	\N	communal	none	matatu	traditional	with_water_and_soap	private_collector	06c0b92f-fb39-4131-82ca-b478454f8ec2	\N
458	14	George Kipkemboi Mawira	Male	48653716	\N	Seperated	college	\N	29	tenant	\N	1	1	0	1	1	0	1	1	2	1	2	0	2	0	2	15	0	0	\N	1	0	0	self	0_5000	\N	\N	>20000	\N	communal	shallow_well	car	public	water_only	private_collector	4d5100ab-6ac1-402d-8fac-4def1582eea2	\N
459	91	Cody Mwololo Benson	Male	16718386	\N	Widowed	university	\N	8	tenant	\N	1	0	0	2	2	2	2	1	2	0	2	1	1	1	0	17	1	2	\N	1	0	1	unemployed	6000_10000	\N	\N	16000_20000	\N	none	piped	boda	other	with_water_and_soap	river	4b04f97e-b329-434a-bc15-200062aa72ae	\N
460	53	Dustin Kamau Mawira	Male	18955692	\N	Widowed	primary	\N	14	tenant	\N	1	1	0	2	0	1	1	2	2	1	0	0	1	2	0	14	2	0	\N	0	1	0	casual	>20000	\N	\N	>20000	\N	communal	none	car	traditional	none	dumpsite	2ff7f0e7-b21b-4c03-b826-30db207c601b	\N
461	231	Steve Kimotho Cheruto	Male	83856167	\N	married	college	\N	24	structure_owner	\N	1	1	0	0	1	0	0	1	1	2	1	1	2	2	1	14	2	0	\N	0	1	0	not_applicable	>20000	\N	\N	16000_20000	\N	flush	piped	train	chemist	none	bins	03e52548-32ee-47ad-aba7-c24ec508e893	\N
462	27	Anna Jelagat Omolo	Female	77269543	\N	Single	none	\N	10	plot_Owner	\N	0	2	0	1	1	2	2	2	1	1	2	2	2	2	2	22	2	1	\N	1	0	0	not_applicable	16000_20000	\N	\N	11000_15000	\N	VIP	shallow_well	car	mission	none	dumpsite	1b454c91-f114-48d1-8381-a61361464a72	\N
463	30	Pamela Achola Sidi	Female	04366461	\N	married	primary	\N	10	structure_owner	\N	1	1	0	2	2	1	1	2	2	0	2	0	1	0	0	15	1	1	\N	0	1	1	student	16000_20000	\N	\N	0_5000	\N	none	piped	bicycle	other	with_water_and_soap	private_collector	d48e0e16-96a2-4f4a-9417-2c67d0b901b0	\N
464	23	Carrie Tirop Nderitu	Female	50616216	\N	Widowed	primary	\N	36	structure_owner	\N	2	2	1	2	2	2	2	0	2	0	1	2	0	2	1	21	1	1	\N	1	1	0	student	0_5000	\N	\N	11000_15000	\N	VIP	vendor	bicycle	public	none	bins	be098650-1478-4ebc-8bff-27379f4ae343	\N
465	71	Lauren Kurgat Okumu	Female	66816707	\N	Seperated	secondary	\N	3	tenant	\N	0	1	0	0	1	2	0	0	2	0	1	2	2	2	2	15	0	2	\N	1	0	0	student	16000_20000	\N	\N	6000_10000	\N	none	none	matatu	traditional	with_water_and_soap	river	a11aca63-dcc7-4227-ab62-29ee014e5a11	\N
466	207	Debra Jeruto Muthee	Female	03091345	\N	married	none	\N	19	structure_owner	\N	2	0	0	1	2	2	1	1	2	1	0	0	0	2	0	14	2	0	\N	1	1	0	student	6000_10000	\N	\N	>20000	\N	VIP	rainwater	matatu	private	with_water_and_soap	dumpsite	a68db57c-70c5-488d-8d2c-358c0d59cfcf	\N
467	43	Brenda Nzai Osman	Female	12974479	\N	Cohabiting	primary	\N	6	tenant	\N	0	1	0	0	0	2	2	0	1	2	1	1	2	1	1	14	0	1	\N	0	0	0	casual	11000_15000	\N	\N	16000_20000	\N	flush	river	train	chemist	none	river	416b852c-a1fa-4f70-9b73-6138825273e4	\N
468	103	Tyler Yussuf Boru	Male	09555179	\N	Single	none	\N	18	tenant	\N	2	2	0	0	0	2	0	1	2	2	1	1	2	0	0	15	0	0	\N	1	0	1	student	6000_10000	\N	\N	11000_15000	\N	VIP	vendor	car	chemist	none	bins	018aa4d3-182d-4175-988c-25cb008a794c	\N
469	176	Henry Wabomba Murugi	Male	61043308	\N	Seperated	none	\N	35	structure_owner	\N	2	0	1	1	0	0	0	2	1	0	0	2	1	1	2	13	1	2	\N	0	1	1	self	0_5000	\N	\N	11000_15000	\N	VIP	shallow_well	train	private	water_only	private_collector	510123bd-dd28-40c6-80b9-4411c3be482b	\N
470	224	Mark Kombe Mwangi	Male	74944075	\N	Widowed	secondary	\N	34	tenant	\N	1	1	0	1	2	1	2	1	1	0	0	1	0	0	0	11	1	0	\N	1	1	0	civil_servant	11000_15000	\N	\N	0_5000	\N	pit_latrine	piped	matatu	private	water_only	dumpsite	b907ecaf-a5dc-4d66-b2f4-5237d0684525	\N
471	170	Malik Njoroge Siele	Male	53381495	\N	Seperated	secondary	\N	39	tenant	\N	0	0	0	0	2	1	2	2	0	0	0	0	1	1	2	11	0	1	\N	1	0	0	not_applicable	0_5000	\N	\N	6000_10000	\N	pit_latrine	piped	matatu	chemist	water_only	river	65c9f609-2e04-43db-b28e-c36b0c99330e	\N
472	198	Tina Abdallah Saruni	Female	85149326	\N	Single	none	\N	40	plot_Owner	\N	0	1	0	0	2	1	1	0	0	0	2	2	1	0	2	12	1	1	\N	1	1	1	self	6000_10000	\N	\N	6000_10000	\N	communal	piped	walk	private	water_only	dumpsite	4a02317a-1969-4f55-aa96-d797535c75c8	\N
473	68	Kimberly Chenangat Mutethia	Female	22514737	\N	Single	none	\N	0	structure_owner	\N	1	0	2	1	1	2	1	2	1	2	2	0	1	2	2	20	0	2	\N	1	1	1	student	11000_15000	\N	\N	16000_20000	\N	VIP	river	car	private	water_only	private_collector	201066c3-f132-4e38-93fd-595e7c7cbb86	\N
474	104	Daniel Opondo Safari	Male	66252267	\N	Seperated	primary	\N	38	tenant	\N	2	0	0	1	2	1	0	1	1	0	0	2	0	2	0	12	1	2	\N	0	1	0	self	6000_10000	\N	\N	>20000	\N	flush	piped	walk	mission	with_water_and_soap	river	a82b327b-b85b-4817-b490-6f8d19199b64	\N
475	149	Christopher Ng'ang'a Mwirigi	Male	62345091	\N	Seperated	university	\N	38	tenant	\N	2	0	1	0	2	2	0	0	2	1	1	1	2	2	1	17	0	2	\N	0	0	0	civil_servant	6000_10000	\N	\N	0_5000	\N	pit_latrine	vendor	matatu	mission	with_water_and_soap	bins	c14edbcb-544d-46b7-a959-ee93d3aa629b	\N
476	234	Mary Joseph Emuria	Female	03443598	\N	Widowed	college	\N	33	structure_owner	\N	2	2	1	2	0	2	2	1	1	2	2	2	1	1	2	23	1	2	\N	1	0	1	civil_servant	>20000	\N	\N	11000_15000	\N	VIP	river	car	chemist	none	bins	ffed4068-cd6e-4b11-ae4f-ec1247229932	\N
477	204	Tracey Omari Maiyo	Female	87459223	\N	Seperated	university	\N	6	plot_Owner	\N	2	2	2	2	0	0	2	1	2	2	1	1	2	1	2	22	0	0	\N	1	1	0	not_applicable	16000_20000	\N	\N	>20000	\N	none	shallow_well	car	other	none	dumpsite	e49d5ae4-40c4-4b94-b5d1-e3597cc6bd3a	\N
478	179	Eduardo Muchemi Muli	Male	13120305	\N	Seperated	college	\N	32	plot_Owner	\N	0	0	0	2	0	0	1	1	2	0	2	2	0	1	0	11	2	0	\N	0	0	0	student	6000_10000	\N	\N	6000_10000	\N	communal	shallow_well	bicycle	traditional	water_only	bins	e01987f0-bd6f-4d1c-83dd-0581de027120	\N
479	139	William Wainaina Wambui	Male	68659192	\N	Single	university	\N	13	plot_Owner	\N	2	2	0	2	0	1	1	1	2	2	2	2	2	0	2	21	2	2	\N	1	0	1	casual	6000_10000	\N	\N	16000_20000	\N	none	shallow_well	car	public	water_only	bins	db426dcb-4d8a-4874-baaf-e40530b40a03	\N
480	96	Gabrielle Ireri Kimosop	Female	18734147	\N	Cohabiting	primary	\N	16	plot_Owner	\N	0	2	2	1	1	1	0	0	1	1	2	2	0	1	0	14	2	2	\N	0	1	0	unemployed	16000_20000	\N	\N	6000_10000	\N	VIP	shallow_well	car	private	with_water_and_soap	river	b569b4fc-985a-422a-b472-678b1ea73fde	\N
481	196	Julie Kiio Naliaka	Female	60850375	\N	Single	secondary	\N	37	plot_Owner	\N	2	2	0	0	0	2	2	2	0	2	0	1	0	2	1	16	2	0	\N	1	1	1	not_applicable	>20000	\N	\N	11000_15000	\N	none	river	boda	chemist	none	private_collector	87875fef-9a5f-4d6f-8aea-1753759623b8	\N
482	112	Jordan Jomo Nyabuto	Female	83026326	\N	married	university	\N	4	tenant	\N	2	0	0	1	2	2	1	2	0	2	1	0	2	0	0	15	2	0	\N	0	1	0	private	11000_15000	\N	\N	16000_20000	\N	pit_latrine	vendor	bicycle	other	water_only	private_collector	9ce7c6ed-edd6-411e-8543-899179708198	\N
483	60	Wendy Chepchirchir Muthama	Female	81224274	\N	Widowed	university	\N	36	structure_owner	\N	0	2	0	2	0	0	2	0	0	0	0	0	1	0	2	9	2	2	\N	1	1	0	private	>20000	\N	\N	11000_15000	\N	none	shallow_well	matatu	public	water_only	river	025e5448-4b46-4d27-b3c7-c869c77819ad	\N
484	153	Corey Wakio Saitoti	Male	19511438	\N	Single	college	\N	16	structure_owner	\N	2	2	1	2	1	0	0	0	0	0	1	0	1	2	2	14	2	0	\N	1	1	1	student	11000_15000	\N	\N	>20000	\N	none	piped	walk	public	with_water_and_soap	river	adc709e6-43e0-4771-b8c6-8c1b005ee299	\N
485	109	Rebecca Kemboi Simon	Female	12510979	\N	married	college	\N	35	structure_owner	\N	1	0	1	2	1	2	1	0	1	1	0	1	0	0	2	13	2	0	\N	0	1	1	unemployed	0_5000	\N	\N	11000_15000	\N	none	vendor	matatu	mission	none	dumpsite	8cc14aa7-46c9-4153-b85d-17c10469fa3c	\N
486	22	Evan Issack Nyangweso	Male	10089985	\N	Cohabiting	university	\N	24	structure_owner	\N	1	2	2	1	2	2	2	2	2	2	1	1	2	1	2	25	2	2	\N	0	1	0	casual	11000_15000	\N	\N	16000_20000	\N	VIP	rainwater	walk	traditional	with_water_and_soap	dumpsite	ee18a68b-a9d4-4cc1-b754-96e4415a7885	\N
487	86	Cynthia Joshua Ombasa	Female	28146709	\N	Widowed	primary	\N	10	structure_owner	\N	0	1	0	1	0	1	0	2	0	2	2	0	2	0	0	11	2	1	\N	0	0	1	private	16000_20000	\N	\N	6000_10000	\N	none	river	train	public	water_only	private_collector	8a5ff121-22d4-4e1f-b402-d5b1a0ce8dc7	\N
488	102	Alejandro Nyaboke Mageto	Male	63332831	\N	Seperated	college	\N	11	structure_owner	\N	2	2	2	1	0	2	0	0	0	2	1	1	0	2	2	17	1	0	\N	1	1	0	private	16000_20000	\N	\N	>20000	\N	flush	none	bicycle	traditional	none	private_collector	e583b2d4-db75-4b60-bc07-34fb480c4b0a	\N
489	26	Charles Mutegi Aluoch	Male	73079608	\N	Cohabiting	none	\N	40	structure_owner	\N	2	2	2	2	1	0	1	2	2	1	0	0	1	2	2	20	1	2	\N	1	0	1	self	>20000	\N	\N	0_5000	\N	VIP	river	bicycle	traditional	with_water_and_soap	river	dd7e8746-6ac4-443a-9e94-e5716bb00a21	\N
490	117	Michael Chepchirchir Mahamud	Male	21915804	\N	Widowed	secondary	\N	19	tenant	\N	1	1	0	1	0	2	0	2	1	2	2	0	2	1	0	15	0	2	\N	0	1	0	casual	0_5000	\N	\N	0_5000	\N	flush	none	train	public	with_water_and_soap	river	97415ebc-0e6c-4c1a-abfe-84c6b6636928	\N
491	219	Derrick Mwangangi Kimeli	Male	48599832	\N	married	primary	\N	15	plot_Owner	\N	0	1	0	0	1	2	0	2	2	0	0	1	2	0	2	13	2	2	\N	0	0	1	unemployed	11000_15000	\N	\N	16000_20000	\N	pit_latrine	none	walk	private	water_only	private_collector	887b66fc-881e-465f-9350-46211ece63b7	\N
492	133	Shelby Wangai Awino	Female	83366498	\N	married	college	\N	13	tenant	\N	1	2	1	2	0	0	2	2	2	0	1	2	1	2	2	20	0	0	\N	1	1	1	student	16000_20000	\N	\N	16000_20000	\N	communal	river	bicycle	public	with_water_and_soap	private_collector	86778418-24bc-449d-8a96-c4e04680846e	\N
493	1	Susan Mageto Muthama	Female	06980541	\N	Seperated	college	\N	39	tenant	\N	1	2	0	0	2	2	0	2	0	2	0	1	0	1	2	15	1	1	\N	0	0	1	student	0_5000	\N	\N	>20000	\N	communal	rainwater	car	private	none	private_collector	8f463315-6287-466e-af65-9dad3b0822fc	\N
494	235	Daniel Jillo Rioba	Male	06527435	\N	Cohabiting	college	\N	34	plot_Owner	\N	1	2	2	2	1	2	2	0	0	0	1	0	0	0	2	15	2	1	\N	1	1	0	casual	16000_20000	\N	\N	>20000	\N	flush	river	boda	mission	none	bins	df086c95-7586-4aef-b794-8f266782e0ae	\N
495	53	Sean Muchiri Kyalo	Male	53498640	\N	married	primary	\N	34	plot_Owner	\N	0	1	0	1	1	2	2	1	2	2	2	0	0	2	2	18	1	1	\N	1	1	0	private	0_5000	\N	\N	11000_15000	\N	flush	rainwater	bicycle	other	water_only	river	8fdacdad-eb39-4c71-be91-1e17e53fb2cc	\N
496	47	Latoya Mongare Muturi	Female	22731555	\N	Cohabiting	university	\N	10	plot_Owner	\N	0	0	0	1	2	1	0	1	1	1	1	0	2	1	1	12	1	0	\N	0	1	1	student	11000_15000	\N	\N	6000_10000	\N	none	rainwater	train	public	none	private_collector	d4138da0-9ab7-4f76-b2b3-c986455dd413	\N
497	8	Paul Kang'ethe Mwende	Male	27393004	\N	Single	primary	\N	9	tenant	\N	1	0	1	2	2	0	1	2	0	0	1	0	1	2	0	13	1	2	\N	0	1	0	private	0_5000	\N	\N	0_5000	\N	flush	none	boda	mission	none	river	fc8f94c0-7ed8-4f6c-83e9-13d8fbbc530b	\N
498	65	Diane Wainaina Mulwa	Female	07873225	\N	Single	secondary	\N	0	tenant	\N	1	1	1	0	0	1	1	2	1	0	0	1	2	0	0	11	0	2	\N	0	0	1	civil_servant	6000_10000	\N	\N	>20000	\N	communal	river	matatu	mission	with_water_and_soap	private_collector	90c2d56c-6b82-4393-8f6d-b6c4a9bd93a4	\N
499	183	Joshua Deng Wangare	Male	44442340	\N	Seperated	primary	\N	10	tenant	\N	0	0	1	0	0	0	1	1	0	0	2	1	1	0	0	7	2	0	\N	1	0	1	unemployed	6000_10000	\N	\N	16000_20000	\N	none	shallow_well	car	traditional	none	river	56cfebc1-5f51-4b8b-90fc-5ed79514fb78	\N
500	99	Eric Opondo Jackson	Male	63499402	\N	Single	college	\N	21	plot_Owner	\N	0	1	0	1	2	2	2	2	2	0	0	0	0	1	2	15	0	0	\N	0	0	1	unemployed	16000_20000	\N	\N	6000_10000	\N	flush	shallow_well	train	public	with_water_and_soap	bins	6efd672a-8b9e-4c24-87f0-cb3f3683590a	\N
501	199	Alex Rotich Mureithi	Male	40939432	\N	Seperated	university	\N	23	plot_Owner	\N	1	1	2	2	2	1	2	0	2	0	0	2	1	2	1	19	1	2	\N	0	1	1	unemployed	6000_10000	\N	\N	0_5000	\N	communal	piped	walk	chemist	none	dumpsite	a5dacb45-4afa-4967-b504-91c533da3de6	\N
502	84	Kaitlyn Kipkirui Gacheri	Female	89203008	\N	Single	none	\N	23	structure_owner	\N	0	1	1	1	1	1	2	2	1	0	2	1	1	1	0	15	0	2	\N	1	0	1	casual	16000_20000	\N	\N	0_5000	\N	pit_latrine	vendor	boda	private	with_water_and_soap	dumpsite	c30e2789-203a-4f9a-8639-bf37af22a869	\N
503	55	Jeremiah Mwinzi Chenangat	Male	33732140	\N	Cohabiting	none	\N	15	structure_owner	\N	2	0	1	1	2	2	1	0	2	1	0	2	0	2	1	17	1	2	\N	1	0	1	civil_servant	16000_20000	\N	\N	16000_20000	\N	none	none	walk	private	with_water_and_soap	private_collector	ecb6ad1d-b938-4c7f-8872-703b5a95b366	\N
504	232	Jason Siele Mutahi	Male	43542950	\N	Widowed	university	\N	6	structure_owner	\N	2	1	0	1	1	2	0	2	0	2	2	0	1	2	1	17	0	1	\N	0	1	0	casual	6000_10000	\N	\N	6000_10000	\N	flush	rainwater	bicycle	other	none	private_collector	ee1da793-d9cd-4364-b945-7d252b1d640b	\N
505	45	Meghan Akumu Musee	Female	33435268	\N	Seperated	primary	\N	9	tenant	\N	1	0	1	2	1	0	0	0	1	0	1	2	1	1	2	13	1	2	\N	1	0	1	private	11000_15000	\N	\N	6000_10000	\N	none	river	boda	chemist	with_water_and_soap	private_collector	bf99be69-018e-4237-904c-124c589119de	\N
506	187	Julie Boke Ndirangu	Female	07238566	\N	Widowed	university	\N	35	structure_owner	\N	2	0	2	0	0	1	0	1	0	0	1	2	2	1	0	12	0	2	\N	0	0	0	not_applicable	6000_10000	\N	\N	>20000	\N	flush	vendor	matatu	mission	water_only	bins	61fd6a88-b7d5-4621-884f-dd96213a00be	\N
507	152	Sherry Okemwa Ngugi	Female	41992883	\N	Seperated	college	\N	32	tenant	\N	0	1	2	0	1	1	1	0	2	2	2	1	0	0	0	13	1	1	\N	0	1	0	private	16000_20000	\N	\N	6000_10000	\N	none	piped	matatu	chemist	none	dumpsite	fa932ce7-83e6-47c7-9db3-be1d145059f8	\N
508	105	Patricia Matheka Kuria	Female	06292766	\N	Seperated	college	\N	11	structure_owner	\N	0	2	2	2	1	1	2	1	2	1	2	0	1	2	1	20	1	0	\N	0	1	0	civil_servant	0_5000	\N	\N	6000_10000	\N	communal	river	bicycle	chemist	with_water_and_soap	river	3509599a-466c-4006-b9d6-829d26ba5f45	\N
509	68	Jamie Muchemi Wabomba	Male	60941305	\N	Single	college	\N	5	structure_owner	\N	2	2	2	1	0	2	2	2	0	0	0	2	1	1	1	18	0	0	\N	1	0	0	casual	6000_10000	\N	\N	>20000	\N	communal	piped	matatu	private	water_only	private_collector	fd5a444d-68f4-48a1-bad1-974100b24831	\N
510	227	Robin Kipyego Nasimiyu	Female	14353289	\N	Single	primary	\N	4	plot_Owner	\N	1	2	1	2	1	2	0	2	1	0	2	2	1	2	1	20	1	0	\N	1	0	0	casual	16000_20000	\N	\N	6000_10000	\N	none	rainwater	car	other	with_water_and_soap	dumpsite	60ced48c-e674-4260-ba0e-5085917a53ae	\N
511	61	Donald Wanjiru Muteti	Male	64449957	\N	Cohabiting	none	\N	7	tenant	\N	0	0	1	1	2	2	2	0	1	2	2	2	2	2	2	21	2	1	\N	1	0	0	self	>20000	\N	\N	16000_20000	\N	communal	river	bicycle	mission	none	river	62bc8ece-9cd0-46d2-b5d8-135971f2ce31	\N
512	132	Paula Wabwire Kaimenyi	Female	42519090	\N	Cohabiting	none	\N	27	structure_owner	\N	2	1	0	2	1	1	0	2	0	2	2	1	2	2	0	18	1	1	\N	1	0	1	casual	6000_10000	\N	\N	11000_15000	\N	pit_latrine	piped	walk	public	none	dumpsite	2fbf11db-bcb8-493b-98c1-50aabc924490	\N
513	110	Ashley Wambugu Mbui	Female	01348041	\N	married	none	\N	26	tenant	\N	1	0	2	2	2	2	2	2	2	2	1	2	2	1	0	23	0	0	\N	0	1	0	student	16000_20000	\N	\N	11000_15000	\N	VIP	vendor	boda	private	water_only	private_collector	e0aeaeb3-2049-4c58-811e-f7fcaa125463	\N
514	214	Stacy Owino Ruwa	Female	57084118	\N	Single	university	\N	34	structure_owner	\N	1	2	1	0	2	1	1	1	2	1	0	2	0	0	1	15	2	1	\N	0	1	0	student	>20000	\N	\N	6000_10000	\N	communal	none	boda	other	with_water_and_soap	private_collector	df6ba634-d50a-4b21-ad53-9198169edb06	\N
515	126	Hannah Mutungi Okinyi	Female	87030261	\N	married	secondary	\N	19	plot_Owner	\N	2	2	0	2	1	0	1	0	1	0	0	2	2	1	2	16	2	2	\N	1	1	0	student	0_5000	\N	\N	6000_10000	\N	communal	vendor	train	other	none	bins	631e135e-22e7-4d41-b07a-cfe02198b644	\N
516	193	Donna Muendo Musila	Female	64829658	\N	Seperated	secondary	\N	9	plot_Owner	\N	0	1	1	2	1	1	1	1	1	0	0	0	1	1	2	13	2	1	\N	0	1	0	unemployed	6000_10000	\N	\N	11000_15000	\N	flush	rainwater	bicycle	private	with_water_and_soap	river	dcbf341c-01e6-4d72-8ba5-423516228866	\N
517	159	Wendy Mutai Yakub	Female	43014026	\N	Seperated	college	\N	22	plot_Owner	\N	2	1	0	1	1	2	0	1	0	2	1	1	2	1	2	17	1	1	\N	1	1	1	unemployed	16000_20000	\N	\N	0_5000	\N	VIP	shallow_well	train	other	water_only	bins	a260cbc3-01cf-4b5c-92bd-4732267eb8b6	\N
518	203	Erika Patrick Omondi	Female	02606819	\N	Widowed	college	\N	19	tenant	\N	0	0	2	2	0	0	0	1	2	1	1	2	1	1	1	14	1	1	\N	1	0	1	self	11000_15000	\N	\N	16000_20000	\N	pit_latrine	rainwater	train	chemist	with_water_and_soap	private_collector	71fd1f95-1454-4715-8049-63106357737b	\N
519	173	Cynthia Ziro Kwemoi	Female	48653471	\N	Seperated	university	\N	35	structure_owner	\N	2	2	2	0	1	1	0	1	2	2	1	0	0	0	0	14	2	0	\N	0	0	1	self	6000_10000	\N	\N	>20000	\N	communal	river	train	public	none	river	2fb391af-14bd-43ab-b76e-d78091c5177c	\N
520	234	Thomas Bashir Ndambuki	Male	27780916	\N	Single	college	\N	9	plot_Owner	\N	2	2	2	0	1	1	1	2	1	0	0	1	0	0	2	15	0	0	\N	0	1	0	not_applicable	16000_20000	\N	\N	16000_20000	\N	none	vendor	train	public	none	dumpsite	3b58cb38-19fa-4c37-8294-ae57a1c237b1	\N
521	25	Beverly Kisilu Murugi	Female	24350281	\N	married	none	\N	26	tenant	\N	0	2	0	0	1	0	0	1	1	2	1	1	2	2	2	15	1	2	\N	1	0	0	unemployed	0_5000	\N	\N	0_5000	\N	pit_latrine	shallow_well	train	private	water_only	private_collector	5a0298bc-04b0-43a4-bffc-871a2fc0624d	\N
522	184	Shane Jebet Ibrahim	Male	66184129	\N	Cohabiting	secondary	\N	2	structure_owner	\N	0	2	1	1	1	0	2	0	1	1	1	0	1	0	1	12	1	2	\N	1	0	0	student	0_5000	\N	\N	11000_15000	\N	pit_latrine	vendor	car	mission	water_only	bins	cc571e98-e01f-4aef-9ccc-18b95dbda5a3	\N
523	95	Kathy Ogola Waswa	Female	78781932	\N	Single	primary	\N	4	structure_owner	\N	2	0	1	0	2	0	0	2	0	1	0	1	0	0	2	11	0	1	\N	1	0	1	not_applicable	>20000	\N	\N	11000_15000	\N	pit_latrine	rainwater	walk	mission	none	dumpsite	a548a902-8aba-4a64-bcf1-723ba526da98	\N
524	79	Courtney Kiptanui Kipngeno	Female	87399165	\N	Cohabiting	secondary	\N	7	structure_owner	\N	0	0	1	0	1	2	0	1	1	1	0	2	1	2	2	14	1	1	\N	0	1	1	self	16000_20000	\N	\N	11000_15000	\N	flush	shallow_well	train	mission	with_water_and_soap	bins	0f6464d6-7f83-4aab-84a0-6052b6897b05	\N
525	236	Mary Mumba Kinoti	Female	60204584	\N	Seperated	college	\N	16	tenant	\N	0	2	2	1	0	0	1	1	0	0	2	2	1	2	2	16	0	0	\N	0	0	0	not_applicable	0_5000	\N	\N	11000_15000	\N	flush	shallow_well	walk	traditional	none	bins	3346a97d-3a5e-4b7c-a289-0a642eda626a	\N
526	211	Stanley Kiplimo Cherotich	Male	05998065	\N	Cohabiting	secondary	\N	10	structure_owner	\N	0	0	2	1	0	2	0	2	2	2	2	1	2	0	0	16	2	2	\N	1	1	1	not_applicable	11000_15000	\N	\N	0_5000	\N	none	shallow_well	matatu	other	with_water_and_soap	dumpsite	a784d922-d769-4209-a217-af77be38bbd1	\N
527	230	Kara Makena Mokaya	Female	72440361	\N	Single	university	\N	34	tenant	\N	1	2	1	2	0	0	0	2	0	1	0	2	0	0	1	12	0	0	\N	0	0	1	student	16000_20000	\N	\N	6000_10000	\N	pit_latrine	none	matatu	other	water_only	river	5cebf4d7-e20a-4905-ad4e-fd34d208766c	\N
528	105	Raymond Naserian Khamisi	Male	21297068	\N	married	university	\N	20	tenant	\N	1	0	0	1	0	2	1	0	0	0	2	1	0	2	2	12	1	2	\N	1	1	1	casual	16000_20000	\N	\N	16000_20000	\N	flush	vendor	boda	public	with_water_and_soap	bins	728bee20-9223-4ee0-be0d-0432403e8a1f	\N
529	126	Adam Kioko Kang'ethe	Male	79243002	\N	Single	none	\N	1	plot_Owner	\N	0	1	1	2	0	2	1	1	1	0	0	2	0	2	1	14	0	1	\N	1	1	1	private	11000_15000	\N	\N	16000_20000	\N	VIP	shallow_well	matatu	mission	with_water_and_soap	dumpsite	a4c0c0dd-3119-483b-9502-b52e94b354c0	\N
530	100	Deborah Odongo Waithera	Female	81634649	\N	Seperated	primary	\N	24	tenant	\N	2	2	1	2	2	2	2	2	2	0	0	0	2	1	0	20	2	0	\N	0	1	1	unemployed	11000_15000	\N	\N	16000_20000	\N	none	shallow_well	walk	public	none	river	6c7f7c4d-d94b-4ce8-9cad-357768075725	\N
531	120	Timothy Fondo Mohamed	Male	48395137	\N	Widowed	secondary	\N	27	plot_Owner	\N	1	1	0	2	0	1	1	0	2	1	2	1	1	2	2	17	2	2	\N	1	0	0	self	16000_20000	\N	\N	11000_15000	\N	none	vendor	train	chemist	with_water_and_soap	private_collector	0fd4e98c-4584-4791-87d5-381fb8aefd99	\N
532	30	Michael Gachanja Matano	Male	08223806	\N	Single	college	\N	19	tenant	\N	1	0	0	1	1	2	1	2	1	2	0	0	2	1	0	14	0	0	\N	0	0	0	casual	>20000	\N	\N	16000_20000	\N	communal	piped	bicycle	mission	water_only	dumpsite	d9924e87-34b9-4fde-80ab-22a6bde5470e	\N
533	237	Derek Ouma Koome	Male	73949159	\N	Seperated	none	\N	16	tenant	\N	2	0	2	0	1	0	0	2	2	2	1	1	2	2	1	18	2	2	\N	0	0	0	casual	11000_15000	\N	\N	11000_15000	\N	VIP	shallow_well	car	traditional	water_only	dumpsite	f89b2156-a649-4dcb-b593-c1266c0da47d	\N
534	124	Rhonda Jackson Ndwiga	Female	37568108	\N	Cohabiting	university	\N	34	plot_Owner	\N	0	1	0	0	2	0	2	1	2	0	2	2	0	2	2	16	2	0	\N	1	1	0	casual	6000_10000	\N	\N	0_5000	\N	VIP	vendor	bicycle	private	water_only	bins	a4b826e4-5599-44e0-bf4c-fde9ea34141d	\N
535	221	Tabitha Nyale Abdille	Female	84249197	\N	Seperated	secondary	\N	1	tenant	\N	0	0	2	2	0	2	2	0	1	1	2	1	2	1	2	18	0	0	\N	1	1	1	not_applicable	16000_20000	\N	\N	11000_15000	\N	pit_latrine	shallow_well	matatu	other	none	dumpsite	4dbf9abf-6c33-4e15-be73-bb86ff1df746	\N
536	19	Dustin Ekal Mutie	Male	00570401	\N	married	college	\N	36	structure_owner	\N	2	1	1	0	0	0	0	1	2	2	1	0	2	2	0	14	0	2	\N	1	1	0	casual	11000_15000	\N	\N	>20000	\N	communal	rainwater	matatu	private	none	dumpsite	22fad09e-6633-4c0f-afbd-a25f18b70690	\N
537	82	Courtney Masha Muriuki	Female	45633035	\N	married	none	\N	14	tenant	\N	1	1	0	0	0	2	2	2	1	2	0	1	1	0	0	13	0	0	\N	0	1	1	self	16000_20000	\N	\N	>20000	\N	communal	shallow_well	boda	other	none	bins	66e2a530-a477-450b-bfe9-67fd763e9689	\N
538	183	Raymond Kurgat Mwanza	Male	47820069	\N	Widowed	primary	\N	26	tenant	\N	1	1	2	1	2	1	2	0	1	1	2	1	2	2	1	20	2	2	\N	0	0	0	private	6000_10000	\N	\N	16000_20000	\N	communal	river	walk	mission	with_water_and_soap	dumpsite	4e34bdc9-4621-4090-a166-47f32a86b31b	\N
539	92	Connor Omolo Mbithe	Male	51935907	\N	Widowed	secondary	\N	15	plot_Owner	\N	1	2	0	1	0	0	1	1	1	0	2	2	1	2	0	14	2	0	\N	0	0	0	casual	11000_15000	\N	\N	0_5000	\N	none	rainwater	bicycle	private	water_only	bins	810ddeb6-50e2-40c3-88aa-b571ae0369d1	\N
540	204	Martin Wanja Terer	Male	23760269	\N	Cohabiting	primary	\N	18	structure_owner	\N	0	2	2	1	2	2	2	2	0	1	2	0	2	2	1	21	2	2	\N	1	0	1	civil_servant	>20000	\N	\N	16000_20000	\N	communal	piped	matatu	other	water_only	river	80a8bfab-6452-47cf-ac55-f815dfbc513d	\N
541	21	Anthony Kiiru Nandwa	Male	52579667	\N	Seperated	college	\N	2	tenant	\N	1	2	2	1	0	1	1	0	1	1	2	2	2	0	0	16	0	0	\N	0	0	1	not_applicable	0_5000	\N	\N	6000_10000	\N	pit_latrine	river	matatu	chemist	none	private_collector	07cd345f-b8bb-4d04-b235-42a1e7ba50fa	\N
542	73	Marcus Kageha Bii	Male	74644597	\N	Widowed	university	\N	17	tenant	\N	1	0	1	1	2	1	0	2	1	0	1	2	2	2	2	18	2	2	\N	1	0	1	private	6000_10000	\N	\N	11000_15000	\N	communal	vendor	boda	other	with_water_and_soap	bins	2e8d1d11-2ab7-440e-8751-fe3187c5a1c8	\N
543	12	Janet Mutisya Okoth	Female	72565715	\N	Widowed	university	\N	34	tenant	\N	2	1	2	2	1	2	1	2	1	0	2	2	2	0	2	22	0	2	\N	0	1	0	self	11000_15000	\N	\N	11000_15000	\N	pit_latrine	none	train	chemist	water_only	bins	ceba736e-befa-4171-a080-becfadb0eb64	\N
544	149	Jeanne Kamathi Kinyua	Female	12384857	\N	married	college	\N	25	structure_owner	\N	0	2	1	2	1	0	2	1	1	0	0	1	2	1	2	16	2	1	\N	1	0	1	civil_servant	0_5000	\N	\N	>20000	\N	flush	vendor	bicycle	other	none	dumpsite	e921968d-5763-45ff-a227-cb8d616c1c32	\N
545	96	Robert Awadh Ouma	Male	01407430	\N	Single	none	\N	0	structure_owner	\N	2	1	1	0	2	2	0	1	2	0	2	2	1	0	2	18	2	0	\N	1	1	0	casual	6000_10000	\N	\N	11000_15000	\N	communal	river	matatu	public	with_water_and_soap	bins	cb1743d6-c9b4-4152-955e-5a12e751f9df	\N
546	90	Richard Mageto Ngigi	Male	23513549	\N	Cohabiting	none	\N	26	structure_owner	\N	1	2	2	2	0	1	0	0	0	1	1	1	2	0	1	14	1	0	\N	0	0	1	unemployed	6000_10000	\N	\N	6000_10000	\N	pit_latrine	piped	train	mission	with_water_and_soap	river	5b61ab43-5896-4568-8346-c23aafbeb14b	\N
547	70	Meredith Kimeli Okuku	Female	80742671	\N	Seperated	college	\N	9	plot_Owner	\N	1	1	2	2	1	0	0	0	1	1	2	1	2	2	2	18	1	0	\N	0	1	0	unemployed	16000_20000	\N	\N	6000_10000	\N	VIP	vendor	train	other	water_only	private_collector	26284885-5019-4764-b2c3-0c2489388aed	\N
548	159	Chelsea Joshua Gichuru	Female	86860980	\N	Widowed	college	\N	8	tenant	\N	0	0	2	1	1	2	2	2	0	0	1	1	2	1	0	15	2	0	\N	0	0	1	private	>20000	\N	\N	11000_15000	\N	communal	shallow_well	train	mission	water_only	dumpsite	aecbee81-5c6e-430d-be79-01901a817fba	\N
549	3	Michele Gicheru Tuwei	Female	37776455	\N	Seperated	none	\N	20	structure_owner	\N	0	1	0	0	2	2	1	2	0	0	1	0	1	2	1	13	0	2	\N	1	1	1	self	0_5000	\N	\N	0_5000	\N	flush	vendor	car	traditional	with_water_and_soap	dumpsite	cacf813a-3550-44f0-bbb0-d35c2b4d79d4	\N
550	218	Kenneth Oloo Mahat	Male	55395896	\N	Seperated	college	\N	37	tenant	\N	0	2	1	2	2	2	0	0	2	1	2	2	0	1	0	17	1	0	\N	0	1	1	student	16000_20000	\N	\N	16000_20000	\N	communal	piped	matatu	traditional	none	dumpsite	35062f63-5771-431c-bd9f-ed54c94e2cb4	\N
551	169	Tricia Wanjau Mwema	Female	39526322	\N	married	primary	\N	40	plot_Owner	\N	1	0	2	0	2	0	2	2	2	1	1	1	2	1	2	19	2	2	\N	1	0	1	private	6000_10000	\N	\N	6000_10000	\N	flush	shallow_well	bicycle	other	with_water_and_soap	private_collector	4ffe6f4a-2ebc-43b7-9f69-8eca2c7edf31	\N
552	126	Michael Mutwiri Kiogora	Male	86664671	\N	Single	university	\N	23	tenant	\N	2	0	2	2	1	1	2	0	2	0	1	0	2	2	2	19	1	0	\N	1	0	1	not_applicable	16000_20000	\N	\N	16000_20000	\N	pit_latrine	vendor	boda	public	none	private_collector	67575d42-a637-4b41-97d1-243515ab46c4	\N
553	183	Andrew Koskei Mawira	Male	07542363	\N	married	college	\N	17	tenant	\N	0	2	0	2	1	0	2	2	1	2	0	0	1	1	1	15	2	2	\N	0	1	1	private	0_5000	\N	\N	16000_20000	\N	pit_latrine	shallow_well	boda	private	water_only	private_collector	e23108e1-b219-45f7-a351-34e6017b1fcc	\N
554	195	Maria Nkirote Murunga	Female	68704830	\N	Cohabiting	university	\N	18	plot_Owner	\N	2	0	1	1	2	1	2	0	1	0	2	2	0	2	1	17	0	1	\N	1	0	1	private	6000_10000	\N	\N	16000_20000	\N	pit_latrine	river	train	private	none	dumpsite	68dddbdc-9c4d-4277-b74a-71d6dce39adc	\N
555	229	Eddie Wanza Shariff	Male	11753744	\N	Seperated	primary	\N	32	structure_owner	\N	2	2	1	2	2	2	2	1	0	0	2	0	0	1	1	18	2	1	\N	1	1	1	not_applicable	6000_10000	\N	\N	>20000	\N	flush	none	walk	chemist	none	bins	92bd3412-28da-4b32-85c6-4948dadf6155	\N
556	237	Marissa Nkirote Mbaabu	Female	50138833	\N	Seperated	primary	\N	13	tenant	\N	0	2	1	1	2	0	2	1	0	1	1	1	2	0	1	15	1	0	\N	0	0	0	not_applicable	11000_15000	\N	\N	11000_15000	\N	communal	piped	bicycle	traditional	water_only	dumpsite	c794ef58-8854-4bb1-809c-bf608113c93c	\N
557	204	Karen Esekon Mbae	Female	29552181	\N	married	primary	\N	30	plot_Owner	\N	0	0	0	2	2	2	0	2	1	0	2	1	2	1	1	16	2	2	\N	0	1	1	unemployed	6000_10000	\N	\N	6000_10000	\N	flush	vendor	walk	traditional	with_water_and_soap	dumpsite	28006414-622e-41ed-9fe4-8ff2560e6641	\N
558	77	Christina Esekon Kiama	Female	46117628	\N	Seperated	college	\N	29	tenant	\N	2	2	1	1	2	2	2	0	2	1	2	1	0	1	0	19	2	2	\N	0	0	0	unemployed	16000_20000	\N	\N	>20000	\N	VIP	none	walk	traditional	with_water_and_soap	private_collector	f4073cdf-545f-4bed-b745-72dfeda74c15	\N
559	67	James Nyale Too	Male	89645637	\N	Single	college	\N	29	tenant	\N	1	1	0	1	0	1	0	0	2	1	1	2	2	0	0	12	2	1	\N	0	0	1	student	16000_20000	\N	\N	16000_20000	\N	none	rainwater	walk	chemist	none	bins	af2e2362-dfc4-4c83-b85f-4881d9afcafc	\N
560	88	Mark Kiiru Kithinji	Male	60863188	\N	Single	none	\N	20	structure_owner	\N	1	0	2	2	1	1	1	2	1	0	2	0	0	2	1	16	0	0	\N	1	0	0	student	>20000	\N	\N	>20000	\N	pit_latrine	shallow_well	matatu	mission	water_only	dumpsite	3340f09e-757c-4a83-a1e3-193b6d00ed2f	\N
561	169	Karen Mulongo Nyangau	Female	87889785	\N	Widowed	none	\N	12	tenant	\N	1	0	2	1	0	2	0	0	2	0	2	2	0	1	0	13	1	2	\N	1	1	1	not_applicable	11000_15000	\N	\N	6000_10000	\N	pit_latrine	river	car	mission	water_only	river	145af8ad-39ad-4a61-83a1-6e61b699c93e	\N
562	161	Alexis Kipkogei Bii	Female	45374535	\N	Widowed	college	\N	6	tenant	\N	1	2	0	1	0	2	2	0	2	2	0	0	2	2	0	16	1	1	\N	1	1	1	civil_servant	11000_15000	\N	\N	0_5000	\N	flush	vendor	train	mission	water_only	bins	62e4a349-92d2-4964-ae93-76840be65906	\N
563	165	Melinda Ombui Chepkoech	Female	57371163	\N	Widowed	secondary	\N	26	tenant	\N	1	0	0	2	1	2	2	0	1	2	2	1	0	1	1	16	1	2	\N	1	1	0	self	0_5000	\N	\N	11000_15000	\N	flush	shallow_well	boda	other	none	bins	93b1d813-bacd-4f73-aa69-963b8d9cc4b5	\N
564	110	Ryan Cheyech Gathogo	Male	41850563	\N	Cohabiting	none	\N	34	tenant	\N	1	1	0	2	0	1	2	1	0	0	1	2	2	0	1	14	2	2	\N	1	0	1	civil_servant	>20000	\N	\N	6000_10000	\N	pit_latrine	vendor	train	other	water_only	river	c63598c5-5d74-4034-8507-77045565787b	\N
565	113	Jessica Wangai Pkemoi	Female	45049890	\N	married	college	\N	19	plot_Owner	\N	0	0	1	1	0	2	0	1	0	0	1	1	0	2	2	11	2	2	\N	0	1	1	student	11000_15000	\N	\N	>20000	\N	communal	vendor	bicycle	public	water_only	river	e0d32674-eedf-43fa-9ee6-27077c130186	\N
566	89	Erica Naserian Gichuru	Female	33127784	\N	Seperated	college	\N	9	tenant	\N	0	0	2	2	1	1	0	2	1	1	2	1	2	1	2	18	2	0	\N	1	1	0	civil_servant	16000_20000	\N	\N	6000_10000	\N	flush	shallow_well	car	public	none	dumpsite	afee9e03-0b84-46c2-86f0-0dc87fcef2bb	\N
567	210	Monique Onsongo Michael	Female	64033941	\N	Single	none	\N	36	plot_Owner	\N	1	0	1	2	2	1	1	1	2	2	1	1	2	2	2	21	1	2	\N	0	0	0	not_applicable	16000_20000	\N	\N	>20000	\N	flush	rainwater	matatu	private	with_water_and_soap	private_collector	84af2b82-406e-48d7-85ed-b58f1533fd10	\N
568	172	Matthew Chepkurui Muindi	Male	17719875	\N	Single	none	\N	30	tenant	\N	1	0	0	0	0	2	1	0	0	2	1	1	0	2	0	10	2	2	\N	1	0	1	not_applicable	11000_15000	\N	\N	16000_20000	\N	none	shallow_well	matatu	traditional	water_only	private_collector	2ad0d056-b9ff-40d1-b82b-855c8fc3ad3d	\N
569	234	Alicia Jama Stephen	Female	51463676	\N	Seperated	secondary	\N	40	plot_Owner	\N	0	0	2	1	0	0	0	1	0	0	2	1	1	0	0	8	0	0	\N	0	0	1	student	0_5000	\N	\N	16000_20000	\N	VIP	none	boda	mission	with_water_and_soap	bins	c1922836-14ed-44b3-8af5-c2f9e5402d86	\N
570	183	Sharon Abdinoor Kipyegon	Female	87026307	\N	Single	none	\N	32	plot_Owner	\N	2	0	2	2	1	2	0	0	2	0	0	0	2	1	1	15	0	1	\N	0	1	0	private	16000_20000	\N	\N	6000_10000	\N	VIP	river	car	public	water_only	private_collector	46cec924-ce2a-42ed-b472-d9dd28358b3e	\N
571	218	Sarah Onyancha Maweu	Female	10603157	\N	Seperated	secondary	\N	30	tenant	\N	2	1	2	2	1	0	1	2	1	2	1	1	0	2	1	19	2	0	\N	1	0	0	private	0_5000	\N	\N	>20000	\N	flush	none	bicycle	private	none	dumpsite	5a316d2d-2d39-4111-8754-0a9ae0ef585d	\N
572	39	Keith Jepchumba Baraka	Male	49010391	\N	Widowed	primary	\N	40	structure_owner	\N	0	1	0	0	2	0	2	2	0	1	2	0	1	1	1	13	0	2	\N	1	1	1	not_applicable	11000_15000	\N	\N	6000_10000	\N	pit_latrine	river	matatu	chemist	none	private_collector	001c2992-c478-42b5-b20d-8f5bbb5b461c	\N
573	237	Jason Mulwa Mitei	Male	65964011	\N	Widowed	none	\N	4	tenant	\N	1	0	0	1	2	0	1	2	1	2	1	1	2	1	0	15	2	2	\N	0	0	0	student	16000_20000	\N	\N	0_5000	\N	VIP	river	walk	mission	water_only	dumpsite	c5a19221-cdb8-4a2c-ae6f-ce5daae5ad7d	\N
574	125	Nancy Khamisi Kimeu	Female	57460455	\N	Widowed	university	\N	13	plot_Owner	\N	0	2	1	1	0	1	0	0	1	2	0	2	2	0	1	13	1	0	\N	0	1	0	civil_servant	16000_20000	\N	\N	11000_15000	\N	none	none	matatu	traditional	none	dumpsite	f3a1a401-b99a-4ff4-a513-8157bd7bafde	\N
575	154	Kimberly Aden Hamisi	Female	80744893	\N	married	secondary	\N	34	plot_Owner	\N	2	1	1	2	2	0	0	1	1	1	1	0	1	2	0	15	0	1	\N	1	1	1	self	>20000	\N	\N	11000_15000	\N	pit_latrine	shallow_well	car	other	with_water_and_soap	dumpsite	c87db193-473f-4c04-8013-199abaec56a7	\N
576	35	Margaret Kaloki Kipkemei	Female	81708575	\N	Cohabiting	secondary	\N	33	plot_Owner	\N	2	1	0	1	2	0	1	2	0	2	1	0	0	1	0	13	1	2	\N	0	1	0	private	6000_10000	\N	\N	16000_20000	\N	communal	piped	matatu	traditional	water_only	bins	52ec1c6e-b50e-48c1-8089-1e66f5cfae1a	\N
577	221	Autumn Okumu Kipngeno	Female	84005735	\N	married	college	\N	2	plot_Owner	\N	1	2	2	2	1	0	1	0	2	0	2	2	2	0	0	17	1	1	\N	0	0	1	not_applicable	>20000	\N	\N	6000_10000	\N	pit_latrine	shallow_well	bicycle	other	none	bins	af998154-5d61-4018-a7c7-47a68aebe6ea	\N
578	165	Lauren Samuel Ndunda	Female	42215204	\N	Seperated	primary	\N	36	tenant	\N	1	2	1	0	0	2	1	0	2	0	0	2	1	0	0	12	1	2	\N	0	0	1	civil_servant	6000_10000	\N	\N	16000_20000	\N	none	piped	matatu	traditional	none	private_collector	bac4bf41-f268-4cb3-a3d5-155f9f742b31	\N
579	69	Catherine Bahati Erupe	Female	11188324	\N	Single	primary	\N	23	structure_owner	\N	1	2	2	1	0	1	2	0	1	1	1	2	2	0	1	17	2	0	\N	0	0	0	civil_servant	6000_10000	\N	\N	>20000	\N	none	shallow_well	boda	private	none	private_collector	b5e21b5b-552a-41f7-9226-e0bd4b4cbea6	\N
580	100	Elizabeth Kilonzo Mwadime	Female	79441526	\N	Widowed	primary	\N	15	tenant	\N	2	1	1	1	2	0	1	0	0	1	1	0	0	0	2	12	1	2	\N	1	0	0	civil_servant	16000_20000	\N	\N	6000_10000	\N	none	rainwater	car	public	with_water_and_soap	river	aa8956ea-d240-4945-9b3b-e83370cdf636	\N
581	99	Anna Njoka Nzioki	Female	07622641	\N	Single	university	\N	9	tenant	\N	1	0	2	2	2	1	2	2	2	0	0	2	1	0	1	18	0	2	\N	1	0	1	civil_servant	11000_15000	\N	\N	>20000	\N	flush	shallow_well	walk	chemist	water_only	river	3c6aedfe-d417-470c-9764-b08591c387a0	\N
582	40	Jacob Cheyech Bonaya	Male	83609762	\N	married	none	\N	7	tenant	\N	0	2	1	1	0	2	1	2	2	2	2	1	2	2	0	20	1	0	\N	1	0	0	unemployed	16000_20000	\N	\N	16000_20000	\N	none	river	matatu	chemist	with_water_and_soap	private_collector	bd74fe84-3e90-4ef1-9402-f7df0c6761bd	\N
583	132	Jessica Rioba Awuor	Female	52813632	\N	Single	primary	\N	25	structure_owner	\N	1	0	0	1	2	0	2	0	1	1	0	1	0	0	1	10	2	1	\N	1	0	0	self	6000_10000	\N	\N	6000_10000	\N	communal	piped	car	public	none	private_collector	04f41734-626d-4859-ae23-a20bbabc8bec	\N
584	65	Jason Muthuri Mutungi	Male	87693991	\N	Widowed	secondary	\N	39	structure_owner	\N	1	1	2	2	0	1	2	1	1	0	0	1	2	0	0	14	1	0	\N	0	1	1	unemployed	11000_15000	\N	\N	>20000	\N	pit_latrine	rainwater	matatu	traditional	none	dumpsite	3a634840-a7dd-4fcf-a614-8883cb9e4aec	\N
585	117	Janice Hamisi Ng'ang'a	Female	14543281	\N	Cohabiting	none	\N	33	tenant	\N	0	1	0	0	2	1	0	1	0	2	0	0	2	1	2	12	2	1	\N	0	1	0	self	6000_10000	\N	\N	11000_15000	\N	none	vendor	walk	mission	none	river	43934f4b-ffe8-4f3b-9527-83d9526818ed	\N
586	211	Ronald Robert Kitsao	Male	01177777	\N	Seperated	university	\N	35	plot_Owner	\N	1	1	1	1	0	1	1	0	2	2	1	1	2	0	2	16	0	0	\N	1	0	0	casual	11000_15000	\N	\N	6000_10000	\N	VIP	vendor	train	chemist	none	river	2b3b2b7f-c11b-4c93-b68a-02e18e283a3d	\N
587	133	Louis Onyiego Okongo	Male	73212566	\N	Seperated	college	\N	31	tenant	\N	0	0	2	0	2	2	2	0	2	1	2	2	2	2	0	19	1	0	\N	1	1	0	unemployed	0_5000	\N	\N	0_5000	\N	communal	piped	train	other	with_water_and_soap	bins	ac3f01d0-ea3b-4d72-a36b-a4450e414089	\N
588	125	Traci Munene Njoroge	Female	73657247	\N	Cohabiting	none	\N	15	plot_Owner	\N	2	0	2	1	0	0	0	0	2	2	1	2	1	1	1	15	2	2	\N	0	1	1	self	11000_15000	\N	\N	>20000	\N	VIP	shallow_well	train	other	water_only	river	55e2bf84-8636-4078-a39f-5b087d01d54e	\N
589	27	Craig Mugendi Wachira	Male	83378036	\N	Cohabiting	college	\N	8	plot_Owner	\N	2	2	1	2	1	2	1	2	1	1	1	2	2	1	0	21	1	1	\N	0	1	0	unemployed	>20000	\N	\N	>20000	\N	communal	river	matatu	public	water_only	bins	a97d38a0-9bd4-4b27-9170-a85035906bad	\N
590	106	Laura Jepngetich Sang	Female	87648414	\N	married	primary	\N	13	plot_Owner	\N	0	0	2	2	2	2	1	2	1	0	0	2	1	2	1	18	1	0	\N	1	0	0	casual	16000_20000	\N	\N	16000_20000	\N	flush	river	matatu	other	water_only	bins	10805354-69b2-4499-9f70-536f67456910	\N
591	115	Olivia Kwamboka Changawa	Female	89788508	\N	married	none	\N	34	plot_Owner	\N	1	2	0	0	0	1	1	1	1	2	0	1	1	1	2	14	0	0	\N	0	1	0	private	16000_20000	\N	\N	0_5000	\N	pit_latrine	none	car	public	none	dumpsite	55cf244b-c5a2-4674-8fc0-b0e1930b7385	\N
592	212	Jose Mbugua Onyango	Male	46221881	\N	Single	college	\N	19	tenant	\N	0	0	0	1	0	0	1	2	1	2	0	1	2	2	2	14	1	0	\N	1	1	0	self	0_5000	\N	\N	16000_20000	\N	none	shallow_well	walk	other	water_only	private_collector	bcfd11f1-c745-48d7-9070-fa0888a126f5	\N
593	189	Jason Mageto Simon	Male	84738819	\N	Cohabiting	secondary	\N	27	plot_Owner	\N	1	0	2	2	2	0	1	1	1	2	2	1	0	0	1	16	1	1	\N	0	0	0	civil_servant	11000_15000	\N	\N	6000_10000	\N	pit_latrine	none	matatu	mission	with_water_and_soap	dumpsite	ea7aa990-2f9a-4e17-a699-ec04218eb93a	\N
594	165	Lindsay Kiarie Jefwa	Female	81102796	\N	married	secondary	\N	9	plot_Owner	\N	0	2	1	0	1	0	0	2	0	0	1	2	0	0	2	11	2	0	\N	0	0	0	civil_servant	0_5000	\N	\N	>20000	\N	communal	shallow_well	bicycle	private	none	dumpsite	6a9bcd6f-b361-4ce5-93be-18a5c1da8d62	\N
595	104	Benjamin Langat Chepkurui	Male	85258172	\N	Single	university	\N	11	plot_Owner	\N	0	1	1	0	1	2	0	2	1	0	1	2	0	0	1	12	1	1	\N	0	0	1	not_applicable	16000_20000	\N	\N	0_5000	\N	flush	piped	boda	mission	with_water_and_soap	private_collector	c04df517-2feb-467a-88a8-fcbafe612b94	\N
596	56	Christopher Huka Wamboi	Male	26882339	\N	Widowed	college	\N	22	plot_Owner	\N	1	0	1	1	0	1	1	1	1	0	0	0	2	1	0	10	1	0	\N	1	0	1	civil_servant	11000_15000	\N	\N	11000_15000	\N	communal	rainwater	car	chemist	none	private_collector	080e959b-a06a-474f-b0e9-fb782bcda229	\N
597	67	Kathy Muraguri Wamaitha	Female	01851503	\N	married	secondary	\N	15	structure_owner	\N	1	1	0	0	0	1	1	0	1	2	0	1	2	1	2	13	1	1	\N	0	0	1	not_applicable	11000_15000	\N	\N	16000_20000	\N	pit_latrine	none	matatu	traditional	with_water_and_soap	dumpsite	d20a1fd1-c417-4338-ab50-9a7b80ef3282	\N
598	171	Cynthia Okuku Kimutai	Female	86030878	\N	Cohabiting	university	\N	4	tenant	\N	2	2	0	0	1	2	2	1	2	2	2	2	0	1	1	20	2	0	\N	0	1	0	casual	11000_15000	\N	\N	0_5000	\N	none	none	bicycle	traditional	with_water_and_soap	bins	e709064d-ad4a-42b1-a80a-835c5dd01942	\N
599	2	Erik Makau Njuguna	Male	78365862	\N	Seperated	none	\N	10	tenant	\N	2	1	1	0	2	1	2	2	0	1	2	0	2	2	2	20	0	2	\N	1	0	1	civil_servant	>20000	\N	\N	16000_20000	\N	VIP	shallow_well	walk	public	none	river	b385b8c4-9da2-44a9-a4c2-39529c91c376	\N
600	30	Desiree Kang'ethe Anyona	Female	70852104	\N	Widowed	university	\N	35	plot_Owner	\N	1	0	0	1	1	0	1	1	2	2	0	2	2	2	0	15	0	2	\N	0	1	0	not_applicable	6000_10000	\N	\N	16000_20000	\N	VIP	none	walk	other	none	river	74b7a644-79ba-46de-985a-2837095db8d9	\N
601	40	Douglas Galgallo Tirop	Male	70915577	\N	Widowed	college	\N	9	tenant	\N	2	0	2	1	0	1	2	0	0	2	0	2	0	1	0	13	2	0	\N	0	1	0	casual	16000_20000	\N	\N	16000_20000	\N	VIP	none	bicycle	public	with_water_and_soap	bins	1161c745-c449-41b1-ad0c-6493b612d6c2	\N
602	176	Samuel Kiplangat Warui	Male	46588091	\N	Seperated	secondary	\N	15	plot_Owner	\N	0	0	1	1	2	1	1	1	0	0	2	2	2	2	2	17	2	2	\N	0	1	1	student	>20000	\N	\N	16000_20000	\N	none	river	matatu	private	with_water_and_soap	dumpsite	ded47d11-9fd6-4e84-a1a6-967b321ca17f	\N
603	236	Mary Mulinge Khaemba	Female	75943444	\N	Cohabiting	primary	\N	18	tenant	\N	1	0	0	1	0	0	2	0	2	2	1	1	2	1	1	14	1	0	\N	0	1	1	self	11000_15000	\N	\N	0_5000	\N	VIP	shallow_well	matatu	public	none	river	72a16437-17df-4044-94c9-2b69b6143fbd	\N
604	18	Zachary Karisa Kipyego	Male	01614158	\N	Single	primary	\N	8	plot_Owner	\N	1	1	1	2	1	0	2	1	2	0	2	0	0	0	1	14	1	2	\N	0	1	0	not_applicable	11000_15000	\N	\N	16000_20000	\N	flush	shallow_well	train	other	water_only	river	7537457b-a96d-46a7-93ad-52d041ac2117	\N
605	31	Patricia Mwihaki Mbogo	Female	24148825	\N	Cohabiting	university	\N	12	tenant	\N	0	0	1	1	2	2	0	0	0	2	0	1	1	2	2	14	1	1	\N	1	0	1	self	16000_20000	\N	\N	0_5000	\N	flush	river	train	private	with_water_and_soap	bins	f4210471-b0e0-4730-acf5-39055674e39b	\N
606	54	Stephanie Kipchirchir Karwitha	Female	27627614	\N	Widowed	primary	\N	30	structure_owner	\N	0	0	2	1	0	2	2	0	2	0	0	1	1	2	1	14	2	0	\N	0	0	1	self	0_5000	\N	\N	11000_15000	\N	flush	none	bicycle	private	none	bins	3822a162-7260-4d29-a230-e49dcb48862e	\N
607	20	Larry Nafuna Karanja	Male	59063323	\N	Seperated	secondary	\N	7	structure_owner	\N	2	1	0	0	1	2	2	2	1	2	0	1	0	1	2	17	1	0	\N	1	1	1	unemployed	11000_15000	\N	\N	>20000	\N	pit_latrine	river	bicycle	private	water_only	river	be0a746f-dda1-4687-a389-59e9810ccc67	\N
608	100	Christy Onditi Munga	Female	34828180	\N	Cohabiting	secondary	\N	36	plot_Owner	\N	0	1	0	0	1	0	2	1	1	0	0	2	1	1	0	10	1	2	\N	0	1	0	civil_servant	>20000	\N	\N	>20000	\N	VIP	vendor	car	mission	none	bins	5a50009b-8597-4ffb-b80c-4f45f5d7db14	\N
609	128	Caitlin Kipkoech Musila	Female	24349134	\N	married	primary	\N	29	plot_Owner	\N	0	1	1	2	0	0	0	0	0	2	1	2	0	0	2	11	1	1	\N	1	0	1	civil_servant	16000_20000	\N	\N	>20000	\N	pit_latrine	piped	boda	private	none	bins	83fedbe4-5be5-4bcb-8eb5-3eb92c9bfb16	\N
610	210	Sierra Muthini Chumo	Female	58081501	\N	Widowed	primary	\N	4	plot_Owner	\N	1	1	0	0	2	0	0	1	1	1	0	2	1	0	0	10	2	2	\N	0	1	0	self	6000_10000	\N	\N	>20000	\N	VIP	piped	car	public	with_water_and_soap	river	1fbacfcc-0763-4839-9daa-75cf50c891c1	\N
611	11	Jamie Wanjala Okoth	Male	31775155	\N	Seperated	college	\N	12	tenant	\N	2	0	1	0	1	1	2	0	1	2	1	0	2	2	1	16	0	0	\N	1	0	1	casual	0_5000	\N	\N	16000_20000	\N	pit_latrine	vendor	boda	mission	none	river	1f4de587-9291-45aa-8bea-9590892c50fe	\N
612	84	Alexis Yussuf Muthike	Female	45222405	\N	Cohabiting	none	\N	34	plot_Owner	\N	2	0	1	0	0	2	0	2	1	1	2	1	1	0	0	13	2	1	\N	0	1	1	civil_servant	11000_15000	\N	\N	>20000	\N	none	shallow_well	boda	chemist	water_only	bins	52137c4d-03be-4bac-9e3a-c2f5252599d3	\N
613	163	Linda Mahat Kibiwot	Female	13477236	\N	Seperated	none	\N	31	structure_owner	\N	0	1	2	1	0	0	0	0	2	1	0	0	1	1	0	9	2	0	\N	0	0	0	self	6000_10000	\N	\N	11000_15000	\N	VIP	rainwater	walk	other	none	river	2f259401-bbf5-4c7b-9f0b-8963375352a6	\N
614	165	Roger Okeyo Kundu	Male	09626533	\N	Cohabiting	university	\N	14	plot_Owner	\N	2	0	1	0	0	0	1	0	2	2	1	0	0	0	2	11	0	1	\N	0	1	1	casual	0_5000	\N	\N	11000_15000	\N	communal	piped	train	other	with_water_and_soap	bins	101adbb3-d4c5-4b77-bd41-4eb9570c5cc3	\N
615	43	Nancy Okelo Khamis	Female	77080786	\N	Widowed	college	\N	36	tenant	\N	2	0	1	1	1	2	1	0	2	2	1	1	1	2	0	17	0	1	\N	0	0	1	civil_servant	11000_15000	\N	\N	0_5000	\N	pit_latrine	none	train	traditional	water_only	river	edc04659-80e1-4d01-a45b-ed71033d7e5c	\N
616	75	Natalie Chacha Titus	Female	64504805	\N	Single	none	\N	19	structure_owner	\N	2	0	0	0	1	0	0	2	1	0	1	1	1	1	2	12	0	1	\N	0	0	1	not_applicable	>20000	\N	\N	11000_15000	\N	communal	piped	boda	mission	with_water_and_soap	private_collector	b948c36a-8943-472a-a899-06a732a266c2	\N
617	18	Christina Said Muuo	Female	45499863	\N	Widowed	none	\N	22	tenant	\N	0	2	0	0	0	0	0	0	2	1	2	2	2	1	1	13	0	1	\N	0	0	1	unemployed	11000_15000	\N	\N	6000_10000	\N	pit_latrine	shallow_well	car	traditional	none	river	d539ccc9-ad9a-46d1-9725-d5cbbaf6e707	\N
618	183	Lisa Okemwa Okumu	Female	80060930	\N	Seperated	university	\N	0	tenant	\N	0	2	2	2	0	0	1	0	2	2	0	0	2	0	1	14	2	1	\N	0	1	1	self	>20000	\N	\N	>20000	\N	communal	none	walk	private	with_water_and_soap	dumpsite	5fbfc5e5-91c5-4c9c-a847-b41eee4ccb75	\N
619	96	Chad Muchiri Ngina	Male	80246465	\N	Seperated	college	\N	15	tenant	\N	2	2	1	1	1	1	0	2	0	0	1	0	1	2	0	14	2	0	\N	0	0	0	student	>20000	\N	\N	0_5000	\N	communal	vendor	walk	traditional	with_water_and_soap	private_collector	3fa59d78-3e71-4610-b9f5-d398e08023b6	\N
620	107	Anna Nderitu Ochola	Female	51988442	\N	Single	primary	\N	17	plot_Owner	\N	2	1	2	0	1	1	1	1	0	0	2	2	2	0	1	16	2	0	\N	0	0	1	self	16000_20000	\N	\N	0_5000	\N	VIP	vendor	boda	other	with_water_and_soap	river	b120b6d7-7455-46b4-98f0-b477c4e088f5	\N
621	21	Isaac Ongeri Suleiman	Male	22907029	\N	Widowed	primary	\N	38	structure_owner	\N	0	0	1	1	0	0	2	2	2	2	1	2	0	0	2	15	1	2	\N	0	0	0	private	11000_15000	\N	\N	0_5000	\N	none	river	matatu	private	with_water_and_soap	bins	33709974-4906-4621-a6c0-33c3f71135ef	\N
622	86	Danielle Njoki Kanini	Female	38554536	\N	Seperated	university	\N	3	plot_Owner	\N	2	1	0	2	2	2	0	1	2	0	1	1	0	1	0	15	0	2	\N	1	1	1	casual	11000_15000	\N	\N	6000_10000	\N	communal	vendor	boda	private	none	dumpsite	6f4546fb-5ded-40c4-8492-fa61cc94e3a2	\N
623	117	Michael Muhia Nyambura	Male	22695193	\N	Widowed	secondary	\N	2	tenant	\N	0	0	1	1	2	1	0	2	0	0	0	0	1	1	2	11	0	0	\N	1	1	1	casual	11000_15000	\N	\N	16000_20000	\N	VIP	piped	boda	public	with_water_and_soap	bins	962347f3-62d4-450a-9e84-6c962c8c87c2	\N
624	46	Robert Bulle Wekesa	Male	23673336	\N	Widowed	none	\N	10	structure_owner	\N	2	2	0	2	2	2	0	0	0	2	0	2	2	2	2	20	1	2	\N	1	0	0	casual	16000_20000	\N	\N	6000_10000	\N	VIP	vendor	train	other	water_only	private_collector	4fe2fdb1-9016-4bc1-81fe-0bcf34ac280a	\N
625	60	Bruce Gatimu Sitienei	Male	14083294	\N	Seperated	college	\N	27	structure_owner	\N	2	2	1	1	0	2	2	2	0	2	1	1	0	2	1	19	0	0	\N	0	1	1	private	>20000	\N	\N	>20000	\N	none	none	walk	other	none	private_collector	716751bc-9527-48fa-87f3-4778031f2807	\N
626	144	Ashley Jemutai Kanja	Female	04353532	\N	Single	secondary	\N	30	plot_Owner	\N	0	1	0	1	0	1	2	0	2	0	0	1	2	2	1	13	2	1	\N	1	1	0	not_applicable	0_5000	\N	\N	0_5000	\N	flush	none	boda	chemist	none	river	0f79f110-5e24-4dc5-8ba9-0417d247113e	\N
652	104	Heather Okeyo Naserian	Female	73855610	\N	Seperated	primary	\N	12	plot_Owner	\N	0	0	2	0	0	1	0	0	2	1	1	0	1	1	2	11	0	1	\N	1	1	1	civil_servant	0_5000	\N	\N	16000_20000	\N	none	rainwater	car	mission	none	bins	1951de87-3d51-4ca7-b97d-b5189810a0c1	\N
627	157	Nicole Mbogo Ngotho	Female	56498157	\N	Widowed	college	\N	36	structure_owner	\N	1	1	0	0	0	1	0	2	2	2	2	0	1	0	1	13	2	2	\N	0	1	0	unemployed	>20000	\N	\N	0_5000	\N	flush	none	matatu	chemist	with_water_and_soap	private_collector	dadfd233-1561-40d0-9535-ad3ddf9790da	\N
628	167	Carol Kipsang Yakub	Female	12459551	\N	Seperated	college	\N	13	structure_owner	\N	2	1	1	0	2	1	1	0	0	1	2	0	0	1	2	14	1	1	\N	0	0	1	casual	>20000	\N	\N	6000_10000	\N	communal	river	train	public	with_water_and_soap	dumpsite	e2a6ffae-ad4e-469b-a296-d594ba0ec038	\N
629	177	Diane Mwaura Chepngetich	Female	50316916	\N	Widowed	secondary	\N	17	structure_owner	\N	0	1	1	2	0	2	0	1	2	0	0	1	0	0	1	11	0	2	\N	0	1	1	not_applicable	16000_20000	\N	\N	6000_10000	\N	communal	vendor	walk	private	water_only	river	093f9de6-b2dd-49ea-9efd-f745b2346402	\N
630	36	Mary Chai Githinji	Female	24562092	\N	Seperated	university	\N	11	structure_owner	\N	1	0	0	0	1	0	2	1	1	0	0	2	2	0	0	10	1	2	\N	1	0	1	casual	>20000	\N	\N	6000_10000	\N	communal	vendor	train	chemist	with_water_and_soap	river	dc169f26-fbac-40d3-8944-e89dbe375973	\N
631	117	Jessica Eregae Mutethia	Female	56811989	\N	Single	college	\N	39	tenant	\N	1	2	2	2	2	0	2	0	1	0	2	1	2	2	2	21	2	1	\N	1	0	0	casual	11000_15000	\N	\N	0_5000	\N	communal	river	car	other	none	bins	089f5660-6ab5-42ca-ab3a-c1a09aa24eca	\N
632	117	Jennifer Wasike Nganga	Female	53964812	\N	married	none	\N	1	plot_Owner	\N	2	1	0	0	0	0	1	0	2	2	1	1	2	2	1	15	1	2	\N	1	1	1	unemployed	0_5000	\N	\N	16000_20000	\N	communal	shallow_well	train	traditional	none	private_collector	585048e3-3c2e-4faf-9f2f-2c6337e0b4ff	\N
633	233	Jerome Rotich Mundia	Male	73681752	\N	married	university	\N	32	plot_Owner	\N	2	0	1	1	1	1	2	0	2	2	1	0	0	0	2	15	0	1	\N	1	1	1	not_applicable	11000_15000	\N	\N	>20000	\N	VIP	piped	train	traditional	with_water_and_soap	private_collector	db5c00fa-8695-4305-8c04-9126e5fcfd8d	\N
634	13	Kyle Onyancha Gona	Male	86244334	\N	married	university	\N	1	structure_owner	\N	2	2	2	0	2	1	0	2	2	2	1	1	1	1	0	19	0	2	\N	0	1	1	casual	0_5000	\N	\N	16000_20000	\N	pit_latrine	rainwater	walk	private	none	dumpsite	566c5f07-e240-44b5-9938-b28e3187f3d3	\N
635	33	Michael Jarso Gakii	Male	63485695	\N	married	college	\N	14	plot_Owner	\N	2	2	0	0	2	2	2	1	2	0	2	2	2	2	1	22	1	2	\N	0	0	1	civil_servant	11000_15000	\N	\N	>20000	\N	flush	rainwater	walk	mission	water_only	dumpsite	b20f98ed-1489-4def-b429-28826e21f2f5	\N
636	106	Beth Kipkosgei Miriti	Female	44288568	\N	married	university	\N	14	tenant	\N	1	0	2	0	0	2	1	2	1	0	2	2	2	0	2	17	1	2	\N	1	1	1	private	6000_10000	\N	\N	11000_15000	\N	VIP	river	boda	private	water_only	bins	9ac4f745-e56d-4fcf-831d-3f7d5dbe97f1	\N
637	54	Alexis Omweri Gakii	Female	85379060	\N	Seperated	secondary	\N	36	structure_owner	\N	2	1	1	1	0	1	2	0	0	1	2	2	1	1	0	15	2	0	\N	1	1	0	self	>20000	\N	\N	11000_15000	\N	VIP	rainwater	walk	other	water_only	bins	dd562ed1-a857-4bc5-9f31-833ee35010a5	\N
638	177	Misty Mutethia Ngina	Female	43480017	\N	Single	university	\N	38	structure_owner	\N	2	0	2	0	1	2	1	0	1	2	0	0	1	0	1	13	1	2	\N	1	1	1	civil_servant	0_5000	\N	\N	16000_20000	\N	none	none	boda	private	with_water_and_soap	dumpsite	dd7dc4a8-145f-4f27-be1d-f5503c988e58	\N
639	68	Stacey Karanja Mwaka	Female	11512228	\N	Single	secondary	\N	5	structure_owner	\N	1	1	0	1	1	2	0	0	2	2	0	0	0	2	0	12	0	0	\N	0	0	0	self	>20000	\N	\N	0_5000	\N	none	shallow_well	walk	chemist	with_water_and_soap	bins	edf501b2-c2bd-4ddf-b01f-8c6073aa361a	\N
640	165	Jack Wakhungu Kithome	Male	06861748	\N	Widowed	university	\N	12	plot_Owner	\N	2	1	2	2	2	1	2	0	2	2	1	0	0	0	2	19	1	2	\N	0	1	1	private	16000_20000	\N	\N	6000_10000	\N	VIP	shallow_well	car	other	water_only	private_collector	43c15ff2-6097-4e97-957a-369dc22555e5	\N
641	106	Amanda Ndambuki Kitsao	Female	69738402	\N	Widowed	none	\N	33	structure_owner	\N	0	0	0	2	1	2	0	0	2	1	2	0	2	0	0	12	0	0	\N	0	0	1	not_applicable	16000_20000	\N	\N	0_5000	\N	flush	river	car	public	water_only	river	e59a3a34-9d7d-4285-8639-02d574ff91dd	\N
642	224	Sarah Irungu Gachoki	Female	38095739	\N	Cohabiting	none	\N	20	tenant	\N	0	0	1	2	1	2	2	1	2	2	0	0	0	2	2	17	2	2	\N	1	1	1	civil_servant	0_5000	\N	\N	6000_10000	\N	pit_latrine	none	train	chemist	water_only	bins	69d92fe6-2a3a-4b8c-b361-f3c31c337dc5	\N
643	231	Maria Ambani Mukoya	Female	55094995	\N	Seperated	secondary	\N	23	plot_Owner	\N	2	2	2	1	1	2	0	2	0	2	1	2	2	1	1	21	1	1	\N	0	1	0	unemployed	16000_20000	\N	\N	16000_20000	\N	VIP	shallow_well	boda	mission	none	bins	5f28220c-a75f-4500-a504-a967f8194169	\N
644	163	John Ndichu Ochola	Male	68779883	\N	married	college	\N	3	tenant	\N	1	1	1	0	2	0	2	0	2	2	1	2	0	2	2	18	1	0	\N	1	0	0	unemployed	>20000	\N	\N	6000_10000	\N	flush	none	train	other	with_water_and_soap	river	dbe77671-a693-4502-af00-9de145d303c2	\N
645	235	Sonya Kingori Kipchumba	Female	68699479	\N	married	college	\N	3	plot_Owner	\N	2	2	1	0	2	1	0	0	0	0	2	0	2	0	2	14	2	2	\N	1	1	0	student	16000_20000	\N	\N	6000_10000	\N	pit_latrine	vendor	train	public	none	bins	695ca46a-3500-4f46-9193-4fe11c871d2d	\N
646	66	Kenneth Waweru Mukoya	Male	56947661	\N	Single	secondary	\N	21	plot_Owner	\N	0	1	1	0	0	1	2	2	1	1	2	0	2	0	1	14	0	2	\N	1	0	1	private	>20000	\N	\N	16000_20000	\N	communal	none	bicycle	other	water_only	bins	42a9671c-7509-4ea3-8d68-2161b70afcf0	\N
647	124	Jerry Oketch Saruni	Male	10243327	\N	Seperated	university	\N	35	structure_owner	\N	1	0	0	1	0	2	2	0	0	0	0	0	2	2	2	12	2	2	\N	1	0	1	casual	0_5000	\N	\N	0_5000	\N	flush	piped	boda	chemist	with_water_and_soap	private_collector	614cf3f3-9514-4729-aa50-f8f3421a37e8	\N
648	16	Whitney Issack Karuri	Female	31736788	\N	Cohabiting	none	\N	5	tenant	\N	0	2	1	2	0	1	1	0	1	0	2	2	1	2	0	15	2	2	\N	0	0	0	unemployed	>20000	\N	\N	0_5000	\N	pit_latrine	shallow_well	walk	public	none	bins	17e54c7a-c728-4793-9f6b-660428eed818	\N
649	11	Wanda Muhoro Yaa	Female	28246175	\N	Seperated	primary	\N	29	plot_Owner	\N	2	2	0	1	2	1	0	1	2	2	0	0	2	0	2	17	1	1	\N	1	0	0	unemployed	6000_10000	\N	\N	11000_15000	\N	communal	piped	bicycle	private	with_water_and_soap	private_collector	e005d854-22e1-4e39-b248-16bf78447bed	\N
650	120	Michelle Wandera Jemutai	Female	32977280	\N	married	university	\N	23	tenant	\N	2	2	2	1	0	0	1	1	0	0	1	1	2	2	0	15	0	1	\N	0	1	1	unemployed	0_5000	\N	\N	0_5000	\N	flush	vendor	bicycle	chemist	none	bins	e509092f-6b0e-42e0-899f-db47c8a35099	\N
651	184	Patrick Hussein Jemeli	Male	85228310	\N	Seperated	none	\N	39	plot_Owner	\N	0	2	0	2	0	0	0	1	2	1	1	1	0	0	0	10	2	2	\N	0	0	1	unemployed	>20000	\N	\N	>20000	\N	pit_latrine	none	matatu	private	water_only	dumpsite	12375e5d-6c13-4f0f-98e3-90b272c6cbd8	\N
654	45	Joanne Ayuma Tonui	Female	54483895	\N	Single	none	\N	0	tenant	\N	2	1	1	2	2	2	0	0	2	1	0	0	1	0	2	16	1	2	\N	1	0	0	self	16000_20000	\N	\N	0_5000	\N	communal	shallow_well	train	other	with_water_and_soap	dumpsite	110fc2ec-5fce-41e8-8fe3-2b98ab24da9b	\N
655	81	Meghan Yegon Ayieko	Female	38043398	\N	Single	college	\N	23	structure_owner	\N	0	1	0	1	1	2	0	0	0	1	1	2	1	1	2	13	2	1	\N	0	0	0	unemployed	0_5000	\N	\N	11000_15000	\N	flush	none	bicycle	chemist	with_water_and_soap	private_collector	c01d1c66-8bde-4caa-89e1-45b06a4b2ea6	\N
656	21	Nicole Muhoro Kiio	Female	65836709	\N	Cohabiting	primary	\N	29	plot_Owner	\N	1	2	0	2	1	0	0	1	2	0	0	1	2	2	1	15	1	1	\N	0	1	0	casual	0_5000	\N	\N	0_5000	\N	pit_latrine	none	walk	traditional	none	dumpsite	0ac423f6-f85d-443f-8b1e-424b706f861b	\N
657	135	Evan Daniel Cheruto	Male	06885099	\N	married	college	\N	40	structure_owner	\N	0	0	2	0	1	2	1	2	1	1	1	0	0	1	1	13	0	0	\N	1	0	1	student	16000_20000	\N	\N	>20000	\N	VIP	piped	walk	public	none	river	1f1517f8-6e81-42c1-95d7-6ae26cd86535	\N
658	102	Nicholas Njau Kevin	Male	85268994	\N	Widowed	university	\N	20	tenant	\N	2	0	0	0	2	1	2	2	1	2	2	1	0	1	0	16	1	0	\N	1	0	0	unemployed	6000_10000	\N	\N	11000_15000	\N	flush	vendor	train	private	with_water_and_soap	river	4c588b00-9ba8-473f-9de3-31e536aa3394	\N
659	123	Melanie Kanja Gachanja	Female	86648992	\N	Single	secondary	\N	0	plot_Owner	\N	1	0	1	1	0	0	2	2	2	2	0	2	0	1	0	14	2	2	\N	0	1	1	not_applicable	>20000	\N	\N	>20000	\N	flush	piped	matatu	traditional	with_water_and_soap	dumpsite	efbc81c5-dcf3-48c6-af39-cfb4f20b315e	\N
660	66	Michael Murithi Ombasa	Male	36648995	\N	Cohabiting	college	\N	4	structure_owner	\N	2	2	2	1	0	0	1	0	0	2	1	0	0	1	0	12	0	0	\N	0	0	1	civil_servant	>20000	\N	\N	11000_15000	\N	flush	vendor	bicycle	public	water_only	private_collector	134daaee-c5f1-4c40-a1ae-8cfe80e94c88	\N
661	93	Kimberly Jepkorir Odira	Female	22642832	\N	Seperated	none	\N	21	plot_Owner	\N	2	0	2	0	2	1	0	1	0	1	1	1	2	0	0	13	1	1	\N	0	0	1	civil_servant	11000_15000	\N	\N	6000_10000	\N	communal	none	car	traditional	water_only	dumpsite	ab35d194-f722-4137-9705-c6fcab9d61bb	\N
662	177	Martha Muthiani Mwinzi	Female	68712860	\N	married	secondary	\N	17	structure_owner	\N	0	2	0	0	1	2	0	1	2	0	0	1	2	1	1	13	0	0	\N	0	1	0	casual	16000_20000	\N	\N	>20000	\N	none	river	train	traditional	none	dumpsite	42936210-33f0-4b9c-83a5-bb55f89a6681	\N
663	86	Katie Musili Bundi	Female	57188551	\N	Cohabiting	none	\N	1	plot_Owner	\N	1	2	2	0	1	1	1	2	2	2	0	0	2	0	2	18	1	1	\N	1	1	1	student	0_5000	\N	\N	>20000	\N	none	none	matatu	private	water_only	bins	b9c116a3-0662-436d-b62f-4790f921a400	\N
664	74	Matthew Jepchumba Haji	Male	83097547	\N	Cohabiting	secondary	\N	14	plot_Owner	\N	1	0	1	2	0	0	0	0	1	2	0	2	1	0	1	11	1	0	\N	1	0	1	casual	16000_20000	\N	\N	0_5000	\N	flush	rainwater	bicycle	mission	with_water_and_soap	bins	ec0e9215-b1e2-44ba-950c-a411b562672e	\N
665	5	Alexis Opondo Kiragu	Female	71117655	\N	Single	none	\N	19	plot_Owner	\N	0	2	2	2	0	1	1	0	0	1	0	1	1	0	2	13	1	1	\N	0	0	1	private	11000_15000	\N	\N	>20000	\N	VIP	shallow_well	matatu	mission	none	private_collector	3f8d1e55-177d-4051-a3b0-045c75289a57	\N
666	44	Austin Nyakundi Chacha	Male	80886771	\N	Seperated	none	\N	28	structure_owner	\N	2	0	0	2	0	2	0	2	2	2	1	0	2	0	0	15	1	2	\N	1	1	1	unemployed	16000_20000	\N	\N	16000_20000	\N	pit_latrine	river	train	private	with_water_and_soap	river	20e001f1-67aa-4ac1-a7e3-10943560560f	\N
667	174	Charles Ogolla Mutethia	Male	85125405	\N	Cohabiting	college	\N	31	structure_owner	\N	1	2	1	1	2	0	1	2	1	0	1	1	0	1	0	14	0	2	\N	1	1	1	unemployed	>20000	\N	\N	>20000	\N	communal	none	train	traditional	water_only	bins	46502bec-7287-4a72-a8ad-a5832c0e37ae	\N
668	41	Susan Muchiri Gacheri	Female	05533216	\N	Single	primary	\N	17	plot_Owner	\N	2	2	1	0	0	1	0	2	1	1	2	2	0	2	1	17	0	1	\N	0	1	1	not_applicable	6000_10000	\N	\N	0_5000	\N	pit_latrine	none	boda	traditional	with_water_and_soap	bins	53b81c11-2560-4cbc-afc8-d9e92df86b5a	\N
669	204	Erin Fondo Onyiego	Female	85194051	\N	married	secondary	\N	16	tenant	\N	0	1	1	1	2	1	1	0	1	0	0	2	2	2	1	15	2	0	\N	1	1	1	not_applicable	16000_20000	\N	\N	>20000	\N	flush	vendor	matatu	public	with_water_and_soap	dumpsite	ba6cd991-82e1-4f31-87fa-c3ad388abf4b	\N
670	225	Lisa Chenangat Onyancha	Female	13093131	\N	Cohabiting	primary	\N	29	plot_Owner	\N	0	2	1	0	2	1	2	0	0	0	1	0	1	2	0	12	2	0	\N	0	0	0	self	16000_20000	\N	\N	6000_10000	\N	VIP	shallow_well	matatu	other	water_only	private_collector	cc5c5483-cea3-467c-86fa-68f866c1ae24	\N
671	127	Lisa Cheruiyot Mutisya	Female	87675598	\N	Single	none	\N	36	structure_owner	\N	2	1	0	2	0	1	1	1	0	1	0	1	2	0	2	14	2	1	\N	1	1	0	civil_servant	6000_10000	\N	\N	6000_10000	\N	none	rainwater	walk	private	with_water_and_soap	private_collector	afc32efa-f202-401b-bd5e-f52b885133a0	\N
672	220	Chelsea James Maghanga	Female	26946829	\N	Seperated	university	\N	30	tenant	\N	0	2	2	0	2	0	1	1	0	1	0	1	1	2	0	13	0	2	\N	0	1	0	self	6000_10000	\N	\N	>20000	\N	none	none	train	mission	none	dumpsite	13654e49-5144-4743-bb52-63cff993705f	\N
673	33	Jennifer Munene Nafula	Female	13945164	\N	Seperated	university	\N	33	plot_Owner	\N	2	0	0	2	0	2	2	0	0	0	0	2	0	1	2	13	1	2	\N	0	0	1	private	>20000	\N	\N	11000_15000	\N	pit_latrine	river	matatu	chemist	none	bins	90f4fe4f-c338-462e-8011-619c739d9f75	\N
674	28	Debbie Awinja Murangiri	Female	02416084	\N	Widowed	college	\N	34	plot_Owner	\N	2	0	2	2	2	1	2	0	2	0	2	0	0	0	2	17	2	1	\N	1	0	0	self	0_5000	\N	\N	>20000	\N	VIP	rainwater	car	other	none	dumpsite	164c7b76-437f-4d53-ad1c-9d4540d09d58	\N
675	237	Brandy Nzilani Makokha	Female	65730924	\N	Cohabiting	secondary	\N	33	structure_owner	\N	2	2	1	1	0	0	0	1	1	2	2	2	0	1	2	17	2	0	\N	1	0	0	civil_servant	0_5000	\N	\N	6000_10000	\N	VIP	shallow_well	walk	chemist	water_only	dumpsite	8021b659-521f-4b30-8336-13c8ace33248	\N
676	183	Melissa Rioba Makau	Female	39671352	\N	Seperated	university	\N	28	tenant	\N	0	1	0	1	2	1	0	1	0	1	2	1	1	1	0	12	2	2	\N	1	1	1	casual	6000_10000	\N	\N	6000_10000	\N	communal	shallow_well	train	chemist	none	bins	8ac4f2bf-7796-43d0-81cf-27dd46225106	\N
677	161	Elizabeth Kiragu Kimaru	Female	77640522	\N	Cohabiting	university	\N	27	structure_owner	\N	1	1	1	1	2	2	1	2	0	0	0	0	2	0	2	15	2	1	\N	1	0	0	civil_servant	>20000	\N	\N	0_5000	\N	VIP	piped	bicycle	traditional	water_only	bins	09006268-04c6-403b-a76a-e12e5cb77855	\N
678	200	Andrew Wairimu Pkemoi	Male	04457611	\N	married	none	\N	9	plot_Owner	\N	1	2	1	1	0	0	1	0	0	0	1	2	2	2	0	13	2	0	\N	0	0	0	private	0_5000	\N	\N	11000_15000	\N	flush	shallow_well	matatu	mission	with_water_and_soap	dumpsite	850d1449-09b7-4b0f-bec1-c93a1a42e7e9	\N
679	110	Frederick Ndirangu Mutethia	Male	85652298	\N	Widowed	secondary	\N	17	plot_Owner	\N	1	2	1	0	0	2	2	1	1	0	2	1	0	1	0	14	0	1	\N	1	1	0	casual	16000_20000	\N	\N	11000_15000	\N	communal	shallow_well	car	public	water_only	dumpsite	086f5208-6353-45e7-b724-5c8e0e695e68	\N
680	200	Amanda Ndoro Mose	Female	66596794	\N	Seperated	primary	\N	24	structure_owner	\N	0	1	2	1	0	1	0	2	1	0	0	0	1	0	1	10	2	1	\N	0	0	0	student	>20000	\N	\N	16000_20000	\N	communal	shallow_well	train	other	none	dumpsite	5333c4aa-2bdc-4412-aa55-a777e60fe458	\N
681	166	Lindsey Kagendo Obare	Female	87212316	\N	Single	secondary	\N	25	plot_Owner	\N	2	2	0	2	0	0	0	2	2	1	0	1	1	1	1	15	2	2	\N	1	0	1	casual	>20000	\N	\N	0_5000	\N	VIP	vendor	matatu	public	none	river	14caa339-23d8-4a4b-b4a4-fbc30986e499	\N
682	197	Victoria Kipchumba Mburu	Female	54616611	\N	Seperated	secondary	\N	32	structure_owner	\N	0	1	0	1	2	1	0	2	2	0	2	2	1	1	0	15	0	0	\N	0	0	1	unemployed	16000_20000	\N	\N	16000_20000	\N	flush	none	walk	other	none	river	c4165f1b-0d0d-4425-96da-e82865540873	\N
683	41	Christine Sitati Mumba	Female	88202366	\N	Widowed	none	\N	9	structure_owner	\N	0	1	2	2	1	1	1	0	2	2	0	1	0	0	2	15	1	2	\N	0	0	0	private	16000_20000	\N	\N	16000_20000	\N	flush	river	matatu	private	none	private_collector	0eb51c26-fa52-485c-aacd-e93a9697c63c	\N
684	167	Jordan Yego Theuri	Female	00979935	\N	Seperated	primary	\N	4	tenant	\N	0	2	1	1	2	2	0	2	2	0	2	1	1	2	2	20	0	2	\N	0	1	0	casual	6000_10000	\N	\N	11000_15000	\N	flush	vendor	car	private	water_only	bins	fde5bd42-60f0-4976-9fbe-625d5add88df	\N
685	102	Cassandra Muchiri Muindi	Female	72531700	\N	married	college	\N	24	structure_owner	\N	1	2	2	1	0	0	2	0	1	0	0	1	2	1	1	14	0	0	\N	1	0	1	student	11000_15000	\N	\N	16000_20000	\N	communal	piped	walk	chemist	none	dumpsite	ae93d105-deb8-4ca1-afa3-1ef45824a023	\N
686	31	Brian Komora Kalume	Male	82903949	\N	Seperated	university	\N	22	tenant	\N	1	2	2	2	2	2	2	0	2	0	0	0	0	0	2	17	0	1	\N	1	1	1	unemployed	>20000	\N	\N	0_5000	\N	communal	vendor	boda	traditional	water_only	bins	93fd5db1-6fd3-42cf-b001-b8224d716ae6	\N
687	237	Martin Awuor Mbaabu	Male	23506743	\N	Single	none	\N	34	structure_owner	\N	0	2	1	1	0	0	1	1	2	1	0	0	0	0	2	11	0	0	\N	0	0	0	casual	0_5000	\N	\N	16000_20000	\N	pit_latrine	river	matatu	private	with_water_and_soap	dumpsite	ccc93a5c-a62f-4398-b225-04a24201f3f4	\N
688	13	Eric Wasike Muchui	Male	64712510	\N	Cohabiting	none	\N	28	structure_owner	\N	1	2	0	1	0	0	1	2	1	0	0	1	0	2	1	12	2	1	\N	0	0	0	not_applicable	11000_15000	\N	\N	11000_15000	\N	VIP	piped	train	public	with_water_and_soap	bins	6b544e81-5494-4dd7-9fe1-c406892acf80	\N
689	90	Eric Mwaka Mbatha	Male	66730007	\N	Cohabiting	university	\N	33	tenant	\N	1	1	2	1	0	1	1	2	2	1	2	2	2	0	0	18	1	1	\N	1	1	1	not_applicable	6000_10000	\N	\N	11000_15000	\N	VIP	none	bicycle	mission	water_only	river	0ea22f81-61b3-4ec0-86f1-bd7cd49dff40	\N
690	14	Maria Chesang Kiama	Female	38923956	\N	Widowed	secondary	\N	20	structure_owner	\N	1	1	1	0	2	0	2	0	1	2	1	0	0	2	2	15	0	0	\N	1	0	0	casual	11000_15000	\N	\N	0_5000	\N	communal	piped	walk	traditional	with_water_and_soap	bins	6d53e76e-5e17-4714-ac23-044ea4cc21c4	\N
691	197	Lisa Komora Awuor	Female	67861989	\N	married	secondary	\N	32	structure_owner	\N	0	1	2	1	2	1	1	2	0	0	0	2	1	2	1	16	0	2	\N	1	1	0	not_applicable	11000_15000	\N	\N	>20000	\N	pit_latrine	none	boda	private	none	river	e1721e9c-8800-43c4-ad49-98885c1924a0	\N
692	213	Steve Mukiri Kairu	Male	20494868	\N	married	college	\N	14	tenant	\N	2	2	1	2	0	0	2	1	2	2	1	1	1	2	1	20	1	0	\N	0	1	1	student	11000_15000	\N	\N	>20000	\N	none	river	boda	other	water_only	river	b333f09e-e4a2-40e9-848a-f46c9204e730	\N
693	14	Erica Nyamai Odinga	Female	59582662	\N	Seperated	university	\N	39	plot_Owner	\N	2	1	2	2	1	2	2	0	1	0	2	2	0	1	2	20	0	0	\N	1	1	1	civil_servant	>20000	\N	\N	11000_15000	\N	pit_latrine	piped	train	private	water_only	dumpsite	67c7c4b4-65b4-4273-9341-2de62b0c8670	\N
694	125	Clarence Kungu Akinyi	Male	68718031	\N	married	primary	\N	29	plot_Owner	\N	0	0	0	2	2	0	1	0	0	0	2	1	0	0	0	8	1	0	\N	1	1	0	not_applicable	0_5000	\N	\N	0_5000	\N	VIP	shallow_well	boda	private	water_only	bins	b2749926-018b-4f92-8864-4df5a35531a0	\N
695	78	Heather Rugut Mungai	Female	28616716	\N	Single	none	\N	38	structure_owner	\N	0	0	1	1	2	1	2	1	1	0	2	1	1	1	1	15	2	0	\N	0	0	0	student	0_5000	\N	\N	16000_20000	\N	communal	piped	matatu	other	with_water_and_soap	private_collector	0e4d23d2-560c-42be-bd72-6420ab2afec5	\N
696	47	Jason Wanjira Cherop	Male	34272872	\N	Cohabiting	primary	\N	30	plot_Owner	\N	1	2	2	2	2	0	1	1	2	0	1	0	2	0	1	17	2	1	\N	1	1	1	private	6000_10000	\N	\N	16000_20000	\N	none	rainwater	walk	traditional	water_only	private_collector	a7f49fb6-1686-4a08-907c-e77aa561c3eb	\N
697	232	Chris Mwangi Kiema	Male	50769173	\N	Widowed	secondary	\N	39	tenant	\N	1	0	0	2	0	2	0	0	2	2	2	2	1	0	0	14	1	1	\N	1	0	0	unemployed	0_5000	\N	\N	11000_15000	\N	pit_latrine	piped	walk	chemist	with_water_and_soap	private_collector	6efafe8a-d268-46af-9ebd-63f352d33851	\N
698	121	April Wanjugu Sikuku	Female	03454681	\N	Widowed	secondary	\N	19	plot_Owner	\N	2	0	2	1	1	2	1	1	2	0	0	0	1	0	0	13	2	2	\N	1	0	1	self	11000_15000	\N	\N	6000_10000	\N	flush	vendor	car	other	none	dumpsite	8dca083c-ae3d-4fdb-b123-6499150c3b3b	\N
699	113	Shawn Chepkoech Kiprop	Male	10092042	\N	Seperated	primary	\N	27	structure_owner	\N	2	1	0	2	0	1	0	0	1	1	2	0	1	0	1	12	2	1	\N	1	1	0	private	6000_10000	\N	\N	11000_15000	\N	VIP	none	matatu	private	water_only	private_collector	fd428f5c-7fdc-4cc6-a022-5a1d19d5284f	\N
700	158	Justin Kangethe Opondo	Male	85604183	\N	Widowed	none	\N	33	tenant	\N	2	0	2	2	2	1	0	1	1	2	2	2	1	0	0	18	1	2	\N	0	1	1	self	11000_15000	\N	\N	16000_20000	\N	none	river	boda	mission	water_only	dumpsite	48c7e38d-3318-4c2f-99a8-a1e19fa7e958	\N
701	55	Trevor Sakwa Wanjiku	Male	85160426	\N	married	college	\N	27	structure_owner	\N	2	2	1	2	0	1	2	1	0	1	2	0	2	2	2	20	1	0	\N	1	0	0	not_applicable	16000_20000	\N	\N	16000_20000	\N	communal	vendor	car	mission	none	river	781e970e-7b88-4bb7-84ac-c2a460c0ee2b	\N
702	146	Jody Kabiru Kiptui	Female	43472330	\N	Widowed	college	\N	15	tenant	\N	1	1	0	0	0	0	2	0	1	2	2	0	1	0	1	11	2	0	\N	1	0	0	student	16000_20000	\N	\N	6000_10000	\N	pit_latrine	shallow_well	matatu	other	with_water_and_soap	private_collector	1e56714d-2757-437c-bd94-90fc81449cc6	\N
703	66	Miranda Kalama Mogire	Female	72279678	\N	Widowed	university	\N	39	plot_Owner	\N	1	0	1	1	2	1	2	1	2	2	0	1	1	0	0	15	0	0	\N	1	0	0	unemployed	>20000	\N	\N	11000_15000	\N	VIP	rainwater	bicycle	other	water_only	river	54fb26e5-9d0d-4511-ac54-13680536c4fb	\N
704	169	Tonya Ondari Odongo	Female	09402221	\N	Cohabiting	none	\N	4	structure_owner	\N	2	1	1	0	2	2	0	1	1	1	2	1	2	1	0	17	2	0	\N	1	1	0	private	>20000	\N	\N	>20000	\N	pit_latrine	piped	bicycle	public	none	river	f35ee71d-8f8f-4ab0-8545-9680facc98a0	\N
705	141	David Muchui Karanja	Male	06783112	\N	Seperated	none	\N	37	plot_Owner	\N	0	1	1	1	0	1	1	1	1	1	1	2	1	1	2	15	0	1	\N	1	1	1	private	6000_10000	\N	\N	16000_20000	\N	flush	rainwater	boda	private	with_water_and_soap	river	0b9c8a35-7ac1-4929-a148-41928b6635f6	\N
706	60	Ricky Nyabuto Halake	Male	70851849	\N	married	college	\N	4	structure_owner	\N	1	1	0	2	0	2	2	2	2	1	0	2	2	1	2	20	0	0	\N	0	0	0	casual	11000_15000	\N	\N	11000_15000	\N	flush	piped	walk	chemist	water_only	dumpsite	5898782e-b878-4d35-8911-3f02091ead2a	\N
707	43	Kelly Jepkemei Tsuma	Male	35931069	\N	Seperated	college	\N	23	structure_owner	\N	0	2	2	0	0	1	2	2	1	0	2	2	0	0	2	16	0	0	\N	0	1	0	not_applicable	16000_20000	\N	\N	16000_20000	\N	flush	piped	walk	private	water_only	bins	62a30af8-e682-4c7c-a5e1-b4c44aa30677	\N
708	24	Jose Kipleting Too	Male	75379444	\N	Single	primary	\N	25	plot_Owner	\N	2	2	2	1	0	0	1	2	2	2	0	0	2	2	2	20	1	2	\N	1	0	1	unemployed	0_5000	\N	\N	11000_15000	\N	pit_latrine	rainwater	walk	private	none	bins	42c634c5-c031-4894-a85e-1ba2568651ea	\N
709	211	Gerald Kipkosgei Wamalwa	Male	06443176	\N	Widowed	university	\N	2	structure_owner	\N	0	0	1	2	0	2	1	0	2	2	2	1	1	1	2	17	0	0	\N	0	0	1	not_applicable	0_5000	\N	\N	11000_15000	\N	VIP	piped	car	public	water_only	bins	57221321-e8ac-46e7-a534-652bbc9e4302	\N
710	20	Ryan Jackson Mwendia	Male	10596755	\N	married	none	\N	21	structure_owner	\N	1	2	0	2	1	2	2	1	2	1	1	0	2	0	0	17	2	1	\N	0	1	1	unemployed	0_5000	\N	\N	6000_10000	\N	none	vendor	train	other	none	river	fe8c1d81-0b83-4bf7-af41-e4edabbd29cc	\N
711	20	Alexis Gachanja Chepkemoi	Female	68341367	\N	Single	none	\N	9	structure_owner	\N	2	1	2	0	2	1	1	0	2	0	1	2	2	2	2	20	1	2	\N	0	0	0	civil_servant	11000_15000	\N	\N	16000_20000	\N	VIP	none	bicycle	private	with_water_and_soap	river	60832ef6-1ce9-4256-92d4-58f26c5289d0	\N
712	17	Amy Kabui Oyoo	Female	28530844	\N	married	primary	\N	33	structure_owner	\N	0	2	2	2	2	0	0	2	1	1	2	0	2	0	2	18	0	1	\N	0	1	0	private	0_5000	\N	\N	16000_20000	\N	VIP	rainwater	boda	traditional	with_water_and_soap	private_collector	b0046e56-7400-4715-b57b-702f4b04123a	\N
713	104	Meredith Mutunga Kagendo	Female	13041150	\N	married	primary	\N	2	plot_Owner	\N	2	0	0	0	1	0	0	2	0	0	2	2	0	0	2	11	1	2	\N	0	0	0	self	6000_10000	\N	\N	11000_15000	\N	none	shallow_well	bicycle	other	water_only	bins	b86626cc-9bc6-45f7-8746-e1ad80f18d49	\N
714	91	Edward Okongo Adow	Male	73056454	\N	Single	primary	\N	7	tenant	\N	1	0	0	2	0	2	2	2	0	2	0	0	0	1	2	14	1	2	\N	0	0	1	unemployed	0_5000	\N	\N	11000_15000	\N	none	none	car	chemist	with_water_and_soap	dumpsite	1a8d050a-00f7-46db-943e-8ff285119058	\N
715	84	Steven Okuku Ireri	Male	21490870	\N	Seperated	none	\N	29	tenant	\N	1	1	0	0	0	2	0	0	0	2	2	2	0	0	1	11	1	0	\N	1	1	1	unemployed	11000_15000	\N	\N	11000_15000	\N	none	shallow_well	car	private	with_water_and_soap	dumpsite	940a5354-b691-4bba-b2ee-c3479961385b	\N
716	73	Courtney Ruwa Mbae	Female	10838455	\N	married	secondary	\N	25	plot_Owner	\N	1	0	1	1	2	2	1	1	0	1	0	0	1	2	2	15	0	2	\N	1	1	1	self	11000_15000	\N	\N	16000_20000	\N	flush	shallow_well	matatu	private	none	bins	684f89d1-8a56-447f-8bac-db5438e1184e	\N
717	151	Patrick Duba Nyabuti	Male	25458738	\N	Seperated	secondary	\N	23	structure_owner	\N	1	1	1	0	1	0	1	1	0	1	1	0	2	2	0	12	1	0	\N	1	0	1	unemployed	11000_15000	\N	\N	16000_20000	\N	none	rainwater	train	private	none	bins	2869bda4-e1d3-4519-82e9-dd9a1ce44ce1	\N
718	97	Anthony Ojwang Bonaya	Male	83741872	\N	Cohabiting	secondary	\N	16	tenant	\N	0	1	1	0	0	2	0	2	1	1	0	2	1	0	0	11	0	0	\N	1	1	0	not_applicable	6000_10000	\N	\N	11000_15000	\N	VIP	river	bicycle	mission	with_water_and_soap	dumpsite	dad12a6f-9f1c-4099-a3d1-7c17bf090048	\N
719	14	Jennifer Dahir Kariuki	Female	34995401	\N	Widowed	primary	\N	20	structure_owner	\N	0	2	1	0	1	2	2	2	2	2	2	0	1	2	2	21	0	1	\N	0	1	0	casual	6000_10000	\N	\N	6000_10000	\N	flush	river	bicycle	traditional	with_water_and_soap	dumpsite	58d6b79d-aeb3-46a4-8e30-4695d3d3c0b5	\N
720	228	Emily Moseti Kaingu	Female	49202439	\N	Widowed	none	\N	25	structure_owner	\N	1	0	1	2	1	1	2	1	2	2	2	0	2	0	1	18	1	1	\N	1	1	0	private	>20000	\N	\N	0_5000	\N	flush	rainwater	car	mission	with_water_and_soap	private_collector	2dcb7661-f278-45b6-b4af-ec82c4eb690a	\N
721	194	Nathan Joel Kajuju	Male	31421493	\N	Single	college	\N	11	structure_owner	\N	2	1	0	2	1	1	0	0	1	1	2	1	1	0	2	15	1	2	\N	0	0	0	casual	16000_20000	\N	\N	6000_10000	\N	communal	none	boda	other	none	river	034838a0-cd08-4580-8423-3e351f7f03d7	\N
722	16	Emily Kibet Githinji	Female	65850106	\N	Single	none	\N	33	structure_owner	\N	0	2	1	2	1	0	2	2	0	0	1	0	2	0	0	13	2	0	\N	1	0	1	student	6000_10000	\N	\N	6000_10000	\N	flush	shallow_well	bicycle	traditional	water_only	bins	43b34ecd-0a17-4b79-8598-6f3aaa7dd0eb	\N
723	139	Lauren Robert Bwire	Female	31067998	\N	Cohabiting	university	\N	8	structure_owner	\N	2	2	2	0	1	2	1	2	2	2	0	2	0	0	2	20	1	0	\N	0	1	1	civil_servant	>20000	\N	\N	11000_15000	\N	pit_latrine	rainwater	walk	traditional	with_water_and_soap	dumpsite	8dc2f014-7fd2-45b6-bff2-e60f4a2273d3	\N
724	47	Benjamin Ojwang Naserian	Male	42858712	\N	Seperated	none	\N	21	tenant	\N	1	0	0	2	0	2	1	2	2	2	0	1	1	2	2	18	0	0	\N	1	0	0	self	6000_10000	\N	\N	>20000	\N	none	piped	bicycle	mission	none	river	38a58fa6-fd35-417b-a85c-612f91f2da45	\N
725	55	Joseph Gacheru Karwitha	Male	74643003	\N	Single	primary	\N	7	plot_Owner	\N	1	0	0	2	2	0	2	1	0	0	2	2	1	0	1	14	0	2	\N	0	1	0	unemployed	0_5000	\N	\N	16000_20000	\N	VIP	none	train	public	with_water_and_soap	river	3dbcd67a-58cb-423a-97d7-3cd5a31b6795	\N
726	68	Mary Mawia Kiragu	Female	88485390	\N	Widowed	secondary	\N	20	structure_owner	\N	0	2	1	1	2	1	1	2	1	0	2	0	2	2	1	18	2	2	\N	1	0	1	student	>20000	\N	\N	0_5000	\N	none	rainwater	boda	other	water_only	bins	d63ed996-10f7-4aa4-bcd3-89eba3087e67	\N
727	149	Patricia Keya Khamisi	Female	37490133	\N	Single	primary	\N	19	structure_owner	\N	1	2	0	2	2	0	0	0	1	0	0	0	1	1	0	10	0	2	\N	1	0	0	unemployed	11000_15000	\N	\N	11000_15000	\N	none	vendor	bicycle	public	water_only	private_collector	c5222275-a820-4f5e-ae2c-84e1cb3e48ce	\N
728	27	Alan Yaa Nkatha	Male	72375824	\N	married	none	\N	21	plot_Owner	\N	2	2	2	1	2	2	0	0	2	2	0	2	0	1	0	18	0	1	\N	1	0	1	unemployed	11000_15000	\N	\N	0_5000	\N	none	river	boda	traditional	with_water_and_soap	bins	3309bbe7-8f45-4769-b1b1-665caa5d3b2a	\N
729	19	Kristen Wairimu Onyancha	Female	01293744	\N	Seperated	primary	\N	11	structure_owner	\N	0	1	0	1	0	2	0	0	1	1	1	0	0	0	1	8	2	2	\N	1	0	1	unemployed	6000_10000	\N	\N	0_5000	\N	none	vendor	boda	other	none	private_collector	e5519713-86e6-431a-9f43-6fe05bca3e1d	\N
730	140	Heather Menza Yussuf	Female	13748112	\N	Widowed	secondary	\N	16	tenant	\N	2	0	1	2	0	1	1	0	0	1	2	0	0	2	2	14	1	1	\N	1	0	0	unemployed	16000_20000	\N	\N	11000_15000	\N	none	shallow_well	walk	public	with_water_and_soap	bins	196efedd-e840-4b1c-9e5b-8ddf9609971b	\N
731	182	Nicole Obonyo Waswa	Female	73023686	\N	Seperated	university	\N	32	structure_owner	\N	1	0	2	2	0	2	1	0	2	0	1	2	2	2	2	19	0	1	\N	1	1	1	unemployed	0_5000	\N	\N	0_5000	\N	VIP	shallow_well	matatu	private	with_water_and_soap	dumpsite	8db41c3f-b14a-4bbf-a4bc-c1a35ed7ce48	\N
732	212	Joshua Ndwiga Wanyoike	Male	77271672	\N	Widowed	secondary	\N	38	structure_owner	\N	1	0	0	0	2	2	0	2	0	1	1	0	1	1	2	13	0	0	\N	1	0	0	not_applicable	6000_10000	\N	\N	11000_15000	\N	communal	vendor	train	chemist	none	river	d2f48c57-fe77-416f-8196-b19136c1dbfc	\N
733	35	Miranda Osman Murimi	Female	85206623	\N	Seperated	primary	\N	1	structure_owner	\N	0	2	2	0	0	2	0	2	1	1	2	1	0	0	1	14	2	0	\N	0	1	1	casual	>20000	\N	\N	16000_20000	\N	pit_latrine	river	walk	public	water_only	private_collector	8237e26a-3871-4038-a781-aef518a2b28a	\N
734	55	Audrey Chepkorir Otieno	Female	63969497	\N	Single	university	\N	22	tenant	\N	1	1	1	1	0	1	0	2	1	2	2	2	2	1	1	18	0	0	\N	0	0	0	casual	16000_20000	\N	\N	16000_20000	\N	VIP	river	train	other	water_only	river	990bac4d-b335-47cc-8da2-cdc709cbda8b	\N
735	100	Frank Kinyua Mulei	Male	40477968	\N	married	university	\N	15	structure_owner	\N	2	2	0	1	0	2	1	0	0	0	1	2	2	2	2	17	0	0	\N	1	1	1	not_applicable	11000_15000	\N	\N	11000_15000	\N	none	shallow_well	car	traditional	water_only	bins	dda4a6d9-397f-44ab-99fd-9e25ce53a044	\N
736	69	Derrick Zawadi Nzai	Male	52844081	\N	Single	university	\N	37	plot_Owner	\N	2	1	0	2	2	0	2	1	2	1	1	0	2	0	1	17	0	1	\N	0	0	0	civil_servant	16000_20000	\N	\N	6000_10000	\N	none	vendor	car	mission	water_only	bins	898e0b08-17b8-4396-b420-3d61b2a2a236	\N
737	120	Desiree Nyangweso Eregae	Female	27371305	\N	Single	none	\N	24	structure_owner	\N	1	2	2	2	2	1	2	1	0	2	1	1	1	0	0	18	2	0	\N	0	1	0	student	16000_20000	\N	\N	11000_15000	\N	communal	piped	bicycle	other	none	private_collector	8327cfe8-1008-452e-9141-bb2a7b9d4279	\N
738	72	Rebecca Dagane Mohammed	Female	79149760	\N	married	secondary	\N	24	plot_Owner	\N	0	0	2	2	2	1	1	1	2	0	1	0	0	1	2	15	1	1	\N	1	0	1	self	6000_10000	\N	\N	0_5000	\N	VIP	rainwater	matatu	other	water_only	dumpsite	7a878f13-477d-42ff-9778-d4b3799566fa	\N
739	68	Amanda Adow Karuga	Female	40190305	\N	Single	college	\N	23	tenant	\N	0	2	2	2	2	1	1	2	2	2	1	1	0	0	0	18	2	1	\N	1	1	0	unemployed	0_5000	\N	\N	>20000	\N	flush	none	walk	private	with_water_and_soap	dumpsite	3c4d02a1-594f-4040-b710-d80562917583	\N
740	1	Arthur Thuku Abdalla	Male	05095048	\N	Single	university	\N	17	plot_Owner	\N	0	2	1	2	0	2	0	2	1	2	0	1	0	2	0	15	2	1	\N	0	1	1	casual	6000_10000	\N	\N	11000_15000	\N	VIP	piped	matatu	other	water_only	river	9dbd0fa5-0e77-4cb7-bf7e-0076c184447f	\N
741	191	Samuel Awuor Mukiri	Male	10385016	\N	Widowed	college	\N	15	structure_owner	\N	2	0	0	1	2	2	2	1	0	0	0	2	2	2	0	16	0	1	\N	0	0	0	unemployed	>20000	\N	\N	11000_15000	\N	communal	none	car	public	with_water_and_soap	river	f26cb459-4872-4e97-976f-a53148883dbc	\N
742	156	Valerie Wamaitha Nyagaka	Female	65565199	\N	Cohabiting	university	\N	14	structure_owner	\N	1	2	0	1	2	1	2	0	1	1	1	1	0	0	2	15	2	2	\N	0	0	1	casual	11000_15000	\N	\N	>20000	\N	flush	vendor	car	public	none	private_collector	d6665840-29f0-4573-8669-46e0b7341e1c	\N
743	39	Andrew Kipngeno Muga	Male	80079949	\N	Single	primary	\N	2	structure_owner	\N	2	2	2	1	2	2	0	1	0	1	0	0	0	0	0	13	1	0	\N	0	0	0	civil_servant	>20000	\N	\N	11000_15000	\N	communal	river	boda	chemist	none	river	6b14c0f5-844d-43c4-97ca-a1bd7cb5b5a4	\N
744	169	Jeffrey Ayuma Masha	Male	06924187	\N	Widowed	primary	\N	20	plot_Owner	\N	2	1	1	2	0	2	2	1	1	0	0	2	0	0	2	16	0	1	\N	1	1	0	not_applicable	6000_10000	\N	\N	6000_10000	\N	VIP	rainwater	car	mission	with_water_and_soap	river	e83f0778-6b17-44c2-90dc-2ff56fbf47ed	\N
745	181	Victoria Eregae Mutegi	Female	85038128	\N	Seperated	secondary	\N	24	plot_Owner	\N	1	2	0	2	1	1	1	0	0	2	0	1	2	2	2	17	1	1	\N	1	0	1	private	6000_10000	\N	\N	0_5000	\N	pit_latrine	vendor	matatu	chemist	with_water_and_soap	bins	a123b0d5-8921-4378-ba52-620fe39a57e6	\N
746	209	Melissa Wambua Nyabuti	Female	38503107	\N	Cohabiting	none	\N	17	structure_owner	\N	0	2	0	1	2	0	1	2	2	1	0	1	1	2	1	16	0	0	\N	1	0	1	not_applicable	0_5000	\N	\N	16000_20000	\N	communal	rainwater	train	other	water_only	dumpsite	5353e5f2-0fe5-4f82-b133-6df47daf1b2d	\N
747	40	Cathy Fundi Gitari	Female	10281855	\N	Widowed	university	\N	6	tenant	\N	1	2	2	0	2	0	1	1	1	2	0	0	1	1	0	14	1	2	\N	0	0	1	civil_servant	16000_20000	\N	\N	16000_20000	\N	communal	river	walk	public	with_water_and_soap	river	2baa8599-a117-4a51-9058-3c0ceb6e5b66	\N
748	94	Isaac Muuo Nyokabi	Male	56184052	\N	Seperated	college	\N	38	structure_owner	\N	0	1	1	0	2	2	0	1	2	1	1	1	2	2	2	18	1	1	\N	1	1	1	private	16000_20000	\N	\N	6000_10000	\N	flush	piped	bicycle	other	water_only	bins	c6c4e9ee-aca1-41dc-a25f-67ded8efaee4	\N
749	29	David Kipsang Cheyech	Male	50214847	\N	Widowed	college	\N	33	plot_Owner	\N	1	1	0	2	2	2	0	2	1	2	0	0	2	1	2	18	1	2	\N	1	0	0	casual	0_5000	\N	\N	6000_10000	\N	communal	vendor	train	traditional	water_only	bins	62723578-b362-44bb-98e9-98f1c3e410ff	\N
750	125	James Chepkorir Kaari	Male	00645004	\N	Single	none	\N	18	structure_owner	\N	0	0	2	0	0	1	0	2	2	0	0	2	1	1	2	13	2	0	\N	1	0	0	unemployed	>20000	\N	\N	>20000	\N	pit_latrine	piped	matatu	other	water_only	river	3e820b5c-2d73-40d1-a263-9f369aa951d3	\N
751	95	Sean Musyimi Abdirahman	Male	32399466	\N	married	college	\N	34	plot_Owner	\N	0	1	0	0	2	0	0	0	0	0	1	1	2	1	0	8	1	0	\N	0	1	1	self	11000_15000	\N	\N	>20000	\N	communal	rainwater	boda	traditional	with_water_and_soap	dumpsite	696dc297-fd1b-4a22-be70-4c98f03be6a7	\N
752	34	Luis Wanjohi Oduor	Male	02723529	\N	Seperated	secondary	\N	13	plot_Owner	\N	2	0	1	0	2	2	2	2	2	1	1	0	1	1	0	17	2	1	\N	0	0	0	not_applicable	0_5000	\N	\N	11000_15000	\N	VIP	piped	train	private	none	river	dbdcd54d-9600-4442-8974-0914e99ba25d	\N
753	60	Corey Chege Muange	Male	73044634	\N	Seperated	primary	\N	9	structure_owner	\N	2	0	1	0	1	2	0	1	0	2	2	2	2	0	1	16	2	2	\N	0	1	0	student	11000_15000	\N	\N	0_5000	\N	communal	shallow_well	boda	other	none	private_collector	2b4075f4-f6d7-4b50-bfbd-2fa13aa68018	\N
754	195	Patrick Kamathi Sila	Male	55875216	\N	Seperated	secondary	\N	26	tenant	\N	2	1	0	0	2	1	0	0	2	0	2	0	0	1	0	11	0	2	\N	1	1	0	private	>20000	\N	\N	6000_10000	\N	none	river	boda	traditional	with_water_and_soap	bins	369af65e-8fc2-4799-abd9-78f5709bae08	\N
755	139	Linda Amondi Ekiru	Female	16424683	\N	Cohabiting	none	\N	32	tenant	\N	1	0	1	1	0	2	1	2	0	2	2	1	0	1	1	15	0	0	\N	0	1	1	student	6000_10000	\N	\N	>20000	\N	flush	river	walk	private	water_only	river	a0578964-b57a-42a0-af16-a2b7c94f87a6	\N
756	97	Joel Jepkorir Jepchirchir	Male	82872483	\N	Seperated	primary	\N	5	plot_Owner	\N	1	2	0	1	1	2	0	1	1	2	2	0	0	1	1	15	2	2	\N	1	0	1	casual	16000_20000	\N	\N	11000_15000	\N	VIP	none	boda	mission	with_water_and_soap	river	d7c8cc50-b2f1-44f7-ab75-37bcebd75267	\N
757	59	Julie Muthini Samwel	Female	02307366	\N	Single	college	\N	21	plot_Owner	\N	2	2	1	1	1	0	1	0	1	1	2	1	2	0	0	15	1	2	\N	1	1	0	private	>20000	\N	\N	>20000	\N	communal	river	boda	private	with_water_and_soap	private_collector	b9906b70-9fb3-4139-b59d-7bce47d68067	\N
758	156	Sean Chemutai Musau	Male	01527186	\N	Widowed	secondary	\N	24	structure_owner	\N	2	1	0	0	0	1	1	0	0	0	2	0	1	1	2	11	0	0	\N	1	0	0	student	6000_10000	\N	\N	0_5000	\N	flush	piped	boda	private	none	private_collector	e16f8fcd-ee30-43b8-820d-6535d9a1b17e	\N
759	78	Tamara Mmboga Nur	Female	05193934	\N	Seperated	university	\N	39	structure_owner	\N	0	2	1	1	0	0	1	2	1	0	2	0	1	0	0	11	2	0	\N	1	1	1	self	>20000	\N	\N	0_5000	\N	flush	rainwater	matatu	mission	water_only	private_collector	34bea661-d2ea-4f81-954e-cf6a5f2374b0	\N
760	69	Ashley Kanyi Bett	Female	33203977	\N	Single	none	\N	38	structure_owner	\N	1	1	1	2	2	0	1	1	0	2	0	2	2	2	2	19	0	0	\N	0	0	0	private	0_5000	\N	\N	>20000	\N	communal	vendor	bicycle	public	with_water_and_soap	private_collector	490a198d-9df0-4723-bd03-e77f5854972a	\N
761	214	Joshua Mwololo Munene	Male	81821205	\N	Single	none	\N	15	tenant	\N	0	1	1	0	2	1	1	1	1	1	0	0	2	2	0	13	0	0	\N	0	0	0	casual	11000_15000	\N	\N	>20000	\N	none	vendor	boda	mission	with_water_and_soap	bins	40817dd4-32eb-4617-814b-a7f4056d81c5	\N
762	30	Daniel Wesonga Kipkemboi	Male	35190255	\N	Single	primary	\N	30	structure_owner	\N	1	1	0	0	1	0	0	2	0	2	0	0	2	1	2	12	1	1	\N	1	0	1	unemployed	16000_20000	\N	\N	16000_20000	\N	flush	river	train	mission	water_only	river	a857b999-4841-4f9f-aa86-c16ef080cc6a	\N
763	65	Thomas Abdiaziz Njihia	Male	78247635	\N	Single	secondary	\N	0	structure_owner	\N	2	2	2	0	2	2	1	1	2	0	1	1	0	2	2	20	0	0	\N	0	1	1	not_applicable	6000_10000	\N	\N	11000_15000	\N	flush	none	car	traditional	water_only	bins	293d25c9-6cb4-48e6-94b7-e799b2ddadf9	\N
764	109	Caleb Muchiri Joel	Male	83573455	\N	Seperated	none	\N	15	tenant	\N	1	1	0	2	2	1	0	2	0	2	0	1	1	0	1	14	0	0	\N	0	0	1	unemployed	6000_10000	\N	\N	16000_20000	\N	VIP	piped	matatu	mission	none	dumpsite	3a0164f1-1eae-4c28-9dfe-315791697462	\N
765	17	Leslie Kimathi Jarso	Male	64917753	\N	Cohabiting	none	\N	31	tenant	\N	1	2	2	2	0	0	2	1	0	0	0	1	1	2	2	16	2	0	\N	1	1	1	private	16000_20000	\N	\N	6000_10000	\N	communal	none	bicycle	chemist	with_water_and_soap	dumpsite	fcdd6a9b-14ab-415d-882f-57e22daaf7df	\N
766	133	Bob Nakhumicha Yegon	Male	10911048	\N	Cohabiting	none	\N	33	structure_owner	\N	0	2	2	0	0	2	0	0	1	1	1	0	2	0	1	12	1	0	\N	1	1	1	private	>20000	\N	\N	11000_15000	\N	communal	rainwater	car	chemist	with_water_and_soap	dumpsite	58a5360f-184c-4708-be8d-f8b8d77dfcd3	\N
767	47	Jake Thuranira Tirop	Male	02818195	\N	Widowed	university	\N	22	structure_owner	\N	2	1	0	1	2	2	2	0	2	0	0	0	2	2	0	16	0	1	\N	1	0	0	unemployed	16000_20000	\N	\N	0_5000	\N	flush	river	car	other	none	bins	695eaed7-704f-4c85-b2a0-563ae7b2fc99	\N
768	72	Alex Kirimi Muthomi	Male	53241341	\N	Seperated	university	\N	25	tenant	\N	1	2	2	0	0	0	0	2	0	1	2	2	2	0	2	16	1	2	\N	1	0	0	civil_servant	6000_10000	\N	\N	11000_15000	\N	none	vendor	train	other	water_only	private_collector	e87ec0a8-8f00-48d1-b473-23de9190ec2b	\N
769	173	Diana Abdifatah Muinde	Female	27536273	\N	Cohabiting	secondary	\N	8	tenant	\N	0	0	1	1	1	2	2	0	2	1	0	2	2	0	1	15	2	2	\N	1	0	0	unemployed	>20000	\N	\N	16000_20000	\N	pit_latrine	none	matatu	mission	water_only	river	1f25d140-74fc-4b10-a12b-5e7761fba082	\N
770	194	Joseph Muchai Musau	Male	42363475	\N	Single	university	\N	14	structure_owner	\N	1	2	2	2	2	1	2	2	0	1	0	0	2	1	0	18	2	0	\N	1	0	0	unemployed	11000_15000	\N	\N	11000_15000	\N	none	river	train	other	none	private_collector	17c62c31-9155-4500-895a-0d49c2ed7477	\N
771	146	Sarah Kihara Nyakundi	Female	39752307	\N	Single	college	\N	17	tenant	\N	0	1	2	2	2	1	1	0	2	0	2	1	2	1	0	17	1	2	\N	0	1	1	private	6000_10000	\N	\N	6000_10000	\N	none	river	train	mission	water_only	river	74d6ed93-80e2-4fb5-a35c-a147d374cdba	\N
772	110	Thomas Bare Godana	Male	74510259	\N	Single	secondary	\N	1	tenant	\N	2	2	2	0	0	2	2	0	1	2	1	0	2	2	0	18	1	0	\N	0	0	1	self	16000_20000	\N	\N	11000_15000	\N	communal	piped	train	chemist	none	river	cfc85aa5-bfaa-42c8-a2f0-5b060419499b	\N
773	105	Ronnie Keya Nyangau	Male	02686901	\N	Widowed	primary	\N	30	plot_Owner	\N	0	0	2	2	1	0	1	1	2	0	1	0	2	2	2	16	1	0	\N	0	0	0	casual	6000_10000	\N	\N	6000_10000	\N	flush	shallow_well	train	other	water_only	bins	6dc67b98-7843-4f3d-8c44-5f8198cc6ad9	\N
774	67	Christopher Marwa Mageto	Male	59577927	\N	Cohabiting	university	\N	3	plot_Owner	\N	0	1	1	2	1	0	2	2	0	1	1	1	2	1	0	15	0	2	\N	0	1	0	unemployed	>20000	\N	\N	11000_15000	\N	none	rainwater	boda	traditional	with_water_and_soap	private_collector	8b851736-0da1-45ce-a199-319944f86cf6	\N
775	35	Natalie Adongo Baya	Female	76261151	\N	Seperated	university	\N	34	plot_Owner	\N	0	0	1	0	2	2	0	1	2	2	2	1	2	1	0	16	0	1	\N	0	0	1	unemployed	16000_20000	\N	\N	16000_20000	\N	pit_latrine	shallow_well	matatu	traditional	with_water_and_soap	private_collector	51684986-0b73-4dee-9462-eae4d319f307	\N
776	231	Jeffrey Ahmed Njagi	Male	72585274	\N	Widowed	college	\N	3	plot_Owner	\N	1	0	1	2	0	1	2	0	0	1	0	1	1	1	2	13	2	2	\N	1	0	0	unemployed	11000_15000	\N	\N	0_5000	\N	VIP	vendor	car	mission	with_water_and_soap	bins	3adc4886-8a49-4c7b-92c8-2e70a783f9e4	\N
777	105	Jasmine Nkirote Sikuku	Female	02404707	\N	married	university	\N	4	plot_Owner	\N	2	1	0	1	2	1	2	0	1	1	0	0	0	1	2	14	0	2	\N	0	0	1	student	6000_10000	\N	\N	0_5000	\N	VIP	none	car	public	none	bins	f1100cb9-a130-49e6-9915-a2901c365ee9	\N
778	175	Ronald David Murigi	Male	64805170	\N	Single	secondary	\N	28	structure_owner	\N	1	1	2	1	2	1	2	0	1	1	2	0	1	2	0	17	1	1	\N	0	0	0	self	6000_10000	\N	\N	11000_15000	\N	pit_latrine	river	bicycle	traditional	water_only	private_collector	dcefc09c-444e-443c-8499-c86ca734b038	\N
779	12	Angel Mbuthia Wafula	Male	87603842	\N	Cohabiting	secondary	\N	20	structure_owner	\N	0	1	1	1	1	1	0	0	2	0	0	2	0	2	1	12	0	1	\N	1	1	1	unemployed	0_5000	\N	\N	>20000	\N	pit_latrine	river	bicycle	public	water_only	dumpsite	7537b10c-a2e2-4f27-9804-742acfa05268	\N
780	231	James John Musyoka	Male	17417207	\N	Single	none	\N	26	tenant	\N	0	0	0	2	0	1	1	2	2	1	0	0	0	1	1	11	2	1	\N	0	0	1	civil_servant	16000_20000	\N	\N	>20000	\N	pit_latrine	shallow_well	boda	traditional	with_water_and_soap	dumpsite	f8b59059-1a2b-449d-a8e8-76eb0e036066	\N
781	86	Michelle Muthama Jemutai	Female	79263788	\N	Cohabiting	university	\N	33	structure_owner	\N	1	2	2	2	1	0	2	0	1	1	0	0	2	0	0	14	0	0	\N	1	1	1	casual	0_5000	\N	\N	11000_15000	\N	none	rainwater	walk	chemist	none	bins	e1112878-3f79-41df-980d-c24eb676f3b3	\N
782	232	James Gachoki Okemwa	Male	56383176	\N	Single	primary	\N	6	tenant	\N	0	1	1	0	1	1	0	1	1	1	2	2	0	2	2	15	0	1	\N	1	1	1	casual	0_5000	\N	\N	16000_20000	\N	communal	rainwater	car	mission	with_water_and_soap	dumpsite	213efc35-f265-4b3a-bb26-dcb714f073f8	\N
783	155	Anthony Kinyanjui Jemeli	Male	34335547	\N	Cohabiting	college	\N	32	tenant	\N	0	0	1	0	0	0	1	0	2	2	0	2	0	2	0	10	1	2	\N	1	1	1	casual	11000_15000	\N	\N	>20000	\N	pit_latrine	vendor	bicycle	chemist	water_only	bins	251acad5-8eed-4282-a25f-14bf15edf52c	\N
784	39	Patricia Waithira Jama	Female	36245466	\N	Single	primary	\N	15	plot_Owner	\N	0	2	0	1	1	1	0	0	0	0	1	2	1	0	2	11	2	0	\N	1	0	1	unemployed	6000_10000	\N	\N	16000_20000	\N	flush	piped	bicycle	public	none	private_collector	a37c2991-6d3c-44c1-a9c1-10bd73063962	\N
785	128	Stephanie Eregae Kanini	Female	87161630	\N	Cohabiting	none	\N	10	tenant	\N	0	1	2	0	0	0	1	0	1	1	1	2	2	0	1	12	0	0	\N	0	1	1	casual	6000_10000	\N	\N	0_5000	\N	pit_latrine	shallow_well	walk	traditional	with_water_and_soap	private_collector	507f84d8-f286-40a4-9e10-94d00cd172c6	\N
786	226	Amanda Njue Mugendi	Female	04253684	\N	Single	primary	\N	24	plot_Owner	\N	0	1	2	0	0	0	0	0	1	2	0	0	2	2	2	12	0	1	\N	1	0	0	unemployed	16000_20000	\N	\N	6000_10000	\N	pit_latrine	river	car	public	water_only	private_collector	9f57b7fe-4083-401f-9681-97b1ebf7dc6e	\N
787	65	Alexander Githaiga Awinja	Male	73189373	\N	Single	primary	\N	25	structure_owner	\N	0	0	2	1	0	2	2	2	2	1	1	1	1	2	2	19	2	2	\N	0	1	1	unemployed	6000_10000	\N	\N	16000_20000	\N	flush	shallow_well	train	public	none	dumpsite	0df869cc-c503-415a-970e-267d007cfe27	\N
788	85	Kevin Jepleting Kassim	Male	78435457	\N	Seperated	none	\N	3	tenant	\N	2	0	2	0	2	2	0	2	1	0	0	0	2	1	0	14	1	0	\N	1	0	1	casual	11000_15000	\N	\N	0_5000	\N	pit_latrine	river	boda	chemist	water_only	private_collector	a5b7705d-40b0-4b6e-b2ba-2f191065aa32	\N
789	170	Rebecca Mutie Esinyen	Female	28668008	\N	Single	primary	\N	12	tenant	\N	0	2	2	2	2	0	1	1	2	2	2	1	0	2	0	19	0	0	\N	0	1	1	casual	6000_10000	\N	\N	16000_20000	\N	flush	river	matatu	public	water_only	bins	183ecf5d-cc02-483c-95f7-bd987cb1af55	\N
790	142	Heather Wawira Kanja	Female	26608584	\N	Single	secondary	\N	24	plot_Owner	\N	0	2	0	2	2	0	1	1	2	1	2	1	2	0	1	17	2	1	\N	1	1	1	self	16000_20000	\N	\N	16000_20000	\N	communal	shallow_well	boda	mission	with_water_and_soap	private_collector	82f58f92-6aea-4a09-9fe1-d7128e25789f	\N
791	225	Taylor Hillow Jacob	Female	08910569	\N	Single	none	\N	31	structure_owner	\N	1	2	1	2	0	1	0	0	1	2	2	0	0	1	0	13	0	1	\N	1	1	1	not_applicable	6000_10000	\N	\N	11000_15000	\N	communal	piped	matatu	other	water_only	bins	2cf8d08e-4536-4338-8658-33d72babdbd3	\N
792	202	Tina Mutisya Akinyi	Female	66462722	\N	Single	none	\N	31	plot_Owner	\N	1	1	1	1	2	0	2	2	0	0	1	0	0	2	0	13	0	2	\N	0	1	1	civil_servant	>20000	\N	\N	6000_10000	\N	none	vendor	walk	private	none	bins	a85ba85a-ec74-435f-9dd8-37c386040591	\N
793	206	Keith Thuranira Philip	Male	08376085	\N	Seperated	secondary	\N	27	tenant	\N	2	0	0	0	1	1	0	1	0	1	1	2	1	0	0	10	1	1	\N	1	0	1	not_applicable	0_5000	\N	\N	11000_15000	\N	VIP	shallow_well	car	private	water_only	dumpsite	8607e2bf-43ea-4087-a53f-baf589f844ee	\N
794	211	Sarah Duba Momanyi	Female	73795432	\N	Cohabiting	none	\N	20	tenant	\N	1	2	1	2	2	2	1	2	0	1	2	1	2	0	2	21	2	2	\N	1	0	0	self	16000_20000	\N	\N	16000_20000	\N	none	none	car	public	with_water_and_soap	river	04581a06-e4fb-4589-a177-cb2d46112223	\N
795	38	Lorraine Mbuvi Odinga	Female	63220775	\N	Seperated	primary	\N	30	tenant	\N	1	2	0	1	2	0	2	0	2	0	2	0	0	2	2	16	2	1	\N	1	0	0	unemployed	16000_20000	\N	\N	>20000	\N	communal	rainwater	matatu	private	with_water_and_soap	bins	5f92934f-9c10-4f59-a81f-db9f273d6bc4	\N
796	61	Cheryl Wangechi Kinoti	Female	05338129	\N	Single	college	\N	11	plot_Owner	\N	1	1	2	0	1	2	1	1	2	2	0	1	1	1	1	17	1	2	\N	0	1	1	private	>20000	\N	\N	11000_15000	\N	pit_latrine	shallow_well	car	traditional	water_only	private_collector	526b4d04-201a-49ab-891a-fb6b34f66a51	\N
797	87	William Brian Jefwa	Male	85303160	\N	Single	secondary	\N	34	tenant	\N	0	0	0	0	1	1	1	0	1	0	1	2	1	2	2	12	0	2	\N	0	1	1	self	6000_10000	\N	\N	0_5000	\N	pit_latrine	river	car	private	none	river	0ebedf09-16e3-42e4-8123-cb3c4908605b	\N
798	181	Ashley Achola Mbithe	Female	59463897	\N	married	primary	\N	32	tenant	\N	2	0	2	0	0	0	0	2	0	2	0	2	1	2	1	14	0	0	\N	1	1	1	self	6000_10000	\N	\N	11000_15000	\N	pit_latrine	river	bicycle	private	none	bins	902fb1d5-64bf-477e-a515-a04d955aaccd	\N
799	155	Kelli Saruni Masinde	Female	08670041	\N	Cohabiting	secondary	\N	22	plot_Owner	\N	1	0	0	1	0	2	0	1	1	0	2	1	1	1	1	12	2	0	\N	1	1	0	self	6000_10000	\N	\N	0_5000	\N	none	river	bicycle	other	with_water_and_soap	bins	75ed44a7-0e0c-4750-952d-89e373cb03d4	\N
800	85	Karen Mohammed Okech	Female	18393541	\N	Seperated	university	\N	7	plot_Owner	\N	1	0	2	2	1	2	1	0	0	1	1	0	2	2	2	17	1	1	\N	0	0	1	self	11000_15000	\N	\N	6000_10000	\N	flush	shallow_well	boda	private	water_only	bins	f972115e-f04d-4136-bb1d-42822509330b	\N
801	138	Elizabeth Rugut Rioba	Female	33125388	\N	married	secondary	\N	17	tenant	\N	2	0	0	0	0	2	0	0	2	2	1	0	0	0	2	11	1	0	\N	1	1	1	student	16000_20000	\N	\N	6000_10000	\N	pit_latrine	vendor	bicycle	other	water_only	river	4b29aae4-2e94-460e-8e6a-7048da0a9dea	\N
802	212	Valerie Cheboi Kenga	Female	32552160	\N	Widowed	secondary	\N	17	structure_owner	\N	2	2	2	1	2	2	2	2	2	2	0	2	1	2	2	26	2	0	\N	1	1	1	unemployed	6000_10000	\N	\N	11000_15000	\N	pit_latrine	rainwater	car	private	with_water_and_soap	private_collector	a29e884b-3d25-4ce9-8c56-77b75a161900	\N
803	138	Robert Abdinoor Wambura	Male	16332082	\N	Widowed	primary	\N	40	structure_owner	\N	1	2	2	2	0	1	1	0	0	1	1	2	2	2	1	18	2	2	\N	0	0	0	not_applicable	16000_20000	\N	\N	>20000	\N	communal	none	bicycle	chemist	water_only	private_collector	519dc1f3-dd4c-42c3-8422-5ffc4f013e81	\N
804	101	Michael Ndung'u Mwinzi	Male	72418095	\N	Cohabiting	primary	\N	21	structure_owner	\N	0	1	1	1	2	2	2	0	2	2	0	1	0	0	2	16	0	0	\N	0	0	1	civil_servant	6000_10000	\N	\N	16000_20000	\N	flush	river	walk	private	with_water_and_soap	dumpsite	e7074384-8723-4a89-ad7b-b773be4489ae	\N
805	204	Stephen Wesonga Baya	Male	16972399	\N	Cohabiting	university	\N	29	structure_owner	\N	2	2	0	2	0	2	2	2	1	0	2	0	2	1	2	20	0	2	\N	1	0	0	unemployed	>20000	\N	\N	6000_10000	\N	pit_latrine	vendor	car	traditional	with_water_and_soap	dumpsite	fc266050-8cd4-488d-a997-30084c742dd6	\N
806	150	Joy Njoka Chege	Female	37923366	\N	Widowed	none	\N	17	structure_owner	\N	1	1	1	2	1	2	0	0	0	0	0	0	1	2	2	13	1	1	\N	0	0	1	not_applicable	6000_10000	\N	\N	0_5000	\N	pit_latrine	river	matatu	traditional	none	river	3f98f5b4-ed7a-4e02-8c76-4fb1b191d7b4	\N
807	202	Deanna Mangale Muriuki	Female	35667883	\N	Cohabiting	none	\N	13	plot_Owner	\N	2	0	0	2	0	2	0	2	2	0	2	1	0	1	0	14	2	1	\N	0	1	0	unemployed	11000_15000	\N	\N	11000_15000	\N	pit_latrine	vendor	walk	traditional	water_only	bins	6a57b5a1-5e10-4e0d-9ca9-7e69e2768d6d	\N
808	144	Carlos Kurgat Jepchumba	Male	70471433	\N	married	college	\N	26	plot_Owner	\N	0	1	1	0	0	1	2	2	0	2	2	1	2	2	0	16	0	1	\N	1	0	1	private	>20000	\N	\N	0_5000	\N	none	vendor	boda	private	water_only	dumpsite	b1362ab3-e78f-469f-ab7c-34f018d117f8	\N
809	236	Amber Omollo Jerono	Female	12381017	\N	Single	none	\N	13	tenant	\N	0	1	1	0	0	1	2	1	0	0	2	2	2	0	2	14	0	1	\N	0	0	1	student	16000_20000	\N	\N	6000_10000	\N	pit_latrine	vendor	boda	chemist	with_water_and_soap	private_collector	827228ed-a26d-4474-800e-f76c322f699b	\N
810	185	Richard Musili Jama	Male	09512888	\N	Cohabiting	university	\N	22	tenant	\N	0	1	2	2	2	2	0	1	0	0	2	0	1	1	2	16	0	1	\N	0	1	1	self	6000_10000	\N	\N	0_5000	\N	none	vendor	boda	private	none	dumpsite	cb5471f7-7e13-462c-9a54-68d42dc41aed	\N
811	95	Steven Mwangi Murunga	Male	49510595	\N	Cohabiting	none	\N	16	structure_owner	\N	0	0	1	0	0	2	2	1	1	1	1	0	1	1	0	11	0	0	\N	1	0	0	self	0_5000	\N	\N	6000_10000	\N	none	rainwater	car	traditional	none	river	8423d6d4-6b03-46ca-861c-c49d8951e6da	\N
812	18	Karen Muli Chepkwony	Female	89881047	\N	Widowed	secondary	\N	0	plot_Owner	\N	1	1	2	1	2	1	0	2	1	2	2	0	0	0	1	16	0	0	\N	0	0	0	self	11000_15000	\N	\N	0_5000	\N	none	vendor	train	private	with_water_and_soap	dumpsite	dc1b85be-5fbf-420d-8049-50f5c53589df	\N
813	193	Michael Kipyego Hillow	Male	23364593	\N	Widowed	college	\N	38	tenant	\N	2	1	1	1	1	2	0	1	0	2	1	0	1	2	1	16	2	0	\N	1	0	0	civil_servant	>20000	\N	\N	6000_10000	\N	flush	none	bicycle	public	with_water_and_soap	river	73714bd5-30d3-4e97-9560-4a57adec978e	\N
814	222	Johnathan Ireri Ochieng	Male	31829001	\N	Single	university	\N	38	tenant	\N	2	1	0	0	0	2	2	0	2	1	0	2	2	0	2	16	2	2	\N	0	1	1	not_applicable	0_5000	\N	\N	>20000	\N	none	river	train	traditional	with_water_and_soap	private_collector	bf1f097d-82cb-45e1-b995-67a99c1fd180	\N
815	80	Linda Mwamburi Ongeri	Female	38631361	\N	married	university	\N	16	plot_Owner	\N	0	0	2	0	0	2	0	1	1	1	1	0	2	2	2	14	2	1	\N	0	0	0	civil_servant	>20000	\N	\N	>20000	\N	pit_latrine	vendor	train	chemist	water_only	bins	996fbe3c-b15f-4fe7-82d7-4ee74fdffcac	\N
816	162	Amanda Samuel Mwinzi	Female	19571547	\N	Widowed	college	\N	4	tenant	\N	0	1	0	1	2	2	2	2	1	2	1	0	0	1	1	16	1	2	\N	0	0	0	self	11000_15000	\N	\N	16000_20000	\N	VIP	piped	car	chemist	none	private_collector	c7f29c5b-fa88-47a7-8cd2-c3a4921ee05a	\N
817	29	Michael Abdifatah Adan	Male	54839644	\N	Single	primary	\N	20	tenant	\N	1	0	0	0	0	1	0	1	0	2	0	0	0	0	2	7	0	1	\N	0	0	0	not_applicable	>20000	\N	\N	>20000	\N	none	none	bicycle	private	water_only	river	bf6f09d2-578d-4da7-a1aa-ee539ca0df15	\N
818	119	Mary Ruto Kamathi	Female	15416597	\N	Seperated	college	\N	6	structure_owner	\N	2	0	2	1	2	2	1	1	2	2	1	0	0	0	1	17	0	0	\N	1	0	1	civil_servant	6000_10000	\N	\N	0_5000	\N	VIP	vendor	walk	private	with_water_and_soap	private_collector	a424d86e-5fb0-4a1b-94d9-0b1b28abc6fc	\N
819	87	William Mwendwa Moraa	Male	21077571	\N	Seperated	primary	\N	12	tenant	\N	2	2	2	1	2	1	0	0	0	1	2	2	2	0	2	19	1	1	\N	0	0	1	not_applicable	6000_10000	\N	\N	>20000	\N	flush	none	car	other	none	river	677bf2ee-0890-4893-81e7-cfc78f3a704a	\N
820	171	Justin Kivuva Terer	Male	51935788	\N	married	university	\N	22	tenant	\N	2	1	2	1	0	0	1	0	0	0	1	2	0	1	0	11	2	1	\N	0	0	1	self	11000_15000	\N	\N	11000_15000	\N	communal	vendor	car	other	with_water_and_soap	river	273164c8-eae2-4505-b872-a7ff1d734501	\N
821	133	Christine Murunga Awinja	Female	44542800	\N	married	none	\N	20	structure_owner	\N	0	2	2	0	2	0	1	2	1	1	1	2	0	0	2	16	0	1	\N	0	1	0	civil_servant	0_5000	\N	\N	6000_10000	\N	VIP	piped	bicycle	public	none	dumpsite	c5f56a19-c346-4c41-a6ea-a104896242a6	\N
822	146	Sarah Wanja Odinga	Female	47605395	\N	married	secondary	\N	5	plot_Owner	\N	0	0	2	2	2	1	2	0	2	0	1	0	0	1	1	14	1	0	\N	1	0	0	unemployed	0_5000	\N	\N	>20000	\N	communal	river	bicycle	traditional	none	bins	fe1110f8-43ea-460d-9df1-26f7d298f58e	\N
823	155	Donna Guyo Jepleting	Female	54897134	\N	married	secondary	\N	32	tenant	\N	1	1	0	1	2	2	2	0	2	1	0	1	2	2	1	18	0	0	\N	0	0	1	self	6000_10000	\N	\N	>20000	\N	none	none	walk	private	water_only	bins	2d659ca8-f2f6-4771-9e3d-858ad4bbc37d	\N
824	97	Michael Bosibori Mwanzia	Male	04996073	\N	Seperated	secondary	\N	36	plot_Owner	\N	2	0	1	0	1	1	2	1	2	2	1	1	0	0	2	16	0	2	\N	1	0	1	civil_servant	16000_20000	\N	\N	6000_10000	\N	communal	rainwater	matatu	private	with_water_and_soap	bins	08a2b6b9-5274-4559-a625-1e7f5e6923bb	\N
825	66	Matthew Kiarie Mmboga	Male	36792320	\N	Widowed	university	\N	23	plot_Owner	\N	0	2	1	0	0	1	1	1	2	1	2	1	2	1	1	16	0	2	\N	0	0	0	unemployed	11000_15000	\N	\N	6000_10000	\N	pit_latrine	none	matatu	traditional	none	private_collector	d3574b75-5c0b-447b-b778-29224ecdf8e9	\N
826	185	Jonathan Mutemi Mwendwa	Male	50397248	\N	Cohabiting	college	\N	34	structure_owner	\N	1	0	0	2	2	2	0	2	1	2	0	2	0	1	2	17	0	1	\N	0	0	0	civil_servant	0_5000	\N	\N	6000_10000	\N	none	river	train	traditional	with_water_and_soap	private_collector	cdb75185-ab2e-4b0a-a458-743410f3e911	\N
827	176	Cheyenne Ndiema Nyamawi	Female	76590184	\N	Cohabiting	none	\N	13	structure_owner	\N	2	0	1	2	1	0	0	2	0	1	2	1	2	1	2	17	2	2	\N	1	0	1	self	16000_20000	\N	\N	>20000	\N	pit_latrine	none	train	mission	with_water_and_soap	dumpsite	f60f2ba4-31d6-4122-9450-6a5335f7b538	\N
828	19	Shane Ronoh Kamene	Male	48374539	\N	married	university	\N	6	plot_Owner	\N	2	2	0	1	1	2	0	0	1	0	2	1	2	1	1	16	1	0	\N	1	1	1	self	11000_15000	\N	\N	16000_20000	\N	pit_latrine	river	train	chemist	none	private_collector	95d12819-eee1-46d8-9661-aca170b5e4b0	\N
829	46	Eric Kurui Junior	Male	32408725	\N	Seperated	primary	\N	31	tenant	\N	2	2	1	0	1	1	1	2	0	2	1	0	0	1	2	16	2	0	\N	1	0	0	unemployed	>20000	\N	\N	6000_10000	\N	pit_latrine	piped	matatu	private	none	river	e067f885-f8f6-4179-a6c7-8d2f42fcc6ef	\N
830	56	Joshua Naliaka Apiyo	Male	82124128	\N	Single	university	\N	12	plot_Owner	\N	2	0	2	2	1	1	1	0	1	0	1	2	1	2	2	18	1	0	\N	0	1	1	not_applicable	6000_10000	\N	\N	>20000	\N	flush	piped	boda	private	with_water_and_soap	dumpsite	0869fd78-eaf2-4b87-9134-350a1378232d	\N
831	217	Linda Bor Muchangi	Female	16985761	\N	Cohabiting	primary	\N	4	tenant	\N	1	2	1	0	0	0	0	0	2	0	1	1	1	0	2	11	2	0	\N	1	0	1	casual	0_5000	\N	\N	16000_20000	\N	VIP	piped	bicycle	traditional	none	dumpsite	02bde97e-e672-4b0a-8e8c-c427291b8ad2	\N
832	109	Cynthia Opiyo Ndinda	Female	56562341	\N	Seperated	none	\N	28	plot_Owner	\N	1	1	1	0	2	0	1	1	0	2	0	0	0	2	0	11	0	2	\N	0	0	0	casual	6000_10000	\N	\N	6000_10000	\N	none	none	train	mission	none	private_collector	83bc5071-b6b6-432c-b61b-c19f3be97b9e	\N
833	166	Fred Halake Khaemba	Male	37186182	\N	Widowed	none	\N	40	plot_Owner	\N	2	0	0	2	0	0	0	1	2	0	2	0	1	0	1	11	1	2	\N	0	1	0	civil_servant	11000_15000	\N	\N	16000_20000	\N	communal	shallow_well	car	private	none	private_collector	1e0fdbbf-51f6-4fdf-a0d5-05da51c10a19	\N
834	125	Darren Jomo Mutwiri	Male	40867210	\N	Seperated	university	\N	23	structure_owner	\N	1	1	1	0	2	2	1	2	0	1	2	0	0	0	0	13	1	2	\N	1	1	1	unemployed	0_5000	\N	\N	16000_20000	\N	none	shallow_well	train	traditional	with_water_and_soap	bins	3332d658-179c-42a5-ab95-2139de2160f2	\N
835	154	Pamela Keitany Galgalo	Female	03743280	\N	married	university	\N	29	plot_Owner	\N	1	2	1	2	2	2	2	1	0	0	1	0	0	0	2	16	2	1	\N	1	1	0	private	6000_10000	\N	\N	>20000	\N	VIP	piped	car	private	water_only	bins	99f63f84-f9bd-4e07-9917-e56ffd77c920	\N
836	226	Gerald Akello Karisa	Male	62073769	\N	Widowed	primary	\N	35	structure_owner	\N	2	0	1	1	1	0	1	0	0	2	0	2	0	0	1	11	1	1	\N	1	0	0	civil_servant	6000_10000	\N	\N	16000_20000	\N	VIP	river	boda	other	with_water_and_soap	dumpsite	0b3abad1-793d-4d74-8c56-1b39029ff61d	\N
837	89	Kimberly Gati Mukiri	Female	01786035	\N	Widowed	none	\N	35	plot_Owner	\N	2	0	1	0	1	1	1	1	1	2	0	2	0	1	1	14	0	2	\N	0	0	0	self	11000_15000	\N	\N	>20000	\N	pit_latrine	rainwater	car	traditional	none	private_collector	50502a8e-4395-4cee-a87b-49805090b849	\N
838	165	Lisa Munyua Chepkwony	Female	03372716	\N	Widowed	university	\N	34	structure_owner	\N	2	1	0	2	1	2	0	0	1	0	1	1	1	0	0	12	1	0	\N	1	1	0	unemployed	16000_20000	\N	\N	>20000	\N	VIP	piped	bicycle	public	none	river	59fbb36b-d905-415c-89c9-e815b4749b33	\N
839	80	Paul Kiprotich Musyimi	Male	68983867	\N	Widowed	secondary	\N	19	plot_Owner	\N	2	2	0	2	1	2	0	2	1	0	1	0	0	2	1	16	0	2	\N	1	0	1	self	>20000	\N	\N	0_5000	\N	none	vendor	boda	mission	water_only	dumpsite	745c2947-0267-4c21-814c-12748f3f9025	\N
840	57	Karina Kiplangat Cheyech	Female	02138273	\N	Widowed	university	\N	10	structure_owner	\N	2	1	1	2	2	2	0	0	0	0	1	0	0	2	1	14	1	2	\N	1	1	0	student	>20000	\N	\N	0_5000	\N	VIP	shallow_well	bicycle	mission	with_water_and_soap	bins	dc24b13a-5f79-43a2-af5e-615463357feb	\N
841	9	Douglas Onyango Kinoti	Male	40567942	\N	Widowed	college	\N	37	structure_owner	\N	2	0	2	2	1	1	1	0	2	0	1	0	2	1	1	16	0	0	\N	0	1	1	private	16000_20000	\N	\N	>20000	\N	pit_latrine	none	matatu	private	with_water_and_soap	bins	39221b14-1957-4e52-b70f-e3f4e4554b92	\N
842	69	Cynthia Kaingu Kitheka	Female	26174928	\N	Single	college	\N	8	structure_owner	\N	1	0	2	0	0	2	0	2	2	0	1	0	1	2	2	15	1	1	\N	0	0	0	not_applicable	0_5000	\N	\N	16000_20000	\N	none	piped	boda	traditional	none	bins	e4ecbc83-e4dc-4422-8a19-40ffa8a46a37	\N
843	7	Andres Mnangat Nkatha	Male	82367700	\N	married	primary	\N	12	structure_owner	\N	2	1	1	2	0	0	2	0	1	2	1	2	1	1	2	18	0	2	\N	1	1	0	unemployed	>20000	\N	\N	6000_10000	\N	flush	none	car	private	none	river	bcde2884-753a-4c51-a9c0-551dfde21d5e	\N
844	142	Daniel Kiema Elijah	Male	20073022	\N	Seperated	primary	\N	38	plot_Owner	\N	2	1	2	1	2	0	0	1	2	2	1	0	0	1	0	15	2	0	\N	1	0	1	private	0_5000	\N	\N	11000_15000	\N	flush	vendor	boda	other	water_only	private_collector	2022b823-3e3f-48ab-a201-ca2903306ed5	\N
845	187	Tammy Mukundi Mucheru	Female	40173289	\N	Single	college	\N	39	plot_Owner	\N	2	0	0	2	2	0	1	2	2	0	1	0	1	1	2	16	1	2	\N	1	1	1	unemployed	11000_15000	\N	\N	16000_20000	\N	communal	vendor	bicycle	chemist	with_water_and_soap	dumpsite	4f0edf31-eba8-46a6-8b76-b93f31d115ad	\N
846	172	Sheila Onditi Bundi	Female	75498733	\N	Widowed	university	\N	34	tenant	\N	2	0	2	0	0	0	2	0	2	2	0	1	2	2	2	17	2	2	\N	0	1	1	unemployed	16000_20000	\N	\N	11000_15000	\N	flush	none	matatu	other	water_only	river	9fe13af1-772c-404f-99f5-0c291970e2d9	\N
847	43	Joseph Isaac Onditi	Male	25273484	\N	Single	university	\N	34	tenant	\N	0	2	1	1	0	0	1	1	1	0	2	1	2	0	1	13	1	2	\N	1	1	0	civil_servant	16000_20000	\N	\N	16000_20000	\N	VIP	rainwater	bicycle	chemist	none	dumpsite	397854e9-e990-4f69-9a23-28bab178a324	\N
848	74	Carlos Sigei Wabwire	Male	16873141	\N	Widowed	primary	\N	12	tenant	\N	1	2	1	0	0	0	0	0	1	1	0	2	0	1	0	9	0	1	\N	0	0	0	not_applicable	11000_15000	\N	\N	6000_10000	\N	pit_latrine	piped	train	other	with_water_and_soap	private_collector	df965cfd-5686-49c1-85fd-5178ccf9ba2e	\N
849	77	Dylan Kimotho Waweru	Male	51469584	\N	married	none	\N	18	plot_Owner	\N	2	2	2	1	0	0	1	2	0	1	2	1	2	2	1	19	0	0	\N	1	0	0	civil_servant	16000_20000	\N	\N	16000_20000	\N	none	rainwater	bicycle	public	with_water_and_soap	bins	92e070ed-5b78-4f7c-beec-466150214fbb	\N
850	91	William Kiptanui Jepngetich	Male	35028752	\N	Single	university	\N	40	tenant	\N	1	2	1	2	1	0	2	0	0	2	0	2	0	2	2	17	2	2	\N	0	0	0	private	0_5000	\N	\N	>20000	\N	none	shallow_well	walk	private	water_only	river	483d67c3-b765-47d8-a914-04a616d98094	\N
851	76	Ronald Onditi Muktar	Male	67050338	\N	Single	primary	\N	37	plot_Owner	\N	2	2	1	1	0	1	1	0	2	0	2	0	2	2	1	17	0	1	\N	0	0	1	casual	11000_15000	\N	\N	>20000	\N	flush	rainwater	matatu	private	none	bins	d3a71090-1e47-4ac4-8655-68ef46683ae3	\N
852	99	Jennifer Imali Wasonga	Female	45694463	\N	Single	university	\N	39	structure_owner	\N	1	0	0	0	2	0	1	2	2	0	0	2	1	0	2	13	2	1	\N	1	1	0	self	0_5000	\N	\N	6000_10000	\N	flush	shallow_well	matatu	other	water_only	private_collector	ddd1f9ab-d359-46fd-8070-f375cebed147	\N
853	42	Shawn Sakwa Wairimu	Male	14732633	\N	Seperated	primary	\N	31	tenant	\N	0	1	1	2	0	1	2	1	1	2	0	0	1	0	1	13	0	1	\N	0	1	0	self	0_5000	\N	\N	0_5000	\N	VIP	rainwater	walk	other	water_only	dumpsite	c9d4f09d-ba87-4164-9634-61700375fc4d	\N
854	212	Roger Mugendi Owino	Male	40708937	\N	Widowed	primary	\N	33	tenant	\N	1	1	1	1	2	1	0	2	1	2	1	1	1	2	2	19	1	1	\N	0	0	0	not_applicable	16000_20000	\N	\N	>20000	\N	pit_latrine	vendor	train	chemist	with_water_and_soap	dumpsite	d2eae6f0-33f6-483f-9761-f5be1f525198	\N
855	186	Eric Wanyonyi Kiti	Male	39813747	\N	Seperated	none	\N	19	tenant	\N	2	1	1	1	2	0	2	0	1	2	1	0	0	0	2	15	1	0	\N	0	1	1	civil_servant	>20000	\N	\N	11000_15000	\N	communal	rainwater	boda	private	with_water_and_soap	private_collector	577da50c-63d1-437a-8256-dea1bbd240d7	\N
856	228	Stephanie Wanzala Chepkirui	Female	66493195	\N	Seperated	college	\N	17	structure_owner	\N	2	0	1	2	1	1	0	2	2	0	1	2	0	1	2	17	1	2	\N	0	1	1	self	0_5000	\N	\N	11000_15000	\N	pit_latrine	rainwater	walk	private	none	dumpsite	626997ac-5b5a-40c9-abd0-dd84aa9491a4	\N
857	138	Christina Nyawira Jepkemei	Female	36278663	\N	married	primary	\N	33	tenant	\N	0	2	1	2	2	0	1	2	1	0	0	1	0	0	2	14	1	2	\N	0	0	1	civil_servant	16000_20000	\N	\N	>20000	\N	none	vendor	bicycle	chemist	with_water_and_soap	bins	4867140b-14bd-42ca-b916-c8038ec30078	\N
858	49	Devin Kiarie Musungu	Male	60522181	\N	Cohabiting	none	\N	28	plot_Owner	\N	0	1	1	2	2	1	2	2	0	1	2	0	0	1	0	15	2	2	\N	0	1	1	unemployed	16000_20000	\N	\N	>20000	\N	VIP	vendor	walk	chemist	none	river	c1986b6e-cb72-4c9d-94d4-88942b0623e6	\N
859	120	George Safari Kinyua	Male	44721481	\N	Widowed	college	\N	37	tenant	\N	1	2	0	0	2	2	1	0	1	2	1	0	2	1	0	15	1	2	\N	0	0	1	casual	16000_20000	\N	\N	16000_20000	\N	pit_latrine	shallow_well	matatu	private	water_only	dumpsite	c1d91287-5bcb-4289-ae0c-56e3c938d616	\N
860	19	Lucas Syombua Odira	Male	02442691	\N	Cohabiting	primary	\N	36	plot_Owner	\N	0	1	1	2	1	0	1	0	1	0	2	1	2	2	2	16	0	0	\N	1	1	0	unemployed	11000_15000	\N	\N	0_5000	\N	communal	vendor	walk	mission	with_water_and_soap	private_collector	657f2f4c-1c7c-4903-8ed2-ac7731fd7362	\N
861	142	Lucas Adan Osman	Male	45738426	\N	married	none	\N	3	structure_owner	\N	0	0	2	2	2	1	0	2	2	0	0	1	2	0	1	15	0	0	\N	1	0	0	private	>20000	\N	\N	>20000	\N	flush	rainwater	boda	traditional	none	private_collector	82f7c1b4-8792-4696-b5ef-31b5bc4676e8	\N
862	17	Mark Ndunge Wambui	Male	66344155	\N	married	none	\N	38	structure_owner	\N	1	1	2	0	0	2	1	1	1	2	1	2	0	1	1	16	0	0	\N	1	0	1	unemployed	11000_15000	\N	\N	0_5000	\N	flush	piped	matatu	mission	water_only	bins	c3665318-5c8f-4d63-992d-b3d812e03433	\N
863	95	Lauren James Abdinoor	Female	52265313	\N	Seperated	primary	\N	18	tenant	\N	2	1	2	0	0	2	1	0	2	2	1	0	2	2	1	18	0	0	\N	0	1	1	casual	11000_15000	\N	\N	11000_15000	\N	none	vendor	matatu	public	with_water_and_soap	river	d247329c-2e17-48b1-bf2f-d200c46e52da	\N
864	100	Andrea Mueni Muthee	Female	76734264	\N	Widowed	college	\N	26	structure_owner	\N	0	2	0	1	2	2	0	2	2	0	0	0	1	1	1	14	0	2	\N	0	0	1	not_applicable	11000_15000	\N	\N	6000_10000	\N	none	rainwater	bicycle	chemist	with_water_and_soap	river	0b496c2b-299f-45e5-bb59-8b6cce756d63	\N
865	200	Sylvia Jepkorir Mwende	Female	67943273	\N	Widowed	university	\N	12	structure_owner	\N	1	1	1	0	2	1	1	0	0	1	0	2	0	0	0	10	0	1	\N	0	1	0	student	16000_20000	\N	\N	16000_20000	\N	pit_latrine	piped	matatu	public	none	dumpsite	db1aae22-12ce-4af6-b050-73bbc85a04b0	\N
866	169	Ann Akoth Nzau	Female	74178380	\N	Widowed	primary	\N	6	tenant	\N	0	0	1	2	2	0	0	0	0	0	0	0	1	0	1	7	2	0	\N	0	0	0	not_applicable	0_5000	\N	\N	0_5000	\N	none	none	matatu	mission	with_water_and_soap	river	412ebe9a-ae9f-43e4-b70e-e31ab0eba110	\N
867	152	Cynthia Oginga Abdulla	Female	52576499	\N	Single	primary	\N	34	tenant	\N	2	1	2	1	0	2	0	1	1	1	1	2	0	2	2	18	2	0	\N	1	1	1	private	>20000	\N	\N	6000_10000	\N	flush	rainwater	bicycle	chemist	none	river	f19bcd8b-ab25-4827-95c6-e63ea965cca0	\N
868	205	Robert Rono Marwa	Male	03927964	\N	Single	university	\N	34	structure_owner	\N	0	0	0	1	1	0	2	2	0	0	1	1	0	1	0	9	1	1	\N	1	0	1	not_applicable	6000_10000	\N	\N	>20000	\N	communal	piped	walk	mission	none	dumpsite	d008b133-b294-4fc6-8621-0a45eeb9229e	\N
869	128	Amanda Ojwang Kangethe	Female	02703080	\N	Widowed	none	\N	37	tenant	\N	2	1	2	0	0	2	2	0	1	0	2	0	2	2	0	16	2	1	\N	0	0	1	student	0_5000	\N	\N	0_5000	\N	flush	shallow_well	car	private	water_only	private_collector	1ff97d3c-2335-40e2-a84b-8cea19bfad2c	\N
870	185	Tara Mauti Keitany	Female	24997987	\N	Single	university	\N	22	tenant	\N	2	1	1	2	2	0	1	2	2	1	2	1	0	1	0	18	0	0	\N	1	1	0	private	0_5000	\N	\N	11000_15000	\N	pit_latrine	none	walk	traditional	none	dumpsite	4cd46343-cea9-4ce6-aa67-5712efea4183	\N
871	158	Kelly Krop Lewa	Female	13041666	\N	Cohabiting	primary	\N	4	plot_Owner	\N	2	2	1	0	0	0	1	2	2	0	0	2	2	1	0	15	0	2	\N	0	1	1	private	16000_20000	\N	\N	11000_15000	\N	flush	piped	matatu	chemist	water_only	bins	b51e2a94-b8f3-42d1-8f47-e687d4bbf03a	\N
872	158	Gloria Kurgat Adam	Female	14628846	\N	Seperated	secondary	\N	2	tenant	\N	1	0	2	0	0	0	2	1	0	2	1	2	0	1	2	14	2	2	\N	0	0	1	casual	6000_10000	\N	\N	16000_20000	\N	VIP	rainwater	boda	private	water_only	bins	a534748b-f0df-4bd0-aa29-ae648d0a9b38	\N
873	183	Edward Michael Abdifatah	Male	64552007	\N	married	none	\N	5	plot_Owner	\N	2	2	1	2	0	2	0	0	2	1	1	1	1	1	0	16	1	0	\N	1	0	1	casual	>20000	\N	\N	11000_15000	\N	flush	piped	bicycle	public	none	private_collector	9be4d691-a6c9-46d7-bb56-d712f4454d35	\N
874	84	Aaron Mbuthia Charo	Male	51871288	\N	Widowed	university	\N	32	plot_Owner	\N	2	1	0	1	2	1	0	0	1	2	0	1	0	1	2	14	0	1	\N	1	0	1	casual	11000_15000	\N	\N	11000_15000	\N	none	rainwater	train	chemist	water_only	dumpsite	d0be2d8b-2d95-45a9-b8e7-931e9db02fc9	\N
875	208	Patricia Nyongesa Kamathi	Female	14341367	\N	Single	college	\N	1	structure_owner	\N	1	2	0	1	1	1	0	2	2	0	1	0	0	2	1	14	0	0	\N	0	0	1	self	0_5000	\N	\N	>20000	\N	none	rainwater	boda	traditional	none	dumpsite	cf6b0343-3c70-4f90-a1b0-6cf8116ad0ec	\N
876	45	Jill Akello Mwinzi	Female	12760725	\N	Single	primary	\N	9	plot_Owner	\N	1	2	0	0	2	0	0	1	2	0	2	2	2	1	2	17	2	2	\N	0	1	1	unemployed	6000_10000	\N	\N	11000_15000	\N	flush	vendor	walk	traditional	none	dumpsite	a8d07a92-1c88-4d65-8638-418c042ea583	\N
877	141	Mary Wanja Jebet	Female	37792506	\N	Widowed	college	\N	21	tenant	\N	1	0	1	0	1	2	0	1	0	2	1	1	0	0	1	11	0	2	\N	0	1	1	student	>20000	\N	\N	>20000	\N	communal	vendor	car	traditional	with_water_and_soap	river	ce8d8323-cc9b-4238-9841-e2e6746a4f74	\N
878	138	Renee Ngumbao Bosire	Female	62750509	\N	Widowed	university	\N	20	tenant	\N	1	2	0	0	1	1	1	0	2	2	1	1	1	2	0	15	1	1	\N	1	0	1	private	>20000	\N	\N	16000_20000	\N	pit_latrine	none	train	public	none	dumpsite	410eee86-7558-4e83-815c-6a9faf0b933b	\N
1154	23	Logan Wambui Muiruri	Male	88471027	\N	married	primary	\N	19	tenant	\N	2	2	1	1	2	0	1	1	0	1	1	2	0	1	2	17	2	1	\N	1	0	0	casual	>20000	\N	\N	0_5000	\N	VIP	river	train	private	none	dumpsite	19e4c905-c92c-4415-a225-2ab010e1fbe1	\N
879	34	Edward Kang'ethe Ngari	Male	11815995	\N	married	university	\N	1	structure_owner	\N	0	1	1	0	1	2	1	2	0	2	0	1	1	2	2	16	2	1	\N	0	0	0	unemployed	16000_20000	\N	\N	>20000	\N	pit_latrine	none	matatu	mission	none	dumpsite	0d05b9a1-7f91-4c46-8db8-29a3efa630ae	\N
880	81	Taylor Gathoni Sande	Female	81220153	\N	Single	secondary	\N	24	tenant	\N	2	0	0	0	1	2	1	2	2	2	0	0	0	2	2	16	2	0	\N	1	1	0	unemployed	0_5000	\N	\N	16000_20000	\N	flush	vendor	car	traditional	water_only	dumpsite	a8ceec8e-d8aa-48d7-892a-d759299c5941	\N
881	233	Tiffany Nzomo Mutunga	Female	74069844	\N	Widowed	none	\N	20	tenant	\N	0	0	2	0	0	2	1	1	2	0	2	2	1	2	2	17	2	1	\N	1	1	1	self	>20000	\N	\N	>20000	\N	none	rainwater	boda	mission	with_water_and_soap	dumpsite	4ca6078c-0f99-4848-9a83-3c4ea21e25a0	\N
882	25	Brian Khisa Kimathi	Male	24606590	\N	Single	university	\N	25	plot_Owner	\N	1	2	1	0	2	1	1	1	0	2	2	1	0	1	2	17	0	0	\N	0	0	0	civil_servant	16000_20000	\N	\N	6000_10000	\N	pit_latrine	vendor	walk	public	none	dumpsite	ab35aa33-2678-44bb-9c77-3f9c90a06c1b	\N
883	185	Christina Kangogo Cherotich	Female	53588758	\N	Cohabiting	university	\N	25	structure_owner	\N	1	2	1	0	0	2	0	0	2	0	0	2	0	0	1	11	1	0	\N	1	0	1	casual	16000_20000	\N	\N	11000_15000	\N	none	shallow_well	matatu	private	with_water_and_soap	private_collector	d9070e8f-be85-4d5a-a76f-fc89f6dcbd7c	\N
884	9	Laura Mwalimu Ochieng	Female	71279549	\N	Seperated	primary	\N	30	plot_Owner	\N	2	1	2	0	2	2	0	2	1	2	2	2	1	0	1	20	1	2	\N	0	1	0	not_applicable	>20000	\N	\N	>20000	\N	pit_latrine	vendor	train	chemist	none	river	e4bad44e-2976-496d-91cc-b6a05e0327e9	\N
885	31	George Nthenya Wario	Male	42960581	\N	Single	primary	\N	29	structure_owner	\N	1	0	1	2	0	2	1	0	2	1	2	2	1	2	2	19	1	2	\N	1	0	0	civil_servant	16000_20000	\N	\N	11000_15000	\N	communal	rainwater	bicycle	other	none	private_collector	6fb77d12-0591-4568-b202-126525c382b5	\N
886	128	Brandon Odhiambo Boke	Male	54440708	\N	Cohabiting	secondary	\N	12	structure_owner	\N	1	1	1	1	0	1	1	0	2	0	0	2	1	1	1	13	2	0	\N	1	0	1	unemployed	11000_15000	\N	\N	16000_20000	\N	VIP	none	train	traditional	none	river	96ea0c2d-974e-4988-8cdd-e76e52c7337d	\N
887	148	Kelsey Apondi Gichuru	Female	20013502	\N	married	university	\N	13	plot_Owner	\N	1	1	0	0	2	2	1	2	1	2	1	2	2	2	0	19	0	1	\N	0	1	0	not_applicable	6000_10000	\N	\N	0_5000	\N	none	shallow_well	matatu	private	with_water_and_soap	bins	216543b4-c21b-4151-81ff-db4aaa77249b	\N
888	18	Amber Chacha Sigei	Female	31715817	\N	married	college	\N	9	tenant	\N	1	1	2	1	1	1	2	1	2	0	1	1	1	2	0	17	1	2	\N	1	1	0	civil_servant	11000_15000	\N	\N	6000_10000	\N	VIP	shallow_well	bicycle	other	with_water_and_soap	dumpsite	e6037eef-2faa-4a2a-8197-94bc33f7d3b5	\N
889	158	Bradley Wangai Muriithi	Male	49779364	\N	Widowed	none	\N	6	structure_owner	\N	2	0	2	0	0	2	2	1	2	0	0	2	0	2	1	16	0	2	\N	1	1	0	private	11000_15000	\N	\N	11000_15000	\N	pit_latrine	vendor	train	chemist	none	bins	30be63fc-8c83-44c0-9fb8-64b710bad58f	\N
890	152	Stephanie Saina Mageto	Female	25567327	\N	married	primary	\N	27	plot_Owner	\N	1	1	0	1	1	0	1	0	1	1	2	1	2	1	2	15	1	2	\N	1	0	0	not_applicable	0_5000	\N	\N	11000_15000	\N	pit_latrine	none	boda	private	with_water_and_soap	bins	22e4ec6e-8a77-4238-a34b-041fc4a2d4a8	\N
891	172	Matthew Kanyi Kangethe	Male	35659038	\N	married	none	\N	22	tenant	\N	0	0	2	1	2	2	2	1	0	2	2	2	0	2	0	18	1	0	\N	0	1	1	not_applicable	6000_10000	\N	\N	0_5000	\N	none	piped	walk	traditional	with_water_and_soap	private_collector	cea4f0f1-9f59-43ce-9edf-c7405e2126d3	\N
892	236	Nicholas Maluki Moseti	Male	41474162	\N	Cohabiting	college	\N	11	plot_Owner	\N	2	0	0	0	0	2	1	1	2	0	1	0	1	0	0	10	1	0	\N	0	1	1	not_applicable	16000_20000	\N	\N	11000_15000	\N	pit_latrine	shallow_well	train	private	with_water_and_soap	dumpsite	307a6b2c-a36f-4af3-a6a9-6d76af38454f	\N
893	15	Steven Wekesa Murangiri	Male	31723593	\N	Cohabiting	primary	\N	19	tenant	\N	0	0	2	2	2	1	0	2	0	0	2	2	1	1	0	15	2	0	\N	1	1	1	private	>20000	\N	\N	6000_10000	\N	communal	vendor	bicycle	other	none	river	ee7a4e91-c3fe-432a-b955-9e584d5f3602	\N
894	126	Peter Yator Njihia	Male	48753939	\N	Widowed	college	\N	8	tenant	\N	2	2	0	2	2	2	0	1	2	0	0	0	1	1	1	16	2	2	\N	0	0	0	student	>20000	\N	\N	11000_15000	\N	none	piped	bicycle	public	water_only	dumpsite	27426d64-23dc-4c31-84cb-dacd774eb557	\N
895	19	Cynthia Mzungu Kageha	Female	41126496	\N	Seperated	primary	\N	17	tenant	\N	0	2	1	1	1	1	2	0	0	1	1	0	2	2	0	14	1	2	\N	0	1	1	not_applicable	6000_10000	\N	\N	0_5000	\N	none	vendor	car	other	with_water_and_soap	private_collector	69613f14-eae8-4591-b5d7-b314d5d44c20	\N
896	74	Linda Apondi Martin	Female	32121168	\N	Widowed	primary	\N	15	tenant	\N	2	1	1	1	0	0	1	1	1	1	0	2	1	2	1	15	2	0	\N	0	0	1	civil_servant	>20000	\N	\N	0_5000	\N	VIP	none	train	traditional	none	bins	b0480735-1964-46e1-ab52-8cabb0e3d5e6	\N
897	232	Daniel Ondari Murangiri	Male	02862343	\N	Seperated	university	\N	38	tenant	\N	1	0	1	2	1	1	2	1	1	0	1	0	0	0	1	12	2	0	\N	1	1	0	civil_servant	6000_10000	\N	\N	11000_15000	\N	VIP	shallow_well	car	chemist	water_only	dumpsite	1b55f0a0-f85a-4f8a-ad76-632f15b261d8	\N
898	114	Joel Mutinda Ndwiga	Male	39536642	\N	Widowed	primary	\N	24	structure_owner	\N	2	0	1	1	1	2	2	0	2	2	0	1	2	2	1	19	0	2	\N	1	1	1	student	11000_15000	\N	\N	>20000	\N	pit_latrine	river	boda	traditional	water_only	private_collector	e612413e-8cf5-4f36-b1b6-8aad1b7e08b6	\N
899	105	Sheila Kipkurui Jepkosgei	Female	11372985	\N	Cohabiting	none	\N	31	structure_owner	\N	2	2	1	1	2	1	1	1	1	1	0	0	2	1	2	18	2	2	\N	0	0	1	private	>20000	\N	\N	16000_20000	\N	flush	river	train	traditional	with_water_and_soap	dumpsite	f8b468dd-fde5-407e-be6d-01dbd716cd61	\N
900	199	Andrew Muthami Kimathi	Male	23843950	\N	Single	secondary	\N	39	plot_Owner	\N	0	0	1	0	1	0	2	2	0	1	2	1	0	1	2	13	0	2	\N	0	1	1	not_applicable	11000_15000	\N	\N	16000_20000	\N	pit_latrine	vendor	bicycle	public	water_only	private_collector	a9e6f3fd-c5c6-43b4-a161-0ecdc5b4509a	\N
901	222	Nathan Muthuri Nkirote	Male	67740334	\N	married	college	\N	8	tenant	\N	1	0	1	2	0	0	2	2	2	0	1	0	2	1	1	15	2	0	\N	0	1	1	unemployed	>20000	\N	\N	0_5000	\N	pit_latrine	shallow_well	boda	private	with_water_and_soap	bins	f559b3f2-50a5-48a8-94d8-3974ff93d882	\N
902	301	Parker Victor Orwa	Male	66855726	\N	Seperated	college	\N	13	tenant	\N	1	1	1	1	1	1	0	1	2	1	2	2	1	2	2	19	1	0	\N	0	0	0	civil_servant	6000_10000	\N	\N	11000_15000	\N	VIP	rainwater	train	private	with_water_and_soap	private_collector	cc102b9e-e86e-4c66-8b12-d2465b1800ad	\N
903	61	Brian Adhiambo Kioko	Male	88003374	\N	Single	university	\N	21	plot_Owner	\N	1	2	2	1	0	1	0	0	0	1	0	0	1	1	1	11	0	1	\N	1	0	0	civil_servant	6000_10000	\N	\N	>20000	\N	pit_latrine	river	boda	traditional	with_water_and_soap	bins	d43a2e80-16b4-4b25-91c9-da6e3a45ea24	\N
904	185	Ashley Gitahi Muthui	Female	53752975	\N	Single	university	\N	36	plot_Owner	\N	1	1	1	2	0	0	1	2	0	2	0	0	2	2	2	16	0	0	\N	0	1	1	not_applicable	0_5000	\N	\N	11000_15000	\N	flush	piped	matatu	other	water_only	bins	5e51e804-6a64-4d6a-a33d-6ec90c8676b7	\N
905	33	Tracey Munguti Ogutu	Female	32868364	\N	Widowed	secondary	\N	21	structure_owner	\N	0	2	2	0	2	0	2	2	2	0	2	2	2	2	2	22	1	2	\N	0	0	1	casual	>20000	\N	\N	0_5000	\N	pit_latrine	rainwater	boda	private	with_water_and_soap	dumpsite	0b881685-b021-4043-bca6-8a8accab1210	\N
906	81	James Owiti Ndiritu	Male	15696396	\N	Seperated	college	\N	17	structure_owner	\N	0	1	2	1	2	0	0	1	2	2	1	1	2	1	2	18	0	1	\N	0	0	1	unemployed	6000_10000	\N	\N	6000_10000	\N	pit_latrine	vendor	train	traditional	water_only	river	21395dad-1f97-4ef2-a8b8-0535b5c7aaa3	\N
907	33	Daniel Langat Kakai	Male	15280243	\N	Seperated	primary	\N	19	tenant	\N	0	1	1	1	1	1	1	2	0	1	0	1	0	0	1	11	1	0	\N	1	0	0	student	>20000	\N	\N	0_5000	\N	none	shallow_well	matatu	private	water_only	river	9fcf0a23-deed-4fdf-a107-5a5ce464a9e3	\N
908	208	Elizabeth Kiogora Omar	Female	23644201	\N	Seperated	primary	\N	22	plot_Owner	\N	0	0	0	0	0	2	2	0	1	2	2	1	1	0	2	13	2	0	\N	0	0	1	not_applicable	0_5000	\N	\N	>20000	\N	flush	rainwater	car	public	with_water_and_soap	private_collector	665ef2b4-2fb3-4b59-a594-875c10b9e8ae	\N
909	96	Crystal Ngome Ombati	Female	73543662	\N	Single	secondary	\N	33	tenant	\N	0	2	0	0	0	2	0	0	1	0	0	2	0	1	1	9	0	2	\N	1	0	0	self	11000_15000	\N	\N	16000_20000	\N	none	vendor	boda	chemist	none	private_collector	162810b2-907e-4f60-a859-19c0cfe8f323	\N
910	133	Carolyn Waithira Kemei	Female	59475916	\N	Single	none	\N	2	structure_owner	\N	0	2	0	2	1	1	1	0	0	2	2	1	1	0	0	13	0	0	\N	1	1	0	civil_servant	11000_15000	\N	\N	>20000	\N	communal	none	bicycle	private	water_only	dumpsite	a640e179-07ad-4394-a984-fc8b91805f3e	\N
911	7	Melissa Wainaina Nduati	Female	29114064	\N	married	none	\N	38	plot_Owner	\N	2	2	1	2	2	0	2	0	2	1	1	2	2	1	2	22	2	1	\N	1	1	1	private	6000_10000	\N	\N	16000_20000	\N	pit_latrine	rainwater	boda	chemist	none	river	cc21a34a-6bf5-455c-b54e-dc5f14498f7b	\N
912	225	Deborah Titus Gakii	Female	07181733	\N	Cohabiting	college	\N	1	structure_owner	\N	2	2	1	0	1	1	0	1	2	1	1	0	1	2	1	16	0	0	\N	0	1	0	civil_servant	0_5000	\N	\N	>20000	\N	flush	none	matatu	other	water_only	river	94be924c-cbe3-41d4-bef1-d75c78fd2d1b	\N
913	106	David Maweu Kiplangat	Male	42685768	\N	Seperated	university	\N	22	tenant	\N	2	1	1	2	1	1	2	1	2	1	0	0	0	0	2	16	1	0	\N	0	0	1	private	11000_15000	\N	\N	6000_10000	\N	flush	none	walk	other	with_water_and_soap	river	2b5bdaaa-1ad0-4cde-a38f-19450f31e37f	\N
914	217	Jennifer Odoyo Hassan	Female	44679212	\N	married	secondary	\N	0	tenant	\N	1	1	2	0	1	2	0	0	1	0	2	2	0	2	0	14	0	1	\N	0	1	0	casual	>20000	\N	\N	6000_10000	\N	VIP	rainwater	car	private	with_water_and_soap	private_collector	c8305e5f-d7de-4d3d-be44-9ad7277d2f52	\N
915	6	Brandon Ouma Jomo	Male	78103820	\N	married	secondary	\N	2	plot_Owner	\N	0	0	0	2	2	2	0	0	1	1	2	2	0	1	1	14	1	1	\N	0	1	0	not_applicable	6000_10000	\N	\N	6000_10000	\N	pit_latrine	shallow_well	car	other	with_water_and_soap	bins	d1409414-de1d-49fa-a3d1-17dd37d43a1b	\N
916	222	Daniel Munyi Mohamud	Male	62512724	\N	Cohabiting	college	\N	1	structure_owner	\N	2	0	2	0	1	2	0	1	0	2	0	2	1	0	1	14	2	0	\N	1	1	0	unemployed	0_5000	\N	\N	>20000	\N	communal	shallow_well	walk	private	with_water_and_soap	bins	095b9540-ee46-45a7-a05f-d4d295122846	\N
917	25	Joshua Mwongeli Okumu	Male	45028311	\N	Seperated	secondary	\N	40	plot_Owner	\N	1	1	0	2	2	1	1	1	2	2	2	1	2	1	1	20	1	1	\N	0	0	0	not_applicable	11000_15000	\N	\N	11000_15000	\N	flush	piped	matatu	private	none	private_collector	759abd31-e977-44f1-b640-d5fc09e5aa2f	\N
918	52	Sharon Thoya Omari	Female	18254453	\N	Cohabiting	secondary	\N	7	plot_Owner	\N	0	2	0	0	2	1	1	2	0	1	0	2	0	0	1	12	2	2	\N	0	0	0	student	6000_10000	\N	\N	0_5000	\N	none	vendor	train	mission	water_only	dumpsite	34831260-c019-47d5-85c4-daa885b0cf98	\N
919	167	Tammy Wakhungu Ngina	Female	86499213	\N	married	secondary	\N	30	structure_owner	\N	1	0	2	1	1	0	0	1	0	0	2	0	0	2	1	11	1	1	\N	1	0	0	private	16000_20000	\N	\N	6000_10000	\N	flush	piped	train	public	water_only	private_collector	056995fa-0e2f-4b0a-88e7-5518484ad16f	\N
920	110	Richard Marwa Murungi	Male	45457689	\N	married	secondary	\N	4	structure_owner	\N	0	0	1	1	1	1	1	2	1	1	1	0	0	2	1	13	0	2	\N	1	1	0	private	0_5000	\N	\N	6000_10000	\N	VIP	rainwater	matatu	other	none	private_collector	c6f04546-9fc0-4462-9352-17f36300552e	\N
921	116	Melissa Kimanthi Ngure	Female	62289943	\N	Seperated	none	\N	20	structure_owner	\N	1	1	1	2	0	2	0	0	0	2	1	1	2	0	1	14	0	0	\N	0	1	1	not_applicable	16000_20000	\N	\N	6000_10000	\N	communal	rainwater	train	other	water_only	dumpsite	49a7f2eb-7a18-4ec5-9cda-3a22334525b2	\N
922	157	Samuel Chenangat Mwendia	Male	50281999	\N	Single	primary	\N	16	plot_Owner	\N	0	0	0	0	0	1	2	0	2	1	2	1	0	2	0	11	2	1	\N	1	0	1	student	11000_15000	\N	\N	6000_10000	\N	none	piped	boda	mission	with_water_and_soap	dumpsite	d63fd3f9-90e1-47d5-85e3-3a9a5ba81ab5	\N
923	208	Timothy Musa Kiboi	Male	02380239	\N	Single	none	\N	37	structure_owner	\N	2	1	1	2	1	2	2	2	2	2	0	1	2	0	2	22	0	1	\N	0	1	1	not_applicable	0_5000	\N	\N	6000_10000	\N	pit_latrine	piped	train	private	with_water_and_soap	river	a368b7f6-7b81-4723-96b7-68a4165adf59	\N
924	183	Bryan Biwott Ngui	Male	31264806	\N	married	none	\N	7	structure_owner	\N	0	1	2	0	2	0	2	0	0	1	1	2	2	1	2	16	1	0	\N	0	1	0	unemployed	11000_15000	\N	\N	0_5000	\N	flush	shallow_well	train	mission	none	dumpsite	034a3509-cf13-4575-b68c-6a1ab96b9a95	\N
925	62	Marc Keter Brian	Male	09243769	\N	Single	college	\N	7	tenant	\N	0	1	2	2	0	0	0	2	0	1	2	2	0	0	2	14	2	1	\N	0	1	1	student	16000_20000	\N	\N	11000_15000	\N	VIP	rainwater	bicycle	public	with_water_and_soap	river	8c89ef54-2a6b-4087-8ad0-13bec211f328	\N
926	7	Nicolas Ndungu Mohammed	Male	52620552	\N	Cohabiting	secondary	\N	9	tenant	\N	1	2	1	1	2	1	2	2	0	2	1	2	0	1	1	19	1	0	\N	1	1	1	civil_servant	0_5000	\N	\N	6000_10000	\N	none	piped	walk	other	none	dumpsite	aad626d9-69b0-4f00-b1b9-04a0672493a6	\N
927	141	Tyler Imali Kerubo	Male	63793377	\N	Cohabiting	none	\N	6	plot_Owner	\N	0	1	0	1	2	1	2	0	0	1	2	1	2	0	2	15	0	1	\N	1	1	0	private	0_5000	\N	\N	>20000	\N	none	vendor	walk	mission	water_only	bins	db4e4f4c-792a-407a-878c-4b77b3ae2fdc	\N
928	26	Katelyn Kimani Misiko	Female	57914152	\N	Single	secondary	\N	13	structure_owner	\N	2	0	0	1	0	2	1	0	1	1	0	0	0	1	0	9	0	0	\N	0	1	0	not_applicable	11000_15000	\N	\N	16000_20000	\N	communal	none	walk	mission	water_only	dumpsite	bf29fb86-d876-4f86-bb61-76b97e5029d4	\N
929	212	David Kipngeno Musyoki	Male	70015387	\N	Seperated	primary	\N	10	plot_Owner	\N	1	1	0	0	0	1	0	0	0	0	0	0	2	1	2	8	2	1	\N	0	0	0	unemployed	6000_10000	\N	\N	>20000	\N	flush	vendor	walk	public	with_water_and_soap	private_collector	f53e6629-8d9d-4698-8b06-8551db31e7d9	\N
930	139	Charles Nyale Mwadime	Male	19207903	\N	Single	primary	\N	22	plot_Owner	\N	1	2	2	1	2	1	2	1	2	2	0	0	0	1	1	18	0	2	\N	1	1	0	not_applicable	16000_20000	\N	\N	0_5000	\N	flush	river	train	private	with_water_and_soap	river	668a9a85-4ff5-4296-b627-1eb29586d568	\N
931	63	Nicholas Wanzala Kimani	Male	14804281	\N	Cohabiting	primary	\N	4	tenant	\N	2	0	0	2	1	1	2	0	0	0	1	0	1	1	2	13	2	0	\N	1	1	1	casual	16000_20000	\N	\N	0_5000	\N	pit_latrine	rainwater	matatu	other	water_only	private_collector	2be0df06-d64f-41e9-8218-c30d69e55a0a	\N
932	36	Elizabeth Ochieng Oyugi	Female	53555630	\N	Cohabiting	secondary	\N	12	structure_owner	\N	0	2	0	0	2	1	0	2	0	1	2	0	0	1	1	12	1	0	\N	1	1	1	unemployed	0_5000	\N	\N	16000_20000	\N	VIP	piped	matatu	chemist	none	dumpsite	b2392f4f-7695-4b31-9f61-5b893d5c2344	\N
933	162	Scott Situma Mati	Male	24638002	\N	Cohabiting	college	\N	26	structure_owner	\N	2	0	0	2	1	0	0	2	2	2	0	2	0	0	2	15	1	2	\N	0	1	1	unemployed	0_5000	\N	\N	6000_10000	\N	pit_latrine	vendor	bicycle	public	with_water_and_soap	private_collector	8c2d04ed-2d23-40b2-a3cb-dff62960f066	\N
934	123	Jessica Nzisa Mwema	Female	73390196	\N	Widowed	university	\N	24	structure_owner	\N	2	1	1	2	1	1	2	2	1	1	2	0	2	2	1	21	2	0	\N	0	1	1	unemployed	11000_15000	\N	\N	>20000	\N	pit_latrine	piped	bicycle	other	none	bins	1e43ce30-f10f-49d7-9614-5cc379d0542c	\N
935	184	Marcia Mohamed Kirwa	Female	03963816	\N	Seperated	none	\N	7	plot_Owner	\N	2	2	1	1	1	1	2	0	1	2	1	1	1	0	1	17	1	2	\N	0	0	1	unemployed	6000_10000	\N	\N	>20000	\N	flush	rainwater	matatu	private	none	river	1594d263-b8be-4b05-af19-a4d4f26d147e	\N
936	192	Alexis Jemutai Abdinoor	Female	41359412	\N	Seperated	college	\N	23	plot_Owner	\N	2	0	1	0	2	0	2	2	1	2	2	0	2	0	2	18	1	1	\N	1	1	1	civil_servant	0_5000	\N	\N	11000_15000	\N	VIP	rainwater	train	other	water_only	dumpsite	7ce437eb-fb04-42fc-8193-3cffe411939c	\N
937	209	Angela Ayieko Kanja	Female	63523492	\N	Single	secondary	\N	35	plot_Owner	\N	1	2	2	2	0	0	1	2	1	1	0	2	2	1	0	17	0	1	\N	1	1	0	unemployed	16000_20000	\N	\N	6000_10000	\N	pit_latrine	none	bicycle	other	water_only	dumpsite	762348b6-4337-4a07-acb7-f4c1ed2928d6	\N
938	109	Dana Etyang Ziro	Female	16001695	\N	Widowed	university	\N	31	structure_owner	\N	0	2	1	1	1	2	0	1	2	0	0	1	0	1	2	14	1	0	\N	1	0	1	self	0_5000	\N	\N	11000_15000	\N	pit_latrine	river	bicycle	traditional	with_water_and_soap	river	da8e41ec-5c14-4e8a-8470-c46d3cc16a3c	\N
939	127	Stephen Nyabuti Kiptui	Male	19350138	\N	Widowed	college	\N	20	tenant	\N	0	2	0	0	2	0	0	0	2	0	1	1	0	2	1	11	1	0	\N	1	0	1	not_applicable	0_5000	\N	\N	0_5000	\N	VIP	vendor	car	traditional	water_only	private_collector	70bfcec7-afa2-489b-bb57-0d44409dc5aa	\N
940	192	Joseph Ouma Muthengi	Male	01523459	\N	Seperated	primary	\N	7	plot_Owner	\N	1	2	0	2	0	2	0	0	2	1	0	1	1	2	1	15	1	2	\N	1	0	0	private	>20000	\N	\N	0_5000	\N	VIP	none	boda	chemist	none	dumpsite	154cf08a-4b0f-4ab5-8267-1ea36b8a75ea	\N
941	108	Valerie Kiio Isaac	Female	07886446	\N	Cohabiting	college	\N	8	plot_Owner	\N	0	1	1	2	2	1	2	1	0	0	2	2	2	2	0	18	0	2	\N	0	0	0	casual	6000_10000	\N	\N	16000_20000	\N	pit_latrine	shallow_well	walk	other	water_only	dumpsite	dab93a00-27da-437d-bfa2-4d2806c5083f	\N
942	26	Sophia Busienei Kamene	Female	38276113	\N	Single	none	\N	2	tenant	\N	1	2	1	2	1	1	0	1	2	2	0	2	0	0	2	17	1	0	\N	0	1	0	student	16000_20000	\N	\N	16000_20000	\N	pit_latrine	piped	walk	traditional	with_water_and_soap	private_collector	1e0e0247-410c-46e6-a65c-ea8fa7f3b601	\N
943	171	Charles Muasya Birgen	Male	16103896	\N	Widowed	primary	\N	35	structure_owner	\N	0	1	2	1	0	2	2	2	2	2	1	2	2	1	0	20	0	2	\N	1	1	0	not_applicable	16000_20000	\N	\N	6000_10000	\N	pit_latrine	shallow_well	walk	public	none	bins	faa693fd-3753-47dc-bed5-f3be0c4a5c88	\N
944	146	Amber Toroitich Karwitha	Female	34886799	\N	Widowed	college	\N	8	tenant	\N	0	0	0	0	0	0	1	1	0	2	1	0	2	0	2	9	2	1	\N	0	0	1	not_applicable	>20000	\N	\N	11000_15000	\N	flush	none	car	chemist	with_water_and_soap	bins	96d2dbe6-96f1-42bb-916b-624480017ea8	\N
945	89	Rachel Wasonga Robi	Female	49072883	\N	Widowed	university	\N	26	plot_Owner	\N	2	2	0	2	2	0	2	0	0	1	0	1	1	2	0	15	1	1	\N	1	1	0	private	6000_10000	\N	\N	6000_10000	\N	VIP	piped	bicycle	other	with_water_and_soap	bins	c7bb3282-1b18-422f-a737-b403cc7e6496	\N
946	38	Jason Onyango Kwemoi	Male	53586213	\N	Widowed	none	\N	9	structure_owner	\N	1	2	0	0	1	2	1	2	1	1	0	2	2	0	2	17	2	2	\N	0	1	0	self	6000_10000	\N	\N	0_5000	\N	none	shallow_well	bicycle	other	with_water_and_soap	dumpsite	949766db-f8b1-4e10-83c2-a1041ab6facf	\N
947	135	Adam Ombui Gathoni	Male	16007644	\N	Single	university	\N	16	tenant	\N	0	1	0	1	1	0	0	0	2	2	2	1	0	0	0	10	0	1	\N	0	0	1	civil_servant	16000_20000	\N	\N	>20000	\N	flush	shallow_well	train	other	with_water_and_soap	dumpsite	53f4f328-7f92-4ad7-afd2-4fb597c8c46b	\N
948	60	Douglas Jepkosgei Rashid	Male	83693202	\N	Seperated	college	\N	1	structure_owner	\N	2	0	1	1	2	2	1	2	1	1	1	2	2	2	2	22	0	0	\N	0	1	1	unemployed	16000_20000	\N	\N	16000_20000	\N	flush	vendor	walk	public	with_water_and_soap	dumpsite	cb14f2d7-9a63-4cdd-8a7c-82453521a66d	\N
949	91	Sabrina Yussuf Baraza	Female	19689286	\N	Cohabiting	none	\N	30	tenant	\N	2	2	1	2	1	2	1	1	0	2	2	2	0	2	1	21	0	2	\N	1	1	1	civil_servant	6000_10000	\N	\N	11000_15000	\N	flush	shallow_well	bicycle	public	none	river	9ead9e96-a0f9-444f-9fa8-b4f78759cf96	\N
950	71	Taylor Joshua Wanja	Female	10798559	\N	Cohabiting	university	\N	11	tenant	\N	2	1	0	0	1	1	2	1	2	2	0	0	0	2	1	15	2	0	\N	0	1	1	student	0_5000	\N	\N	11000_15000	\N	flush	river	walk	traditional	none	river	ed9c1bfb-30d0-4338-927b-93e569b9cdf6	\N
951	175	Tammy Gikonyo Ombati	Female	75030055	\N	Cohabiting	primary	\N	22	plot_Owner	\N	0	1	2	2	2	0	2	2	0	2	2	2	0	0	1	18	1	2	\N	1	0	0	student	11000_15000	\N	\N	>20000	\N	pit_latrine	vendor	train	public	none	bins	a236edbf-4c9b-4d74-97be-08344db85252	\N
952	231	Amanda Nyaga Cheptoo	Female	51927722	\N	Seperated	none	\N	24	plot_Owner	\N	1	1	2	2	1	0	2	1	2	2	2	0	1	1	0	18	0	2	\N	1	1	0	private	16000_20000	\N	\N	16000_20000	\N	pit_latrine	vendor	car	private	with_water_and_soap	bins	5197bb4a-0c51-4e16-a163-f6358220ffc1	\N
953	139	Sarah Suleiman Nzuki	Female	13799493	\N	Single	college	\N	1	plot_Owner	\N	2	2	0	0	2	0	0	1	0	2	1	0	2	2	1	15	0	2	\N	1	1	1	unemployed	0_5000	\N	\N	16000_20000	\N	pit_latrine	river	car	traditional	with_water_and_soap	private_collector	b77e37f1-b9ee-45bd-8a03-d0aa3b454056	\N
954	135	Sonya Ogola Mahat	Female	23377377	\N	Cohabiting	university	\N	27	tenant	\N	1	0	1	2	0	0	2	2	2	1	0	0	1	1	0	13	2	2	\N	1	1	0	private	16000_20000	\N	\N	0_5000	\N	pit_latrine	rainwater	walk	other	water_only	private_collector	1d0b3de3-1d2c-4a72-8258-409db48db6ba	\N
955	144	Richard Esekon Suleiman	Male	83255203	\N	Seperated	secondary	\N	28	structure_owner	\N	1	1	0	1	1	2	2	2	2	2	1	0	2	2	2	21	2	2	\N	0	0	1	not_applicable	11000_15000	\N	\N	6000_10000	\N	flush	vendor	matatu	other	none	private_collector	91581e53-bd6c-4fc6-965f-8fedd7c77eee	\N
956	25	Ashley Matheka Moturi	Female	24969804	\N	married	primary	\N	28	structure_owner	\N	2	2	1	1	0	2	1	0	2	2	1	0	1	1	2	18	1	2	\N	1	0	0	casual	11000_15000	\N	\N	>20000	\N	communal	none	walk	private	water_only	private_collector	bce22b55-adc4-4586-9b6e-090cc0aaec0b	\N
957	12	Jacob Kigen Jepchumba	Male	00538478	\N	Widowed	secondary	\N	35	structure_owner	\N	0	1	0	0	1	0	1	0	1	1	1	0	2	0	0	8	2	2	\N	1	1	1	student	11000_15000	\N	\N	11000_15000	\N	flush	shallow_well	matatu	other	water_only	dumpsite	bfeed182-ccb9-49b6-96d3-bedcf230c08d	\N
958	63	Jeffrey Kemboi Gati	Male	66995141	\N	married	none	\N	15	plot_Owner	\N	1	2	2	2	1	1	0	1	2	2	1	2	1	1	2	21	0	2	\N	1	1	0	self	>20000	\N	\N	0_5000	\N	pit_latrine	shallow_well	boda	private	none	bins	1e30346e-d99a-45b9-8b6f-e7dc7765e9bc	\N
959	20	Kyle Mwangi Koech	Male	34273390	\N	Seperated	none	\N	11	tenant	\N	1	2	1	1	1	2	1	2	0	0	0	1	0	2	0	14	0	0	\N	1	1	1	self	16000_20000	\N	\N	6000_10000	\N	communal	shallow_well	matatu	chemist	none	dumpsite	5d93ff39-6900-4fde-99bf-2a9335cc79f5	\N
960	15	Andrea Kiplimo Naserian	Female	31431525	\N	Widowed	university	\N	19	tenant	\N	2	0	2	0	0	0	1	0	1	1	0	2	0	1	0	10	2	1	\N	0	0	1	self	11000_15000	\N	\N	0_5000	\N	flush	shallow_well	matatu	other	with_water_and_soap	dumpsite	c365bdbe-4ca3-40e0-a0c0-8c896e775a7b	\N
961	40	Donald Kibe Nzai	Male	76351622	\N	married	college	\N	35	plot_Owner	\N	0	0	0	0	0	1	1	2	2	1	1	1	0	2	2	13	1	2	\N	1	0	1	casual	16000_20000	\N	\N	0_5000	\N	VIP	piped	walk	public	water_only	river	80339950-35b8-4a6e-b0ec-7fa3c2af3948	\N
962	20	Alexander Kandie Njeri	Male	78744144	\N	Single	none	\N	16	tenant	\N	2	0	1	2	0	1	1	0	0	2	1	1	1	2	1	15	2	1	\N	1	1	0	unemployed	16000_20000	\N	\N	11000_15000	\N	pit_latrine	none	bicycle	other	water_only	private_collector	9d3c9772-5b45-4877-8c8a-fdfdda322d4f	\N
963	103	Kristi Nganga Maghanga	Female	74311843	\N	Widowed	college	\N	31	plot_Owner	\N	0	0	0	2	1	1	1	0	0	1	0	2	2	2	1	13	1	1	\N	0	0	0	not_applicable	0_5000	\N	\N	6000_10000	\N	communal	none	bicycle	other	with_water_and_soap	private_collector	67011f6f-26ba-4944-9cbf-342467e3be17	\N
964	51	Sheri Koskei Kipkogei	Female	35229032	\N	Single	none	\N	20	plot_Owner	\N	1	2	0	1	0	2	2	0	1	0	0	2	2	1	0	14	2	0	\N	1	1	1	private	6000_10000	\N	\N	0_5000	\N	flush	rainwater	bicycle	mission	none	dumpsite	4d10e846-1f58-4ad1-80ea-dfe2e9009b27	\N
965	178	Stephanie Nyambura Ngina	Female	49303575	\N	Widowed	none	\N	26	structure_owner	\N	2	1	0	2	0	1	1	1	1	0	2	0	0	1	2	14	0	0	\N	0	1	0	not_applicable	11000_15000	\N	\N	>20000	\N	VIP	none	train	other	none	private_collector	edbd1a71-94d9-4444-9655-663734451d4f	\N
966	208	Matthew Kilonzi Ogutu	Male	43214303	\N	Cohabiting	college	\N	1	tenant	\N	2	0	0	1	0	0	1	1	2	2	0	1	1	2	1	14	2	0	\N	0	1	1	unemployed	16000_20000	\N	\N	>20000	\N	flush	vendor	car	other	water_only	private_collector	64d4f508-d23c-424e-b98f-20f551e8ad9b	\N
967	184	Christopher Ndinda Migwi	Male	64569135	\N	Seperated	university	\N	6	plot_Owner	\N	0	2	0	1	0	2	2	1	0	2	2	1	0	0	2	15	1	1	\N	0	1	0	student	11000_15000	\N	\N	11000_15000	\N	VIP	piped	car	private	none	river	ca00a305-eee4-411c-9fc6-35454a50bb48	\N
968	129	Mary Mwakio Athman	Female	14559606	\N	Cohabiting	none	\N	4	structure_owner	\N	0	0	0	1	2	1	2	1	2	2	1	1	2	1	0	16	0	1	\N	0	1	1	private	11000_15000	\N	\N	16000_20000	\N	flush	piped	car	mission	none	river	f8c0bbcd-b0cf-4cc2-b33a-cfc5496f8dfc	\N
969	226	Nicholas Edin Maiyo	Male	46219513	\N	Seperated	secondary	\N	19	structure_owner	\N	0	1	1	1	1	2	0	1	2	0	0	1	2	0	1	13	1	2	\N	0	0	1	unemployed	6000_10000	\N	\N	16000_20000	\N	none	river	boda	private	none	dumpsite	cf59046b-ff85-4702-bcc4-676ff9f55076	\N
970	174	Christopher Ondieki Wesonga	Male	69622387	\N	Cohabiting	secondary	\N	30	plot_Owner	\N	1	2	1	1	1	2	2	2	2	0	2	2	2	0	2	22	2	0	\N	0	1	1	self	0_5000	\N	\N	0_5000	\N	VIP	rainwater	train	public	none	river	6f5fe330-a3a2-415f-9dc8-22d4789d0ae2	\N
971	206	Joel Achola Wandera	Male	16713482	\N	Seperated	college	\N	4	tenant	\N	2	1	2	0	0	1	1	2	1	0	2	0	1	1	2	16	2	0	\N	1	1	1	self	6000_10000	\N	\N	>20000	\N	none	river	boda	chemist	water_only	bins	c7f93c6c-8331-496f-9fbb-3edc3ec77a3b	\N
972	180	Michael Kithinji Muchai	Male	08543859	\N	Cohabiting	college	\N	36	structure_owner	\N	0	2	1	2	1	0	2	1	0	1	0	1	0	2	2	15	0	0	\N	0	0	1	casual	16000_20000	\N	\N	6000_10000	\N	communal	vendor	matatu	public	none	bins	cbfefffb-2310-443a-82db-9bd4e62c422b	\N
973	10	Nicholas Muthengi Muendo	Male	41052384	\N	Cohabiting	college	\N	7	tenant	\N	1	1	2	1	1	2	0	0	1	1	0	0	2	2	1	15	2	0	\N	0	0	1	private	11000_15000	\N	\N	11000_15000	\N	communal	river	walk	private	water_only	dumpsite	17f72a55-e63f-463c-ac54-949b95aaedd1	\N
974	151	Bryan Bosire Nekesa	Male	09794694	\N	Cohabiting	college	\N	27	plot_Owner	\N	1	2	1	1	0	0	2	2	1	1	1	1	1	1	0	15	0	0	\N	0	0	0	civil_servant	6000_10000	\N	\N	11000_15000	\N	flush	river	car	chemist	none	bins	b42cad8f-9c63-4a2c-a300-6895e50f3194	\N
975	169	Ronald Duba William	Male	81870712	\N	Widowed	none	\N	21	plot_Owner	\N	2	2	1	2	1	2	2	2	1	2	2	0	1	1	2	23	0	2	\N	0	0	1	civil_servant	>20000	\N	\N	16000_20000	\N	VIP	piped	bicycle	mission	none	bins	a81f5daa-ff94-463e-b348-047d75e98d83	\N
976	158	Christy Muthama Ramadhan	Female	79309369	\N	Widowed	secondary	\N	39	plot_Owner	\N	2	0	0	1	0	0	0	2	0	0	0	0	2	1	2	10	2	2	\N	1	0	0	private	16000_20000	\N	\N	6000_10000	\N	pit_latrine	piped	train	traditional	none	private_collector	2e00470d-3eba-4374-884f-d9f06369d196	\N
977	91	Zachary Fundi Musila	Male	63244315	\N	Widowed	none	\N	24	structure_owner	\N	2	1	2	0	0	1	1	2	2	2	2	2	1	0	1	19	0	1	\N	1	1	1	student	>20000	\N	\N	16000_20000	\N	none	river	bicycle	public	with_water_and_soap	dumpsite	ddecb032-7bb9-42d3-b0c8-e47715fcb20c	\N
978	219	Tiffany Jepkoech Daud	Female	10448732	\N	Cohabiting	university	\N	23	structure_owner	\N	2	2	0	0	1	0	0	1	0	1	0	1	2	0	1	11	1	1	\N	1	0	1	casual	11000_15000	\N	\N	6000_10000	\N	VIP	river	car	public	with_water_and_soap	river	a88743cd-6d3e-4ced-af93-63ad0434bd6f	\N
979	127	Leslie Njuki Odinga	Female	12220261	\N	Seperated	secondary	\N	9	plot_Owner	\N	2	0	0	2	2	2	0	1	2	0	0	2	0	1	0	14	1	0	\N	1	0	1	private	0_5000	\N	\N	6000_10000	\N	communal	shallow_well	walk	other	water_only	private_collector	51243240-bea3-4608-bbf3-e0b1f1347ddf	\N
980	227	Elizabeth Isaac Philip	Female	38423568	\N	Seperated	primary	\N	30	structure_owner	\N	2	2	2	2	2	1	2	1	1	1	2	0	0	2	2	22	0	2	\N	0	0	1	private	>20000	\N	\N	11000_15000	\N	VIP	none	boda	public	water_only	river	758270e4-d702-4090-aef6-01c5f3e16ecb	\N
981	222	Jennifer Nyawa Wambugu	Female	66897889	\N	Widowed	primary	\N	4	structure_owner	\N	2	2	2	2	1	1	2	1	2	1	0	1	1	2	2	22	2	2	\N	1	1	0	not_applicable	11000_15000	\N	\N	11000_15000	\N	communal	vendor	matatu	mission	water_only	dumpsite	67166f47-bafa-4d75-9ded-2424fd66289c	\N
982	76	Connor Salim Nkatha	Male	59926763	\N	Seperated	none	\N	38	plot_Owner	\N	1	2	1	0	2	2	1	0	0	2	0	0	0	2	1	14	1	2	\N	0	0	0	student	11000_15000	\N	\N	>20000	\N	none	none	walk	traditional	water_only	private_collector	36ab132a-48ab-4b07-bf17-17c02988898a	\N
983	125	Daniel Mukoya Karuri	Male	18978849	\N	Single	university	\N	2	tenant	\N	2	2	2	0	0	0	0	0	0	1	0	1	1	0	1	10	2	2	\N	0	0	0	private	>20000	\N	\N	16000_20000	\N	pit_latrine	river	matatu	chemist	none	private_collector	637bbef9-c6a3-4f51-8901-db74b51c6935	\N
984	5	Catherine Nyaguthii Wangeci	Female	41265770	\N	Cohabiting	college	\N	3	structure_owner	\N	1	1	1	2	1	1	0	1	2	2	0	2	0	1	2	17	2	0	\N	1	1	1	self	6000_10000	\N	\N	>20000	\N	flush	vendor	walk	other	water_only	private_collector	f3121835-fccd-47b6-b7c1-d74da47f21b0	\N
985	97	Richard Ruwa Kalume	Male	52444281	\N	Cohabiting	secondary	\N	25	tenant	\N	1	0	1	1	0	1	0	2	1	2	2	0	2	1	1	15	0	1	\N	0	0	0	civil_servant	0_5000	\N	\N	0_5000	\N	pit_latrine	shallow_well	bicycle	public	none	bins	d44de473-d810-4658-a013-ec3b35cc27f8	\N
986	185	Craig Kandie Masika	Male	10971208	\N	Widowed	primary	\N	5	tenant	\N	1	0	2	1	0	1	2	1	2	2	2	2	0	0	2	18	2	1	\N	0	1	0	student	11000_15000	\N	\N	16000_20000	\N	none	rainwater	walk	public	with_water_and_soap	river	c6538d71-2f15-4e9e-b625-eed66fb7eadc	\N
987	130	David Athman Alio	Male	26088950	\N	Single	secondary	\N	30	tenant	\N	2	0	1	1	2	0	2	1	2	2	0	0	2	2	1	18	2	1	\N	0	0	1	casual	11000_15000	\N	\N	0_5000	\N	none	shallow_well	walk	other	water_only	private_collector	d9e66272-ae46-40c8-b4ae-cfec78b68bc7	\N
988	8	John Gichohi Ngumbao	Male	32504598	\N	Single	none	\N	35	structure_owner	\N	1	2	2	1	2	1	2	0	2	0	2	2	2	2	0	21	1	1	\N	1	1	1	student	16000_20000	\N	\N	16000_20000	\N	none	none	boda	mission	with_water_and_soap	private_collector	eb93d999-b477-4f12-bdb1-c4a82fc51efb	\N
989	165	Ashley Mutanu Adam	Female	68327478	\N	Single	college	\N	18	tenant	\N	1	2	2	2	1	1	1	2	0	1	0	1	2	0	2	18	2	2	\N	0	1	1	self	11000_15000	\N	\N	0_5000	\N	none	river	boda	private	with_water_and_soap	private_collector	4a93b956-dda9-4a87-93a4-20f12e4aceda	\N
990	141	Julie Makokha Moses	Female	31407356	\N	Cohabiting	university	\N	34	tenant	\N	0	1	2	1	0	2	1	2	2	2	1	0	0	1	1	16	0	1	\N	1	0	0	civil_servant	11000_15000	\N	\N	>20000	\N	communal	none	boda	other	none	private_collector	8a0b0403-dfdf-486a-97b8-2961b3548d0c	\N
991	157	Shannon Kamande Ayuma	Female	71936864	\N	Cohabiting	secondary	\N	2	tenant	\N	2	1	0	1	1	2	2	1	0	2	0	2	0	2	2	18	2	1	\N	1	1	0	unemployed	0_5000	\N	\N	16000_20000	\N	none	vendor	car	other	none	private_collector	420b0c77-8f5d-43e0-b689-68767d99311f	\N
992	147	Carrie Mwiti Ojiambo	Female	41274864	\N	married	university	\N	10	tenant	\N	0	2	1	0	0	1	2	2	2	1	1	1	2	0	1	16	0	1	\N	0	1	1	not_applicable	0_5000	\N	\N	6000_10000	\N	pit_latrine	none	boda	chemist	water_only	dumpsite	d6b09f39-6ae7-4574-94d1-522aa930629d	\N
993	71	Angela Jerono Masai	Female	10240673	\N	Cohabiting	university	\N	23	tenant	\N	2	0	2	1	1	1	2	1	0	2	0	1	0	1	1	15	2	2	\N	0	0	1	unemployed	11000_15000	\N	\N	11000_15000	\N	communal	none	car	traditional	none	private_collector	75b99e80-42f7-4a0e-9633-61aa6154e647	\N
994	16	Rachel Fondo Maiyo	Female	48064497	\N	Seperated	university	\N	19	structure_owner	\N	0	2	2	2	0	1	2	0	2	1	1	1	2	2	0	18	2	2	\N	0	1	0	casual	6000_10000	\N	\N	6000_10000	\N	flush	none	car	private	none	private_collector	dd01fd28-7b6a-4c97-9ccb-5a141d947a74	\N
995	95	Terri Bashir Jelimo	Female	32164938	\N	Seperated	college	\N	13	tenant	\N	1	2	2	0	2	0	0	1	1	2	0	1	0	1	0	13	2	2	\N	0	1	0	private	11000_15000	\N	\N	6000_10000	\N	VIP	shallow_well	bicycle	private	with_water_and_soap	dumpsite	f16df4d1-7531-453d-9810-8c7d7dbde662	\N
996	129	Susan Mutuku Kinoti	Female	53340828	\N	Widowed	none	\N	21	plot_Owner	\N	2	2	2	1	1	1	0	2	2	1	0	0	2	1	2	19	2	1	\N	0	1	1	unemployed	16000_20000	\N	\N	>20000	\N	communal	piped	car	other	none	river	b7f4413b-59b8-4812-859b-65baec8fe3ea	\N
997	118	George Chacha Ngui	Male	03024048	\N	Cohabiting	university	\N	35	tenant	\N	1	1	1	2	2	1	0	2	0	0	1	1	1	1	2	16	2	1	\N	0	1	1	civil_servant	0_5000	\N	\N	>20000	\N	communal	shallow_well	boda	other	none	river	800c18de-94c3-496b-9153-1b872dadc177	\N
998	213	Katie Cherutich Kiptoo	Female	77290292	\N	Cohabiting	college	\N	24	plot_Owner	\N	0	1	1	0	2	1	0	2	2	1	2	2	0	1	2	17	1	0	\N	0	1	1	civil_servant	16000_20000	\N	\N	11000_15000	\N	VIP	river	train	other	with_water_and_soap	private_collector	a3d70afb-c357-4f8a-a017-61e6cffb9a1a	\N
999	207	Lisa Ogega Lemayian	Female	73268609	\N	Widowed	none	\N	31	tenant	\N	0	2	1	1	2	0	0	0	0	0	1	1	2	2	2	14	2	0	\N	0	1	1	casual	16000_20000	\N	\N	0_5000	\N	flush	piped	train	other	with_water_and_soap	bins	c78fb7bf-fdb0-413d-895e-ec910cb92048	\N
1000	122	Michelle Benson Mwania	Female	25949125	\N	Widowed	university	\N	32	plot_Owner	\N	1	2	2	2	1	2	1	2	1	0	1	0	2	2	2	21	1	2	\N	0	0	1	private	0_5000	\N	\N	0_5000	\N	flush	vendor	matatu	traditional	none	river	cae2b57e-98fd-499c-b72d-8e16a0c4e9f1	\N
1001	222	Kelly Ogolla Korir	Female	11997064	\N	Widowed	primary	\N	9	tenant	\N	0	2	2	0	1	2	0	1	0	1	2	2	1	2	2	18	1	2	\N	1	1	0	casual	0_5000	\N	\N	0_5000	\N	flush	rainwater	boda	traditional	water_only	private_collector	9d3a8d02-2d9d-40d5-bec7-c0b66eeab24e	\N
1002	96	Kevin Waithira Nyangaresi	Male	79151225	\N	Single	university	\N	19	structure_owner	\N	0	1	2	0	2	1	1	2	0	1	2	0	0	2	0	14	2	0	\N	1	1	1	not_applicable	16000_20000	\N	\N	6000_10000	\N	VIP	river	matatu	chemist	water_only	private_collector	06d39996-a614-4a21-806a-2e5c5867bada	\N
1003	87	Robert Nandwa King'ori	Male	35056427	\N	Seperated	college	\N	34	structure_owner	\N	2	1	0	2	2	0	2	0	1	1	2	2	1	1	2	19	0	2	\N	0	1	0	private	>20000	\N	\N	16000_20000	\N	VIP	piped	bicycle	traditional	with_water_and_soap	bins	feebb57d-14e5-49be-a81d-68f0c14f1cd2	\N
1004	170	Margaret Nyaboke Etyang	Female	05408644	\N	Cohabiting	university	\N	20	plot_Owner	\N	1	0	1	2	2	1	1	2	0	1	0	0	1	2	0	14	2	0	\N	1	0	0	student	11000_15000	\N	\N	11000_15000	\N	none	river	walk	traditional	water_only	bins	418154ec-7cb3-4766-a638-5b2faad554cc	\N
1005	69	Kevin Njoroge Mwadime	Male	52790820	\N	married	secondary	\N	21	structure_owner	\N	2	1	2	1	0	2	1	2	2	1	1	1	1	0	2	19	2	1	\N	0	0	1	casual	0_5000	\N	\N	11000_15000	\N	communal	vendor	boda	mission	water_only	bins	656f380e-95e8-447b-98b7-48a25be5a2aa	\N
1006	1	James Ochola Murangiri	Male	14019060	\N	Seperated	primary	\N	18	tenant	\N	1	1	1	0	0	0	2	2	2	1	1	1	1	2	1	16	1	0	\N	0	0	1	civil_servant	>20000	\N	\N	6000_10000	\N	flush	none	bicycle	chemist	none	river	d67f5181-ecb4-4554-aef3-beb584a8c4fc	\N
1007	62	Jose Bore Mahat	Male	55937356	\N	Single	college	\N	36	plot_Owner	\N	2	1	2	0	0	2	0	1	1	2	1	0	2	2	0	16	2	2	\N	0	0	0	student	11000_15000	\N	\N	6000_10000	\N	VIP	river	walk	private	water_only	bins	eb88ec48-8072-4f01-a64d-91e380c30e4c	\N
1008	126	Christopher Misiko Erupe	Male	30075987	\N	married	secondary	\N	1	plot_Owner	\N	1	0	2	2	2	1	0	0	1	0	2	2	1	2	0	16	0	2	\N	0	0	0	casual	16000_20000	\N	\N	11000_15000	\N	pit_latrine	river	train	chemist	water_only	dumpsite	1fac077d-1f80-49ae-9224-f11027e77d67	\N
1009	202	Natalie Gichana Were	Female	78840303	\N	married	none	\N	31	structure_owner	\N	0	2	2	1	2	0	1	2	1	0	2	0	2	2	1	18	0	1	\N	1	1	0	casual	0_5000	\N	\N	>20000	\N	VIP	vendor	car	public	with_water_and_soap	dumpsite	68df2302-0ad3-47f2-ace6-f452fa25960b	\N
1010	110	Adrian Gathogo Jepleting	Male	73851049	\N	married	college	\N	32	structure_owner	\N	2	1	0	2	0	1	2	1	2	0	0	1	2	1	2	17	0	2	\N	1	1	0	self	>20000	\N	\N	6000_10000	\N	VIP	none	matatu	mission	with_water_and_soap	dumpsite	a20a7f73-b8be-4c51-a39c-8b268fa5935e	\N
1011	129	Ryan Ndirangu Keitany	Male	28507930	\N	married	college	\N	5	structure_owner	\N	2	1	0	2	0	2	1	0	0	2	0	2	2	0	0	14	0	2	\N	0	1	1	private	16000_20000	\N	\N	11000_15000	\N	VIP	none	car	other	with_water_and_soap	river	49e106d6-a6ee-49c9-abaf-4b1a1199d865	\N
1012	56	Craig Salim Joel	Male	88373464	\N	Single	university	\N	37	structure_owner	\N	0	0	2	0	2	0	2	1	1	1	2	1	0	0	0	12	0	2	\N	1	0	0	not_applicable	6000_10000	\N	\N	16000_20000	\N	communal	shallow_well	walk	private	none	river	f66d56e7-bcba-4570-bbeb-a66c3ee29478	\N
1013	74	Jordan Ayieko Abdulla	Male	34864921	\N	Single	primary	\N	40	structure_owner	\N	1	2	2	1	2	2	0	1	1	0	0	2	0	1	2	17	1	2	\N	1	1	1	casual	11000_15000	\N	\N	16000_20000	\N	flush	vendor	boda	chemist	with_water_and_soap	private_collector	eb9017ec-03b0-4784-932d-f8c9309789af	\N
1014	52	Monica Nafuna Kaloki	Female	77059160	\N	Widowed	secondary	\N	6	tenant	\N	0	2	0	0	1	1	1	2	1	1	0	1	1	0	0	11	2	2	\N	0	1	1	civil_servant	6000_10000	\N	\N	11000_15000	\N	VIP	none	bicycle	public	none	river	dd594d3d-c9c1-44fc-bbd8-0c8c1f5b19b4	\N
1015	5	Fernando Nelima Anyona	Male	70205785	\N	Seperated	secondary	\N	10	structure_owner	\N	1	1	2	0	0	2	0	1	1	1	0	0	2	1	0	12	2	2	\N	1	1	1	private	11000_15000	\N	\N	11000_15000	\N	pit_latrine	vendor	matatu	traditional	none	river	ef26213e-61a1-4d47-944a-9babc1ade9b6	\N
1016	178	Michael Stephen Nduku	Male	66468373	\N	Widowed	primary	\N	4	tenant	\N	0	1	1	0	1	1	0	0	2	0	1	0	1	0	1	9	1	1	\N	0	0	1	casual	11000_15000	\N	\N	6000_10000	\N	flush	vendor	walk	public	with_water_and_soap	bins	a89ea3ea-a7ec-4f6f-8d88-b036976f022e	\N
1017	79	Brian Issa Pkemoi	Male	20585190	\N	Cohabiting	university	\N	7	plot_Owner	\N	2	1	0	2	2	0	0	0	1	2	0	0	0	2	2	14	1	1	\N	0	1	0	student	>20000	\N	\N	6000_10000	\N	VIP	none	bicycle	public	none	bins	921d5cef-a69b-469e-ad23-81f7410bbaf7	\N
1018	153	Thomas Wario Kassim	Male	38066990	\N	Cohabiting	college	\N	20	plot_Owner	\N	1	2	0	1	0	2	0	2	0	2	0	1	2	0	0	13	2	2	\N	0	1	0	private	16000_20000	\N	\N	6000_10000	\N	VIP	shallow_well	train	traditional	with_water_and_soap	river	6daeab56-682f-4697-8cec-d7e2e0b5d807	\N
1019	110	Sierra Sawe Maloba	Female	64461141	\N	Seperated	university	\N	4	structure_owner	\N	2	1	1	2	0	2	2	2	2	1	0	2	1	1	1	20	2	1	\N	0	0	0	not_applicable	0_5000	\N	\N	11000_15000	\N	communal	piped	walk	other	none	bins	9c3ac06d-df24-422a-814a-957c8f5c7eb8	\N
1020	174	Joshua Kamathi Wanjala	Male	61882999	\N	married	primary	\N	35	structure_owner	\N	1	0	0	2	0	1	0	1	0	1	2	0	2	2	0	12	2	1	\N	1	0	1	private	6000_10000	\N	\N	6000_10000	\N	VIP	vendor	matatu	other	water_only	bins	1e8a55fe-17f4-4206-9206-6779d01dca21	\N
1021	7	Darrell Mbatha Mutemi	Male	89971123	\N	Cohabiting	primary	\N	34	structure_owner	\N	2	0	1	2	0	1	0	1	1	0	0	1	1	1	1	12	2	0	\N	1	1	0	private	>20000	\N	\N	16000_20000	\N	none	vendor	walk	public	with_water_and_soap	river	5bf3848d-fbc7-42ca-8bd8-cae3a1c21f6e	\N
1022	83	Phillip Kinuthia Karani	Male	27064635	\N	Single	none	\N	21	structure_owner	\N	0	2	1	2	2	2	2	1	0	1	1	2	0	1	2	19	0	0	\N	1	0	1	self	0_5000	\N	\N	>20000	\N	communal	rainwater	matatu	public	with_water_and_soap	bins	c24cb657-8be9-4630-80b3-3e515830d028	\N
1023	8	Terry Marwa Nyaga	Male	71269758	\N	Cohabiting	none	\N	10	plot_Owner	\N	1	2	2	0	2	0	0	1	0	0	1	2	0	2	2	15	0	1	\N	1	1	1	unemployed	16000_20000	\N	\N	0_5000	\N	none	rainwater	boda	private	none	bins	a0bb5be4-81ea-4b23-b8b9-afa0dbc37eff	\N
1024	142	Cody Yakub Ojwang	Male	24115604	\N	Single	primary	\N	0	structure_owner	\N	1	2	0	2	0	2	0	0	2	0	1	0	1	0	1	12	2	1	\N	1	0	0	unemployed	16000_20000	\N	\N	>20000	\N	pit_latrine	rainwater	bicycle	traditional	water_only	private_collector	45430e51-d2dc-4e43-90d6-bfde6b289154	\N
1025	187	Beth Ndegwa Ndege	Female	41256554	\N	Widowed	university	\N	17	tenant	\N	1	2	0	0	2	0	0	1	0	1	0	0	2	0	2	11	1	1	\N	1	0	0	private	11000_15000	\N	\N	0_5000	\N	none	rainwater	train	other	none	private_collector	6efe1c03-54a9-4689-b331-48fd74d051ad	\N
1026	176	David Kiptanui Mutua	Male	87159704	\N	Single	university	\N	25	tenant	\N	2	0	0	2	0	1	0	0	2	1	1	0	2	2	2	15	1	0	\N	1	1	1	student	11000_15000	\N	\N	6000_10000	\N	flush	shallow_well	train	chemist	with_water_and_soap	dumpsite	5f1f7c51-662a-4802-9ec2-f2535e88325d	\N
1027	221	Wayne Makau Kipkemoi	Male	82182987	\N	Seperated	primary	\N	28	structure_owner	\N	1	0	1	1	1	0	2	0	0	1	1	2	2	1	1	14	2	2	\N	1	1	1	student	11000_15000	\N	\N	16000_20000	\N	pit_latrine	none	boda	mission	with_water_and_soap	river	024deb32-51ab-4dd6-966d-861253325120	\N
1028	213	Amanda Martin Kibe	Female	76798264	\N	Seperated	none	\N	29	tenant	\N	1	2	0	0	2	1	0	2	1	1	2	1	1	2	2	18	0	2	\N	0	1	1	casual	>20000	\N	\N	0_5000	\N	communal	piped	boda	mission	with_water_and_soap	private_collector	e90630f6-bc55-4dbe-9d84-95daf9d93aa6	\N
1029	233	Felicia Orwa Kabiru	Female	69279593	\N	Cohabiting	primary	\N	38	tenant	\N	0	1	2	2	1	1	0	1	1	1	1	2	0	0	1	14	0	0	\N	1	0	0	private	6000_10000	\N	\N	16000_20000	\N	none	vendor	walk	mission	water_only	bins	6eb32445-8278-4918-9df0-a343f50d11cc	\N
1030	172	Tara Junior Jepkemei	Female	02577358	\N	Cohabiting	none	\N	31	structure_owner	\N	0	1	2	1	2	0	2	0	1	2	2	2	1	1	2	19	0	2	\N	0	0	0	unemployed	>20000	\N	\N	0_5000	\N	pit_latrine	shallow_well	boda	public	none	private_collector	07a603ea-b732-4094-ac6c-4bca970b8dc8	\N
1031	114	Jennifer Mwaniki Kiio	Female	61711220	\N	Single	primary	\N	15	tenant	\N	1	1	2	2	2	2	0	0	1	2	2	1	2	0	2	20	2	2	\N	1	0	1	private	0_5000	\N	\N	6000_10000	\N	VIP	river	walk	chemist	with_water_and_soap	private_collector	bde01338-ba4c-45fe-bc97-00693eb44eb4	\N
1032	215	Joshua Kiogora Okello	Male	59494266	\N	Single	secondary	\N	12	plot_Owner	\N	2	2	2	2	2	1	0	2	1	0	1	2	1	1	0	19	2	2	\N	1	1	1	casual	6000_10000	\N	\N	0_5000	\N	flush	shallow_well	bicycle	traditional	water_only	private_collector	845f4a36-2698-4084-9a25-c40acf219363	\N
1033	210	Heather Mutune Mbaka	Female	01458084	\N	Seperated	university	\N	6	plot_Owner	\N	0	2	1	1	1	2	1	2	1	1	0	2	2	0	2	18	2	0	\N	1	1	0	unemployed	6000_10000	\N	\N	11000_15000	\N	pit_latrine	vendor	car	other	water_only	bins	a5199060-dbf2-4628-99ce-dbba2b286e6b	\N
1034	120	Denise Sidi Fondo	Female	45084686	\N	Cohabiting	secondary	\N	20	tenant	\N	2	2	2	0	0	1	0	2	1	0	2	1	1	0	2	16	1	1	\N	0	0	1	self	6000_10000	\N	\N	11000_15000	\N	pit_latrine	rainwater	train	chemist	none	bins	6334fe28-65cb-47cb-ad14-65b0193bc11a	\N
1035	236	Brett Hillow Kabui	Male	49981171	\N	Widowed	primary	\N	18	tenant	\N	2	0	0	1	0	2	0	2	2	0	2	0	2	0	1	14	1	1	\N	1	0	0	self	>20000	\N	\N	11000_15000	\N	none	vendor	car	mission	water_only	bins	033ec563-a930-4e01-9504-4a6a081829fd	\N
1036	64	Melissa Ng'ang'a Chesire	Female	66725953	\N	Seperated	none	\N	19	tenant	\N	2	1	1	1	0	0	2	2	2	0	1	1	0	0	0	13	0	2	\N	1	1	0	private	0_5000	\N	\N	>20000	\N	communal	piped	train	mission	none	dumpsite	f0eb2f0b-4de4-476c-a3ad-22a0c2f9cd23	\N
1037	43	Jessica Bonaya Jeptoo	Female	32214539	\N	Seperated	none	\N	1	structure_owner	\N	1	0	2	0	2	0	0	2	2	0	2	0	1	2	2	16	0	1	\N	1	0	1	unemployed	>20000	\N	\N	>20000	\N	flush	shallow_well	train	chemist	water_only	private_collector	da7d33fe-8390-443d-a3f8-90989b7e57d2	\N
1038	64	Catherine Okumu Abdulla	Female	51178504	\N	Cohabiting	university	\N	25	plot_Owner	\N	2	2	2	0	2	1	0	1	1	2	1	1	1	1	0	17	1	2	\N	1	1	1	unemployed	16000_20000	\N	\N	0_5000	\N	communal	river	boda	mission	with_water_and_soap	dumpsite	4a2be0cd-1353-4c18-9054-fcd7f13a89b6	\N
1039	20	Mary Ongeri Mutune	Female	57756346	\N	married	secondary	\N	38	structure_owner	\N	0	2	1	0	0	1	2	1	0	1	1	2	0	0	0	11	0	0	\N	0	1	0	private	0_5000	\N	\N	6000_10000	\N	communal	none	boda	mission	with_water_and_soap	bins	3ded8103-534b-4c8a-a4ec-4a4d719f9249	\N
1040	132	James Farah Gathogo	Male	08821291	\N	Cohabiting	secondary	\N	31	structure_owner	\N	1	1	0	2	1	2	0	1	2	0	2	0	2	1	2	17	2	1	\N	0	0	1	civil_servant	0_5000	\N	\N	0_5000	\N	VIP	shallow_well	car	mission	none	river	05be965c-91c3-4e00-89d9-cf5afb6a09a6	\N
1041	233	Marcus Mugo Mutugi	Male	26218786	\N	Cohabiting	secondary	\N	6	structure_owner	\N	2	2	1	1	0	0	0	0	1	0	1	0	1	1	0	10	2	0	\N	0	0	1	unemployed	16000_20000	\N	\N	11000_15000	\N	communal	piped	walk	other	with_water_and_soap	river	f9ab2601-322a-4db7-adc5-0415fbc62efa	\N
1042	55	Crystal Ali Pkemoi	Female	62409284	\N	Cohabiting	college	\N	4	plot_Owner	\N	0	0	1	0	2	2	2	0	2	2	1	1	2	2	2	19	0	1	\N	1	0	1	casual	>20000	\N	\N	>20000	\N	communal	rainwater	train	traditional	with_water_and_soap	private_collector	f45bea08-354c-404a-9db7-a723447f6200	\N
1043	208	Elizabeth Moses Jepchumba	Female	56599754	\N	Widowed	college	\N	3	structure_owner	\N	2	1	2	0	0	2	0	1	0	1	0	2	0	2	0	13	1	0	\N	1	0	1	not_applicable	16000_20000	\N	\N	0_5000	\N	communal	river	train	chemist	with_water_and_soap	private_collector	dacb77c9-75ad-4c1a-89cc-71c24336713b	\N
1044	73	Sandra Gitonga Bii	Female	85724405	\N	Cohabiting	college	\N	39	structure_owner	\N	2	1	1	2	1	0	1	2	2	1	0	2	0	0	2	17	2	1	\N	1	0	0	civil_servant	0_5000	\N	\N	16000_20000	\N	pit_latrine	shallow_well	matatu	other	with_water_and_soap	bins	83273aa3-01e4-4fae-9991-275b466042ae	\N
1045	193	Martha Macharia Kimeli	Female	04653942	\N	Cohabiting	university	\N	5	plot_Owner	\N	0	1	0	2	0	2	1	1	1	1	0	0	0	1	0	10	0	1	\N	1	0	0	unemployed	>20000	\N	\N	>20000	\N	flush	rainwater	bicycle	other	water_only	private_collector	f75cd39f-24b6-4343-b3d6-951748e40202	\N
1046	111	Jacqueline Musili Patrick	Female	70834542	\N	Single	secondary	\N	30	plot_Owner	\N	0	2	0	0	1	0	1	0	2	1	1	0	0	0	2	10	0	0	\N	1	0	1	not_applicable	6000_10000	\N	\N	>20000	\N	none	none	bicycle	private	with_water_and_soap	private_collector	2460baa9-2e52-4ea3-89e7-c77a0d64fa53	\N
1047	32	Lisa Odiwuor Kimaiyo	Female	40590122	\N	Single	none	\N	24	structure_owner	\N	1	2	1	1	2	2	1	1	1	0	0	0	0	0	2	14	1	0	\N	1	0	0	private	0_5000	\N	\N	16000_20000	\N	VIP	piped	boda	mission	none	dumpsite	153db8eb-af3b-47fc-bc00-5e67364072de	\N
1048	130	Gavin Maghanga Boru	Male	81243805	\N	Widowed	university	\N	9	structure_owner	\N	2	1	2	2	1	1	1	1	0	0	1	2	0	0	1	15	2	0	\N	1	0	0	casual	>20000	\N	\N	11000_15000	\N	flush	vendor	bicycle	traditional	none	dumpsite	d867e817-3999-4a6b-a77a-924960da5596	\N
1049	204	Timothy Mawia Simon	Male	03459444	\N	married	none	\N	17	plot_Owner	\N	2	1	1	0	1	2	1	0	0	2	2	2	1	0	1	16	0	0	\N	0	1	0	self	6000_10000	\N	\N	16000_20000	\N	VIP	piped	bicycle	public	none	river	885ac8de-9ec0-4620-8fb1-a37be057bb55	\N
1050	113	Taylor Njoka Oyoo	Female	13285438	\N	Single	university	\N	6	plot_Owner	\N	1	2	1	2	1	0	1	1	0	1	2	1	2	2	0	17	1	1	\N	1	1	0	casual	16000_20000	\N	\N	16000_20000	\N	VIP	rainwater	matatu	private	water_only	private_collector	6263dfc4-ea15-4303-a89e-a14252b4e95c	\N
1051	84	Debra Gathogo Yator	Female	87371606	\N	Single	primary	\N	40	plot_Owner	\N	1	2	0	1	0	2	2	1	2	0	2	2	1	2	0	18	1	0	\N	0	0	0	civil_servant	11000_15000	\N	\N	11000_15000	\N	communal	vendor	boda	traditional	with_water_and_soap	river	e48c2061-6d6a-477b-b075-95df05550653	\N
1052	114	Matthew Kiptum Kariuki	Male	06490758	\N	Cohabiting	secondary	\N	19	tenant	\N	0	2	0	2	0	1	1	2	1	0	0	0	2	1	2	14	1	0	\N	0	1	1	student	>20000	\N	\N	16000_20000	\N	communal	rainwater	car	chemist	with_water_and_soap	private_collector	0fab48a8-ec1d-4194-ad68-e1b13cbe9d39	\N
1053	89	Charles Opiyo Apondi	Male	50858375	\N	Seperated	primary	\N	10	tenant	\N	2	0	0	1	0	1	2	0	1	1	0	1	1	0	1	11	0	2	\N	0	0	0	student	0_5000	\N	\N	0_5000	\N	communal	none	bicycle	public	with_water_and_soap	bins	88f26d17-fc11-47c7-90e9-def5a9829cd4	\N
1054	164	Earl Murunga Victor	Male	13176097	\N	Seperated	primary	\N	35	plot_Owner	\N	1	2	2	2	2	0	2	0	2	0	1	2	1	0	1	18	2	2	\N	0	0	0	private	6000_10000	\N	\N	6000_10000	\N	none	river	walk	chemist	water_only	bins	3e47e761-0fa0-42de-a06e-0cf2e28e6e91	\N
1055	175	James Mugo Wasonga	Male	56088263	\N	married	primary	\N	35	plot_Owner	\N	1	1	2	1	2	1	1	0	1	1	1	0	0	1	1	14	2	0	\N	0	1	0	not_applicable	0_5000	\N	\N	16000_20000	\N	flush	vendor	car	mission	none	bins	9d5b3fcf-e554-4132-8d41-e5e2a3464d65	\N
1056	117	Michael Situma Waithira	Male	25915539	\N	Cohabiting	secondary	\N	28	plot_Owner	\N	1	2	2	0	0	0	2	2	2	2	1	1	0	0	1	16	2	0	\N	0	0	0	self	11000_15000	\N	\N	16000_20000	\N	pit_latrine	piped	car	chemist	none	river	fe941d9b-525f-4738-a65e-8b7685369665	\N
1057	150	Christopher Gichuhi Wasike	Male	72421677	\N	Cohabiting	secondary	\N	5	plot_Owner	\N	2	0	1	2	2	0	1	1	2	0	0	2	2	0	0	15	0	2	\N	1	1	1	student	>20000	\N	\N	6000_10000	\N	pit_latrine	none	walk	public	with_water_and_soap	private_collector	242e114d-b716-411b-a14f-9c0d6f5fa5e4	\N
1058	207	Sarah Esinyen Yussuf	Female	16759656	\N	married	university	\N	18	tenant	\N	0	1	0	0	1	2	1	0	1	2	0	1	0	0	0	9	1	2	\N	1	0	0	unemployed	6000_10000	\N	\N	16000_20000	\N	VIP	none	train	traditional	with_water_and_soap	bins	d27f0781-22ea-44d5-8545-22d837bf223f	\N
1059	116	Chelsea Jeruto Kenga	Female	76567584	\N	Cohabiting	primary	\N	7	structure_owner	\N	0	2	1	1	2	1	1	0	1	1	2	0	1	1	2	16	1	0	\N	0	1	1	private	6000_10000	\N	\N	11000_15000	\N	VIP	rainwater	boda	other	none	river	5ff94167-b487-49c1-b31a-48720102a158	\N
1060	130	Cheryl Nelima Galgalo	Female	66738124	\N	Cohabiting	university	\N	5	structure_owner	\N	2	0	0	1	1	0	1	0	1	2	0	2	2	2	1	15	2	1	\N	1	1	1	casual	6000_10000	\N	\N	11000_15000	\N	none	shallow_well	car	public	with_water_and_soap	river	b32610a2-05e6-498a-9fd9-2b3f54145bcd	\N
1061	139	David Karimi Busienei	Male	69247130	\N	Cohabiting	secondary	\N	32	tenant	\N	1	1	0	2	0	2	2	2	2	2	2	2	0	2	0	20	2	2	\N	0	1	0	self	6000_10000	\N	\N	0_5000	\N	pit_latrine	river	matatu	traditional	none	dumpsite	eb006c45-cd0d-4ef9-ad7a-2f9d92297c35	\N
1062	49	James Brian Kaburu	Male	35910252	\N	Single	college	\N	23	tenant	\N	2	2	0	2	0	1	2	2	1	0	2	2	1	0	0	17	1	2	\N	1	1	0	civil_servant	>20000	\N	\N	6000_10000	\N	pit_latrine	vendor	train	traditional	with_water_and_soap	dumpsite	d41399d5-fca9-4cf4-9857-0e752c3b6a00	\N
1063	106	Gregory Saitoti Ndunge	Male	78367752	\N	Seperated	primary	\N	19	tenant	\N	0	1	0	1	2	0	1	1	0	2	1	1	2	0	0	12	1	1	\N	1	1	1	student	11000_15000	\N	\N	>20000	\N	communal	shallow_well	bicycle	other	with_water_and_soap	private_collector	4dfac3db-f1c4-43f5-bdd2-e6cfa2d42f86	\N
1064	80	William Thiong'o Muthomi	Male	09728438	\N	Cohabiting	university	\N	32	tenant	\N	1	2	1	0	1	0	1	0	0	1	0	2	2	0	1	12	0	1	\N	0	1	1	not_applicable	16000_20000	\N	\N	0_5000	\N	none	piped	matatu	other	water_only	bins	197a9238-f8ac-42b8-bbdd-a41205e90d3a	\N
1065	200	Jonathan Sawe Kaburu	Male	82150438	\N	Cohabiting	none	\N	38	tenant	\N	1	2	0	2	0	2	0	0	0	2	1	1	2	0	1	14	2	0	\N	1	0	1	not_applicable	0_5000	\N	\N	6000_10000	\N	VIP	none	bicycle	other	none	bins	865e4b37-8f53-4de0-90a2-0ad39efa35f7	\N
1066	44	Benjamin Kenga Mwakio	Male	34458861	\N	married	none	\N	24	structure_owner	\N	0	1	0	2	0	1	1	2	2	0	1	0	1	0	1	12	1	2	\N	1	0	1	unemployed	>20000	\N	\N	>20000	\N	communal	river	train	mission	water_only	bins	de4f9d09-96fe-4df6-b862-73bb27262405	\N
1067	122	William Richard Krop	Male	24850884	\N	married	primary	\N	18	tenant	\N	2	1	2	1	1	0	2	2	2	1	1	2	0	0	1	18	1	2	\N	0	1	0	casual	16000_20000	\N	\N	0_5000	\N	communal	rainwater	walk	chemist	with_water_and_soap	dumpsite	e04319d3-50dc-42c1-9c38-dc5053df186c	\N
1068	225	Christina Oyoo Jemeli	Female	68944761	\N	married	none	\N	31	structure_owner	\N	1	0	2	2	2	0	1	0	1	0	1	1	1	1	0	13	2	1	\N	1	1	1	not_applicable	6000_10000	\N	\N	>20000	\N	pit_latrine	vendor	walk	chemist	with_water_and_soap	river	f6385350-0ff3-4fbe-8979-c4caab670f12	\N
1069	13	John Kitonga Kiragu	Male	83152319	\N	Seperated	primary	\N	39	structure_owner	\N	0	2	1	1	1	1	0	0	0	2	1	1	1	2	0	13	2	2	\N	0	0	1	private	11000_15000	\N	\N	>20000	\N	communal	shallow_well	matatu	chemist	water_only	river	f90aeef2-ccb5-4c37-8c41-9c2b15375ee8	\N
1070	30	Katherine Mbuvi Kalama	Female	46158077	\N	Seperated	secondary	\N	10	structure_owner	\N	1	2	2	0	1	0	0	1	0	1	1	1	1	0	2	13	1	0	\N	0	1	1	unemployed	0_5000	\N	\N	16000_20000	\N	none	rainwater	boda	chemist	with_water_and_soap	river	2de96279-37a2-4318-a9f4-db822dd7f3a7	\N
1071	190	Mark Ogega Kinyua	Male	57801533	\N	Single	secondary	\N	18	plot_Owner	\N	2	0	2	1	1	2	0	1	0	0	0	1	1	0	2	13	1	2	\N	0	0	1	civil_servant	16000_20000	\N	\N	>20000	\N	flush	rainwater	train	other	none	bins	fb82f71b-5131-4129-bf67-ccca67efb600	\N
1072	184	Larry Nkirote Maiyo	Male	28241150	\N	Single	secondary	\N	40	structure_owner	\N	1	2	0	0	2	2	2	1	1	2	0	2	0	2	0	17	2	0	\N	0	1	0	unemployed	>20000	\N	\N	6000_10000	\N	none	rainwater	walk	traditional	with_water_and_soap	bins	d48cdfda-17cd-4d16-9342-22c1a10684bd	\N
1073	57	Kelly Kwamboka Maingi	Female	40068987	\N	Cohabiting	secondary	\N	37	structure_owner	\N	0	1	1	2	0	0	1	0	1	2	2	0	1	1	2	14	2	2	\N	1	0	1	student	6000_10000	\N	\N	6000_10000	\N	flush	river	train	private	none	bins	517e14fd-22d4-451a-98b3-5e25c45e7ed0	\N
1074	182	Michael Mwero Mutio	Male	73430227	\N	Widowed	primary	\N	6	plot_Owner	\N	0	1	0	1	0	2	0	2	0	1	1	2	2	0	2	14	1	2	\N	0	0	1	student	0_5000	\N	\N	11000_15000	\N	flush	piped	train	traditional	with_water_and_soap	river	40cc2776-4ea1-47b8-88ca-e183311589e9	\N
1075	225	Dalton Wesonga Onyiego	Male	45423939	\N	married	secondary	\N	19	structure_owner	\N	1	1	1	1	0	1	2	2	1	2	0	1	2	0	0	15	0	1	\N	0	1	1	not_applicable	16000_20000	\N	\N	>20000	\N	pit_latrine	none	train	traditional	water_only	private_collector	133531e8-417a-4580-b61d-8d6339574290	\N
1076	216	Jessica Saitoti Baraza	Female	02437170	\N	Seperated	college	\N	30	plot_Owner	\N	2	0	2	1	1	2	0	1	0	2	0	2	0	0	0	13	0	2	\N	0	0	1	private	6000_10000	\N	\N	11000_15000	\N	flush	vendor	car	chemist	with_water_and_soap	dumpsite	2df455a4-6af2-4457-8de3-fbb0c306684b	\N
1077	43	Colleen Muhonja Adam	Female	01049687	\N	Cohabiting	university	\N	9	structure_owner	\N	2	2	1	0	2	2	2	0	1	2	1	0	0	0	1	16	1	2	\N	0	0	0	self	11000_15000	\N	\N	11000_15000	\N	pit_latrine	none	car	mission	with_water_and_soap	private_collector	193ae0ac-668b-4b8e-8fc5-f7ea6a06afe5	\N
1078	191	Amanda Wafula Jepchumba	Female	59459273	\N	married	primary	\N	10	plot_Owner	\N	2	0	2	2	1	0	2	1	2	1	1	0	2	1	1	18	2	2	\N	0	0	1	student	>20000	\N	\N	11000_15000	\N	flush	rainwater	boda	other	with_water_and_soap	private_collector	a2588fe6-f4e5-42ee-a842-8c894796dc66	\N
1079	106	Kevin Wangeci Ekeno	Male	10150749	\N	married	none	\N	13	tenant	\N	0	2	2	1	1	1	0	0	2	2	1	1	0	2	0	15	0	1	\N	0	0	1	civil_servant	>20000	\N	\N	0_5000	\N	pit_latrine	piped	train	private	water_only	bins	7ef4b533-60a3-4bbd-874c-6a93edd926d4	\N
1080	86	Robert Nyabuto Wabomba	Male	12729891	\N	married	none	\N	14	structure_owner	\N	1	1	0	2	1	1	1	0	0	2	2	2	0	1	1	15	1	2	\N	1	1	0	unemployed	>20000	\N	\N	>20000	\N	VIP	vendor	matatu	traditional	with_water_and_soap	private_collector	9832f598-739b-4c4b-a68e-8016a18aec59	\N
1081	82	Sandra Bii Abdallah	Female	18484868	\N	Single	college	\N	10	structure_owner	\N	1	1	0	1	1	2	0	2	2	2	2	1	2	2	0	19	2	0	\N	1	1	1	casual	0_5000	\N	\N	>20000	\N	pit_latrine	shallow_well	matatu	mission	water_only	bins	ddfa1d63-a530-45b3-b421-d80d483e1e1c	\N
1082	81	Joel Chepkorir Mwema	Male	23776193	\N	married	secondary	\N	37	structure_owner	\N	0	2	0	2	0	2	1	1	1	1	2	2	2	2	0	18	0	1	\N	0	0	0	casual	11000_15000	\N	\N	11000_15000	\N	flush	rainwater	walk	chemist	none	dumpsite	a9048d6f-4678-454d-a759-e7c4338e63ba	\N
1083	169	Travis Mutua Kasyoka	Male	62224138	\N	Cohabiting	none	\N	0	plot_Owner	\N	0	1	2	2	1	0	0	2	1	0	0	2	2	1	0	14	0	0	\N	1	0	1	private	>20000	\N	\N	6000_10000	\N	none	vendor	car	chemist	with_water_and_soap	dumpsite	31cf8cc7-0f6d-41fe-bb45-30e5f7e8f1c7	\N
1084	45	Jacob Kimeli Nyakio	Male	08386748	\N	Cohabiting	primary	\N	8	structure_owner	\N	1	1	2	2	1	2	2	2	0	0	0	0	2	0	1	16	0	1	\N	0	1	0	not_applicable	>20000	\N	\N	6000_10000	\N	none	river	train	other	none	bins	bb9f433e-b3bd-4d60-afe0-8e8a65cd7c48	\N
1085	71	Michelle Ibrahim Muli	Female	78018179	\N	Widowed	university	\N	40	structure_owner	\N	2	2	2	2	1	1	1	1	0	1	0	0	1	1	2	17	1	2	\N	1	1	1	civil_servant	16000_20000	\N	\N	11000_15000	\N	VIP	vendor	matatu	chemist	water_only	private_collector	a3ff4551-da67-4033-ad8f-3e6337af1ef6	\N
1086	195	Bradley Kagwiria Apiyo	Male	31547399	\N	married	none	\N	5	plot_Owner	\N	0	1	0	0	2	2	2	1	0	0	1	2	2	0	2	15	0	2	\N	1	0	1	unemployed	0_5000	\N	\N	11000_15000	\N	pit_latrine	river	car	private	none	private_collector	36360ff0-c556-4841-81bd-5c3691b0cab5	\N
1087	94	Sonia Mutua Ochieng	Female	05922057	\N	married	none	\N	4	structure_owner	\N	2	1	1	1	0	0	2	1	2	1	1	0	2	0	2	16	0	1	\N	0	0	0	student	16000_20000	\N	\N	6000_10000	\N	communal	vendor	matatu	chemist	none	dumpsite	0b3643e8-bc18-4206-b147-d4c4be1baf95	\N
1088	50	Karina Muthee Makungu	Female	56013269	\N	Seperated	university	\N	20	structure_owner	\N	2	2	0	1	0	1	2	0	2	0	0	0	1	1	1	13	2	1	\N	0	1	1	not_applicable	11000_15000	\N	\N	6000_10000	\N	pit_latrine	vendor	car	traditional	with_water_and_soap	private_collector	a73bfc1f-8cd8-4d4d-b979-169b5cdd7f7a	\N
1089	69	Kathryn Nzau Chege	Female	88020529	\N	married	university	\N	27	plot_Owner	\N	2	2	2	2	0	0	2	0	0	1	1	1	0	1	2	16	2	1	\N	1	1	0	student	11000_15000	\N	\N	0_5000	\N	communal	piped	train	mission	none	dumpsite	64feb3c8-cf7e-4676-a845-5a4e714acb4b	\N
1090	29	Dan Okello Musimbi	Male	08695687	\N	Cohabiting	university	\N	7	plot_Owner	\N	1	2	1	1	1	2	2	2	0	0	1	1	2	2	1	19	1	1	\N	0	1	1	not_applicable	11000_15000	\N	\N	>20000	\N	none	vendor	boda	chemist	water_only	dumpsite	fc137bc1-755e-46d9-98f3-33e5dec7ecfc	\N
1091	112	David Jepleting Fundi	Male	35849666	\N	Single	university	\N	19	plot_Owner	\N	1	0	2	2	0	2	2	1	2	0	2	1	1	0	1	17	2	2	\N	0	1	0	private	11000_15000	\N	\N	11000_15000	\N	pit_latrine	vendor	car	public	none	dumpsite	f27b9c96-3f5a-4658-bd86-b175e2a7ac82	\N
1092	195	Tracy Nyokabi Muya	Female	70956994	\N	Widowed	university	\N	5	tenant	\N	2	1	1	0	2	2	1	2	1	1	0	0	1	1	1	16	1	1	\N	0	1	0	casual	0_5000	\N	\N	>20000	\N	none	vendor	bicycle	chemist	none	private_collector	8dbe220f-ec7c-46e6-9591-115df9af1be0	\N
1093	228	Ashley Nyabuto Jumba	Female	23870930	\N	Widowed	college	\N	1	structure_owner	\N	0	2	0	2	0	2	1	2	0	0	0	2	2	2	2	17	1	2	\N	1	1	1	self	0_5000	\N	\N	11000_15000	\N	none	none	bicycle	chemist	with_water_and_soap	private_collector	2547d697-08be-4365-a79e-fb4f3cfe58b4	\N
1094	219	Madison Yatich Masila	Female	01428577	\N	Single	secondary	\N	37	plot_Owner	\N	2	1	0	0	2	2	2	0	0	0	1	0	2	1	2	15	0	0	\N	1	1	1	self	16000_20000	\N	\N	6000_10000	\N	flush	shallow_well	car	chemist	with_water_and_soap	bins	9f173427-7cca-4a8e-a993-9cfd3f31e350	\N
1095	88	Bryan Kang'ethe Ombati	Male	10544463	\N	Single	primary	\N	32	tenant	\N	0	0	1	2	0	0	0	1	1	2	0	1	0	2	2	12	0	2	\N	1	0	1	not_applicable	6000_10000	\N	\N	11000_15000	\N	pit_latrine	vendor	walk	public	water_only	dumpsite	3da829ec-71ad-45d5-8e40-42f0a7913e07	\N
1096	83	Marc Musa Wechuli	Male	13198681	\N	Widowed	none	\N	27	structure_owner	\N	0	2	0	1	2	1	2	1	0	0	0	1	2	0	1	13	2	2	\N	0	0	0	unemployed	>20000	\N	\N	>20000	\N	flush	none	walk	traditional	with_water_and_soap	bins	eaa76dfb-5d0f-44a6-9a38-29c8461e4cf4	\N
1097	141	Scott Muendo Mutunga	Male	77698818	\N	Single	primary	\N	8	plot_Owner	\N	2	0	0	1	2	2	0	1	1	0	1	1	1	1	1	14	1	2	\N	0	0	0	civil_servant	0_5000	\N	\N	16000_20000	\N	none	shallow_well	train	chemist	none	dumpsite	66be6c65-4393-4c62-918a-999e81248bcb	\N
1098	76	Ryan Rono Gachoki	Male	49631385	\N	Single	primary	\N	4	plot_Owner	\N	1	1	0	2	2	0	1	1	2	1	0	0	1	2	2	16	0	0	\N	0	1	1	self	6000_10000	\N	\N	6000_10000	\N	communal	vendor	matatu	chemist	with_water_and_soap	private_collector	f26faa0f-99b4-4b11-b37c-98a09344ca4f	\N
1099	160	Ronald Macharia Ngui	Male	11493604	\N	married	primary	\N	16	plot_Owner	\N	1	0	0	0	2	0	0	0	1	0	1	2	2	1	2	12	1	2	\N	1	0	0	civil_servant	0_5000	\N	\N	6000_10000	\N	VIP	shallow_well	train	chemist	water_only	private_collector	e49cac72-0562-48be-82b7-05e29eb84e93	\N
1100	120	Natalie Muriungi Kanana	Female	86344425	\N	Widowed	university	\N	38	plot_Owner	\N	0	0	1	1	0	1	1	1	2	1	1	2	1	2	1	15	0	0	\N	1	1	0	civil_servant	>20000	\N	\N	>20000	\N	VIP	none	bicycle	other	none	dumpsite	3474d6eb-f9c0-4901-9aaf-3e7ed56d3a06	\N
1101	182	Tyler Okinyi Ratemo	Male	66237052	\N	Cohabiting	college	\N	17	plot_Owner	\N	1	1	2	0	1	0	0	0	0	2	1	1	2	2	0	13	1	0	\N	1	1	1	unemployed	0_5000	\N	\N	6000_10000	\N	VIP	shallow_well	walk	private	with_water_and_soap	river	794f34d4-23d6-4407-a3fb-06860c630ab7	\N
1102	167	Jenna Osiemo Mukhwana	Female	61680247	\N	Single	college	\N	37	tenant	\N	2	1	1	1	0	2	0	2	0	1	2	1	0	0	2	15	2	0	\N	0	1	0	self	16000_20000	\N	\N	6000_10000	\N	none	river	bicycle	mission	water_only	bins	80fd8da6-1009-4bb8-a56f-c1e7e0c5d00e	\N
1103	141	Tamara Lewa Thoya	Female	27767158	\N	married	college	\N	31	structure_owner	\N	2	0	2	0	2	0	2	2	0	0	0	2	2	1	0	15	1	2	\N	1	1	0	unemployed	0_5000	\N	\N	6000_10000	\N	communal	river	walk	other	water_only	dumpsite	f11d9f51-c6df-4168-914e-6fc3f28823a1	\N
1104	83	Marie Maroa Francis	Female	24365997	\N	Cohabiting	none	\N	1	structure_owner	\N	0	0	0	1	2	1	2	1	1	2	0	1	1	0	2	14	0	2	\N	0	1	0	unemployed	6000_10000	\N	\N	>20000	\N	flush	none	bicycle	private	none	bins	8def984e-322f-487e-9415-25030025b815	\N
1105	174	Julie Isaac Evans	Female	73320919	\N	Single	none	\N	39	tenant	\N	0	2	0	0	1	1	2	0	2	0	0	2	1	1	2	14	1	0	\N	0	0	1	casual	16000_20000	\N	\N	16000_20000	\N	pit_latrine	river	car	public	none	river	45badbe8-2f5b-4c52-a177-41ba03d50c7e	\N
1106	210	Brenda Wanjau Chemutai	Female	82889291	\N	Cohabiting	secondary	\N	17	structure_owner	\N	1	0	2	0	2	0	2	1	1	0	2	2	2	0	0	15	2	2	\N	0	1	0	casual	11000_15000	\N	\N	16000_20000	\N	communal	rainwater	matatu	mission	none	private_collector	029aa22e-9043-4d1a-adf4-bb45f6ff0dbc	\N
1107	99	Kristen Makau Dennis	Female	39823810	\N	married	primary	\N	3	tenant	\N	0	0	0	1	0	1	2	2	2	0	0	1	1	1	2	13	2	0	\N	0	1	0	casual	6000_10000	\N	\N	0_5000	\N	pit_latrine	river	matatu	private	none	dumpsite	6baa59d7-9a2f-4e60-b74a-256ad545473d	\N
1108	167	Cynthia Aden Abdulla	Female	10044105	\N	Seperated	secondary	\N	22	plot_Owner	\N	1	0	1	2	1	0	1	1	1	1	0	1	2	1	1	14	2	0	\N	1	1	0	not_applicable	11000_15000	\N	\N	>20000	\N	pit_latrine	river	walk	traditional	none	private_collector	d878f660-d258-4042-a6ff-ae9bcf219f67	\N
1109	219	Brittany Omar Ngure	Female	61237333	\N	Single	primary	\N	36	tenant	\N	0	1	2	1	2	1	1	2	2	1	2	1	2	1	1	20	0	0	\N	1	1	0	not_applicable	6000_10000	\N	\N	11000_15000	\N	VIP	shallow_well	matatu	mission	water_only	river	9daf8e65-2236-4f87-b89c-6f12aebb93f4	\N
1110	183	Savannah Kiogora Okongo	Female	85766039	\N	Widowed	none	\N	39	plot_Owner	\N	1	0	0	0	1	2	0	1	2	0	1	0	2	1	0	11	2	0	\N	0	1	0	not_applicable	0_5000	\N	\N	16000_20000	\N	VIP	piped	train	private	none	bins	99618696-212a-45c2-9c1a-26286436ef0b	\N
1111	106	Shawn Chesang Morara	Male	44753255	\N	Seperated	none	\N	10	plot_Owner	\N	0	0	0	0	0	0	2	2	2	0	1	2	0	0	1	10	0	0	\N	0	1	1	casual	16000_20000	\N	\N	11000_15000	\N	flush	shallow_well	matatu	mission	water_only	bins	17d10516-4324-4d03-828a-6ea8c8ceeaaf	\N
1112	158	Margaret Chumo Michael	Female	80904236	\N	Single	college	\N	33	plot_Owner	\N	2	2	0	0	1	1	0	0	2	0	1	0	0	1	2	12	0	1	\N	0	1	1	casual	11000_15000	\N	\N	16000_20000	\N	none	rainwater	boda	private	with_water_and_soap	river	af2a5721-4157-43e7-9c89-bd9a4f585fc5	\N
1113	224	Ronald Ndiritu Mayaka	Male	70380748	\N	Single	none	\N	7	structure_owner	\N	2	2	2	2	1	0	2	0	1	0	0	1	2	0	1	16	1	0	\N	0	0	0	not_applicable	11000_15000	\N	\N	6000_10000	\N	communal	vendor	car	traditional	water_only	private_collector	56ba2f5b-e851-484a-83c0-70d941dc7903	\N
1114	79	Barbara Mbugua Bahati	Female	19694017	\N	Seperated	secondary	\N	35	plot_Owner	\N	0	0	2	2	1	1	0	2	0	2	1	2	1	0	2	16	2	2	\N	1	1	0	not_applicable	11000_15000	\N	\N	16000_20000	\N	none	piped	car	other	none	river	e20d2a9b-eaa7-4d81-9388-0cfa75303594	\N
1115	47	George Ratemo Nyaguthii	Male	76742436	\N	Seperated	primary	\N	1	tenant	\N	2	1	0	1	0	0	2	1	2	0	1	1	2	1	0	14	2	0	\N	1	0	0	private	0_5000	\N	\N	6000_10000	\N	communal	none	boda	mission	water_only	dumpsite	8037c799-e146-4178-8e73-10164cdf9f63	\N
1116	15	Karen Ngei Jackson	Female	69044814	\N	Seperated	university	\N	32	tenant	\N	1	0	1	0	1	1	0	0	2	1	2	1	0	0	2	12	1	0	\N	0	0	0	unemployed	11000_15000	\N	\N	>20000	\N	VIP	piped	boda	other	none	private_collector	89dfc62a-6069-4827-a3d3-642c0c63823e	\N
1117	185	Rebecca Munyao Jarso	Female	84118389	\N	Single	primary	\N	10	tenant	\N	1	1	2	0	0	1	1	0	2	2	0	0	2	2	1	15	2	0	\N	0	0	0	self	16000_20000	\N	\N	6000_10000	\N	VIP	piped	bicycle	other	with_water_and_soap	dumpsite	4f086068-5224-43ae-b2f8-7055a76a3fc1	\N
1118	70	William Mutiso Oloo	Male	34469744	\N	Cohabiting	college	\N	24	plot_Owner	\N	1	1	0	1	1	2	2	1	2	2	0	1	1	2	2	19	2	0	\N	0	1	0	civil_servant	>20000	\N	\N	0_5000	\N	pit_latrine	vendor	bicycle	mission	with_water_and_soap	dumpsite	bf197c4c-7911-4f91-ad6e-837c350d15d4	\N
1119	77	Tasha Gikonyo Jepkirui	Female	01302974	\N	Single	university	\N	12	plot_Owner	\N	0	0	2	1	1	0	0	0	1	2	0	2	2	0	2	13	1	2	\N	1	1	1	casual	11000_15000	\N	\N	0_5000	\N	flush	shallow_well	walk	chemist	none	river	90cad9a7-8afa-4f7e-93ef-e75b247aa633	\N
1120	211	Leslie Mureithi Duba	Female	64815395	\N	Seperated	college	\N	40	structure_owner	\N	0	2	2	2	0	0	1	2	2	2	0	1	2	0	1	17	2	2	\N	1	0	0	casual	11000_15000	\N	\N	6000_10000	\N	communal	rainwater	train	traditional	none	river	4530aaf1-1654-447a-8056-cc466da7b2a0	\N
1121	126	Eric Wambura Cheptoo	Male	56974208	\N	Single	university	\N	21	structure_owner	\N	0	2	2	1	0	2	0	0	2	2	1	1	1	0	0	14	0	1	\N	0	0	1	student	>20000	\N	\N	>20000	\N	VIP	piped	boda	mission	water_only	river	5f55b074-3784-451d-afdb-b35d7bdd2609	\N
1122	71	Brittany Chepkoech Kadenge	Female	84425344	\N	Widowed	none	\N	27	structure_owner	\N	1	1	2	2	2	2	0	0	0	1	0	2	0	2	0	15	2	0	\N	0	0	0	private	16000_20000	\N	\N	0_5000	\N	flush	piped	boda	traditional	water_only	river	92220b8c-6801-49d1-a2d8-ca848127aa5f	\N
1123	137	Brandi Benjamin Nzau	Female	27764282	\N	married	primary	\N	39	tenant	\N	0	2	2	2	1	2	0	2	1	0	2	1	1	0	2	18	1	0	\N	1	0	0	not_applicable	6000_10000	\N	\N	>20000	\N	communal	none	boda	chemist	with_water_and_soap	dumpsite	fd0663a7-e272-4b4d-9d12-607fbdbbe540	\N
1124	174	Rachel Kaari Oyaro	Female	45581396	\N	married	university	\N	30	plot_Owner	\N	0	2	2	0	0	2	2	2	1	1	2	1	0	0	2	17	0	2	\N	1	1	0	private	6000_10000	\N	\N	>20000	\N	flush	rainwater	boda	private	with_water_and_soap	bins	d63aed6b-4dc5-4b90-8154-b6f85ee5d6c4	\N
1125	117	Theresa Rono Ibrahim	Female	81027984	\N	married	university	\N	11	tenant	\N	0	2	0	1	2	1	0	2	2	0	2	0	1	1	1	15	1	2	\N	0	0	1	civil_servant	>20000	\N	\N	0_5000	\N	VIP	rainwater	bicycle	public	none	dumpsite	e566a0cf-8e50-4e8f-8c6a-84c08aefed4b	\N
1126	20	Cassandra Karani Ndungu	Female	09093887	\N	Widowed	university	\N	16	tenant	\N	0	1	0	1	0	1	1	0	1	1	2	1	2	1	2	14	2	1	\N	1	1	0	not_applicable	11000_15000	\N	\N	>20000	\N	pit_latrine	vendor	walk	mission	water_only	bins	328cd665-14a5-473f-8697-c42d8931fd11	\N
1127	71	Angela Muigai Makori	Female	30643884	\N	Seperated	none	\N	37	tenant	\N	2	1	2	0	0	1	0	2	2	1	2	2	1	1	1	18	1	0	\N	1	1	1	casual	16000_20000	\N	\N	>20000	\N	communal	piped	bicycle	public	water_only	private_collector	8b290f95-1e3f-460c-84ef-d0b0b781076c	\N
1128	58	Jeremy Nasimiyu Kipngeno	Male	23896011	\N	Seperated	secondary	\N	17	tenant	\N	0	1	2	1	2	0	2	0	1	2	0	1	1	1	1	15	0	1	\N	1	0	0	not_applicable	>20000	\N	\N	6000_10000	\N	VIP	shallow_well	bicycle	traditional	none	dumpsite	bcec53bf-80ec-4632-8479-472f30f92128	\N
1129	167	Traci Mumba Galgalo	Female	74895919	\N	Cohabiting	college	\N	16	structure_owner	\N	0	0	2	0	0	0	2	1	0	1	2	1	1	1	0	11	0	2	\N	0	1	1	private	>20000	\N	\N	16000_20000	\N	pit_latrine	vendor	car	chemist	with_water_and_soap	dumpsite	473c8edd-d8c8-470c-a5d1-6bfa5687d55f	\N
1130	56	Gregory Mwakio Ndiritu	Male	89245274	\N	Seperated	none	\N	18	plot_Owner	\N	1	1	1	0	0	0	1	2	0	1	0	2	1	0	2	12	1	0	\N	0	1	0	not_applicable	>20000	\N	\N	6000_10000	\N	flush	shallow_well	boda	private	none	river	311599a6-40af-4d89-8f48-153e148e79c3	\N
1131	53	Courtney Muraguri Chemtai	Female	16347845	\N	Seperated	college	\N	39	tenant	\N	2	0	2	1	2	1	0	2	2	2	0	2	1	2	2	21	0	1	\N	0	1	0	civil_servant	6000_10000	\N	\N	16000_20000	\N	pit_latrine	rainwater	train	chemist	with_water_and_soap	private_collector	777ff834-3911-43cb-b5fc-b1356f6b8f50	\N
1132	54	Joshua Ogada Biwott	Male	59896309	\N	Seperated	college	\N	4	tenant	\N	2	0	1	1	1	2	1	1	0	1	2	1	0	0	1	14	0	2	\N	0	1	1	not_applicable	0_5000	\N	\N	6000_10000	\N	communal	shallow_well	walk	public	none	river	7b74da17-7b02-47a7-96aa-f3fd6e25e39b	\N
1133	14	Tracey Victor Okongo	Female	26104407	\N	Widowed	none	\N	12	structure_owner	\N	2	1	1	0	2	2	2	1	0	2	2	2	2	2	0	21	1	0	\N	1	0	0	unemployed	>20000	\N	\N	>20000	\N	VIP	piped	walk	public	with_water_and_soap	bins	1e0ba44f-6a38-4a5a-911e-53c490776c58	\N
1134	28	Phillip Murungi Aoko	Male	36131889	\N	Seperated	secondary	\N	21	structure_owner	\N	2	2	0	0	0	1	0	1	2	2	2	0	1	1	0	14	2	1	\N	0	1	0	private	11000_15000	\N	\N	0_5000	\N	none	rainwater	matatu	traditional	water_only	private_collector	83aa84d5-6d2f-4d12-9edc-8aef585f8867	\N
1135	235	Joseph Emuria Ng'ang'a	Male	39751528	\N	Single	none	\N	26	plot_Owner	\N	2	2	0	0	0	2	2	1	1	2	1	1	0	2	0	16	2	2	\N	0	0	1	civil_servant	16000_20000	\N	\N	0_5000	\N	none	river	bicycle	traditional	with_water_and_soap	river	a368b6dc-538e-488c-8feb-3d6307e11157	\N
1136	109	Danielle Ouko Mutunga	Female	76328102	\N	married	none	\N	20	plot_Owner	\N	0	2	0	0	1	0	2	0	0	2	1	1	1	2	0	12	0	1	\N	0	1	1	unemployed	>20000	\N	\N	16000_20000	\N	pit_latrine	none	walk	traditional	with_water_and_soap	dumpsite	f4f90496-b2e2-4231-983a-ff20ba0a958f	\N
1137	6	Christie Adow Gathoni	Female	57011977	\N	Cohabiting	college	\N	32	plot_Owner	\N	1	0	0	0	0	1	1	2	0	1	1	2	1	0	2	12	1	1	\N	1	0	1	self	>20000	\N	\N	6000_10000	\N	VIP	river	walk	chemist	none	bins	08318d01-81ab-4de3-86ac-aa084967e3f5	\N
1138	108	Jennifer Muange Gatwiri	Female	64130334	\N	married	secondary	\N	11	tenant	\N	2	0	0	0	1	1	1	0	2	2	1	0	0	0	2	12	1	1	\N	0	0	1	civil_servant	16000_20000	\N	\N	11000_15000	\N	pit_latrine	shallow_well	train	private	with_water_and_soap	river	00e7a4c5-b9b7-4c8a-997d-edf4af14d42c	\N
1139	208	Kristen Adhiambo Mundia	Female	89597963	\N	Single	secondary	\N	38	plot_Owner	\N	1	2	1	1	0	1	0	2	2	1	1	0	2	2	2	18	2	1	\N	0	1	0	casual	>20000	\N	\N	6000_10000	\N	none	vendor	walk	mission	water_only	bins	56ff1e5a-61ec-42f2-97bb-f5992d3c6531	\N
1140	231	Ruben Mwendwa Ngunjiri	Male	26505006	\N	Single	primary	\N	17	structure_owner	\N	2	1	0	0	2	2	1	1	1	1	0	2	0	2	1	16	0	2	\N	1	1	0	not_applicable	>20000	\N	\N	11000_15000	\N	flush	river	walk	public	with_water_and_soap	bins	5bf3fe9a-692c-452b-a26e-a37dddcc40eb	\N
1141	21	Laurie Soi Gona	Female	76239021	\N	Single	none	\N	7	tenant	\N	2	0	0	1	0	2	1	1	0	1	1	1	1	1	0	12	0	0	\N	1	0	1	civil_servant	16000_20000	\N	\N	0_5000	\N	communal	river	matatu	chemist	with_water_and_soap	river	393cf971-86c0-41ef-bb20-8c84df9cde1c	\N
1142	83	Bryan Aloo Murugi	Male	81739456	\N	Widowed	secondary	\N	36	plot_Owner	\N	2	1	0	1	2	1	0	0	0	2	0	0	0	1	2	12	2	2	\N	0	0	0	unemployed	>20000	\N	\N	11000_15000	\N	flush	river	bicycle	private	with_water_and_soap	dumpsite	95d10c58-f381-4a37-a7af-d9f1d90bdbd2	\N
1143	200	Jeffrey Bonaya Edin	Male	03001785	\N	Single	university	\N	23	structure_owner	\N	2	0	0	2	2	0	1	0	2	2	2	1	1	1	0	16	1	2	\N	0	1	1	private	>20000	\N	\N	>20000	\N	flush	rainwater	bicycle	other	water_only	dumpsite	d73420e3-e8da-41c3-8987-1640d7fb9f43	\N
1144	105	Crystal Oyoo Victor	Female	66512185	\N	Widowed	college	\N	33	structure_owner	\N	1	1	2	1	2	1	2	1	2	0	1	0	0	0	1	15	0	1	\N	1	0	0	civil_servant	6000_10000	\N	\N	>20000	\N	VIP	piped	car	chemist	water_only	river	aada0dd3-a305-4a0c-8a13-b7d139f9eb2a	\N
1145	25	Michael Mbogo Mzungu	Male	34019254	\N	Widowed	university	\N	13	structure_owner	\N	2	1	1	0	2	1	1	2	2	0	2	2	2	1	1	20	1	0	\N	0	1	1	unemployed	6000_10000	\N	\N	>20000	\N	none	rainwater	boda	other	water_only	dumpsite	7e26ba66-ed32-48c8-9646-7f4e5b8df9bf	\N
1146	78	Leslie Kimosop Jerono	Female	75181020	\N	Seperated	none	\N	23	plot_Owner	\N	2	2	2	2	1	1	2	2	0	0	2	2	0	0	1	19	1	0	\N	1	0	0	private	11000_15000	\N	\N	11000_15000	\N	flush	shallow_well	matatu	traditional	with_water_and_soap	river	d7c2975a-4921-463d-a2cd-606cb7d0b8f5	\N
1147	147	Bryan Wangare Okumu	Male	72006501	\N	Single	college	\N	22	plot_Owner	\N	0	1	1	0	2	2	2	2	1	1	0	2	1	2	0	17	1	0	\N	0	0	1	casual	16000_20000	\N	\N	0_5000	\N	flush	none	matatu	public	none	private_collector	a9f49878-a96c-4207-bb95-83d0be8ecd9b	\N
1148	96	Steve Muturi Mutemi	Male	89205344	\N	married	secondary	\N	14	tenant	\N	0	2	2	1	2	0	2	0	2	0	0	0	1	2	2	16	2	0	\N	0	0	0	unemployed	11000_15000	\N	\N	>20000	\N	pit_latrine	rainwater	matatu	other	with_water_and_soap	dumpsite	325ce32d-cc67-4d0e-ba1b-d8f1feb352c5	\N
1149	155	Charles Joel Mwendia	Male	86337218	\N	Cohabiting	college	\N	23	tenant	\N	0	0	1	1	2	0	1	1	1	1	2	2	1	0	0	13	0	2	\N	1	1	0	unemployed	>20000	\N	\N	11000_15000	\N	VIP	none	matatu	public	water_only	private_collector	cef75cd6-a2a3-4bc0-9e58-8c5e6e7d93ce	\N
1150	231	Angel Ojwang Mahamud	Male	16925233	\N	married	university	\N	12	tenant	\N	2	2	2	0	2	1	0	0	2	0	1	1	2	1	1	17	1	0	\N	0	0	0	casual	16000_20000	\N	\N	16000_20000	\N	communal	none	car	private	water_only	private_collector	207637d9-d2eb-4d99-b5e8-db663ea6c32b	\N
1151	125	Franklin Chumo Ngugi	Male	15272466	\N	Single	primary	\N	12	structure_owner	\N	2	2	1	2	2	1	0	2	0	0	0	0	0	2	2	16	0	0	\N	1	0	0	casual	0_5000	\N	\N	16000_20000	\N	flush	none	boda	traditional	none	private_collector	1e72e643-00f0-4599-ba80-c7d6bab9bdff	\N
1152	153	Kathryn Kiptoo Abdifatah	Female	56215873	\N	Seperated	primary	\N	39	plot_Owner	\N	2	0	0	1	0	1	0	0	2	1	2	1	2	1	1	14	1	1	\N	1	0	0	student	0_5000	\N	\N	11000_15000	\N	flush	river	car	private	none	private_collector	ebe4538a-dae8-47f6-a77f-13e60c310e74	\N
1153	110	Eric Chepkirui Wanjiru	Male	84967450	\N	Seperated	none	\N	22	plot_Owner	\N	2	1	1	0	0	0	0	0	1	1	0	0	2	2	2	12	0	0	\N	0	0	1	civil_servant	6000_10000	\N	\N	>20000	\N	flush	river	train	traditional	water_only	private_collector	e5770b49-93c2-4782-a86c-19e435e0bc9b	\N
1155	34	David Wangare Muteti	Male	08774791	\N	Single	primary	\N	3	plot_Owner	\N	1	2	1	0	0	1	0	1	2	1	2	2	2	1	2	18	2	1	\N	1	1	0	student	0_5000	\N	\N	6000_10000	\N	none	rainwater	walk	other	water_only	bins	83bc97fc-98a8-4f1d-a5ee-1d7613c20377	\N
1156	232	Melissa Koome Lewa	Female	13199773	\N	Cohabiting	none	\N	17	plot_Owner	\N	2	0	0	1	1	0	1	2	2	1	2	0	1	1	0	14	0	0	\N	0	0	1	not_applicable	11000_15000	\N	\N	16000_20000	\N	pit_latrine	vendor	bicycle	other	none	river	2b57e4b1-2dd9-4827-b64f-f0ccbb3dc988	\N
1157	101	Brian Muinde Nyongesa	Male	85957965	\N	married	secondary	\N	20	structure_owner	\N	0	0	2	1	2	1	1	0	2	2	0	0	0	1	2	14	1	1	\N	1	1	0	self	11000_15000	\N	\N	0_5000	\N	pit_latrine	river	boda	mission	with_water_and_soap	river	adb56dc6-cd4b-4a26-be2a-429b722f3382	\N
1158	208	David Mutheu Wachira	Male	53182096	\N	Widowed	college	\N	15	plot_Owner	\N	0	0	0	2	1	2	0	1	2	0	0	1	1	0	2	12	0	2	\N	0	0	0	student	16000_20000	\N	\N	>20000	\N	none	rainwater	car	traditional	none	private_collector	72d5a325-0e38-4d2b-8e8c-d816a13fe4a4	\N
1159	237	Stephanie Wangeci Oluoch	Female	41755492	\N	Widowed	college	\N	38	tenant	\N	0	1	2	0	2	0	2	0	0	0	0	1	1	2	1	12	1	0	\N	1	1	1	civil_servant	11000_15000	\N	\N	6000_10000	\N	communal	none	bicycle	mission	with_water_and_soap	private_collector	9aa86125-ff61-4606-960f-7475d6c75d7d	\N
1160	144	Lauren Omari Waithera	Female	29634380	\N	Cohabiting	university	\N	27	tenant	\N	0	2	1	2	2	0	1	0	0	0	0	2	2	1	1	14	1	2	\N	0	1	1	casual	11000_15000	\N	\N	16000_20000	\N	VIP	shallow_well	matatu	private	none	bins	f2c7a7b3-981f-450e-a678-9af4de22aed5	\N
1161	54	Robert Jefwa Jeruto	Male	47770121	\N	Cohabiting	college	\N	16	plot_Owner	\N	0	0	2	2	2	1	0	1	1	2	0	0	0	0	2	13	1	1	\N	1	0	0	not_applicable	11000_15000	\N	\N	6000_10000	\N	communal	vendor	train	mission	with_water_and_soap	private_collector	e8a7a392-5958-4dc0-8ba2-68f272398979	\N
1162	81	Mark Kinya Barasa	Male	88654356	\N	Widowed	primary	\N	37	tenant	\N	2	2	2	2	1	1	2	0	2	2	2	0	0	2	2	22	1	1	\N	1	0	1	self	11000_15000	\N	\N	>20000	\N	communal	none	car	public	water_only	private_collector	6ffa2e75-9894-44f9-99c4-4a189daa0b3e	\N
1163	158	Lisa Naliaka Suleiman	Female	03525053	\N	Widowed	secondary	\N	26	tenant	\N	2	2	0	2	1	1	0	1	0	2	0	0	1	2	1	15	2	1	\N	0	1	1	not_applicable	16000_20000	\N	\N	16000_20000	\N	flush	shallow_well	walk	chemist	water_only	river	f52e0edd-5085-4ff1-a580-c10d8cbc7376	\N
1164	156	Frederick Wangai Nzisa	Male	39772254	\N	Single	college	\N	13	structure_owner	\N	1	0	2	1	2	1	2	0	0	1	2	2	2	0	2	18	2	1	\N	0	1	0	student	16000_20000	\N	\N	11000_15000	\N	VIP	river	car	traditional	none	bins	c1e867d0-13a6-4922-a0bf-0a71d735ef88	\N
1165	11	Sandra Bundi Wanyama	Female	82272723	\N	Seperated	primary	\N	29	plot_Owner	\N	0	0	2	1	1	1	2	0	2	2	0	2	0	0	1	14	1	2	\N	1	1	0	civil_servant	11000_15000	\N	\N	16000_20000	\N	none	shallow_well	boda	private	with_water_and_soap	private_collector	c8ee532f-00a6-4052-bec8-04139bc7db04	\N
1166	159	Jennifer Jepkogei Erupe	Female	55809294	\N	Single	primary	\N	12	structure_owner	\N	1	1	1	0	0	1	0	2	1	0	0	0	0	1	1	9	1	2	\N	1	1	0	civil_servant	0_5000	\N	\N	16000_20000	\N	communal	river	walk	public	none	river	794d3388-de15-4a3c-9ac7-5ae1f48c63b2	\N
1167	56	Phillip Bare Kairu	Male	20679967	\N	Cohabiting	none	\N	7	structure_owner	\N	2	0	2	1	0	2	0	1	0	1	0	0	1	1	0	11	1	1	\N	1	0	0	self	16000_20000	\N	\N	6000_10000	\N	none	rainwater	boda	chemist	with_water_and_soap	private_collector	72de3ce3-eab7-472d-a49c-4abc6e8a68b2	\N
1168	111	Tiffany Mwangangi Theuri	Female	33006661	\N	Single	university	\N	23	structure_owner	\N	0	2	1	2	2	2	1	1	2	0	2	1	0	0	2	18	2	1	\N	1	1	1	civil_servant	>20000	\N	\N	16000_20000	\N	none	piped	car	traditional	water_only	dumpsite	e9460580-5c5d-4186-8fe0-afcb8dc338ef	\N
1169	137	Theresa Wakio Chelimo	Female	33952965	\N	Widowed	none	\N	16	tenant	\N	2	2	0	0	0	0	2	2	2	2	0	2	0	1	0	15	0	2	\N	1	1	0	self	6000_10000	\N	\N	16000_20000	\N	none	rainwater	boda	chemist	with_water_and_soap	private_collector	2be75487-2575-4227-8283-811f39f6b054	\N
1170	220	Diana Mugendi Jimale	Female	06165726	\N	Cohabiting	college	\N	22	plot_Owner	\N	0	0	0	1	1	0	2	2	0	0	1	0	2	2	0	11	1	0	\N	1	1	0	unemployed	11000_15000	\N	\N	>20000	\N	communal	none	car	chemist	with_water_and_soap	river	a1afdf83-b087-4c9b-b959-fa9d380454c1	\N
1171	105	John Wambugu Okelo	Male	18461847	\N	Seperated	primary	\N	2	plot_Owner	\N	2	1	0	1	0	1	0	1	1	0	2	1	0	1	2	13	0	2	\N	0	0	0	private	16000_20000	\N	\N	0_5000	\N	VIP	vendor	bicycle	other	none	private_collector	a9bd5576-6582-4701-a1f2-e3ae7c3009db	\N
1172	222	Amber Cherono Mbuthia	Female	55457274	\N	Cohabiting	college	\N	5	structure_owner	\N	2	1	1	1	0	1	0	1	1	0	1	2	0	1	2	14	2	1	\N	0	0	1	unemployed	0_5000	\N	\N	6000_10000	\N	VIP	river	walk	public	water_only	bins	5b5d36cf-212c-4f87-bdc1-83b2d5f79f68	\N
1173	229	Kevin Mmbone Mutio	Male	64074392	\N	Widowed	none	\N	20	structure_owner	\N	0	2	2	0	1	0	1	1	0	0	1	2	0	1	0	11	0	2	\N	0	0	0	civil_servant	16000_20000	\N	\N	16000_20000	\N	pit_latrine	vendor	car	other	water_only	river	99fc7fce-6cce-44b9-b0a7-741e50a96943	\N
1174	146	Julie Odhiambo Mati	Female	44504259	\N	Seperated	primary	\N	2	structure_owner	\N	1	2	2	2	2	0	2	1	1	1	2	2	1	1	1	21	0	2	\N	1	0	1	casual	11000_15000	\N	\N	>20000	\N	flush	rainwater	train	chemist	none	river	97b0a717-7ca2-48e8-8a54-91f0a7864099	\N
1175	22	Melody Karimi Wanje	Female	04369516	\N	Single	primary	\N	40	plot_Owner	\N	2	2	0	1	2	0	2	0	0	1	1	1	2	1	2	17	2	0	\N	1	1	1	self	0_5000	\N	\N	6000_10000	\N	pit_latrine	none	boda	traditional	water_only	private_collector	9d5a9b48-2904-45cd-b3af-3bee53188824	\N
1176	49	Pamela Lagat Munguti	Female	16612635	\N	Seperated	college	\N	29	plot_Owner	\N	1	2	0	2	0	0	0	1	2	1	0	2	0	2	1	14	2	2	\N	1	1	0	civil_servant	6000_10000	\N	\N	0_5000	\N	none	shallow_well	walk	public	none	bins	05eead1b-e18b-4232-9262-8b073d8e3e87	\N
1177	123	Jessica Chesang Jerop	Female	75407574	\N	Cohabiting	none	\N	27	plot_Owner	\N	0	1	2	2	0	0	1	0	0	2	2	2	0	2	2	16	1	1	\N	0	1	1	not_applicable	6000_10000	\N	\N	>20000	\N	VIP	shallow_well	bicycle	public	with_water_and_soap	river	9b70009f-9116-437c-b629-8dd54f5a4f26	\N
1178	70	Vanessa Kurgat Kiio	Female	29471912	\N	Widowed	secondary	\N	13	tenant	\N	2	2	2	2	2	0	0	2	1	0	2	1	0	1	0	17	1	1	\N	1	1	1	unemployed	11000_15000	\N	\N	11000_15000	\N	none	rainwater	walk	public	water_only	river	92127156-c2c8-4655-a447-772ca6a2b8e2	\N
1179	8	Katherine Kanyi Murithi	Female	50174987	\N	Seperated	university	\N	24	plot_Owner	\N	0	2	0	2	1	1	2	2	2	2	1	0	2	2	0	19	1	0	\N	0	0	0	civil_servant	11000_15000	\N	\N	>20000	\N	communal	vendor	bicycle	chemist	none	private_collector	1c8e074e-8a81-4250-a6ee-1fba1aa9236a	\N
1180	31	Michele Gitari Kang'ethe	Female	21384728	\N	Cohabiting	none	\N	11	plot_Owner	\N	1	2	2	1	1	2	0	1	2	0	1	0	1	0	2	16	1	2	\N	1	1	1	civil_servant	>20000	\N	\N	>20000	\N	none	none	boda	public	water_only	bins	65f8fb03-188b-49a7-bc08-d16f7fe880a2	\N
1181	129	Misty Ndung'u Ogega	Female	64140734	\N	married	university	\N	1	plot_Owner	\N	2	1	2	0	2	2	2	2	1	0	0	2	0	1	1	18	1	2	\N	0	1	1	unemployed	6000_10000	\N	\N	>20000	\N	flush	piped	train	mission	with_water_and_soap	dumpsite	1ea0ff52-73f2-48dd-a0f7-b5cfe486428d	\N
1182	202	Lee Mulongo Okelo	Male	37782446	\N	married	primary	\N	40	plot_Owner	\N	1	0	1	2	0	1	2	0	0	0	2	1	0	2	1	13	1	1	\N	1	0	1	civil_servant	0_5000	\N	\N	16000_20000	\N	VIP	vendor	boda	private	with_water_and_soap	river	a31e518c-da83-49e2-ac30-bcadf9f56073	\N
1183	77	Robert Omar Yusuf	Male	75778979	\N	Seperated	primary	\N	40	structure_owner	\N	2	0	0	2	1	2	2	2	0	0	1	2	0	0	2	16	2	2	\N	1	1	0	private	6000_10000	\N	\N	6000_10000	\N	VIP	piped	bicycle	public	none	dumpsite	00170228-6f08-4c4f-8ff0-51d0bf6b8145	\N
1184	184	Steven Salah Moses	Male	32183281	\N	Widowed	college	\N	0	tenant	\N	1	0	2	2	2	1	0	1	1	0	0	2	0	1	2	15	1	1	\N	1	0	0	not_applicable	>20000	\N	\N	0_5000	\N	flush	rainwater	train	public	water_only	dumpsite	8c1da2b3-13fb-4bf3-bd5b-69b97516eec6	\N
1185	163	Donald Gona James	Male	36006930	\N	Seperated	secondary	\N	34	structure_owner	\N	0	2	0	0	1	2	0	1	1	0	2	0	1	2	2	14	1	1	\N	0	1	0	student	11000_15000	\N	\N	>20000	\N	none	none	boda	mission	none	bins	e7b10ab7-ed35-400e-ba2e-e2a40bd22e2c	\N
1186	119	Benjamin Esinyen Bwire	Male	43869608	\N	married	university	\N	2	tenant	\N	0	2	0	2	0	0	1	2	1	0	0	0	0	0	0	8	2	0	\N	1	1	1	casual	>20000	\N	\N	16000_20000	\N	flush	shallow_well	walk	public	water_only	river	6c6d07ec-a07b-4122-858b-fd3b33a7dae3	\N
1187	49	George Muteti Haji	Male	38771385	\N	Widowed	primary	\N	27	structure_owner	\N	0	0	2	1	1	1	1	1	2	1	1	1	0	1	0	13	0	2	\N	1	1	0	private	>20000	\N	\N	11000_15000	\N	VIP	river	walk	chemist	none	river	f33e18fd-a765-4e0c-9ac9-06fa2ec84c25	\N
1188	228	Andrea Mutinda Wamaitha	Female	04841304	\N	Seperated	none	\N	18	plot_Owner	\N	2	1	0	2	0	0	2	2	0	1	1	1	2	0	1	15	0	2	\N	1	0	1	student	>20000	\N	\N	0_5000	\N	pit_latrine	piped	boda	chemist	none	private_collector	66f37812-f6ec-4a6b-9a64-8d64e4009a55	\N
1189	49	Amanda Muthike Kanyi	Female	04769200	\N	Seperated	secondary	\N	38	plot_Owner	\N	1	0	1	1	1	2	1	1	1	1	2	1	0	1	0	14	0	0	\N	0	1	0	casual	16000_20000	\N	\N	16000_20000	\N	none	shallow_well	bicycle	public	with_water_and_soap	dumpsite	ee3d72ef-4456-4b75-ad85-32c119956979	\N
1190	201	Gail Kithome Kangethe	Female	20932647	\N	Widowed	none	\N	10	structure_owner	\N	0	2	2	2	1	2	2	2	2	0	2	0	2	0	0	19	2	0	\N	0	0	1	casual	6000_10000	\N	\N	>20000	\N	flush	river	bicycle	mission	with_water_and_soap	bins	fdec8841-4c16-4e3f-b988-f52732c40c8f	\N
1191	83	Alan Ndiritu Wanjohi	Male	23574417	\N	Single	none	\N	21	structure_owner	\N	1	0	2	1	0	1	0	1	1	1	0	1	2	1	2	14	0	0	\N	0	0	0	not_applicable	11000_15000	\N	\N	>20000	\N	flush	vendor	boda	public	water_only	private_collector	004b67f4-ef6d-4a39-8862-5fa19134b122	\N
1192	65	Shelly Adam Ndolo	Female	22644346	\N	Widowed	university	\N	33	structure_owner	\N	0	0	2	0	1	1	0	2	1	1	2	1	2	1	1	15	0	0	\N	0	0	1	not_applicable	6000_10000	\N	\N	11000_15000	\N	none	river	bicycle	private	water_only	private_collector	dbb4ecd7-8539-45fd-be8b-16ba490fcb48	\N
1193	119	Tamara Simon Ekai	Female	72277884	\N	Cohabiting	none	\N	11	tenant	\N	0	2	0	1	2	2	1	0	0	1	1	0	2	1	0	13	1	0	\N	0	1	1	unemployed	0_5000	\N	\N	11000_15000	\N	VIP	piped	car	private	none	dumpsite	78a5baea-3dee-4064-88f0-17c63d29c9aa	\N
1194	142	Matthew Mutisya Maroa	Male	58022627	\N	Widowed	university	\N	34	structure_owner	\N	1	1	0	1	1	0	1	2	1	1	1	0	1	0	0	11	2	1	\N	1	0	0	casual	16000_20000	\N	\N	11000_15000	\N	communal	piped	walk	mission	none	private_collector	a49e1366-942e-4ebb-8a4e-ef6360d56458	\N
1195	110	Amber Munyoki Patrick	Female	31346154	\N	Cohabiting	secondary	\N	36	structure_owner	\N	0	1	0	0	0	1	2	2	0	0	0	1	1	1	0	9	1	0	\N	1	1	0	self	>20000	\N	\N	>20000	\N	pit_latrine	none	bicycle	public	with_water_and_soap	dumpsite	4c8f5832-3a4f-44c7-aeec-537ec9bb0aa2	\N
1196	301	Malik Chepkorir Chemtai	Male	04860406	\N	Widowed	university	\N	13	structure_owner	\N	0	1	0	1	1	2	0	0	2	2	0	0	1	1	1	12	2	0	\N	0	1	0	self	0_5000	\N	\N	16000_20000	\N	VIP	rainwater	bicycle	other	water_only	dumpsite	b2862866-8e41-4f44-a912-6134a2e7d573	\N
1197	30	Jennifer Kihara Mutembei	Female	00553600	\N	Cohabiting	college	\N	10	plot_Owner	\N	2	2	0	2	0	2	0	1	2	1	0	1	2	2	0	17	1	1	\N	0	0	0	not_applicable	6000_10000	\N	\N	16000_20000	\N	pit_latrine	shallow_well	train	mission	with_water_and_soap	bins	0643f1b6-86fd-4a20-869c-06e5babdbff6	\N
1198	177	Christine Muthiani Kinya	Female	25940257	\N	Widowed	college	\N	26	plot_Owner	\N	1	2	2	0	1	1	2	0	1	1	2	2	1	1	0	17	2	2	\N	1	0	0	unemployed	>20000	\N	\N	0_5000	\N	flush	river	walk	private	with_water_and_soap	river	9b65fa60-2d79-4b89-9786-3d72ac475fc3	\N
1199	92	Mary Wasike Kendi	Female	84714299	\N	Cohabiting	college	\N	12	tenant	\N	2	0	1	0	0	1	2	2	1	2	0	2	1	0	0	14	2	0	\N	1	1	0	private	6000_10000	\N	\N	>20000	\N	communal	rainwater	bicycle	other	none	dumpsite	fd807349-fdad-42a3-b2de-e148f14d14bd	\N
1200	235	Savannah Rutto Soi	Female	65986151	\N	Cohabiting	secondary	\N	30	tenant	\N	1	1	2	1	0	0	0	2	0	0	2	1	2	0	2	14	0	2	\N	0	1	1	private	11000_15000	\N	\N	6000_10000	\N	VIP	shallow_well	walk	chemist	with_water_and_soap	dumpsite	b8abecfd-751c-4152-ba2b-8c923f80a925	\N
1201	52	Margaret Migwi Abdallah	Female	27491625	\N	Widowed	secondary	\N	3	structure_owner	\N	1	0	0	1	1	2	2	2	0	2	2	0	2	0	1	16	0	1	\N	0	0	0	civil_servant	16000_20000	\N	\N	>20000	\N	VIP	river	car	chemist	none	river	327bb6a6-0b4a-48a5-8ecf-e710815bdc40	\N
1202	79	Thomas Jepleting Wangari	Male	17695709	\N	married	university	\N	33	plot_Owner	\N	2	1	1	1	2	2	1	1	0	1	0	0	0	2	2	16	0	0	\N	1	1	0	self	16000_20000	\N	\N	16000_20000	\N	flush	rainwater	train	traditional	water_only	river	1d710d07-acbf-4807-aa5e-9cc7015ec806	\N
1203	116	Dennis Kioko Kassim	Male	41831121	\N	married	primary	\N	5	structure_owner	\N	0	2	0	0	2	1	1	2	2	1	2	1	1	0	0	15	1	1	\N	1	1	1	self	0_5000	\N	\N	0_5000	\N	flush	none	boda	public	water_only	river	b31d2d37-abb6-422d-9533-6ea9a680e68d	\N
1204	35	Anthony Mutuma Kiptui	Male	29643148	\N	Single	primary	\N	38	plot_Owner	\N	2	0	0	2	0	2	2	1	0	1	1	0	1	0	0	12	2	2	\N	1	0	1	unemployed	6000_10000	\N	\N	0_5000	\N	VIP	none	train	private	water_only	bins	c8adb550-bf74-4818-be58-1d3899100e95	\N
1205	182	Joseph Masinde Nkatha	Male	32811650	\N	Widowed	college	\N	27	structure_owner	\N	2	1	2	0	1	0	1	0	2	0	1	2	0	0	1	13	0	1	\N	0	0	0	casual	6000_10000	\N	\N	6000_10000	\N	flush	river	matatu	other	none	bins	846155d2-617c-4acb-af28-e5547567ef5b	\N
1206	44	John Muoki Awadh	Male	79051707	\N	Seperated	university	\N	9	plot_Owner	\N	0	1	1	0	0	2	0	0	2	1	1	1	0	0	2	11	2	0	\N	1	0	1	student	>20000	\N	\N	0_5000	\N	communal	vendor	train	chemist	none	private_collector	2633a5c7-cf11-4cf2-94da-94f8046da301	\N
1207	127	Tammy Kinya Sifuna	Female	77510009	\N	Widowed	primary	\N	34	plot_Owner	\N	2	0	2	0	0	1	1	0	1	2	2	0	1	1	0	13	2	1	\N	0	0	0	self	0_5000	\N	\N	>20000	\N	flush	none	bicycle	public	with_water_and_soap	private_collector	9978046a-5dc9-480a-afee-71c3eaf05d8d	\N
1208	138	Denise Waweru Amondi	Female	36103233	\N	Widowed	primary	\N	13	structure_owner	\N	1	0	0	1	0	2	1	1	0	2	1	0	0	2	0	11	1	1	\N	0	1	0	student	16000_20000	\N	\N	16000_20000	\N	VIP	river	bicycle	private	none	dumpsite	4a9c7eb5-7239-4ca2-a384-f229dfa663b8	\N
1209	103	Juan Emmanuel Gedi	Male	86948400	\N	Single	primary	\N	12	structure_owner	\N	1	1	1	2	2	1	1	2	2	1	1	1	2	0	2	20	1	1	\N	1	1	1	not_applicable	16000_20000	\N	\N	11000_15000	\N	VIP	shallow_well	car	chemist	none	dumpsite	26c609e6-4e4b-42cd-933a-c51c3dd6e3cb	\N
1210	27	Emma Ngeno Mutuma	Female	24352483	\N	married	college	\N	23	tenant	\N	0	1	1	1	1	1	0	0	1	2	1	2	1	2	1	15	0	2	\N	1	0	0	civil_servant	6000_10000	\N	\N	16000_20000	\N	none	piped	car	private	none	bins	3490442b-48f9-4399-8956-f82ac9c1c301	\N
1211	53	Brenda Kinuthia Murungi	Female	58912763	\N	Widowed	primary	\N	18	structure_owner	\N	0	1	1	1	2	2	1	2	1	1	1	2	2	1	1	19	1	1	\N	0	1	1	student	0_5000	\N	\N	11000_15000	\N	none	piped	matatu	private	with_water_and_soap	river	e393ce8b-507b-4838-89a6-4d27ddb82182	\N
1212	165	Pamela Bakari Masese	Female	85191499	\N	Single	college	\N	40	structure_owner	\N	0	2	2	1	1	0	1	1	1	1	2	1	0	2	0	15	2	2	\N	0	1	1	casual	0_5000	\N	\N	6000_10000	\N	communal	none	matatu	public	water_only	dumpsite	82538fd2-2e39-4b54-ac82-196d1d2d1d6f	\N
1213	103	Crystal Mbuvi Mbuthia	Female	19149559	\N	Seperated	college	\N	40	tenant	\N	1	1	1	0	0	0	2	0	2	1	2	0	2	2	1	15	0	1	\N	1	1	1	casual	6000_10000	\N	\N	0_5000	\N	communal	none	train	public	with_water_and_soap	private_collector	b0cc68a2-2ae3-46ae-9363-eecdffa79e7c	\N
1214	7	Stacy Chesang Nzilani	Female	49593354	\N	married	primary	\N	40	plot_Owner	\N	2	1	2	2	0	1	1	1	2	0	0	2	0	1	1	16	2	1	\N	0	0	1	private	>20000	\N	\N	11000_15000	\N	pit_latrine	vendor	bicycle	private	none	bins	7f4a9813-708e-4f3c-816b-b7ea0f9b2da4	\N
1215	96	Rebekah Ekai Komora	Female	84263749	\N	Single	secondary	\N	33	plot_Owner	\N	2	2	1	1	2	0	1	0	0	1	1	0	1	1	2	15	0	1	\N	0	0	1	casual	6000_10000	\N	\N	>20000	\N	communal	vendor	bicycle	traditional	none	bins	af2ec7d0-30e3-4ff0-a98e-4c7f17ac76f9	\N
1216	137	Erin Karambu Kirimi	Female	50842372	\N	Single	college	\N	25	structure_owner	\N	0	0	2	0	0	2	0	1	0	2	2	2	2	0	1	14	0	1	\N	1	1	1	civil_servant	0_5000	\N	\N	0_5000	\N	flush	river	bicycle	other	water_only	bins	92d40889-9c2f-4c40-9c6e-4e0c104d2267	\N
1217	151	Samuel Ngome Munyao	Male	82656063	\N	Cohabiting	college	\N	25	plot_Owner	\N	2	2	1	1	2	1	0	0	0	2	1	1	0	0	2	15	0	0	\N	0	0	0	private	6000_10000	\N	\N	6000_10000	\N	pit_latrine	none	bicycle	traditional	water_only	dumpsite	de38acb7-4b50-4854-b76e-19f823ef9d70	\N
1218	33	Crystal Atieno Yatich	Female	14213668	\N	Single	secondary	\N	17	structure_owner	\N	1	2	0	2	1	0	1	2	1	0	1	2	1	0	0	14	2	2	\N	1	1	0	private	>20000	\N	\N	16000_20000	\N	VIP	shallow_well	car	public	none	dumpsite	9c014a82-0e6c-4525-8082-500a9c48c1cd	\N
1219	8	Patricia Muthui Rugut	Female	47123725	\N	Cohabiting	secondary	\N	24	structure_owner	\N	1	2	1	1	0	1	0	1	0	0	1	0	1	2	0	11	2	1	\N	1	1	0	self	11000_15000	\N	\N	0_5000	\N	communal	none	car	public	none	dumpsite	5b24e62d-8963-4179-888f-7916aee6e4d9	\N
1220	112	Jonathan Sila Nyokabi	Male	74401174	\N	Cohabiting	primary	\N	9	tenant	\N	0	0	2	2	2	1	0	2	0	2	0	1	2	0	0	14	1	2	\N	1	0	0	civil_servant	>20000	\N	\N	16000_20000	\N	VIP	shallow_well	train	mission	with_water_and_soap	dumpsite	89ce7427-be82-4032-8657-e070907948d5	\N
1221	123	Mercedes Alio Joshua	Female	50566847	\N	married	secondary	\N	31	plot_Owner	\N	1	0	0	2	2	1	1	0	1	1	1	2	2	0	2	16	0	2	\N	0	1	1	student	6000_10000	\N	\N	>20000	\N	pit_latrine	river	bicycle	traditional	water_only	bins	dea3e3f5-2068-4829-b1a6-5a0aa8c08659	\N
1222	210	Joseph Mutunga Chepkoech	Male	32297256	\N	Seperated	secondary	\N	6	structure_owner	\N	1	1	1	2	2	1	2	0	1	0	0	1	0	2	1	15	1	2	\N	0	0	1	unemployed	16000_20000	\N	\N	>20000	\N	pit_latrine	river	boda	chemist	water_only	dumpsite	18a18794-39df-4bab-924e-7038e216e845	\N
1223	216	Amber Moseti Kairu	Female	21923201	\N	Cohabiting	college	\N	10	plot_Owner	\N	2	0	1	1	0	2	2	2	0	0	0	1	0	1	1	13	2	1	\N	1	0	1	unemployed	>20000	\N	\N	11000_15000	\N	VIP	rainwater	bicycle	chemist	with_water_and_soap	river	7021064a-b648-40a9-8b3d-24a9ef1d96c6	\N
1224	155	Patricia Kipkoech Makena	Female	08861185	\N	married	none	\N	36	tenant	\N	1	1	1	1	2	2	2	0	0	2	2	1	1	2	2	20	1	2	\N	0	1	1	private	16000_20000	\N	\N	16000_20000	\N	flush	river	matatu	mission	water_only	private_collector	a73ec52b-d2fb-4f3e-a2c6-5697320c37f8	\N
1225	78	Regina Mugo Yegon	Female	00813349	\N	Widowed	university	\N	11	structure_owner	\N	0	2	1	0	2	2	2	0	2	0	2	0	2	2	0	17	0	0	\N	0	1	1	private	0_5000	\N	\N	16000_20000	\N	pit_latrine	none	bicycle	other	with_water_and_soap	dumpsite	e955248d-24d8-4436-bccc-65992b662365	\N
1226	157	Lisa Tirop Issak	Female	56932909	\N	Widowed	none	\N	7	structure_owner	\N	0	0	2	0	1	2	1	2	2	0	0	1	2	1	0	14	1	1	\N	1	1	0	not_applicable	>20000	\N	\N	>20000	\N	pit_latrine	none	train	mission	with_water_and_soap	private_collector	0bb66a8b-9255-4c5d-95be-b8a39f96c8bb	\N
1227	145	Autumn Kimotho Maitha	Female	22901184	\N	married	none	\N	11	structure_owner	\N	0	1	1	1	2	2	0	1	1	2	2	0	1	1	0	15	2	2	\N	0	0	1	student	11000_15000	\N	\N	0_5000	\N	VIP	none	bicycle	mission	none	private_collector	91f19c2e-e486-4361-970d-0d96c983d51e	\N
1228	196	Colleen Jomo Kipngetich	Female	55177529	\N	Single	secondary	\N	8	plot_Owner	\N	0	1	2	2	2	2	1	1	1	1	1	0	0	2	1	17	2	1	\N	1	0	0	private	11000_15000	\N	\N	>20000	\N	pit_latrine	none	train	mission	none	river	69260f32-b253-47ae-b65e-b2ff647d467c	\N
1229	181	Lisa Mahamud Gakii	Female	37117438	\N	Single	university	\N	29	plot_Owner	\N	2	2	1	2	1	1	0	1	1	0	1	2	0	2	0	16	0	1	\N	1	1	1	self	16000_20000	\N	\N	11000_15000	\N	communal	piped	walk	private	none	river	60c61edc-c770-441f-a42b-cd7ff925369d	\N
1230	217	Gwendolyn Muthike Nafuna	Female	70316616	\N	Widowed	none	\N	9	structure_owner	\N	0	0	2	1	1	0	1	2	2	0	1	1	2	0	0	13	1	1	\N	1	1	0	casual	>20000	\N	\N	0_5000	\N	flush	shallow_well	boda	public	none	river	079cb722-3eed-4f51-91f5-fc34d487b152	\N
1231	70	Jane Chai Dennis	Female	81796297	\N	Single	college	\N	8	tenant	\N	1	0	0	1	1	2	1	0	1	1	2	1	2	2	1	16	1	0	\N	1	1	0	unemployed	16000_20000	\N	\N	6000_10000	\N	none	river	matatu	private	none	private_collector	201bd93a-4644-4fe7-8221-7e3ca1516412	\N
1232	91	Philip Noor Mohammed	Male	42827977	\N	Widowed	secondary	\N	0	plot_Owner	\N	1	2	1	2	1	0	0	2	1	1	1	0	1	1	2	16	0	0	\N	1	0	0	unemployed	>20000	\N	\N	16000_20000	\N	pit_latrine	vendor	train	public	water_only	river	89a414ee-0a3b-4627-88c2-d184f459978c	\N
1233	92	Lance Mbogo Kituku	Male	41623357	\N	Single	none	\N	10	structure_owner	\N	1	0	2	2	0	1	0	0	1	1	2	0	1	0	0	11	1	0	\N	0	1	0	civil_servant	>20000	\N	\N	0_5000	\N	VIP	piped	train	other	with_water_and_soap	river	aaab95f8-4e44-4ff7-b507-3aa1137a8aac	\N
1234	104	Keith Sigei Wabwile	Male	06081089	\N	married	primary	\N	35	tenant	\N	2	0	2	2	2	2	1	0	1	2	1	2	0	0	1	18	2	0	\N	1	1	1	private	0_5000	\N	\N	6000_10000	\N	none	river	walk	chemist	water_only	dumpsite	19476575-47ee-4ff8-aea1-6cbcdd0cae1a	\N
1235	194	Heather Abdikadir Samwel	Female	58969206	\N	married	college	\N	0	tenant	\N	1	0	1	1	0	0	0	1	1	0	2	0	0	1	0	8	2	1	\N	0	1	0	not_applicable	0_5000	\N	\N	6000_10000	\N	flush	river	bicycle	public	none	private_collector	c7cd17b1-d412-4813-a680-fd0b2a3b48e9	\N
1236	76	Cynthia Jepkemei Kaloki	Female	16719643	\N	Widowed	secondary	\N	27	tenant	\N	1	2	1	1	2	2	0	1	1	1	0	1	1	0	1	15	0	2	\N	1	0	1	not_applicable	16000_20000	\N	\N	0_5000	\N	flush	none	bicycle	mission	with_water_and_soap	bins	1f7954bd-5f8e-4951-a29e-def81042ed65	\N
1237	63	Stacey Oloo Nyaguthii	Female	76866007	\N	Widowed	primary	\N	5	plot_Owner	\N	1	0	1	2	2	2	1	1	0	2	1	2	2	0	1	18	2	0	\N	1	1	1	not_applicable	16000_20000	\N	\N	16000_20000	\N	none	vendor	matatu	chemist	water_only	bins	9ab91c92-1c61-413b-8fd9-ab0a45c26601	\N
1238	140	Lauren Muriungi Guyo	Female	54639634	\N	Cohabiting	secondary	\N	10	structure_owner	\N	2	0	2	1	0	2	0	1	2	1	0	2	1	2	0	16	2	1	\N	0	1	0	private	0_5000	\N	\N	>20000	\N	VIP	vendor	bicycle	traditional	none	dumpsite	695b571f-a9c3-43c5-9caa-5ceb4a715ce3	\N
1239	47	Tracy Wanje Chomba	Female	40172254	\N	Single	college	\N	28	tenant	\N	1	0	1	0	2	2	0	1	1	0	2	1	1	1	0	13	1	2	\N	1	1	1	private	16000_20000	\N	\N	11000_15000	\N	none	river	walk	other	water_only	private_collector	e8072b5c-5a1e-4ba8-9b9f-e96023124115	\N
1240	71	Derek Musyoki Sawe	Male	67923707	\N	Widowed	college	\N	20	tenant	\N	2	1	1	1	0	2	2	2	2	1	1	2	0	2	0	19	2	1	\N	0	1	1	self	0_5000	\N	\N	11000_15000	\N	communal	piped	boda	other	water_only	private_collector	1c0f9f20-ca8a-4a17-9357-816c0a56660a	\N
1241	231	Jennifer Muthama Kendi	Female	30364394	\N	Widowed	primary	\N	29	structure_owner	\N	0	0	0	2	0	0	0	2	1	0	2	2	1	0	1	11	0	0	\N	1	0	1	unemployed	16000_20000	\N	\N	6000_10000	\N	flush	river	train	mission	with_water_and_soap	river	b2186cce-75a3-4081-9dfd-124ae5d90cf4	\N
1242	220	Kathryn Emuria Karisa	Female	39751275	\N	Widowed	secondary	\N	8	plot_Owner	\N	2	2	0	1	0	2	2	0	0	1	1	0	1	0	1	13	2	2	\N	1	1	1	self	11000_15000	\N	\N	>20000	\N	flush	vendor	boda	mission	water_only	river	5e7629cc-eaf6-48bc-be1e-7e3952750a29	\N
1243	81	Jon Wanzala Cheruiyot	Male	62897011	\N	Single	college	\N	15	tenant	\N	1	2	1	1	0	0	1	1	1	1	0	2	2	1	0	14	1	1	\N	0	0	0	not_applicable	0_5000	\N	\N	16000_20000	\N	flush	river	matatu	traditional	with_water_and_soap	bins	ffd27eae-1214-4d86-8e94-913c0e0aff9e	\N
1244	33	Stacy Matheka Toroitich	Female	08104846	\N	Cohabiting	none	\N	8	plot_Owner	\N	0	0	2	1	2	2	1	2	2	1	0	0	1	1	2	17	0	2	\N	0	0	0	civil_servant	6000_10000	\N	\N	>20000	\N	none	rainwater	boda	mission	with_water_and_soap	private_collector	c9bc7e5d-4428-475f-b1c0-290057c9febb	\N
1245	60	Linda Thomas Hussein	Female	87710299	\N	Single	secondary	\N	20	structure_owner	\N	0	0	0	2	0	0	1	1	2	1	0	1	0	1	2	11	1	0	\N	0	1	0	not_applicable	11000_15000	\N	\N	6000_10000	\N	communal	rainwater	matatu	public	none	river	b3f799b3-6264-4f08-8573-1ed25a6d142b	\N
1246	226	Charles Masai Jerono	Male	36262994	\N	Widowed	none	\N	19	plot_Owner	\N	0	1	1	0	0	1	0	2	2	0	0	1	0	2	0	10	1	2	\N	1	0	0	civil_servant	11000_15000	\N	\N	0_5000	\N	VIP	vendor	bicycle	private	with_water_and_soap	bins	c1097f81-bd58-4ea2-8e84-e2f03396946a	\N
1247	36	Jason Amondi Boke	Male	69617556	\N	Widowed	none	\N	17	tenant	\N	1	1	1	0	1	0	0	2	1	2	0	0	1	1	2	13	2	0	\N	1	0	1	private	0_5000	\N	\N	0_5000	\N	communal	none	matatu	mission	none	private_collector	3da6c28c-9557-4b97-8131-bd393a1bfa9a	\N
1248	203	Beth Orina Cherutich	Female	33390527	\N	married	college	\N	15	plot_Owner	\N	2	1	1	2	0	2	2	0	0	2	2	1	2	2	0	19	1	1	\N	1	0	0	self	6000_10000	\N	\N	>20000	\N	pit_latrine	rainwater	train	mission	water_only	private_collector	a9ffd549-2625-49f9-ad8c-9307d0e1579f	\N
1249	96	Scott Warui Odongo	Male	38234776	\N	Widowed	secondary	\N	22	tenant	\N	0	1	0	1	2	2	2	2	2	0	2	1	0	0	1	16	0	1	\N	0	1	0	unemployed	>20000	\N	\N	11000_15000	\N	none	vendor	bicycle	traditional	with_water_and_soap	river	dd39d2e2-510c-4b7a-a58d-3d1d2333e9b0	\N
1250	113	Megan Kilonzo Gacheri	Female	65794658	\N	married	secondary	\N	40	structure_owner	\N	1	1	0	2	0	1	2	0	1	1	2	1	2	1	1	16	0	0	\N	1	1	0	civil_servant	11000_15000	\N	\N	6000_10000	\N	flush	rainwater	car	other	none	river	0032b78c-c514-416f-b4ba-983fe2a755b8	\N
1251	2	Angela Pkemoi Bashir	Female	86114300	\N	married	none	\N	13	structure_owner	\N	0	1	1	2	0	2	0	0	2	1	2	2	1	1	1	16	1	1	\N	1	0	0	private	0_5000	\N	\N	0_5000	\N	flush	rainwater	boda	traditional	none	dumpsite	d7403067-cea4-4d4a-955d-0ef4897f76eb	\N
1252	135	Jennifer Shariff Okeyo	Female	37580049	\N	Cohabiting	university	\N	9	structure_owner	\N	2	0	2	0	2	2	0	2	1	0	1	2	2	1	2	19	2	2	\N	1	1	1	not_applicable	16000_20000	\N	\N	16000_20000	\N	communal	piped	bicycle	other	with_water_and_soap	river	d666b21f-b81c-4ddd-926c-7afd23d68b4a	\N
1253	126	Zachary Farah Gacheri	Male	42515295	\N	Seperated	college	\N	22	plot_Owner	\N	2	1	0	2	0	2	0	0	1	1	0	2	2	2	1	16	0	2	\N	0	0	0	private	16000_20000	\N	\N	11000_15000	\N	VIP	vendor	bicycle	chemist	with_water_and_soap	bins	ee4c2fab-4220-418e-a99d-5973f901f866	\N
1254	158	Scott Ochieng Lewa	Male	25467006	\N	Single	none	\N	22	tenant	\N	1	1	2	1	1	2	2	0	1	2	2	2	1	0	0	18	1	0	\N	0	0	1	casual	11000_15000	\N	\N	16000_20000	\N	flush	rainwater	train	chemist	none	dumpsite	24b65dc7-1e8d-4b6c-955f-8c8f0e662f73	\N
1255	39	Frances Muthiani Makungu	Female	04563546	\N	Seperated	primary	\N	8	plot_Owner	\N	2	1	2	0	2	1	0	0	2	0	0	0	1	1	2	14	1	0	\N	1	1	1	self	>20000	\N	\N	>20000	\N	VIP	shallow_well	train	public	with_water_and_soap	private_collector	a1dd3dd7-b859-4633-acb4-20544470b9d4	\N
1256	33	Henry Kamau Chepkorir	Male	88580357	\N	married	primary	\N	30	structure_owner	\N	1	0	2	1	1	2	1	1	1	1	1	2	2	0	2	18	0	1	\N	1	1	0	private	0_5000	\N	\N	16000_20000	\N	pit_latrine	river	bicycle	public	with_water_and_soap	bins	2397b708-5ab4-4627-9391-0cca22eb575f	\N
1257	159	Stephanie Daud Kithome	Female	42951551	\N	married	none	\N	34	tenant	\N	0	0	1	0	0	1	1	0	2	2	2	0	1	1	1	12	2	0	\N	1	1	0	not_applicable	>20000	\N	\N	11000_15000	\N	flush	piped	bicycle	chemist	with_water_and_soap	bins	1d035047-26d8-4761-a3e2-3a876cbb551f	\N
1258	164	Elizabeth Muya Wanjau	Female	12180150	\N	Seperated	secondary	\N	30	structure_owner	\N	0	0	0	0	1	2	2	2	2	0	1	1	1	0	0	12	2	0	\N	0	1	1	not_applicable	6000_10000	\N	\N	6000_10000	\N	none	river	car	chemist	water_only	bins	bea5fb50-b422-4975-bcb6-5bc596d495b6	\N
1259	234	Miguel Salah Cheruiyot	Male	05949289	\N	Cohabiting	university	\N	23	plot_Owner	\N	0	1	1	2	1	0	2	1	0	1	0	2	1	2	1	15	1	2	\N	0	1	0	not_applicable	>20000	\N	\N	>20000	\N	VIP	piped	matatu	other	with_water_and_soap	dumpsite	3e42f7a9-886e-4c8e-8fb9-d9792a62d4a8	\N
1260	208	Shelley Saina Ngina	Female	31804275	\N	Cohabiting	university	\N	24	plot_Owner	\N	1	0	0	0	0	2	2	1	1	0	0	2	0	2	1	12	0	2	\N	1	0	0	unemployed	6000_10000	\N	\N	0_5000	\N	VIP	rainwater	car	traditional	water_only	river	f7ab4c05-270e-42d6-805f-64fe614b848b	\N
1261	206	Christine Odero Mutindi	Female	41706388	\N	Widowed	secondary	\N	20	plot_Owner	\N	0	2	0	1	0	0	2	2	2	0	1	2	2	2	0	16	2	0	\N	1	0	1	unemployed	6000_10000	\N	\N	>20000	\N	none	river	train	other	water_only	bins	302a5d5a-3796-4587-9a85-700e7846c47b	\N
1262	87	Tyler Sikuku Mbula	Male	31402412	\N	married	secondary	\N	11	tenant	\N	2	1	1	2	1	0	1	0	2	2	0	2	2	2	1	19	1	1	\N	1	0	1	civil_servant	16000_20000	\N	\N	11000_15000	\N	none	vendor	bicycle	traditional	with_water_and_soap	bins	886a24c0-e205-4957-b3ab-30991f0abcb5	\N
1263	102	Sharon Emuria Gacheru	Female	25915162	\N	Cohabiting	college	\N	4	structure_owner	\N	2	1	1	1	1	2	0	2	0	0	1	0	1	1	1	14	2	1	\N	1	0	1	not_applicable	16000_20000	\N	\N	>20000	\N	VIP	shallow_well	bicycle	traditional	water_only	private_collector	c7c1ec2a-6b07-4803-adc0-07a2f9f80963	\N
1264	8	Cheryl Ali Muktar	Female	36714672	\N	Cohabiting	secondary	\N	37	tenant	\N	2	2	2	2	0	2	2	2	2	1	2	1	1	2	0	23	0	0	\N	0	1	0	unemployed	0_5000	\N	\N	>20000	\N	flush	piped	car	other	with_water_and_soap	private_collector	84eb0440-c165-4aa4-966c-074fdf0a0d0a	\N
1265	33	Shawn Masese Nanjala	Male	16036388	\N	Seperated	university	\N	19	structure_owner	\N	0	2	0	1	1	2	1	2	2	1	2	0	0	1	2	17	2	0	\N	0	1	1	not_applicable	0_5000	\N	\N	16000_20000	\N	VIP	piped	matatu	public	with_water_and_soap	private_collector	86c649ca-8a39-4280-998b-fd40a7547608	\N
1266	228	Victoria Sang Barasa	Female	55630100	\N	Seperated	primary	\N	0	plot_Owner	\N	1	1	0	1	1	1	0	1	2	0	2	1	0	0	2	13	1	0	\N	0	0	0	civil_servant	>20000	\N	\N	6000_10000	\N	VIP	shallow_well	matatu	traditional	with_water_and_soap	river	81569df4-eee5-4a71-83b6-87dbe0a029dd	\N
1267	170	Aaron Nyagaka Kithome	Male	57499301	\N	Widowed	secondary	\N	27	plot_Owner	\N	0	2	2	1	1	0	2	2	2	2	0	2	0	0	1	17	2	0	\N	1	1	0	student	16000_20000	\N	\N	>20000	\N	flush	none	train	public	with_water_and_soap	bins	f95f9cb7-efcf-4fe5-b6bd-5516b8a11384	\N
1268	189	Jeremiah Chepkirui Kiogora	Male	78219589	\N	Cohabiting	university	\N	32	tenant	\N	2	2	0	0	2	0	1	0	0	1	2	1	0	2	1	14	1	0	\N	0	1	1	civil_servant	11000_15000	\N	\N	11000_15000	\N	none	none	boda	private	water_only	private_collector	01f31d0b-5440-4da5-abdc-b2b9e976f89d	\N
1269	163	Shawn Gacheri Thuo	Male	01307694	\N	Widowed	secondary	\N	28	plot_Owner	\N	1	1	0	2	1	2	2	2	2	2	2	2	2	1	2	24	1	0	\N	1	1	0	civil_servant	0_5000	\N	\N	16000_20000	\N	pit_latrine	vendor	train	public	water_only	river	f5399835-b3c3-42aa-b8bd-6dda3dd90aca	\N
1270	35	Matthew Ibrahim Omari	Male	07412317	\N	Cohabiting	none	\N	8	structure_owner	\N	1	2	0	1	1	0	0	1	2	2	1	1	1	1	1	15	2	0	\N	0	1	1	not_applicable	0_5000	\N	\N	16000_20000	\N	VIP	shallow_well	train	traditional	none	private_collector	edd22ff5-18cf-4d0b-a876-bb67d9f2f9cc	\N
1271	155	Lori Kairu Karimi	Female	05014371	\N	Single	college	\N	17	structure_owner	\N	0	1	0	1	2	1	1	1	0	2	1	0	0	2	1	13	0	1	\N	0	1	0	not_applicable	16000_20000	\N	\N	16000_20000	\N	flush	rainwater	boda	chemist	none	bins	c1ef6417-1784-4eb8-8c24-316c6c84fe60	\N
1272	1	John Mwita Gichuru	Male	69751342	\N	Seperated	none	\N	25	structure_owner	\N	0	2	1	2	2	0	0	2	2	0	2	0	2	2	2	19	0	2	\N	0	1	0	casual	11000_15000	\N	\N	0_5000	\N	pit_latrine	vendor	matatu	chemist	with_water_and_soap	private_collector	6eab19ce-52dd-467c-891d-44f34027d0f1	\N
1273	40	Chloe Mmboga Muchira	Female	43369357	\N	married	none	\N	28	tenant	\N	2	2	0	0	0	2	2	1	2	1	0	2	2	2	1	19	1	1	\N	1	1	0	self	>20000	\N	\N	11000_15000	\N	flush	vendor	car	chemist	with_water_and_soap	bins	65b5a4be-0a9e-410b-a112-81d3d060f796	\N
1274	141	Wesley Bundi Were	Male	79460503	\N	Seperated	university	\N	32	plot_Owner	\N	2	2	1	0	0	2	0	1	0	0	1	2	0	1	1	13	0	0	\N	0	0	1	self	6000_10000	\N	\N	>20000	\N	communal	piped	car	mission	water_only	private_collector	ee2431ac-3807-4251-89a6-6129c7c97461	\N
1275	211	Eric Gicheru Ochola	Male	36226912	\N	married	none	\N	11	structure_owner	\N	2	0	0	1	2	2	2	1	0	0	0	1	2	2	2	17	2	1	\N	0	0	0	student	6000_10000	\N	\N	>20000	\N	VIP	piped	train	chemist	with_water_and_soap	bins	e21c1bda-efbb-4485-bba7-b1bb6eb0f78b	\N
1276	74	Carolyn Njoki Munyao	Female	47213409	\N	Seperated	primary	\N	38	plot_Owner	\N	2	2	2	1	0	0	1	1	0	0	0	2	2	1	0	14	0	2	\N	1	1	0	self	16000_20000	\N	\N	11000_15000	\N	VIP	vendor	boda	private	none	bins	61de38da-a3e2-4314-b342-25a12ae0cac2	\N
1277	19	Diane Githaiga Nur	Female	21108443	\N	Cohabiting	secondary	\N	20	plot_Owner	\N	0	1	1	1	0	1	0	0	1	0	0	2	0	2	2	11	0	0	\N	1	0	0	private	0_5000	\N	\N	6000_10000	\N	none	vendor	car	mission	water_only	dumpsite	b23dc7a1-96d7-4119-929c-2743b1200251	\N
1278	155	Alexis Nyangaresi Njeru	Female	45153048	\N	Cohabiting	university	\N	38	structure_owner	\N	1	1	0	2	0	0	1	1	2	0	0	1	1	0	0	10	1	1	\N	0	1	0	student	6000_10000	\N	\N	6000_10000	\N	VIP	none	matatu	traditional	none	private_collector	b1ec484e-68a1-48ad-b1ca-c7f9fef3d732	\N
1279	178	Michael Mutinda Kipkemoi	Male	72131011	\N	married	primary	\N	2	structure_owner	\N	2	2	0	0	1	1	1	1	1	1	2	1	1	1	1	16	1	1	\N	0	1	1	self	16000_20000	\N	\N	>20000	\N	VIP	none	walk	private	with_water_and_soap	bins	8bc35ef7-6baf-4a63-8c42-7f204e9ea8b1	\N
1280	137	Jaclyn Ngaruiya Bulle	Female	31566339	\N	Cohabiting	university	\N	5	tenant	\N	1	1	2	1	1	1	1	2	0	0	1	0	1	0	0	12	1	1	\N	0	0	0	student	16000_20000	\N	\N	16000_20000	\N	none	vendor	car	other	water_only	bins	136cc44d-4c0f-48f6-acc5-c077d955d634	\N
1281	139	Thomas Kimanzi Lumbasi	Male	48734201	\N	Cohabiting	none	\N	3	plot_Owner	\N	1	2	2	0	1	0	1	2	2	0	0	2	0	0	0	13	0	0	\N	0	0	0	student	>20000	\N	\N	11000_15000	\N	flush	none	boda	chemist	water_only	river	52fef053-7506-4bf5-b0db-4f3bdbe6e344	\N
1282	37	Kimberly Wanza Mutanu	Female	33142520	\N	married	university	\N	11	tenant	\N	0	1	1	0	0	1	2	0	0	2	2	1	2	2	1	15	1	1	\N	1	1	0	private	11000_15000	\N	\N	>20000	\N	pit_latrine	rainwater	car	traditional	water_only	bins	34ef4a5b-5181-4322-852d-badb62e8ad47	\N
1283	9	Casey Mwema Mbaabu	Male	01959087	\N	Seperated	none	\N	26	structure_owner	\N	0	2	1	1	0	2	1	2	1	1	0	1	0	0	0	12	0	0	\N	0	0	1	self	11000_15000	\N	\N	>20000	\N	communal	rainwater	boda	private	with_water_and_soap	bins	dfb69faa-ebf2-45cb-a05e-9270f6d32bb2	\N
1284	94	Mathew Munyao Mohamed	Male	34044682	\N	Cohabiting	primary	\N	15	plot_Owner	\N	0	2	1	1	1	1	1	0	1	0	2	2	2	0	0	14	1	0	\N	0	0	0	student	6000_10000	\N	\N	6000_10000	\N	none	shallow_well	boda	other	with_water_and_soap	dumpsite	d6f99bd8-9ef3-403a-bf19-324399363c98	\N
1285	65	Jessica Munguti Dagane	Female	14754141	\N	Seperated	college	\N	26	plot_Owner	\N	2	1	0	1	2	0	0	0	2	2	0	0	0	2	2	14	0	2	\N	1	0	0	casual	6000_10000	\N	\N	6000_10000	\N	VIP	river	train	private	water_only	bins	c834fcef-7baa-48be-abcb-e54697a40f43	\N
1286	228	Aaron Oginga Sifuna	Male	46558959	\N	Cohabiting	primary	\N	6	tenant	\N	1	2	1	1	2	1	2	0	2	2	1	2	2	2	1	22	2	1	\N	0	0	1	private	16000_20000	\N	\N	11000_15000	\N	VIP	shallow_well	boda	mission	water_only	private_collector	d917abaa-92c6-4952-a58e-702d0af3d607	\N
1287	193	Taylor Too Musyoki	Female	09184825	\N	married	none	\N	27	structure_owner	\N	1	1	2	0	2	0	0	2	0	1	0	2	1	1	2	15	0	0	\N	0	1	0	not_applicable	16000_20000	\N	\N	6000_10000	\N	communal	vendor	matatu	mission	none	river	cf1c74a5-3526-4aef-84fb-f80b9bdc8bb7	\N
1288	38	Juan Wako Mwathi	Male	08846303	\N	Widowed	secondary	\N	27	tenant	\N	1	1	1	1	1	2	0	0	1	2	0	1	0	2	2	15	1	2	\N	1	1	0	civil_servant	16000_20000	\N	\N	11000_15000	\N	flush	river	car	chemist	none	private_collector	d50c16e7-924c-48cd-b218-14b3b3215cc5	\N
1289	159	Anna Okoth Chelimo	Female	61645035	\N	Single	primary	\N	2	structure_owner	\N	2	2	2	2	0	1	0	1	0	0	1	0	0	2	0	13	0	0	\N	1	0	0	student	>20000	\N	\N	6000_10000	\N	VIP	river	bicycle	public	none	private_collector	fd6855e1-6209-417a-b952-08e1f1f4aa90	\N
1290	48	Todd Wanyoike Kagwiria	Male	09181123	\N	Widowed	university	\N	28	plot_Owner	\N	0	2	0	2	0	2	1	1	1	2	1	2	0	1	1	16	2	1	\N	0	0	0	unemployed	11000_15000	\N	\N	16000_20000	\N	none	rainwater	boda	traditional	water_only	private_collector	3f9e0852-25f7-45b6-8d99-b1f2b32335bd	\N
1291	30	Michael Changawa Godana	Male	68620498	\N	Single	secondary	\N	18	plot_Owner	\N	0	2	0	1	1	2	0	1	2	1	0	0	1	2	2	15	2	0	\N	0	0	0	private	11000_15000	\N	\N	11000_15000	\N	VIP	rainwater	matatu	mission	with_water_and_soap	private_collector	6d57cf6a-09fd-4c53-852d-7fd47ddea995	\N
1292	14	Jason Muchui Jarso	Male	27036192	\N	Seperated	college	\N	15	plot_Owner	\N	2	0	0	1	2	1	2	2	1	2	2	1	1	1	2	20	1	1	\N	0	0	1	casual	16000_20000	\N	\N	0_5000	\N	communal	piped	boda	public	water_only	private_collector	cfddfca3-218f-48ec-9fdd-d759bcdd9d26	\N
1293	182	Johnathan Mwanzia Wamuyu	Male	79728376	\N	Widowed	primary	\N	0	structure_owner	\N	1	1	0	2	0	0	1	0	1	0	0	0	2	0	0	8	1	2	\N	1	0	1	unemployed	16000_20000	\N	\N	16000_20000	\N	communal	rainwater	bicycle	public	with_water_and_soap	dumpsite	89a1162e-f331-4f28-9079-88554d7c39e5	\N
1294	237	Beth Kipkurui Mutanu	Female	13860179	\N	married	secondary	\N	4	structure_owner	\N	2	2	2	0	0	1	0	1	2	2	0	1	0	1	1	15	1	0	\N	1	1	0	casual	6000_10000	\N	\N	16000_20000	\N	pit_latrine	rainwater	walk	mission	water_only	dumpsite	31c4c445-26f0-42f2-8075-f77b416583b6	\N
1295	119	Shannon Gathogo Kangethe	Female	07364451	\N	Cohabiting	secondary	\N	7	structure_owner	\N	2	0	0	0	2	1	1	2	0	2	1	2	2	2	1	18	1	1	\N	0	0	0	private	0_5000	\N	\N	11000_15000	\N	communal	shallow_well	car	public	none	private_collector	d2fb1fb2-f4ae-495f-8a2e-a512b79de0c3	\N
1296	203	Shawn Kahindi Mnangat	Male	81853358	\N	Cohabiting	secondary	\N	20	tenant	\N	1	0	2	1	0	2	0	0	2	1	0	0	0	2	1	12	1	0	\N	1	1	1	private	16000_20000	\N	\N	16000_20000	\N	none	piped	walk	mission	water_only	private_collector	ce3a7975-2ec0-4a2b-a494-b867e888b071	\N
1297	123	Jennifer Ondari Kassim	Female	57536428	\N	Cohabiting	secondary	\N	9	plot_Owner	\N	2	2	1	2	0	0	1	1	1	2	0	2	0	0	2	16	0	0	\N	1	0	0	civil_servant	>20000	\N	\N	16000_20000	\N	pit_latrine	shallow_well	boda	traditional	with_water_and_soap	dumpsite	57dbb0fb-c28d-4bca-b932-5d8873229969	\N
1298	35	David Amina Duba	Male	13832918	\N	Single	secondary	\N	11	plot_Owner	\N	1	0	0	0	0	0	1	0	1	2	0	0	0	0	2	7	2	2	\N	0	1	1	not_applicable	0_5000	\N	\N	>20000	\N	communal	river	train	other	water_only	dumpsite	32f6f4f2-296c-44a3-bd61-c793770edd75	\N
1299	206	Thomas Peter Ogada	Male	86525371	\N	Seperated	college	\N	32	plot_Owner	\N	2	1	2	0	1	1	1	2	1	1	1	1	0	1	0	15	2	1	\N	1	1	1	self	11000_15000	\N	\N	11000_15000	\N	flush	shallow_well	bicycle	chemist	water_only	private_collector	e468b8da-97fc-4e32-bc55-e0c2287d2680	\N
1300	7	Tracey Biwott Chepkwony	Female	36027296	\N	Seperated	none	\N	11	plot_Owner	\N	0	2	2	0	2	2	2	2	0	1	2	1	0	1	2	19	0	0	\N	0	1	1	unemployed	0_5000	\N	\N	0_5000	\N	none	vendor	car	chemist	none	bins	5217480a-0073-475f-8aeb-9b114a73fe8b	\N
1301	40	Carrie Jelagat Munywoki	Female	05565749	\N	Single	none	\N	28	structure_owner	\N	0	2	0	0	0	1	0	1	0	0	1	0	1	2	1	9	1	0	\N	1	0	1	unemployed	>20000	\N	\N	11000_15000	\N	communal	piped	walk	private	none	private_collector	b34391fe-3d35-4c24-b6c1-561ff892f82f	\N
1302	56	Keith Jelle Nakhumicha	Male	34587212	\N	Single	primary	\N	24	tenant	\N	0	1	2	2	2	0	1	2	2	1	2	2	0	0	2	19	0	2	\N	1	1	1	self	0_5000	\N	\N	0_5000	\N	none	river	train	traditional	water_only	dumpsite	9565fea2-2757-4899-b92b-fcec900e6618	\N
1303	192	Holly Kiptanui Mutunga	Female	82791679	\N	Seperated	university	\N	18	tenant	\N	1	1	0	0	1	1	2	2	2	0	2	1	0	0	0	13	1	1	\N	1	1	1	unemployed	>20000	\N	\N	11000_15000	\N	none	vendor	car	mission	with_water_and_soap	private_collector	6356937f-252a-4e43-b243-a6d0e13dbad0	\N
1304	14	Monica Oketch Nyaboke	Female	28114738	\N	Widowed	college	\N	25	plot_Owner	\N	1	0	0	2	2	0	2	1	0	0	1	2	1	2	1	15	2	0	\N	0	1	1	private	11000_15000	\N	\N	6000_10000	\N	flush	rainwater	matatu	private	with_water_and_soap	private_collector	ff2ab427-5036-4532-bc38-f7fd0d88f0a8	\N
1305	94	Charles Wafula Wairimu	Male	42475793	\N	Cohabiting	primary	\N	10	tenant	\N	2	1	0	0	0	0	0	0	1	2	1	1	2	2	0	12	1	0	\N	1	1	0	casual	0_5000	\N	\N	0_5000	\N	communal	none	train	public	water_only	river	6128d817-81e8-4215-9764-c85fe3064399	\N
1306	152	Paul Wahome Muthike	Male	01216828	\N	married	secondary	\N	38	tenant	\N	1	2	0	0	2	2	2	0	1	2	2	1	2	1	0	18	2	2	\N	1	1	1	not_applicable	16000_20000	\N	\N	0_5000	\N	pit_latrine	none	car	other	with_water_and_soap	private_collector	7d75ee44-5566-4ce1-9717-54edd1c4b7c8	\N
1307	206	Cody Chomba Stephen	Male	01923664	\N	Widowed	secondary	\N	17	tenant	\N	1	0	0	1	1	0	2	2	2	0	0	0	0	2	0	11	1	1	\N	1	0	0	casual	6000_10000	\N	\N	>20000	\N	none	river	bicycle	chemist	water_only	bins	19fece05-ddfa-49f1-b44d-616b1f458e52	\N
1308	186	Dana Yakub Nzuki	Female	56420213	\N	Cohabiting	university	\N	21	structure_owner	\N	2	2	0	0	1	2	0	2	1	1	2	0	2	1	1	17	1	1	\N	1	1	0	civil_servant	0_5000	\N	\N	11000_15000	\N	none	piped	bicycle	traditional	none	private_collector	53d4e3e9-08af-45cd-a289-d1f4f138c074	\N
1309	169	Kyle Kipchumba Abdalla	Male	32887577	\N	Seperated	university	\N	25	tenant	\N	2	0	1	1	0	1	2	1	1	0	0	2	1	1	0	13	0	2	\N	0	1	1	private	6000_10000	\N	\N	>20000	\N	VIP	river	train	private	with_water_and_soap	dumpsite	54fdefba-2b10-44c8-b4af-a2a3ea5800eb	\N
1310	230	Ashley Chebon Ndiritu	Female	30125766	\N	married	primary	\N	32	plot_Owner	\N	2	0	0	0	1	2	0	2	0	1	2	2	0	1	1	14	2	1	\N	0	1	1	not_applicable	11000_15000	\N	\N	11000_15000	\N	none	shallow_well	bicycle	traditional	with_water_and_soap	river	91d54afe-14c8-47ba-937a-47d48a2e4b1b	\N
1311	78	Natasha Ronoh Mbogo	Female	88234308	\N	Single	college	\N	13	plot_Owner	\N	1	1	1	1	1	2	1	2	2	1	0	0	2	2	1	18	1	1	\N	1	0	0	student	16000_20000	\N	\N	0_5000	\N	flush	none	train	other	water_only	bins	1ab72526-8311-4d64-9d02-9dd95a85a73b	\N
1312	127	Melissa Kimosop Chepkosgei	Female	26855618	\N	Single	university	\N	5	tenant	\N	0	2	2	1	1	2	1	0	1	0	0	0	2	1	0	13	2	1	\N	0	0	1	civil_servant	6000_10000	\N	\N	>20000	\N	communal	piped	walk	private	water_only	private_collector	d21aa6ff-08db-4f01-9ccb-8f4c55a581d2	\N
1313	74	Lisa Ekidor Ngome	Female	79316820	\N	Single	secondary	\N	29	tenant	\N	2	2	0	2	1	2	0	1	1	2	0	0	2	2	1	18	2	0	\N	1	0	1	civil_servant	6000_10000	\N	\N	>20000	\N	VIP	none	car	public	none	dumpsite	d983958f-0e6c-4eac-a178-c6af819ec31c	\N
1314	58	Erica Nyale Ngina	Female	53529538	\N	Widowed	secondary	\N	2	structure_owner	\N	2	1	1	2	0	1	1	2	2	0	2	2	2	0	2	20	1	0	\N	1	0	0	private	6000_10000	\N	\N	0_5000	\N	pit_latrine	none	matatu	private	with_water_and_soap	dumpsite	a5e621be-8468-4532-993a-1415565d7f2b	\N
1315	173	Nicole Mogire Ekitela	Female	16604698	\N	Widowed	college	\N	26	structure_owner	\N	2	2	0	2	0	2	0	1	2	2	0	1	2	0	0	16	0	1	\N	0	0	1	private	16000_20000	\N	\N	16000_20000	\N	VIP	piped	walk	chemist	water_only	private_collector	3ff416e0-226d-476e-a428-9d7941f8fcb3	\N
1316	121	Amy Cheboi Minayo	Female	74701792	\N	Seperated	primary	\N	20	plot_Owner	\N	1	2	2	0	2	2	0	1	0	0	1	1	2	1	1	16	0	1	\N	0	0	0	casual	6000_10000	\N	\N	>20000	\N	VIP	shallow_well	walk	private	with_water_and_soap	bins	629d8416-105a-463a-8be6-37c94d13dc45	\N
1317	226	Vickie Samuel Nyaguthii	Female	40397812	\N	Seperated	college	\N	25	structure_owner	\N	2	2	1	2	2	1	1	0	2	2	2	1	1	1	1	21	1	1	\N	1	1	0	student	>20000	\N	\N	0_5000	\N	pit_latrine	vendor	matatu	mission	none	private_collector	02c295af-aff6-4978-9acb-1e63d7cf8c45	\N
1318	78	Dustin Kinoti Kurgat	Male	43625163	\N	Widowed	university	\N	8	plot_Owner	\N	0	2	2	2	2	0	2	1	0	2	1	0	0	0	1	15	2	1	\N	0	1	1	private	6000_10000	\N	\N	16000_20000	\N	pit_latrine	piped	bicycle	other	water_only	dumpsite	cda79873-15c3-4f30-a923-450df53c6b2c	\N
1319	156	Jesse Nandwa Mwakio	Male	35740663	\N	Single	college	\N	12	tenant	\N	0	2	2	1	2	2	2	1	2	1	2	2	2	1	1	23	2	0	\N	1	1	1	student	0_5000	\N	\N	11000_15000	\N	pit_latrine	piped	boda	other	with_water_and_soap	private_collector	f87ab732-1957-41bc-8947-b04392ec83a3	\N
1320	189	Charles Karuga Muraguri	Male	56930316	\N	Widowed	university	\N	20	structure_owner	\N	1	2	1	0	0	2	2	2	0	0	2	0	2	0	1	15	2	0	\N	0	0	0	casual	16000_20000	\N	\N	>20000	\N	communal	vendor	walk	mission	none	dumpsite	8db03fae-6786-47ca-af13-8ae74c701ca9	\N
1321	235	Natasha Kiprotich Mutethia	Female	11255509	\N	Single	none	\N	34	plot_Owner	\N	0	2	0	1	0	0	1	2	0	0	2	0	1	1	1	11	2	1	\N	1	1	0	casual	11000_15000	\N	\N	16000_20000	\N	communal	piped	bicycle	traditional	none	river	0cc1a57f-8574-441a-b29f-d37c9da39b48	\N
1322	228	Angelica Wangui Gichuru	Female	41740336	\N	Widowed	university	\N	31	plot_Owner	\N	2	0	1	0	0	1	1	2	1	2	2	2	2	0	1	17	0	2	\N	1	0	1	casual	0_5000	\N	\N	>20000	\N	none	rainwater	boda	traditional	with_water_and_soap	private_collector	d69be29e-00f5-4bf6-99ff-b51f600ea173	\N
1323	182	Ashley Wanjohi Chomba	Female	23696197	\N	Seperated	none	\N	25	plot_Owner	\N	2	0	0	1	2	0	1	1	0	2	0	1	1	1	2	14	1	2	\N	0	1	0	casual	11000_15000	\N	\N	6000_10000	\N	none	river	bicycle	private	water_only	private_collector	afec751f-863b-4985-b25e-a49ebbc3aaac	\N
1324	1	Brian Issack Jeptoo	Male	20331107	\N	married	none	\N	40	tenant	\N	2	0	1	2	2	2	0	2	1	0	2	0	1	1	2	18	1	2	\N	1	1	0	self	6000_10000	\N	\N	0_5000	\N	VIP	shallow_well	walk	mission	water_only	dumpsite	8bb13daa-fe66-4756-8e9e-dab0917a2bb3	\N
1325	195	Robert Kimemia Safari	Male	24394480	\N	married	none	\N	23	plot_Owner	\N	1	0	0	1	2	2	0	0	2	0	1	1	2	0	0	12	0	0	\N	0	0	0	civil_servant	0_5000	\N	\N	16000_20000	\N	flush	shallow_well	bicycle	mission	none	bins	da438361-1c6b-4de6-986e-98a65bdfeef9	\N
1326	147	Maria Murimi Muthomi	Female	46778718	\N	Widowed	secondary	\N	12	tenant	\N	0	2	2	1	1	1	2	1	2	0	1	0	1	2	0	16	1	0	\N	0	1	0	civil_servant	6000_10000	\N	\N	11000_15000	\N	VIP	none	matatu	other	none	river	836f9027-da97-4e1b-beaa-20fe21251889	\N
1327	155	Ivan Maithya Nyanchama	Male	80054346	\N	Cohabiting	college	\N	13	tenant	\N	0	0	0	1	1	1	0	1	1	0	2	2	0	1	0	10	2	1	\N	1	1	0	student	11000_15000	\N	\N	16000_20000	\N	pit_latrine	rainwater	bicycle	mission	water_only	river	692dad20-5efb-4722-9ad4-7790267a76a4	\N
1328	46	Shannon Ewoi Esinyen	Female	53953374	\N	married	college	\N	19	structure_owner	\N	2	0	2	0	1	0	1	0	2	2	1	1	0	2	2	16	0	0	\N	1	1	0	student	6000_10000	\N	\N	>20000	\N	pit_latrine	rainwater	walk	other	none	river	f3853cd7-e210-4aad-8054-00c9982cbb8c	\N
1329	89	Erin Jimale Eyanae	Female	08579352	\N	Single	secondary	\N	39	plot_Owner	\N	0	0	0	0	2	2	1	1	1	1	2	1	0	2	0	13	0	2	\N	0	1	1	private	0_5000	\N	\N	0_5000	\N	flush	river	matatu	other	none	bins	d4d0f009-6831-4bc2-8c86-5b951b1375e7	\N
1330	207	Ryan Kigen Moturi	Male	56158844	\N	Cohabiting	university	\N	26	structure_owner	\N	0	0	2	1	0	1	2	1	2	2	0	2	1	1	0	15	1	2	\N	1	1	1	self	0_5000	\N	\N	16000_20000	\N	communal	shallow_well	bicycle	public	water_only	river	da5cc500-689d-42af-9d0e-a8ec9c501d22	\N
1331	45	Danny Munga Nkirote	Male	14559498	\N	married	primary	\N	24	structure_owner	\N	1	1	1	1	1	1	1	1	2	0	2	1	1	2	1	17	0	2	\N	0	0	0	not_applicable	6000_10000	\N	\N	16000_20000	\N	VIP	shallow_well	car	chemist	water_only	bins	136fd9bb-9a76-4e59-933d-6305deb415a7	\N
1332	165	Beverly Wanyonyi Sang	Female	84566273	\N	Widowed	university	\N	39	tenant	\N	2	1	1	0	0	0	0	1	0	1	2	0	2	0	1	11	1	0	\N	0	1	1	private	11000_15000	\N	\N	11000_15000	\N	VIP	vendor	matatu	private	with_water_and_soap	private_collector	015dd203-a50a-4d2f-b5e3-2465485897a3	\N
1333	103	Cheryl Kivuva Mwaura	Female	12719574	\N	Widowed	none	\N	25	tenant	\N	2	1	2	2	2	2	0	2	2	1	2	2	1	0	1	22	1	2	\N	0	1	1	unemployed	0_5000	\N	\N	6000_10000	\N	pit_latrine	river	car	other	none	private_collector	5acdcaa5-dfe6-441e-9752-fa313339f94b	\N
1334	131	Carrie Kimeu Ondieki	Female	59944144	\N	Cohabiting	university	\N	36	tenant	\N	1	1	0	1	2	1	1	2	2	2	0	0	2	0	2	17	0	2	\N	1	1	0	casual	0_5000	\N	\N	0_5000	\N	communal	shallow_well	car	public	water_only	river	8d24d74b-439e-497b-8dd0-f915fbbd7e68	\N
1335	20	Robert Jepchirchir Mohammed	Male	35363815	\N	Cohabiting	none	\N	32	tenant	\N	0	2	0	0	1	0	2	2	2	2	2	0	2	0	1	16	1	0	\N	0	1	0	self	16000_20000	\N	\N	11000_15000	\N	none	river	walk	traditional	none	private_collector	677d58ee-10e4-4f6d-85c2-188112d8aa58	\N
1336	219	Nancy Kipkemboi Mwiti	Female	26738887	\N	Single	primary	\N	36	plot_Owner	\N	0	2	0	1	0	1	0	2	0	0	0	2	0	0	2	10	1	2	\N	1	0	0	private	0_5000	\N	\N	0_5000	\N	communal	shallow_well	car	chemist	water_only	bins	b4beb3c4-7c99-4e9b-b72c-623fb8bb3808	\N
1337	127	Nicole Nyokabi Okeyo	Female	36164642	\N	married	none	\N	15	structure_owner	\N	1	2	0	1	0	2	2	2	0	0	0	0	0	0	2	12	0	0	\N	0	1	1	student	6000_10000	\N	\N	6000_10000	\N	pit_latrine	none	walk	traditional	water_only	dumpsite	4f297a81-0852-4cb0-b5e5-d87ecdef6002	\N
1338	59	Christopher Akinyi Akinyi	Male	18413994	\N	Cohabiting	none	\N	7	structure_owner	\N	2	0	2	1	0	0	2	1	2	2	2	0	0	2	2	18	2	0	\N	0	0	1	self	16000_20000	\N	\N	11000_15000	\N	communal	rainwater	walk	public	water_only	private_collector	696d1c15-bdd2-4e65-873b-d17db701ae84	\N
1339	207	Robert Kalama Murigi	Male	64497146	\N	Cohabiting	none	\N	14	plot_Owner	\N	1	2	2	0	1	0	2	0	2	2	2	0	2	0	2	18	2	2	\N	1	1	0	self	6000_10000	\N	\N	>20000	\N	none	piped	boda	traditional	none	bins	9643840f-7cbf-4032-9f69-d1ba9f9e806d	\N
1340	97	Natasha Mbuthia Ngige	Female	49661099	\N	Cohabiting	secondary	\N	28	structure_owner	\N	2	0	1	2	0	1	2	2	1	2	0	0	2	1	2	18	2	2	\N	0	0	1	casual	0_5000	\N	\N	>20000	\N	flush	none	bicycle	private	none	river	d0039bae-add6-4599-92ab-cecbaef2a2d2	\N
1341	5	Scott Nyaga Ondieki	Male	63928294	\N	married	college	\N	26	plot_Owner	\N	0	2	2	0	1	2	2	1	0	2	2	0	0	0	1	15	0	1	\N	1	0	1	unemployed	>20000	\N	\N	0_5000	\N	communal	none	matatu	chemist	water_only	dumpsite	41468869-2f35-4154-bb2a-3cd6e1b4014a	\N
1342	182	Allison Omwenga Apiyo	Female	74340008	\N	Single	none	\N	7	tenant	\N	1	2	0	1	1	1	1	0	2	2	2	2	2	1	1	19	0	2	\N	0	0	1	casual	16000_20000	\N	\N	>20000	\N	pit_latrine	shallow_well	matatu	other	none	private_collector	2ca1f88e-9436-4dc8-88d5-72dceac6605c	\N
1343	8	Richard Nkirote Wambua	Male	56971722	\N	Widowed	primary	\N	32	tenant	\N	2	0	0	2	2	1	1	1	2	1	2	1	1	1	2	19	2	0	\N	1	1	1	not_applicable	6000_10000	\N	\N	16000_20000	\N	communal	rainwater	car	other	water_only	river	7ba5fe8c-9bc0-4eb9-9ffe-cf9e2b24a7ca	\N
1344	172	Kyle Masese Otieno	Male	41512391	\N	Single	none	\N	35	plot_Owner	\N	0	2	1	1	1	2	1	0	0	0	2	1	0	2	2	15	1	0	\N	0	0	1	student	>20000	\N	\N	0_5000	\N	flush	rainwater	boda	private	none	private_collector	3df8f093-f82d-49fd-aca0-2b3dcfd83673	\N
1345	161	Victoria Pkemoi Nthiga	Female	60358842	\N	Cohabiting	primary	\N	32	plot_Owner	\N	0	2	0	1	2	1	1	1	2	1	0	1	1	2	2	17	0	2	\N	1	0	0	civil_servant	>20000	\N	\N	6000_10000	\N	pit_latrine	rainwater	boda	private	water_only	river	a484146e-d200-4851-9681-24cb5a5929da	\N
1346	87	Caitlyn Nanjala Wanjiku	Female	59732169	\N	Widowed	secondary	\N	34	plot_Owner	\N	2	0	1	0	0	2	2	1	1	0	0	0	0	2	2	13	1	1	\N	0	0	1	not_applicable	6000_10000	\N	\N	11000_15000	\N	pit_latrine	vendor	boda	private	with_water_and_soap	bins	71822f3b-a50a-48aa-9af5-3994c634a8dd	\N
1347	200	Alexis Kiptanui Kairu	Female	38386944	\N	Widowed	college	\N	37	tenant	\N	1	2	2	0	0	1	0	0	2	2	2	0	0	1	2	15	2	2	\N	0	1	1	private	16000_20000	\N	\N	16000_20000	\N	none	piped	matatu	traditional	none	dumpsite	13b6826b-ab0b-4061-a236-4757b66232fa	\N
1348	83	Daniel Kendi Wechuli	Male	60479785	\N	Single	primary	\N	30	structure_owner	\N	1	2	0	1	2	2	1	1	1	0	2	0	2	0	0	15	1	0	\N	0	0	1	student	0_5000	\N	\N	>20000	\N	VIP	piped	matatu	chemist	none	river	6852475d-94d9-4fa1-808c-5f0bb88d752b	\N
1349	199	Jose Kivuva Cheruiyot	Male	76229999	\N	married	secondary	\N	29	structure_owner	\N	1	0	1	2	0	0	0	1	2	2	2	0	2	0	2	15	0	2	\N	1	0	1	casual	>20000	\N	\N	>20000	\N	pit_latrine	vendor	matatu	chemist	water_only	dumpsite	8f2a57fa-b92d-4e2a-861c-88d763b27fa7	\N
1350	79	Theresa Mutethia Nyakio	Female	47454606	\N	Single	primary	\N	29	structure_owner	\N	2	1	2	2	0	0	2	0	2	1	1	0	0	1	0	14	2	2	\N	0	0	0	student	16000_20000	\N	\N	6000_10000	\N	VIP	piped	train	public	with_water_and_soap	dumpsite	711f60de-723c-469f-bbd4-b077e711ec17	\N
1351	19	Peggy Akumu Lagat	Female	00136520	\N	Single	none	\N	19	structure_owner	\N	2	1	1	0	0	2	2	1	2	1	2	2	1	2	0	19	1	0	\N	1	0	0	casual	0_5000	\N	\N	0_5000	\N	flush	river	matatu	other	with_water_and_soap	river	8e7ef4d4-11e1-4d35-a4dc-b443bfed94ee	\N
1352	162	Brandi Maranga Marwa	Female	73485983	\N	Single	secondary	\N	3	tenant	\N	0	2	2	2	0	1	1	1	2	2	0	1	1	2	0	17	1	2	\N	0	1	1	casual	16000_20000	\N	\N	0_5000	\N	none	river	matatu	mission	none	private_collector	36a11897-ddc9-4f76-bb34-78a292467392	\N
1353	14	Angel Chesire Maritim	Male	28591965	\N	Single	primary	\N	10	tenant	\N	2	1	1	1	2	1	2	2	2	0	2	0	0	1	0	17	1	0	\N	1	0	1	student	>20000	\N	\N	16000_20000	\N	communal	shallow_well	train	chemist	none	private_collector	5ed8603b-59fb-46a6-a351-190ff9b9c4bc	\N
1354	202	Amanda Soita Kakai	Female	52769421	\N	Widowed	college	\N	31	plot_Owner	\N	2	0	0	1	0	0	0	0	2	0	2	1	0	0	0	8	1	0	\N	0	1	0	not_applicable	6000_10000	\N	\N	6000_10000	\N	flush	shallow_well	bicycle	private	none	river	85d15297-dac4-469e-b2ee-5362c18a08b0	\N
1355	99	Kevin Abdullahi Tuwei	Male	87270589	\N	Seperated	university	\N	2	tenant	\N	1	2	1	1	2	0	2	0	2	2	0	0	2	2	0	17	1	1	\N	0	0	1	student	>20000	\N	\N	>20000	\N	flush	river	matatu	chemist	water_only	river	5afe9ba8-73e1-4feb-8a75-8e137d084f2f	\N
1356	167	William Joel Omweri	Male	43177142	\N	married	university	\N	34	structure_owner	\N	1	0	1	1	1	0	1	2	0	0	1	1	2	1	1	13	0	0	\N	0	1	1	casual	6000_10000	\N	\N	0_5000	\N	communal	none	matatu	other	with_water_and_soap	dumpsite	42214d74-b895-4130-b819-dd20acbb3f8a	\N
1357	174	Brian Mitei Etyang	Male	85311533	\N	Widowed	none	\N	9	plot_Owner	\N	2	1	2	1	2	1	0	2	1	0	1	0	2	1	2	18	0	0	\N	0	0	0	self	0_5000	\N	\N	0_5000	\N	VIP	vendor	boda	mission	water_only	river	25d27572-b592-426b-babb-6f079f486507	\N
1358	233	Patrick Kiilu Makori	Male	38467054	\N	Cohabiting	primary	\N	27	plot_Owner	\N	1	2	1	1	0	2	1	0	1	1	0	2	2	1	0	15	2	0	\N	1	0	1	civil_servant	0_5000	\N	\N	11000_15000	\N	VIP	vendor	bicycle	chemist	with_water_and_soap	bins	2cf57053-16db-4d29-ad5c-5224c538156f	\N
1359	141	Brian Chenangat Kinyua	Male	73879499	\N	Seperated	college	\N	9	tenant	\N	2	0	0	0	0	1	2	0	2	1	1	2	2	1	0	14	0	0	\N	1	0	0	not_applicable	16000_20000	\N	\N	0_5000	\N	pit_latrine	piped	bicycle	mission	none	dumpsite	79bd2583-287b-4ce2-8970-eb242b62b6ac	\N
1360	230	Christopher Ngure Ongeri	Male	21898171	\N	Single	secondary	\N	32	tenant	\N	0	0	2	1	2	0	0	1	1	2	0	0	0	2	0	11	1	1	\N	0	0	1	casual	6000_10000	\N	\N	16000_20000	\N	none	shallow_well	boda	other	none	private_collector	f5aaffd6-235e-49f5-b303-61c69bb132e1	\N
1361	134	Jennifer Krop Osoro	Female	28082343	\N	Single	college	\N	34	structure_owner	\N	1	0	2	1	0	2	0	0	0	2	2	1	1	1	1	14	0	0	\N	0	1	1	not_applicable	6000_10000	\N	\N	0_5000	\N	communal	vendor	matatu	mission	with_water_and_soap	river	be3afb38-6ece-48f6-bdc3-14a32b5e7a4f	\N
1362	141	Megan Nyabuti Kipngetich	Female	15746080	\N	Single	university	\N	23	plot_Owner	\N	1	1	1	0	1	1	1	2	1	1	1	0	2	0	2	15	1	1	\N	0	1	1	civil_servant	>20000	\N	\N	11000_15000	\N	communal	none	walk	public	none	river	c1350261-17fe-4dc2-82ae-c1d1e2eaac82	\N
1363	199	Jason Bett Mutuma	Male	71985450	\N	Single	university	\N	25	structure_owner	\N	1	2	1	2	1	0	0	0	0	2	2	1	0	2	0	14	1	1	\N	1	0	0	casual	0_5000	\N	\N	0_5000	\N	VIP	none	matatu	public	water_only	dumpsite	8b238930-c1ef-4ee4-aba5-f6ea68146e9f	\N
1364	111	Christopher Masha Rop	Male	08667230	\N	Seperated	secondary	\N	11	tenant	\N	2	2	1	0	1	2	2	2	0	1	2	2	0	2	0	19	2	0	\N	1	0	0	civil_servant	16000_20000	\N	\N	11000_15000	\N	none	vendor	boda	private	water_only	river	0fdd276d-6425-4e18-bf7e-8863888df25f	\N
1365	208	Anthony Naibei Odira	Male	21470746	\N	Single	university	\N	36	structure_owner	\N	0	0	2	2	0	0	1	0	0	1	0	1	1	1	1	10	0	1	\N	1	1	0	self	>20000	\N	\N	11000_15000	\N	pit_latrine	piped	car	public	water_only	private_collector	64465eb2-1dd6-4146-87ad-153be08f0a49	\N
1366	129	Kristi Philip Wangeci	Female	25549490	\N	Seperated	college	\N	9	tenant	\N	0	1	1	1	2	1	0	1	1	2	1	0	2	1	1	15	2	0	\N	0	1	1	student	>20000	\N	\N	0_5000	\N	pit_latrine	none	boda	chemist	none	river	df2ef80c-ddbf-4d19-ba30-d169164c5eab	\N
1367	31	Anthony Munga Fondo	Male	80061936	\N	married	college	\N	2	structure_owner	\N	2	1	2	2	1	1	2	1	0	0	1	2	2	0	1	18	2	2	\N	0	0	1	not_applicable	16000_20000	\N	\N	6000_10000	\N	pit_latrine	river	train	traditional	none	private_collector	8471648d-23e7-4cde-a403-71ba4bd81eb2	\N
1368	118	Tina Wanga Awadh	Female	79872532	\N	Cohabiting	none	\N	2	plot_Owner	\N	2	2	0	1	1	0	0	2	1	1	2	1	0	0	1	14	0	0	\N	1	1	1	self	16000_20000	\N	\N	>20000	\N	pit_latrine	piped	train	traditional	with_water_and_soap	river	f7d589d6-b6e8-4f89-8954-2f40ea982263	\N
1369	9	James Omwenga Kimemia	Male	24287235	\N	Cohabiting	college	\N	13	tenant	\N	0	1	1	1	2	0	1	2	0	0	0	2	2	2	1	15	0	1	\N	1	1	1	not_applicable	16000_20000	\N	\N	0_5000	\N	pit_latrine	rainwater	matatu	chemist	with_water_and_soap	dumpsite	471cde0e-32c3-424a-88c7-8f2aa5aea637	\N
1370	218	Joseph Toroitich Mmbone	Male	77335567	\N	married	none	\N	37	plot_Owner	\N	0	1	0	0	1	1	2	0	0	1	2	1	2	0	1	12	1	1	\N	0	1	0	private	>20000	\N	\N	6000_10000	\N	VIP	river	car	public	none	river	d1384657-f3ba-4961-aefc-ff018bd255b0	\N
1371	75	Gregory Tanui Terer	Male	19870038	\N	Widowed	college	\N	11	tenant	\N	0	1	0	1	1	0	1	2	2	1	0	1	1	1	1	13	1	1	\N	0	1	1	civil_servant	0_5000	\N	\N	11000_15000	\N	pit_latrine	river	train	private	with_water_and_soap	dumpsite	e9c1c073-883d-4a8e-a562-ae670414b6f0	\N
1372	11	Edwin Murangiri Mwaka	Male	16418824	\N	Seperated	secondary	\N	29	plot_Owner	\N	2	2	2	0	0	1	2	0	1	1	0	0	2	0	1	14	1	1	\N	1	0	1	private	6000_10000	\N	\N	16000_20000	\N	pit_latrine	none	walk	chemist	water_only	dumpsite	4e73e720-cc2f-4bba-bdcc-0757caed49d3	\N
1373	32	Stephen Issa Ogega	Male	24763089	\N	Single	primary	\N	33	structure_owner	\N	0	0	1	0	1	1	0	2	1	0	1	2	2	1	0	12	0	1	\N	1	0	1	civil_servant	0_5000	\N	\N	>20000	\N	communal	river	bicycle	traditional	water_only	dumpsite	2b7bafd8-d6f5-4ef0-8471-714da21bbd89	\N
1374	204	Garrett Migwi Okoth	Male	70196644	\N	Cohabiting	none	\N	0	tenant	\N	1	1	1	1	0	0	1	0	0	0	2	2	0	2	2	13	2	1	\N	1	0	0	casual	11000_15000	\N	\N	0_5000	\N	VIP	river	walk	chemist	water_only	private_collector	4f900d22-a317-4a09-9c6b-2226bd26e77c	\N
1375	63	Cody Ndung'u Kiptoo	Male	77102903	\N	Single	primary	\N	28	plot_Owner	\N	2	0	1	2	1	1	1	0	1	0	1	0	2	1	1	14	1	2	\N	0	1	1	unemployed	>20000	\N	\N	>20000	\N	none	rainwater	bicycle	private	water_only	private_collector	900472e1-6726-4b84-8266-3a3d689fd534	\N
1376	167	Mark Kathure Omweri	Male	83046021	\N	Seperated	secondary	\N	9	plot_Owner	\N	2	2	0	2	0	0	0	0	1	0	1	2	2	2	2	16	1	0	\N	0	1	1	not_applicable	11000_15000	\N	\N	16000_20000	\N	none	rainwater	matatu	other	none	bins	31a0ee41-ea10-4982-82aa-7db06348e8d3	\N
1377	77	Christian Kamathi Kwemoi	Male	72114159	\N	Widowed	university	\N	33	tenant	\N	0	1	1	2	2	1	0	1	2	2	0	1	2	2	1	18	0	1	\N	1	1	1	student	0_5000	\N	\N	0_5000	\N	pit_latrine	vendor	car	mission	with_water_and_soap	river	6a228717-28c3-47a4-a49e-a37ee875d290	\N
1378	133	Alyssa Ngari Kurgat	Female	34439292	\N	Widowed	university	\N	12	tenant	\N	1	0	0	0	0	1	1	0	0	1	1	1	1	2	1	10	1	1	\N	0	1	1	self	11000_15000	\N	\N	0_5000	\N	communal	rainwater	car	mission	with_water_and_soap	bins	b6080a64-fd6d-45ef-b178-a899a6498c74	\N
1379	198	Michael Maloba Mulei	Male	75637533	\N	Widowed	none	\N	1	tenant	\N	1	1	0	0	0	1	2	2	1	0	2	1	1	1	1	14	2	2	\N	0	1	0	not_applicable	11000_15000	\N	\N	>20000	\N	none	river	boda	other	none	river	476fc187-a4ba-43c4-a25a-6333a87c7e5d	\N
1380	151	Kevin Kangethe Richard	Male	88804637	\N	Seperated	university	\N	33	plot_Owner	\N	2	1	0	1	1	0	1	1	2	1	1	1	1	0	2	15	1	1	\N	0	1	1	self	>20000	\N	\N	>20000	\N	VIP	rainwater	boda	traditional	with_water_and_soap	bins	780393a6-d138-4cab-9083-6ddb5c066356	\N
1381	231	Ricky Chesire Tsuma	Male	37784257	\N	married	secondary	\N	28	structure_owner	\N	0	2	0	0	2	0	1	0	1	1	0	2	1	2	0	12	2	1	\N	0	0	0	casual	11000_15000	\N	\N	0_5000	\N	none	piped	car	traditional	none	private_collector	0a19ef2b-3e1e-45c0-9748-475b4248e2e7	\N
1382	210	Richard Katana Makori	Male	63652928	\N	Single	none	\N	29	plot_Owner	\N	0	2	2	0	1	2	1	0	1	2	1	2	2	2	2	20	1	2	\N	0	1	1	self	16000_20000	\N	\N	6000_10000	\N	flush	rainwater	train	private	water_only	bins	2f414e49-66db-4508-a611-8f9318f8fe46	\N
1383	127	David Lumbasi Oginga	Male	30136791	\N	Single	university	\N	25	plot_Owner	\N	0	0	0	2	1	2	2	0	0	2	1	0	2	2	0	14	1	2	\N	1	0	1	civil_servant	11000_15000	\N	\N	16000_20000	\N	flush	vendor	bicycle	chemist	water_only	bins	fe7c41e4-3c0e-4bc0-90b1-4f56e38ecb12	\N
1384	181	Shannon Muthini Kibiwot	Female	24715385	\N	Widowed	college	\N	39	structure_owner	\N	1	1	2	2	0	1	2	2	2	0	0	2	0	1	1	17	1	1	\N	1	1	0	casual	0_5000	\N	\N	16000_20000	\N	communal	shallow_well	bicycle	traditional	water_only	river	142b098b-d90f-4282-9bbb-e0ac67d2d3ae	\N
1385	38	Alice Mwende David	Female	46139469	\N	Widowed	college	\N	19	structure_owner	\N	2	0	1	1	0	2	2	1	1	2	2	0	2	0	1	17	0	2	\N	0	1	1	private	>20000	\N	\N	>20000	\N	flush	piped	matatu	public	water_only	private_collector	b7901d71-1ac8-449e-afbe-5fb1adfb0998	\N
1386	15	Crystal Nyamawi Kariuki	Female	54099381	\N	Widowed	primary	\N	9	tenant	\N	1	0	2	2	2	2	0	0	1	1	1	2	0	0	0	14	1	0	\N	1	0	1	not_applicable	>20000	\N	\N	6000_10000	\N	communal	none	matatu	mission	none	private_collector	90e6bd2e-a902-4d00-907a-6017f5464a8e	\N
1387	119	David Odiwuor Masika	Male	44401666	\N	Cohabiting	none	\N	1	structure_owner	\N	0	0	0	1	0	0	0	2	0	0	1	1	2	0	2	9	1	2	\N	1	1	0	casual	16000_20000	\N	\N	0_5000	\N	pit_latrine	none	train	public	with_water_and_soap	dumpsite	1424afd2-5f88-49f2-adf3-006c0f857e9c	\N
1388	146	Richard Mureithi Chomba	Male	57475079	\N	Seperated	secondary	\N	9	tenant	\N	2	0	1	1	0	2	2	0	1	1	2	2	2	1	2	19	1	1	\N	1	0	1	unemployed	16000_20000	\N	\N	>20000	\N	flush	rainwater	car	private	water_only	private_collector	e8f32ff1-5a52-46d3-bd9a-756736b19bde	\N
1389	80	Michelle Sang Chenangat	Female	75709703	\N	Single	university	\N	1	tenant	\N	1	2	2	1	1	2	1	0	1	2	2	1	1	2	2	21	0	0	\N	1	1	0	not_applicable	0_5000	\N	\N	11000_15000	\N	pit_latrine	rainwater	matatu	mission	water_only	bins	571a4555-b3a2-4ca1-81d4-75ad4d3b1725	\N
1390	178	Tracey Mutio Karuga	Female	09323524	\N	married	secondary	\N	17	tenant	\N	0	2	1	0	2	2	0	0	1	2	2	0	1	2	1	16	0	1	\N	0	1	1	civil_servant	0_5000	\N	\N	11000_15000	\N	flush	vendor	bicycle	chemist	water_only	dumpsite	a65770b4-44b7-45e9-8db8-82f9c98652e9	\N
1391	94	Danny Sidi Bosire	Male	60822154	\N	Widowed	primary	\N	0	structure_owner	\N	2	2	1	0	1	2	1	2	1	1	2	2	1	0	1	19	1	2	\N	1	0	0	unemployed	6000_10000	\N	\N	>20000	\N	none	none	matatu	mission	with_water_and_soap	private_collector	0acec894-f0d7-4ee2-aedb-bc0d05021eae	\N
1392	101	Christina Kipkosgei Chepkirui	Female	16171590	\N	Seperated	secondary	\N	11	plot_Owner	\N	2	2	1	1	2	2	1	1	0	0	1	0	1	1	1	16	1	1	\N	1	0	0	unemployed	0_5000	\N	\N	11000_15000	\N	flush	river	walk	traditional	with_water_and_soap	private_collector	79b375c9-31f9-4521-82b2-d10e36356982	\N
1393	211	Dennis Jerotich Odoyo	Male	17411540	\N	Seperated	none	\N	31	plot_Owner	\N	1	2	1	0	1	0	1	0	2	1	1	2	0	2	0	14	1	1	\N	0	1	0	not_applicable	11000_15000	\N	\N	16000_20000	\N	none	river	walk	public	with_water_and_soap	bins	d30b9b85-624e-403d-9110-0afcd7124415	\N
1394	32	Oscar Kairu Nelima	Male	26343065	\N	Widowed	secondary	\N	32	plot_Owner	\N	1	2	0	2	2	1	1	1	2	0	2	2	1	0	2	19	0	2	\N	0	1	0	private	6000_10000	\N	\N	11000_15000	\N	flush	rainwater	walk	chemist	water_only	dumpsite	0bf27061-ae49-40b1-ada2-65d0f7586c02	\N
1395	23	Joseph Nanjala Jumba	Male	54189928	\N	married	none	\N	28	structure_owner	\N	2	1	2	1	2	0	1	2	1	2	0	2	0	0	1	17	0	0	\N	1	0	0	civil_servant	0_5000	\N	\N	16000_20000	\N	VIP	piped	matatu	other	none	bins	f9e392a6-e00f-43ee-9418-ab3fabfd8ac1	\N
1396	22	James Sakwa Sammy	Male	58673749	\N	Cohabiting	primary	\N	2	plot_Owner	\N	1	2	2	2	1	1	0	1	0	1	0	2	2	1	2	18	2	1	\N	1	1	1	self	6000_10000	\N	\N	>20000	\N	communal	shallow_well	car	traditional	none	river	6a8096dd-2d7b-4eaa-8af7-af14775e5333	\N
1397	95	Mackenzie Chacha Mbiti	Female	23664468	\N	married	college	\N	37	structure_owner	\N	2	1	0	1	0	0	2	0	1	0	1	2	1	2	1	14	1	1	\N	0	1	1	student	0_5000	\N	\N	11000_15000	\N	VIP	river	boda	private	none	dumpsite	52e526ae-1291-480d-8fc4-d56069a7c280	\N
1398	78	Judith Nyangau Mutie	Female	11639817	\N	Single	primary	\N	35	tenant	\N	1	2	0	2	0	2	2	0	1	0	0	1	0	2	1	14	1	1	\N	1	0	1	unemployed	0_5000	\N	\N	16000_20000	\N	none	none	walk	traditional	with_water_and_soap	dumpsite	7b8334f5-d1a2-4cf4-bbae-1cc4c0952eee	\N
1399	49	Christopher Onsongo Nyawira	Male	83209978	\N	Widowed	primary	\N	18	plot_Owner	\N	2	0	1	2	0	1	0	1	1	2	1	0	1	0	2	14	2	0	\N	0	0	0	student	16000_20000	\N	\N	16000_20000	\N	none	river	train	chemist	water_only	dumpsite	946883ef-2405-445b-ba7b-d592cbfc36c1	\N
1400	24	Michael Ogega Kimeli	Male	02716806	\N	Seperated	none	\N	22	tenant	\N	0	2	1	0	2	0	0	2	0	1	0	2	2	0	2	14	2	2	\N	1	1	0	student	6000_10000	\N	\N	16000_20000	\N	pit_latrine	rainwater	bicycle	chemist	water_only	private_collector	38da9199-906c-4844-8bac-f949337eead4	\N
1401	45	Ashley Ochieng Kipkemei	Female	15716943	\N	Seperated	college	\N	22	tenant	\N	0	0	2	1	0	1	2	0	2	2	0	0	2	0	0	12	0	2	\N	0	1	1	student	11000_15000	\N	\N	11000_15000	\N	pit_latrine	vendor	walk	traditional	with_water_and_soap	private_collector	f0e894d8-47dc-4774-ab90-380f13e4a599	\N
1402	185	Katherine Rioba Murangiri	Female	66299818	\N	Seperated	none	\N	19	structure_owner	\N	0	1	1	0	2	2	2	1	1	2	0	0	2	0	1	15	1	1	\N	0	1	1	civil_servant	0_5000	\N	\N	6000_10000	\N	none	piped	boda	private	none	dumpsite	a3486a02-0c4c-4a0c-ab66-c7d48eb93d9f	\N
1403	100	Michael Mambo Oketch	Male	34855866	\N	Cohabiting	college	\N	9	tenant	\N	2	0	0	2	0	2	0	0	2	0	1	2	1	2	0	14	0	0	\N	1	0	0	civil_servant	11000_15000	\N	\N	11000_15000	\N	communal	river	walk	other	water_only	private_collector	c3b9644d-8e3a-4e1b-96ef-07a1bf720656	\N
1404	126	Cynthia Oketch Kimosop	Female	13145027	\N	Seperated	none	\N	29	tenant	\N	0	0	0	2	2	2	0	0	2	1	1	0	0	2	1	13	1	2	\N	1	0	1	self	0_5000	\N	\N	6000_10000	\N	VIP	piped	boda	chemist	water_only	river	7d2bdf08-52eb-4e40-b430-9fe293f63b99	\N
1405	35	Randy Ngure Chesang	Male	13575795	\N	Widowed	none	\N	15	tenant	\N	2	1	0	1	0	1	0	0	0	2	0	1	2	0	2	12	0	2	\N	1	0	1	civil_servant	6000_10000	\N	\N	0_5000	\N	communal	rainwater	boda	private	with_water_and_soap	bins	f0ce015e-282c-4569-9977-f0914376d0bc	\N
1406	187	Nathaniel Chirchir Kaari	Male	38462442	\N	married	none	\N	26	structure_owner	\N	2	1	0	2	1	1	2	0	0	1	0	2	1	2	1	16	0	0	\N	0	1	1	unemployed	0_5000	\N	\N	11000_15000	\N	flush	river	walk	private	none	bins	104feeee-5866-4d32-83b8-188664dc0216	\N
1407	223	Thomas Kiama Stephen	Male	43222758	\N	married	primary	\N	23	plot_Owner	\N	0	0	0	1	2	1	1	0	0	1	2	1	2	0	2	13	2	1	\N	1	1	0	student	16000_20000	\N	\N	11000_15000	\N	none	shallow_well	car	other	with_water_and_soap	bins	ba0c2793-9540-443c-8753-6b94ea9dd6cf	\N
1408	31	Michael Makori Anyango	Male	12383370	\N	married	university	\N	27	plot_Owner	\N	1	2	2	2	2	1	2	0	0	0	0	2	1	1	0	16	1	2	\N	1	1	0	not_applicable	16000_20000	\N	\N	16000_20000	\N	flush	shallow_well	bicycle	other	water_only	dumpsite	7fe4aa3c-e8a5-4db2-b2b0-1517517cbd68	\N
1409	106	Edwin Nyakio Issa	Male	07981957	\N	married	secondary	\N	26	tenant	\N	2	0	1	1	0	1	1	1	2	1	0	0	0	1	1	12	2	0	\N	1	1	0	unemployed	6000_10000	\N	\N	6000_10000	\N	flush	river	car	public	none	private_collector	af161314-4ef0-4aea-a55b-b5b717e3e7ed	\N
1410	131	Tracy Francis Mutethia	Female	42184101	\N	Single	university	\N	9	plot_Owner	\N	1	0	0	2	1	2	2	0	1	0	0	0	2	1	0	12	0	0	\N	1	0	1	civil_servant	11000_15000	\N	\N	16000_20000	\N	flush	piped	matatu	chemist	with_water_and_soap	private_collector	5ae3e5ba-8808-4f8d-a79c-05e15e8cb958	\N
1411	116	Jennifer Awadh Shikuku	Female	22632777	\N	Widowed	university	\N	5	plot_Owner	\N	1	1	1	1	0	1	2	2	0	2	0	2	1	1	2	17	2	2	\N	1	1	1	not_applicable	6000_10000	\N	\N	>20000	\N	pit_latrine	rainwater	walk	public	water_only	dumpsite	5874465d-442f-4126-8214-2799db4bf45a	\N
1412	99	Nicholas Ndanu Koech	Male	14446234	\N	married	college	\N	13	tenant	\N	2	1	1	1	0	0	2	2	2	0	2	0	2	2	1	18	1	0	\N	0	1	0	self	0_5000	\N	\N	0_5000	\N	flush	river	walk	chemist	with_water_and_soap	dumpsite	1d449dd3-365e-4b65-b832-53352ea3bbaa	\N
1413	222	Kimberly Kageha Ndiritu	Female	28184382	\N	Single	none	\N	22	structure_owner	\N	2	2	2	2	1	2	2	2	2	0	0	0	0	0	1	18	0	0	\N	0	1	0	unemployed	16000_20000	\N	\N	11000_15000	\N	pit_latrine	vendor	bicycle	chemist	none	river	ee4bff8b-4bde-479e-8d73-ef880e37f095	\N
1414	57	Sarah Yator Omweri	Female	37354972	\N	Widowed	university	\N	38	plot_Owner	\N	1	2	1	0	2	0	0	2	2	0	1	0	2	0	2	15	0	0	\N	0	1	0	civil_servant	6000_10000	\N	\N	0_5000	\N	none	vendor	bicycle	mission	with_water_and_soap	private_collector	422bed23-6f06-499f-a9e2-98468df1b009	\N
1415	34	Karen Nyamawi Kemei	Female	30920874	\N	Cohabiting	university	\N	5	tenant	\N	2	0	0	1	1	2	1	0	2	0	0	1	2	2	2	16	1	0	\N	0	0	1	student	16000_20000	\N	\N	6000_10000	\N	flush	rainwater	matatu	mission	none	private_collector	33b5b7f3-0017-4afc-9c29-386cae58304e	\N
1416	71	Joshua Cherutich Jeptoo	Male	52367287	\N	Cohabiting	college	\N	15	plot_Owner	\N	0	2	0	0	2	1	1	0	0	1	0	2	1	0	1	11	1	0	\N	1	1	0	casual	16000_20000	\N	\N	0_5000	\N	pit_latrine	river	matatu	public	none	bins	1e805c84-644f-4139-b80c-01bcc6d6f302	\N
1417	209	Jacqueline Muigai Mwololo	Female	88357819	\N	Single	none	\N	36	structure_owner	\N	0	0	2	1	2	0	0	0	1	0	1	0	0	1	2	10	1	1	\N	0	0	1	self	16000_20000	\N	\N	>20000	\N	pit_latrine	river	matatu	other	none	bins	c17d4381-2ccb-42a3-aa87-8827ea709285	\N
1418	177	Brianna Oyugi Were	Female	29694775	\N	married	college	\N	12	structure_owner	\N	1	1	0	2	2	1	2	1	0	0	0	2	0	0	2	14	1	0	\N	1	1	0	private	11000_15000	\N	\N	11000_15000	\N	none	vendor	train	chemist	water_only	bins	007c0837-afc3-4544-bacc-10845943d1ac	\N
1419	53	Robert Elijah Gatimu	Male	02703503	\N	Seperated	university	\N	37	structure_owner	\N	2	0	0	0	2	0	2	0	1	1	1	2	0	0	0	11	0	2	\N	1	0	1	not_applicable	11000_15000	\N	\N	6000_10000	\N	none	river	train	public	water_only	bins	cc29d90e-2269-4837-be04-189e26d83b1d	\N
1420	116	Anthony Nduati Nzau	Male	07993013	\N	married	college	\N	0	tenant	\N	0	2	2	1	0	0	2	0	1	2	0	0	0	0	1	11	2	1	\N	1	1	0	self	11000_15000	\N	\N	16000_20000	\N	pit_latrine	rainwater	car	other	with_water_and_soap	dumpsite	009f764a-1190-4a47-9e76-8f0c1405dcf5	\N
1421	92	Peter Hussein Kitonga	Male	34635482	\N	Widowed	none	\N	29	plot_Owner	\N	1	1	0	1	0	0	2	2	2	1	1	2	0	1	1	15	1	2	\N	0	0	1	not_applicable	16000_20000	\N	\N	6000_10000	\N	pit_latrine	rainwater	train	traditional	water_only	bins	55d3e989-4be6-4f08-b210-74c3a177df30	\N
1422	105	Brittany Langat Stephen	Female	60255815	\N	Single	secondary	\N	3	tenant	\N	2	0	1	0	1	1	0	2	1	2	0	0	2	0	1	13	2	2	\N	0	0	1	student	16000_20000	\N	\N	6000_10000	\N	VIP	none	walk	other	none	dumpsite	347b12ec-d728-4520-a828-0fd90abf81e2	\N
1423	50	Jamie Odiwuor Kipchirchir	Female	52898491	\N	Single	none	\N	33	structure_owner	\N	1	1	1	0	2	0	0	0	1	0	0	2	2	1	1	12	2	0	\N	0	1	1	private	6000_10000	\N	\N	6000_10000	\N	none	rainwater	car	private	none	private_collector	1bdb6781-e9d9-4c93-bbd2-d2f4b1e46d1f	\N
1424	225	Stephanie Ojwang Toroitich	Female	52342150	\N	Single	none	\N	8	structure_owner	\N	2	2	2	2	0	2	0	2	1	1	1	1	1	2	0	19	1	0	\N	0	1	1	civil_servant	>20000	\N	\N	16000_20000	\N	flush	piped	bicycle	public	with_water_and_soap	river	efcc858d-f029-43cb-8861-68b594239d36	\N
1425	105	Daniel Ouma Wanyonyi	Male	35902854	\N	Single	university	\N	3	tenant	\N	1	2	0	0	1	1	2	0	1	2	0	2	0	0	0	12	2	2	\N	1	0	1	civil_servant	0_5000	\N	\N	0_5000	\N	none	shallow_well	boda	public	none	private_collector	a99320a1-d8dc-454c-b0d6-7c16bdd5e2b3	\N
1426	54	Matthew Muimi Muthee	Male	73352173	\N	Cohabiting	college	\N	11	plot_Owner	\N	2	2	0	1	1	1	0	2	1	0	2	2	0	2	1	17	1	2	\N	1	1	0	private	6000_10000	\N	\N	6000_10000	\N	VIP	piped	walk	mission	none	bins	cd3aaaa5-66b7-4f26-9670-13b6de3dc557	\N
1427	129	Kara Richard Wambugu	Female	25496753	\N	Widowed	secondary	\N	31	structure_owner	\N	2	1	2	1	0	1	0	2	2	1	0	1	1	0	1	15	2	1	\N	0	1	1	not_applicable	>20000	\N	\N	>20000	\N	pit_latrine	rainwater	boda	other	with_water_and_soap	river	26327858-c538-4985-91e9-2b282091d3a7	\N
1428	211	William Mueni Njiru	Male	46383021	\N	Single	college	\N	36	structure_owner	\N	0	0	1	2	2	0	2	1	0	2	1	2	0	0	2	15	0	1	\N	1	1	1	civil_servant	16000_20000	\N	\N	6000_10000	\N	communal	river	train	other	with_water_and_soap	dumpsite	31e59178-53d8-4e58-b29d-e4099edd679a	\N
1429	201	Michael Wangila Kipkoech	Male	85199616	\N	married	university	\N	21	structure_owner	\N	1	1	2	1	0	0	0	0	2	1	1	2	1	1	1	14	2	2	\N	0	1	1	private	0_5000	\N	\N	6000_10000	\N	communal	vendor	bicycle	private	with_water_and_soap	private_collector	02143394-e9eb-44f9-a150-f358f4c6d201	\N
1430	117	Nicholas Murimi Guyo	Male	49760808	\N	married	secondary	\N	0	structure_owner	\N	2	1	2	1	0	1	0	1	2	1	0	1	0	1	1	14	0	2	\N	0	1	0	not_applicable	>20000	\N	\N	16000_20000	\N	none	piped	boda	traditional	with_water_and_soap	bins	c32455ab-2d49-43d4-845f-015d439fb996	\N
1431	124	Elizabeth Eregae Sila	Female	17368558	\N	Widowed	none	\N	40	plot_Owner	\N	1	2	0	2	0	0	0	1	2	2	2	1	2	0	0	15	1	2	\N	0	0	1	civil_servant	16000_20000	\N	\N	16000_20000	\N	communal	none	walk	mission	water_only	bins	ab57b461-fa89-4c7f-a320-26f842a478b4	\N
1432	69	Henry Maina Mwongela	Male	50709548	\N	married	none	\N	40	tenant	\N	1	0	0	1	1	0	0	1	1	1	1	2	1	2	0	12	2	1	\N	1	1	0	self	6000_10000	\N	\N	11000_15000	\N	flush	river	matatu	chemist	water_only	river	56991017-22c3-40d2-855f-01c1be22b7fd	\N
1433	67	Scott Mulongo Maiyo	Male	02544211	\N	Seperated	college	\N	1	plot_Owner	\N	0	2	0	1	1	0	1	2	0	1	0	2	1	1	2	14	0	1	\N	0	0	1	civil_servant	>20000	\N	\N	11000_15000	\N	none	river	walk	other	with_water_and_soap	bins	ed65e9b3-542b-4db6-be29-2cb127594013	\N
1434	128	James Mbaka Mucheru	Male	77204103	\N	Seperated	none	\N	30	tenant	\N	1	1	2	1	1	1	2	1	0	2	2	0	0	2	0	16	1	1	\N	1	1	0	student	6000_10000	\N	\N	16000_20000	\N	communal	vendor	boda	mission	water_only	private_collector	e7010ec1-5a4a-4084-97e7-d5921902fa89	\N
1435	61	Laura Shariff Maluki	Female	24340335	\N	Widowed	university	\N	38	tenant	\N	1	2	2	1	2	2	1	2	0	2	0	0	1	2	2	20	2	2	\N	0	1	0	self	6000_10000	\N	\N	0_5000	\N	flush	vendor	boda	public	none	private_collector	866d0ec9-c362-4c85-a066-ebfde2cd49b0	\N
1436	108	Benjamin Kanja Kiarie	Male	84693546	\N	Seperated	college	\N	8	structure_owner	\N	2	0	2	0	1	1	1	2	0	0	2	1	1	1	2	16	2	2	\N	1	0	1	self	6000_10000	\N	\N	11000_15000	\N	pit_latrine	rainwater	train	mission	none	private_collector	081fa523-6f4f-43e7-bda8-fd6ed060272c	\N
1437	130	Megan Abdulla Ngatia	Female	16368902	\N	Cohabiting	primary	\N	21	plot_Owner	\N	2	2	1	0	1	2	1	0	0	0	2	0	1	2	1	15	1	1	\N	1	0	0	private	6000_10000	\N	\N	>20000	\N	flush	shallow_well	matatu	chemist	none	private_collector	a4b38939-bcdd-4ba2-b853-6a6ea4293e28	\N
1438	233	Wendy Titus Okemwa	Female	78508923	\N	Widowed	primary	\N	17	tenant	\N	2	0	0	2	1	1	2	0	2	1	1	1	2	2	1	18	2	1	\N	0	1	0	casual	16000_20000	\N	\N	6000_10000	\N	flush	vendor	matatu	traditional	water_only	dumpsite	5a87b9cf-32eb-4a97-acaa-fbae5c544f25	\N
1439	134	Thomas Samson Waithera	Male	29052099	\N	married	primary	\N	12	tenant	\N	2	0	1	0	0	0	0	0	0	1	1	1	1	0	1	8	1	2	\N	1	0	0	civil_servant	0_5000	\N	\N	6000_10000	\N	none	vendor	walk	public	water_only	bins	21624503-e6c4-482e-bbed-5add46b502c7	\N
1440	209	Becky Komora Salah	Female	60077659	\N	Seperated	none	\N	23	tenant	\N	0	0	1	1	0	1	0	2	1	2	1	1	1	2	0	13	0	0	\N	0	1	0	private	6000_10000	\N	\N	>20000	\N	none	vendor	car	public	none	private_collector	370a6354-b489-457d-8edf-55ee99ca87e4	\N
1441	158	Nicole Njoka Njue	Female	24731846	\N	married	secondary	\N	17	tenant	\N	0	1	1	0	0	0	2	0	2	0	0	0	0	1	2	9	2	1	\N	1	1	1	civil_servant	11000_15000	\N	\N	11000_15000	\N	none	rainwater	boda	chemist	with_water_and_soap	private_collector	37fcd374-20df-4c8d-ad64-03d498a3a20d	\N
1442	117	Ashley Nzilani Wamalwa	Female	65247587	\N	Seperated	college	\N	17	structure_owner	\N	0	0	0	2	2	1	0	0	2	0	0	0	2	2	1	12	2	0	\N	0	0	1	private	>20000	\N	\N	>20000	\N	communal	shallow_well	train	mission	water_only	bins	1c534996-245e-4260-9b70-d211fd45238e	\N
1443	63	Lori Kipkurui Kipkemoi	Female	54338134	\N	Seperated	university	\N	12	tenant	\N	0	2	1	2	1	0	0	1	1	0	2	1	0	1	1	13	0	0	\N	0	1	1	not_applicable	16000_20000	\N	\N	16000_20000	\N	communal	shallow_well	train	chemist	none	river	ace88c8e-5aa3-425b-84cc-889725e831ea	\N
1444	219	Todd Wako Muriithi	Male	73595684	\N	Cohabiting	none	\N	24	plot_Owner	\N	2	0	2	2	1	1	1	1	1	1	1	1	1	1	1	17	1	2	\N	1	1	1	private	6000_10000	\N	\N	6000_10000	\N	flush	river	walk	traditional	water_only	private_collector	487232a2-af03-4e9f-a1f5-6586417d78ec	\N
1445	13	Angela Were Karwitha	Female	11139945	\N	married	college	\N	6	plot_Owner	\N	2	0	2	1	2	0	1	2	2	0	0	2	1	1	0	16	0	2	\N	0	0	0	not_applicable	0_5000	\N	\N	11000_15000	\N	none	river	boda	private	water_only	bins	98648def-89f8-407a-a937-ac51399cadda	\N
1446	158	Andrea Aloo Chenangat	Female	26309502	\N	Cohabiting	secondary	\N	2	structure_owner	\N	0	0	0	2	1	0	1	1	0	1	1	1	2	1	2	13	2	0	\N	1	0	0	civil_servant	0_5000	\N	\N	0_5000	\N	communal	piped	train	chemist	none	private_collector	6af5acdb-323e-4606-9dfd-8bea72027e4d	\N
1447	5	Tammy Momanyi Mbui	Female	77914023	\N	Widowed	college	\N	5	plot_Owner	\N	0	1	0	2	1	0	2	2	0	1	0	0	1	1	2	13	2	2	\N	0	1	1	civil_servant	11000_15000	\N	\N	16000_20000	\N	pit_latrine	piped	bicycle	mission	water_only	river	5ba8e8ea-dc92-48de-a1a8-5ac9d96a9865	\N
1448	85	Doris Kiplangat Abdiaziz	Female	13788223	\N	Single	none	\N	8	structure_owner	\N	2	2	1	2	1	2	0	0	2	0	0	0	2	0	2	16	0	1	\N	0	1	0	student	6000_10000	\N	\N	0_5000	\N	flush	rainwater	bicycle	traditional	water_only	private_collector	ee3c49e7-e995-44a8-8640-c1e8a3753f54	\N
1449	96	Krista Muriithi Muthoka	Female	29421692	\N	Single	university	\N	34	structure_owner	\N	0	1	0	0	1	2	0	1	0	2	1	0	2	0	1	11	0	2	\N	0	0	0	not_applicable	>20000	\N	\N	16000_20000	\N	VIP	rainwater	car	chemist	none	private_collector	dc50a8bb-933c-4be7-a9ec-6f238e0da28e	\N
1450	222	Justin Sila Kalekye	Male	04860787	\N	Cohabiting	primary	\N	24	tenant	\N	1	2	1	2	0	1	2	1	1	1	1	1	0	1	2	17	1	2	\N	0	0	1	not_applicable	16000_20000	\N	\N	>20000	\N	none	rainwater	car	traditional	with_water_and_soap	dumpsite	d89fc534-6982-4dc4-82dc-7f9f1e1ea954	\N
1451	140	David Sitienei Simiyu	Male	07286403	\N	Single	secondary	\N	23	structure_owner	\N	0	0	1	0	0	2	0	2	2	1	1	1	0	1	1	12	1	1	\N	0	1	1	private	11000_15000	\N	\N	6000_10000	\N	flush	vendor	bicycle	traditional	with_water_and_soap	private_collector	6f69d9f5-97e7-421f-824e-bdd73596f93c	\N
1452	235	James Nyongesa Mathenge	Male	62530067	\N	Widowed	college	\N	19	plot_Owner	\N	2	1	0	0	2	1	1	0	1	1	0	1	1	0	1	12	0	0	\N	0	1	0	private	>20000	\N	\N	6000_10000	\N	VIP	shallow_well	train	chemist	water_only	dumpsite	d7c22c55-ced7-47ed-98fd-49be2cc43350	\N
1453	222	John Wabwire Sidi	Male	05635899	\N	Single	none	\N	26	tenant	\N	2	0	1	1	1	1	2	0	1	0	0	2	2	1	1	15	0	1	\N	1	1	0	private	0_5000	\N	\N	0_5000	\N	communal	river	car	public	water_only	dumpsite	266e71c9-aa55-4fe6-9408-a63335c51afb	\N
1454	217	Mario Mnangat Nafuna	Male	30314314	\N	Widowed	none	\N	11	plot_Owner	\N	2	1	1	1	0	2	0	0	0	1	2	1	0	2	2	15	0	2	\N	1	0	1	not_applicable	6000_10000	\N	\N	0_5000	\N	none	shallow_well	train	mission	none	river	7bc40aa6-4ad5-4679-b5b4-6ff2f8915233	\N
1455	62	Christian Ndunge Omari	Male	25251602	\N	Widowed	secondary	\N	32	tenant	\N	0	0	0	0	0	1	2	2	2	2	0	1	1	0	1	12	2	2	\N	1	1	0	not_applicable	>20000	\N	\N	6000_10000	\N	pit_latrine	rainwater	car	traditional	none	dumpsite	ac5747d2-af62-4043-a0bb-eb50350fa637	\N
1456	198	Angela Sitienei Mbaabu	Female	61263849	\N	Widowed	primary	\N	34	structure_owner	\N	1	2	1	1	2	2	0	1	0	2	0	1	0	2	1	16	2	2	\N	1	1	1	unemployed	>20000	\N	\N	16000_20000	\N	none	piped	car	mission	none	private_collector	d58c9170-62b5-4150-b7ca-885bea328c5d	\N
1457	168	Christine Muthama Mzungu	Female	19811935	\N	Widowed	college	\N	5	structure_owner	\N	2	2	2	0	1	2	0	2	0	0	0	1	2	2	2	18	2	0	\N	1	0	1	student	0_5000	\N	\N	6000_10000	\N	pit_latrine	shallow_well	train	other	with_water_and_soap	dumpsite	de5d7e40-7f2f-4e86-83df-a2a599fd933e	\N
1458	111	Scott Mutheu Tarus	Male	63471990	\N	Cohabiting	secondary	\N	28	tenant	\N	0	0	2	2	1	2	0	0	0	1	1	1	1	1	2	14	2	2	\N	1	1	1	self	>20000	\N	\N	>20000	\N	none	rainwater	matatu	mission	water_only	private_collector	6f0a7c42-c0cb-44d3-abdf-15e19bb882f1	\N
1459	96	Ashley Soi Abdinoor	Female	54448589	\N	Single	university	\N	13	structure_owner	\N	2	2	1	2	2	2	0	1	1	0	2	1	1	0	2	19	1	1	\N	0	1	0	civil_servant	0_5000	\N	\N	11000_15000	\N	pit_latrine	shallow_well	car	chemist	with_water_and_soap	dumpsite	f42077e9-1416-4b1e-8958-9f4eb89eadf6	\N
1460	175	Elizabeth Wambugu Gichuru	Female	28206901	\N	Single	college	\N	16	plot_Owner	\N	0	0	2	1	1	1	1	1	2	0	2	2	0	1	1	15	2	2	\N	0	1	0	not_applicable	6000_10000	\N	\N	>20000	\N	communal	vendor	bicycle	private	water_only	dumpsite	60b991d8-a98d-45c1-9424-179405f25f30	\N
1461	30	Mark Warui Mzungu	Male	76849226	\N	Cohabiting	college	\N	21	tenant	\N	1	2	1	0	1	1	0	1	1	2	2	1	0	2	2	17	2	0	\N	1	0	0	not_applicable	>20000	\N	\N	>20000	\N	communal	rainwater	bicycle	mission	none	private_collector	244902d0-49f9-44ab-9a32-9583d99da398	\N
1462	44	Anthony Chebon Kiiru	Male	71589781	\N	married	none	\N	3	structure_owner	\N	0	0	2	0	2	2	2	2	2	1	2	1	0	1	1	18	2	1	\N	0	0	0	private	0_5000	\N	\N	16000_20000	\N	pit_latrine	river	walk	chemist	none	river	fbb13001-6041-4b34-90b3-d6c2d46dcca7	\N
1463	161	Regina Gitahi Kimotho	Female	61442730	\N	Cohabiting	university	\N	2	structure_owner	\N	2	2	1	0	1	1	2	2	2	1	1	0	0	2	1	18	0	2	\N	1	1	0	student	6000_10000	\N	\N	6000_10000	\N	none	shallow_well	matatu	chemist	with_water_and_soap	river	14f6ca5c-eed0-481f-9448-e8ffdf4a30d4	\N
1464	65	Mary Njoroge Jillo	Female	18172334	\N	Widowed	university	\N	20	structure_owner	\N	1	2	0	1	1	2	0	1	2	0	0	2	0	2	2	16	2	2	\N	0	1	1	student	11000_15000	\N	\N	>20000	\N	flush	vendor	matatu	mission	water_only	private_collector	5290193f-8788-431a-b308-c637a3f39497	\N
1465	156	Alexis Junior Wesonga	Female	36156152	\N	Single	secondary	\N	2	plot_Owner	\N	2	2	0	2	1	2	1	1	1	1	1	0	0	1	1	16	1	0	\N	1	0	1	civil_servant	0_5000	\N	\N	16000_20000	\N	none	river	train	private	with_water_and_soap	dumpsite	dcbe2898-3b14-4bdf-808e-8a8e2310f204	\N
1466	109	Antonio Apiyo Chengo	Male	66812049	\N	Widowed	secondary	\N	11	plot_Owner	\N	2	2	2	1	2	0	1	1	2	1	2	2	1	0	2	21	2	1	\N	1	0	1	civil_servant	0_5000	\N	\N	6000_10000	\N	VIP	piped	car	private	none	bins	b60ea2c5-151a-40bd-a901-fe9953ad1f82	\N
1467	41	Kyle Daud Cheruto	Male	07721749	\N	Cohabiting	primary	\N	33	structure_owner	\N	1	1	2	0	2	1	0	1	1	1	2	0	1	0	1	14	2	2	\N	0	0	1	private	>20000	\N	\N	16000_20000	\N	flush	vendor	boda	public	none	bins	225ccb21-7be0-4242-9889-064e332b953b	\N
1468	82	Michael Ndolo Fondo	Male	65366082	\N	Single	secondary	\N	16	tenant	\N	0	2	1	2	0	1	1	1	2	2	1	0	1	0	0	14	1	2	\N	0	0	1	unemployed	11000_15000	\N	\N	6000_10000	\N	pit_latrine	vendor	walk	other	water_only	bins	12f27a00-99d4-41fd-88ee-ee4ef9a76eb3	\N
1469	91	Angel Krop Bosibori	Male	37476061	\N	Seperated	college	\N	37	structure_owner	\N	1	2	1	0	2	2	2	0	2	1	0	2	2	1	2	20	1	0	\N	0	1	1	civil_servant	16000_20000	\N	\N	11000_15000	\N	flush	piped	bicycle	traditional	none	private_collector	2a0f7ea1-ea3f-4574-842a-4574b95feed1	\N
1470	35	Raymond Kipruto Baraza	Male	21715136	\N	Single	college	\N	2	structure_owner	\N	1	1	1	0	2	1	0	0	0	1	1	2	0	0	1	11	2	0	\N	0	1	0	not_applicable	16000_20000	\N	\N	0_5000	\N	pit_latrine	piped	train	private	water_only	private_collector	94afc17c-08e4-4ee6-a771-1eb891b6c387	\N
1471	237	Tracy Ongeri Keitany	Female	33860566	\N	married	none	\N	18	plot_Owner	\N	1	0	0	2	0	1	0	0	2	2	1	2	0	1	2	14	1	2	\N	0	1	0	private	>20000	\N	\N	6000_10000	\N	pit_latrine	rainwater	boda	mission	none	bins	ef4e8f4a-798a-493b-9dea-ca61053c33d0	\N
1472	83	Mark Chesang Keya	Male	43933614	\N	married	secondary	\N	31	tenant	\N	0	1	2	0	2	2	2	2	2	2	1	1	1	0	1	19	0	0	\N	0	0	0	not_applicable	16000_20000	\N	\N	>20000	\N	communal	piped	matatu	other	with_water_and_soap	dumpsite	34c39863-e293-4be7-b33a-b8dcdd2be947	\N
1473	1	Mark Mbui Moseti	Male	60529258	\N	Widowed	university	\N	5	tenant	\N	0	1	1	0	2	2	1	2	2	1	2	2	2	0	2	20	2	0	\N	0	0	0	private	6000_10000	\N	\N	>20000	\N	flush	river	matatu	traditional	water_only	river	01cd6a9a-f58f-4e12-a5e7-15fc6e87db1f	\N
1474	65	Anne Nzau Kamene	Female	56947893	\N	Seperated	secondary	\N	10	plot_Owner	\N	1	0	0	1	0	2	2	0	1	1	0	2	1	2	2	15	2	1	\N	0	1	0	self	0_5000	\N	\N	16000_20000	\N	communal	shallow_well	matatu	traditional	with_water_and_soap	private_collector	4de4641d-5a7f-47b2-8c3f-15a899e20018	\N
1475	72	Valerie Muema Mohammed	Female	34939985	\N	married	secondary	\N	24	structure_owner	\N	1	2	2	2	2	0	2	0	1	0	2	1	1	2	0	18	2	2	\N	0	0	0	self	>20000	\N	\N	11000_15000	\N	flush	none	car	public	with_water_and_soap	private_collector	718bc6f0-9886-463c-890a-1641cfe11bd3	\N
1476	189	Elizabeth Koros Muasya	Female	66402904	\N	married	none	\N	35	tenant	\N	2	1	1	2	0	0	0	0	1	2	0	2	1	0	0	12	0	2	\N	0	0	1	student	16000_20000	\N	\N	0_5000	\N	communal	piped	bicycle	mission	with_water_and_soap	river	89561f26-a1af-4ce2-bf95-eb3ce7d80437	\N
1477	120	Lori Ndirangu Ruto	Female	17357461	\N	Seperated	secondary	\N	35	plot_Owner	\N	0	0	2	1	1	2	1	2	0	0	2	2	0	0	2	15	1	1	\N	1	0	0	civil_servant	>20000	\N	\N	6000_10000	\N	pit_latrine	vendor	boda	private	with_water_and_soap	bins	e83dd716-fecb-427a-934d-873388738e34	\N
1478	21	Samantha Gatwiri Ngari	Female	19226944	\N	Seperated	college	\N	20	plot_Owner	\N	2	2	2	1	0	1	0	2	2	1	0	0	1	2	2	18	0	2	\N	0	0	0	unemployed	11000_15000	\N	\N	11000_15000	\N	none	river	matatu	other	water_only	dumpsite	028e8127-d8f6-48c9-8a0f-3926edd79ee7	\N
1479	210	Stephanie Wangechi Jebet	Female	46261860	\N	Seperated	primary	\N	19	plot_Owner	\N	2	0	1	2	1	1	2	1	2	2	2	2	1	1	2	22	2	1	\N	1	1	0	civil_servant	>20000	\N	\N	11000_15000	\N	pit_latrine	shallow_well	walk	mission	water_only	dumpsite	f13a5e11-f836-443b-93b5-45717d34bc5d	\N
1480	104	David Mmbone Rioba	Male	10391047	\N	Seperated	secondary	\N	13	structure_owner	\N	2	1	2	0	1	0	0	1	1	0	2	2	0	1	0	13	2	2	\N	0	0	0	not_applicable	>20000	\N	\N	6000_10000	\N	none	piped	walk	mission	none	private_collector	3cdc5263-1bbf-46e7-998b-60ef9b92d706	\N
1481	20	Ashley Mwakio Abdi	Female	55513480	\N	Cohabiting	secondary	\N	33	plot_Owner	\N	2	1	0	0	1	2	1	2	2	2	2	2	1	1	2	21	1	0	\N	0	1	0	not_applicable	11000_15000	\N	\N	0_5000	\N	VIP	shallow_well	bicycle	mission	none	dumpsite	0d855683-aa4b-4345-a1d2-3a7ce803727c	\N
1482	222	Mathew Mburu Maghanga	Male	44702335	\N	Seperated	university	\N	32	structure_owner	\N	2	2	2	0	1	1	2	0	1	1	1	1	2	0	0	16	1	0	\N	1	0	0	civil_servant	>20000	\N	\N	0_5000	\N	none	shallow_well	car	private	water_only	bins	d4512c1d-288b-4c48-bf15-aaf37ee27a75	\N
1483	73	Julie Migwi Wanjiku	Female	89569455	\N	married	primary	\N	24	plot_Owner	\N	2	2	0	2	2	1	2	0	1	0	1	0	1	0	1	15	0	2	\N	0	0	1	student	0_5000	\N	\N	11000_15000	\N	flush	shallow_well	walk	traditional	water_only	private_collector	5419730e-32ca-4bab-9c35-676722090ae7	\N
1484	14	Caitlyn Karisa Abdulla	Female	76149353	\N	Seperated	primary	\N	26	structure_owner	\N	2	1	2	2	1	1	2	0	2	2	0	0	2	1	0	18	0	1	\N	0	1	0	self	6000_10000	\N	\N	16000_20000	\N	communal	vendor	car	traditional	with_water_and_soap	private_collector	c9b083e2-bac7-4eb1-9b2d-1e5de9942927	\N
1485	182	Bonnie Aden Kyalo	Female	23692466	\N	married	university	\N	20	plot_Owner	\N	1	2	2	2	1	2	0	1	2	2	0	2	0	1	0	18	0	0	\N	1	1	0	casual	0_5000	\N	\N	>20000	\N	none	vendor	walk	private	water_only	bins	3c7026de-ebae-4b35-90e2-db201cc746fc	\N
1486	178	Reginald Mutinda Mwero	Male	56540213	\N	Widowed	primary	\N	35	tenant	\N	1	1	1	1	2	0	1	1	1	2	1	2	1	0	1	16	0	2	\N	0	1	0	unemployed	16000_20000	\N	\N	>20000	\N	communal	rainwater	bicycle	chemist	with_water_and_soap	private_collector	3437f359-1a70-41be-9d23-5a036ed0fd10	\N
1487	132	Kyle Kipkemoi Shikuku	Male	36327363	\N	Widowed	none	\N	10	structure_owner	\N	2	0	2	2	1	1	0	2	2	2	1	1	2	1	0	19	2	1	\N	0	0	0	self	11000_15000	\N	\N	>20000	\N	none	shallow_well	bicycle	other	none	river	79fad716-e6e0-49e3-a337-988707347b56	\N
1488	44	Joshua Mwinzi Nyakio	Male	29897803	\N	Cohabiting	none	\N	33	plot_Owner	\N	2	2	0	2	2	2	0	0	1	0	2	2	0	2	0	17	1	1	\N	1	1	1	not_applicable	0_5000	\N	\N	6000_10000	\N	none	river	matatu	public	water_only	dumpsite	c9a123a2-0112-4f75-baf5-3c081d6e3a18	\N
1489	21	Kayla Onsongo Ekiru	Female	49290244	\N	Cohabiting	secondary	\N	1	plot_Owner	\N	0	1	2	1	0	1	1	0	1	1	2	1	0	0	0	11	2	0	\N	0	1	0	self	0_5000	\N	\N	6000_10000	\N	pit_latrine	rainwater	matatu	public	water_only	river	99ea66af-0936-491a-9334-2442ff02e752	\N
1490	100	Tiffany Muraya Githinji	Female	28938313	\N	Single	none	\N	34	structure_owner	\N	2	0	0	2	0	2	2	1	2	2	1	0	0	0	0	14	0	1	\N	1	0	1	unemployed	6000_10000	\N	\N	11000_15000	\N	none	vendor	matatu	private	none	dumpsite	8c1594cd-7032-49de-aaac-10edfeffa165	\N
1491	76	Leslie Oyaro Galgalo	Female	16638550	\N	Widowed	none	\N	33	tenant	\N	0	1	1	1	2	1	1	0	1	0	2	2	0	2	2	16	1	2	\N	0	1	1	private	11000_15000	\N	\N	>20000	\N	flush	shallow_well	matatu	chemist	none	private_collector	dffeb30e-60e2-4b9c-bf93-c725fe099412	\N
1492	40	Keith Ndege Mwongela	Male	03862644	\N	Cohabiting	primary	\N	36	structure_owner	\N	1	2	0	1	2	1	1	1	0	0	1	1	0	2	1	14	0	1	\N	0	0	0	student	6000_10000	\N	\N	16000_20000	\N	flush	rainwater	train	private	with_water_and_soap	private_collector	7c5b45fc-bda5-4271-a5f9-5c622edc0998	\N
1493	130	Charles Jelagat Mulinge	Male	21462696	\N	Cohabiting	none	\N	35	structure_owner	\N	1	2	0	2	2	0	1	1	1	0	2	2	2	0	1	17	1	1	\N	0	1	1	self	6000_10000	\N	\N	0_5000	\N	flush	none	train	public	with_water_and_soap	private_collector	741d8eb3-97a9-4261-af12-36b6b9ed6670	\N
1494	53	Derrick Wabwile Joshua	Male	08646333	\N	Widowed	primary	\N	36	structure_owner	\N	2	0	2	0	0	2	0	2	0	0	2	2	1	0	2	15	2	0	\N	0	0	1	unemployed	11000_15000	\N	\N	16000_20000	\N	VIP	piped	bicycle	public	water_only	bins	2caca943-6170-4fce-a3c4-427eb9ea2bdc	\N
1495	72	Catherine Chepkosgei Mbui	Female	50897334	\N	Single	secondary	\N	37	plot_Owner	\N	0	1	0	1	2	2	2	2	2	1	2	1	2	1	1	20	2	2	\N	1	1	1	student	>20000	\N	\N	>20000	\N	VIP	river	boda	other	none	river	a7ed4b8b-d75d-4ad8-916f-9b08a7031bed	\N
1496	152	Richard Bonaya Gacheri	Male	32765799	\N	Widowed	secondary	\N	3	structure_owner	\N	2	0	1	0	2	1	1	0	0	1	2	0	2	0	2	14	0	2	\N	0	1	0	not_applicable	6000_10000	\N	\N	16000_20000	\N	VIP	none	bicycle	chemist	water_only	river	355865dd-1261-4eb7-a227-8020e1530c0e	\N
1497	54	Jennifer Victor Abdikadir	Female	44392321	\N	Single	university	\N	21	tenant	\N	0	1	1	2	1	1	0	2	0	2	0	0	2	2	0	14	2	2	\N	0	1	1	civil_servant	16000_20000	\N	\N	>20000	\N	pit_latrine	river	matatu	public	none	bins	69401465-a1e0-4795-b01c-60316c60d498	\N
1498	166	Shannon Njoka Gacheri	Female	20961171	\N	married	primary	\N	33	structure_owner	\N	1	1	0	2	0	0	1	0	0	0	1	2	2	1	1	12	1	1	\N	1	0	0	unemployed	16000_20000	\N	\N	6000_10000	\N	VIP	rainwater	walk	public	with_water_and_soap	private_collector	f7adce9a-e34d-4604-93d0-a70e448735e1	\N
1499	133	Bonnie Ngugi Muthengi	Female	36960955	\N	Widowed	none	\N	32	tenant	\N	0	2	2	1	0	1	1	1	0	2	2	1	1	2	2	18	0	1	\N	0	1	0	unemployed	>20000	\N	\N	0_5000	\N	pit_latrine	piped	bicycle	other	water_only	private_collector	463aff03-62aa-43f0-baab-e562c5d7385a	\N
1500	171	Vickie Maiyo Wamboi	Female	15921843	\N	Single	college	\N	25	plot_Owner	\N	2	1	0	1	1	0	0	0	0	1	1	0	0	1	1	9	2	2	\N	0	1	1	private	16000_20000	\N	\N	>20000	\N	none	none	bicycle	private	none	bins	b0b81e72-d4a5-4fc0-a865-1422f0e92437	\N
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

SELECT pg_catalog.setval('public.beneficiary_parcel_id_seq', 1, false);


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

SELECT pg_catalog.setval('public.households_id_seq', 1500, true);


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

