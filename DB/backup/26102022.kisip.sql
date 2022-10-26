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
    hh_id integer,
    settlement_id integer NOT NULL,
    intervention_id integer,
    intervention_phase integer NOT NULL,
    benefit_type_id integer NOT NULL
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
    settlement_id integer,
    intervention_phase integer
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
    intervention_type_id integer NOT NULL,
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

COPY public.beneficiary (id, hh_id, settlement_id, intervention_id, intervention_phase, benefit_type_id) FROM stdin;
\.


--
-- Data for Name: beneficiary_parcel; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.beneficiary_parcel (beneficiary_id, parcel_id, id, settlement_id, intervention_phase) FROM stdin;
1	227	1	69	1
2	219	2	69	1
3	222	3	69	1
4	224	4	69	1
4	225	5	69	1
7	117	8	69	1
8	50	9	69	1
9	36	10	69	1
10	158	11	69	1
11	214	12	69	1
12	205	13	69	1
13	45	14	69	1
14	62	15	69	1
15	134	16	69	1
16	84	17	69	1
17	30	18	69	1
18	181	19	69	1
19	189	20	69	1
20	201	21	69	1
21	187	22	69	1
22	39	23	69	1
22	49	24	69	1
23	120	25	69	1
24	16	26	69	1
25	27	27	69	1
26	146	28	69	1
27	113	29	69	1
28	21	30	69	1
29	29	31	69	1
30	92	32	69	1
32	198	33	69	1
33	59	34	69	1
34	88	35	69	1
35	105	36	69	1
36	67	37	69	1
37	6	38	69	1
38	37	39	69	1
39	175	40	69	1
40	221	41	69	1
41	73	42	69	1
42	77	43	69	1
43	132	44	69	1
44	167	45	69	1
46	194	46	69	1
47	56	47	69	1
48	32	48	69	1
49	118	49	69	1
50	5	50	69	1
51	208	51	69	1
52	145	52	69	1
53	220	53	69	1
54	11	54	69	1
55	116	55	69	1
56	173	56	69	1
57	125	57	69	1
57	215	58	69	1
59	54	59	69	1
60	86	60	69	1
61	35	61	69	1
62	97	62	69	1
63	69	63	69	1
64	28	64	69	1
65	164	65	69	1
65	165	66	69	1
66	195	67	69	1
67	183	68	69	1
68	199	69	69	1
69	42	70	69	1
70	119	71	69	1
71	130	72	69	1
72	129	73	69	1
74	188	74	69	1
75	89	75	69	1
76	46	76	69	1
77	216	77	69	1
78	141	78	69	1
79	2	79	69	1
80	160	80	69	1
81	212	81	69	1
82	174	82	69	1
83	24	83	69	1
84	10	84	69	1
85	23	85	69	1
86	112	86	69	1
87	192	87	69	1
88	119	88	69	1
89	203	89	69	1
90	63	90	69	1
91	20	91	69	1
92	186	92	69	1
93	166	93	69	1
94	94	94	69	1
94	95	95	69	1
94	96	96	69	1
95	184	97	69	1
96	131	98	69	1
97	178	99	69	1
98	47	100	69	1
99	93	101	69	1
100	22	102	69	1
101	118	103	69	1
102	153	104	69	1
103	25	105	69	1
104	72	106	69	1
105	156	107	69	1
106	102	108	69	1
107	8	109	69	1
107	197	110	69	1
108	78	111	69	1
109	56	112	69	1
110	57	113	69	1
111	71	114	69	1
112	100	115	69	1
113	226	116	69	1
114	209	117	69	1
115	85	118	69	1
116	90	119	69	1
117	18	120	69	1
117	19	121	69	1
119	48	122	69	1
120	3	123	69	1
121	191	124	69	1
122	154	125	69	1
122	155	126	69	1
122	190	127	69	1
123	80	128	69	1
124	217	129	69	1
125	66	130	69	1
126	124	131	69	1
127	114	132	69	1
128	149	133	69	1
129	98	134	69	1
129	138	135	69	1
130	128	136	69	1
130	135	137	69	1
131	101	138	69	1
132	65	139	69	1
133	60	140	69	1
134	44	141	69	1
135	108	142	69	1
136	127	143	69	1
137	159	144	69	1
138	107	145	69	1
139	68	146	69	1
140	170	147	69	1
141	169	148	69	1
142	41	149	69	1
144	51	150	69	1
146	12	151	69	1
147	213	152	69	1
148	99	153	69	1
149	202	154	69	1
150	182	155	69	1
151	85	156	69	1
152	127	157	69	1
153	139	158	69	1
154	13	159	69	1
155	207	160	69	1
156	121	161	69	1
157	58	162	69	1
158	151	163	69	1
159	150	164	69	1
160	79	165	69	1
161	84	166	69	1
162	126	167	69	1
163	126	168	69	1
164	82	169	69	1
165	52	170	69	1
166	70	171	69	1
167	140	172	69	1
168	33	173	69	1
168	34	174	69	1
169	136	175	69	1
170	172	176	69	1
171	9	177	69	1
172	83	178	69	1
173	87	179	69	1
174	99	180	69	1
175	58	181	69	1
176	77	182	69	1
177	109	183	69	1
178	76	184	69	1
179	90	185	69	1
180	91	186	69	1
181	223	187	69	1
182	40	188	69	1
183	200	189	69	1
184	64	190	69	1
185	218	191	69	1
186	61	192	69	1
187	179	193	69	1
188	14	194	69	1
189	163	195	69	1
190	123	196	69	1
190	161	197	69	1
191	144	198	69	1
192	43	199	69	1
193	103	200	69	1
194	133	201	69	1
195	147	202	69	1
196	204	203	69	1
197	61	204	69	1
198	31	205	69	1
199	17	206	69	1
200	191	207	69	1
201	1	208	69	1
202	15	209	69	1
203	111	210	69	1
204	26	211	69	1
205	120	212	69	1
206	15	213	69	1
207	142	214	69	1
207	143	215	69	1
208	193	216	69	1
209	81	217	69	1
210	106	218	69	1
211	53	219	69	1
212	4	220	69	1
212	7	221	69	1
213	177	222	69	1
214	152	223	69	1
215	224	224	69	1
216	38	225	69	1
217	75	226	69	1
218	104	227	69	1
219	228	228	69	1
5	180	6	69	1
6	180	7	69	1
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
42	69	Edward Kemboi Chesingil	Male	20043374	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
71	69	Hellen Chepkoechchepkwony	Female	5452746	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9	69	Alfred Matundura Mochere	Male	25065871	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
10	69	Ali Adan Osman	Male	1232667	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
11	69	Ali Ahmed Warsama	Male	134906	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
12	69	Ali Hassan Isack	Male	27671099	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
14	69	Anjalina Kanda Rotich	Female	3138704	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
15	69	Anorld Maswai Ngeywo	Male	1156124	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
16	69	Bahati P. Ag. Elijah	Male	BAHATI P. AG. ELIJAH	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
17	69	Bernard Kipkoech Langat	Male	24172010	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
18	69	Berry Auma Yuaya	Female	5981073	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
19	69	Bishar Omar Mohamed	Female	20935326	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
20	69	Boniface Pepela Matofari	Male	10747462	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
21	69	Catherine Ipaliopagala	Female	4384977	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
22	69	Charles Chonjo Makokha	Male	22575998	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
24	69	Christine Chepketer Barno	Female	8762878	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
25	69	Clement Kharunda Siahi	Male	10659532	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
26	69	Clement Kibirgen Serem	Male	723044	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
28	69	Daniel Liyula Muliru	Male	DANIEL LIYULA MULIRU	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
29	69	Daniel Ngetich	Male	877620	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
30	69	Daniel Tiliareng’ Kibowen	Male	336891	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
31	69	David Berech Kebenei	Male	6578457	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
32	69	David Karanja	Male	847843	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
34	69	David Kiplangat Kipsang	Male	1448838	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
35	69	David Kunusia	Male	13613215	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
36	69	Dennis Simeon Odinga	Male	10840510	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
37	69	Dinah Chebet	Female	10937286	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
38	69	Dinah Chemase	Female	20960766	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
40	69	Dorcas Akou Munyes	Female	12424194	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
41	69	Dorcas Masese Isrita	Male	300709	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
44	69	Elijah Kipkoech Sugut	Male	20697153	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
45	69	Eliud Kipchumba Keen	Male	27917947	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
46	69	Eliud Kipkoech Lagat	Male	13202352	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
47	69	Elizabeth Chepkemboi	Female	563405	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
49	69	Elphas Kipkemboi Ngelechei	Male	7444365	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
50	69	Emily Jepkemboi Misoi	Female	3264274	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
51	69	Eric Morara Orina	Male	12898637	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
52	69	Ernest Kibet	Male	1221030	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
53	69	Esther Kalunda	Female	22548355	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
54	69	Esther Ngelel	Female	5602280	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
55	69	Eunice Njambi Gitau	Female	1230027	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
56	69	Eunice Wandia Kavinya	Female	20655808	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
57	69	Eunice Wangoi	Female	8627569	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
59	69	Francis Anari Nyanumba	Male	1634687	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
60	69	Francis Karanja Kianda	Male	320245	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
62	69	Fred Welch Muleshe	Male	9871955	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
63	69	Getrude Mutoro Wanyonyi	Female	23955645	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
64	69	Gidion A. Maiyo	Male	3265936	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
66	69	Go For Restoration Of Truth	Male	CHURCH	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67	69	Goretty Akinyi Ochieng	Female	13206168	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
68	69	Grace Colleta	Female	6086699	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
69	69	Haron Luvisia Makokha	Male	13434856	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
70	69	Hassan Owgiro Wissack	Male	HASSAN OWGIRO WISSACK	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
73	69	Hellenathulumutanda	Female	1899914	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
74	69	Hellenzipporah Willey	Female	997310	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
75	69	Henry Kirwa Sambai	Male	1449808	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
77	69	Hussein Mohamed Muhamud	Male	23875691	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
78	69	Ibrahim Adanbatelo	Male	3253487	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
79	69	Ibrahim Aden Ali Dika	Male	23510780	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
80	69	Ibrahim Edin Konre	Male	1449338	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
81	69	Ibrahim Hussein Farah	Male	11651948	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
82	69	Ibrahim Ibrenrobow	Male	9567956	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
83	69	Ibrahim Wafula Khatete	Male	2086220	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
84	69	Isaac Adan	Male	838101	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
85	69	Isaac Kiptepis Chemrokok	Male	5791478	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
86	69	Isaac N. Njuguna Kimengi	Male	3463082	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
88	69	Issack Hussein Abdula	Male	ISSACK HUSSEIN ABDULA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
89	69	Jacob Kipsang Arap Yego	Male	21341278	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
90	69	James Michori Maina	Male	846866	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
91	69	James Wathika Gituro	Male	1446766	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
92	69	Jane Maru	Female	3444018	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
93	69	Jane Njeri Kaniaru	Female	9252376	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
94	69	Japheth Kittur Chemaiyo	Male	5303326	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
95	69	Jaqueline Mukungu Maina	Female	20939812	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
97	69	Jepkurgat Birgen	Male	5300202	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
98	69	Joel K. Kotutwo	Male	3322434	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99	69	Joel Rotich Chirchir	Male	9570345	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
100	69	John Alex Bore	Male	235238	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
101	69	John Kimathi Muriuki	Male	11490396	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
102	69	John Makau Ofisi	Male	977607	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
103	69	John Masisa Olwanyi	Male	1444297	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
104	69	John Ogola Okumu	Male	433424/63	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
106	69	Joseph Kamau Toro	Male	16064310	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1	69	Abdi Ali Isaak	Male	4389049	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2	69	Abdikadir Shiekh Mohamed	Male	5071335	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3	69	Abdullah Hassan Haji Hussein	Male	5964784	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4	69	Abraham K. Chesire	Male	4125821	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6	69	Achilles Kimurgor Ngeny	Male	5932469	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7	69	Aden Ali Dika	Male	1232826	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8	69	Agnes Wanini Kaniu	Female	2338898	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
27	69	Daniel Kipchirchir Koros	Male	1226151	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
139	69	Margaret Wambui Michori	Female	839018	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
174	69	Philip Kipkemei Murei	Male	1233584	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
213	69	Wilson Kimosibei Ngisirei	Male	6857261	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
116	69	Judith Nabwile Nyongesa	Female	11328244	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
117	69	Julius Kadima Lanya	Male	6877189	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
118	69	Julius Kiprop Mosbei	Male	23997064	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
120	69	Julius Mwangi Njuguna	Male	726825	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
121	69	Justus Muriuki Marimi	Male	1234420	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
122	69	Kalist Ouma Wasike	Male	1226785	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
123	69	Kennedy Josephat Okonda	Male	10840544	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
124	69	Khadija Adan Abdi	Female	11193974	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
125	69	Kimuikey Jonathan Magut	Male	1811331	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
126	69	Kipkering Arap Keino	Male	1251715	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
127	69	Kipkosgei Murei	Female	1228408	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
129	69	Kiprotich Bitock	Male	1228142	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
130	69	Kipserem Mutai	Male	1451739	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
131	69	Leah Jepkemoi Chumo	Female	1279781	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
132	69	Lucas Barasa	Male	585690	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
133	69	Lucy Wanjiro	Female	6861967/69	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
134	69	Luka Kipkoech Bitok	Male	9991259	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
136	69	Maimuna Kakenyankinangaei	Female	9252409	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
141	69	Margaret Wanjiku Nyuri	Female	1934526	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
142	69	Mariam Barkale	Female	24009107	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
143	69	Mary Anyango Mukele	Female	261498	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
144	69	Mary Chepchirchir Choge	Female	839527	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
145	69	Mary Nanjala Kayanda	Female	4144676	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
146	69	Mary Nasmiyu Simiyu	Female	5737822	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
147	69	Mary Wanjiku	Female	1446626	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
148	69	Mathew Kibet Kimurua	Male	287818	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
149	69	Maxwell Misoga	Male	20005587	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
150	69	Milca Ogolla	Male	1232405	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
151	69	Milka Toroitich Lutia	Male	283556	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
152	69	Mohamed Abdi Osman	Male	13004986	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
153	69	Mohamed Ali Ego	Male	16078279	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
154	69	Mohamed Alioido	Male	1450336	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
155	69	Moses Arap Yego	Male	3937265	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
156	69	Moses Kamau Wangari	Male	25282290	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
157	69	Moses Kemboi Kiprono	Male	1785730	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
158	69	Moses Kipsang Murei	Male	448736	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
160	69	Nahashon Kiptum Samoei	Male	22455986	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
161	69	Nasambu Rose Wilfrida Ogola	Female	258223	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
162	69	Nelly Chepchirchir Kebenei	Female	23666910	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
163	69	Nelson Adeya Kisali	Male	11167521	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
164	69	Oliver James Guto	Male	11792847	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
165	69	Pamellah Toto Papai	Female	4213176	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
166	69	Patrick Wachira Gitura	Male	12473272	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
167	69	Paul Kipyego Kosgei	Male	1230441	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
169	69	Paul Kosgei Kutto	Male	6846836	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
170	69	Paul Ronoh Kurgat	Male	8333364	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
176	69	Philip Mulogosi	Male	7968673	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
177	69	Pius Wamalwa Munialo	Male	976253	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
179	69	Regina Jerotich Kemboi	Female	12878784	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
180	69	Robert Tinega Zakayo	Male	407460	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
181	69	Ronald Kipkech Kipterei	Male	13069317	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
182	69	Sadia Hussein Ali	Male	1182928	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
183	69	Saine Kimeli John	Male	10761914	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
184	69	Salima Mohamed Hassan	Female	25953310	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
173	69	Philip Kipketer Kosgei	Male	21617017	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
186	69	Sammy Ndiema Kalinjonya	Male	27815172	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
188	69	Samuel Kiplel Kirwa	Male	11121582	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
189	69	Samwelwaruguwanyoike	Male	10183470	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
190	69	Sarah Cherono Cheruiyot	Female	1237386	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
191	69	Sarah Imbogo	Female	9169424	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
192	69	Sarah Jeruto Sammy	Female	6860030	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
193	69	Sefania Salambo	Female	8715817	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
195	69	Shaphan Lunani Makunda	Male	8837489	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
196	69	Simeon Agwata Nyamagwa	Male	304333	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
197	69	Simon Kipkemboi	Male	4638347	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
198	69	Simon Kitum Chemweno	Male	1225750	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
199	69	Sofia Anyango Ogutu	Female	14453703	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
200	69	Solomon Ihachi Chibelenje	Male	57670882	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
201	69	Stephen Angwenyi Nyamweya	Male	10013600	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
202	69	Stephen Koech	Male	13206399	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
204	69	Susana Jelamai Mutai	Female	8327224	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
205	69	Teresa Chemenjo Lelei	Female	3999338	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
206	69	William Kiprop Ronoh	Male	11604311	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
207	69	William Ndinya Omollo	Male	1097291	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
208	69	William Omweri	Male	6117612	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
209	69	William Wanjohi Mureithi	Male	7456816	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
211	69	Wilson K C Chelimo	Male	6597192	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
215	69	Yegon Dominic Kipngetich	Male	22415513	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
107	69	Joseph Kipchumba Kigen	Male	10704708	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
108	69	Joseph Kiptoo Ruto	Male	8626254	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
109	69	Joseph Ngetich Langat	Male	6424953	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
212	69	Wilson Kiptanui Ronoh	Male	12464743	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
110	69	Joseph Wafula	Male	12878478	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
112	69	Joshua Kipsang Kibiego	Male	4901812	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
113	69	Josiah Nyamohanga Kerario	Male	2827045	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
114	69	Josphine Kerubo	Female	303108	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
115	69	Joyce Jeruto Kipkore	Female	9865394	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
185	69	Sammy Mirikau Mukolwe	Male	1228691	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5	69	Hassan Adanabdi	Male	10760454	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
13	69	Anastasia Jepngetich Masai	Female	11605041	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
23	69	Charles K. A. Ruto	Male	12553722	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
33	69	David Kipkoech Cherus	Male	9604644	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
39	69	Dominic Andole Mwimani	Male	14552392	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
48	69	Elizabeth Matsitsa Mwangi	Female	13205654	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
58	69	Fatuma Adan Ali	Female	21301442	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
61	69	Francis Kibagendi Mogute	Male	2980079	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
65	69	Gladys Moraa Nyachieo	Female	12877095	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
76	69	Hilda Ayuma Samwel	Female	726175	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
87	69	Ismael Issak Ibren	Male	12755957	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
96	69	Jeniffer Toiyoi Toroitich	Female	3541848	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
105	69	Joseph Chesire Chemuna	Male	4342878	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
111	69	Josephat Kiptarbei Kirwa	Male	253278	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
119	69	Julius Maina Mathenge	Male	723426	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
128	69	Kiprop Philemon Kandie	Female	10376643	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
135	69	Luka Leiyeyo Ole Roimen	Male	10403958	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
137	69	Marcella Jebatia Kibet	Female	9839874	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
138	69	Margaret Njeri Gaithuya	Female	5783344	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
159	69	Mwangi Njoroge Bahati P. Ag. Elijah	Male	725677	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
168	69	Paul Kivisi Musanga	Male	1170732	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
171	69	Peter Kirwa Kebenei	Male	1108234	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
172	69	Peter Wabwire Okuku	Male	10121546	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
178	69	Rachel Muthoni Gacheru	Female	12948021	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
187	69	Samson Kipkosgei Tuwei	Male	3295383	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
194	69	Shadrack Kingetich	Male	20337474	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
203	69	Susan Arua Chuma	Female	12642986	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
210	69	Willymina Ngaira Magotsi	Female	5632689	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
216	69	Zacchaus Omai Juma	Male	22767364	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
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

COPY public.interventions (id, intervention_type_id, year, intervention_phase, settlement_id, cluster_id) FROM stdin;
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
5	0.045	\N	226	4044	\N	069_003	\N	0103000020E61000000100000005000000A1A3CE08059E414054A9CCB8EF0EE23FD78B41240C9E4140ACF8CC38FE0FE23FAE9489260F9E4140E77601921D0FE23F2FC55C87079E4140203AEA2CF30DE23FA1A3CE08059E414054A9CCB8EF0EE23F
7	0.05	\N	226	4046	\N	069_004	0	0103000020E61000000100000005000000A1A3CE08059E41406CAACCB8EF0EE23F167C4B3E029E4140FAEED7952110E23F4BFE6149089E41401EC2103E1A11E23FD78B41240C9E4140F4F8CC38FE0FE23FA1A3CE08059E41406CAACCB8EF0EE23F
9	0.052	\N	226	4511	\N	069_005	0	0103000020E61000000100000005000000167C4B3E029E4140FAEED7952110E23F5BFBD99EFE9D4140C35DD6B39B11E23FCD708CE0039E4140FAB1B8356012E23F4BFE6149089E41401EC2103E1A11E23F167C4B3E029E4140FAEED7952110E23F
10	0.071	\N	226	4116	\N	069_006	0	0103000020E610000001000000060000009E06D3051D9E4140180C684AC31FE23F051D09DE189E4140458D49173421E23F108049FE1F9E41405051FD737422E23F39A0ABAE239E414058D11B0E7C21E23F14D3A77E239E4140251C0C2F0821E23F9E06D3051D9E4140180C684AC31FE23F
11	0.047	\N	226	4125	\N	069_007	0	0103000020E61000000100000005000000051D09DE189E4140458D49173421E23FA943ED04169E41404F860CFE3322E23F5A4A96A11C9E41409CC288475923E23F108049FE1F9E41405051FD737422E23F051D09DE189E4140458D49173421E23F
13	0.039	\N	226	41301	\N	069_008	0	0103000020E61000000100000006000000A943ED04169E41404F860CFE3322E23F9B65CA31139E41401CE1EA602F23E23F807B579D189E4140726F835FF123E23F9C4783AB1A9E414032F95A43DF23E23F5A4A96A11C9E41409CC288475923E23FA943ED04169E41404F860CFE3322E23F
14	0.05	\N	226	4122	\N	069_009	0	0103000020E61000000100000006000000C8E8ACEA0E9E414035806C2C0121E23FD01610950C9E414024082773DE21E23F04BDE4FA0C9E41400926E2505222E23F9B65CA31139E41401CE1EA602F23E23FA943ED04169E41404F860CFE3322E23FC8E8ACEA0E9E414035806C2C0121E23F
16	0.049	\N	226	4114	\N	069_010	0	0103000020E61000000100000005000000F56ED8AB119E41402E1701BBF31FE23FC8E8ACEA0E9E414035806C2C0121E23FA943ED04169E41404F860CFE3322E23F051D09DE189E4140458D49173421E23FF56ED8AB119E41402E1701BBF31FE23F
18	0.046	\N	226	4110	\N	069_011	0	0103000020E6100000010000000600000054A36902159E41407F12AF14AB1EE23FF56ED8AB119E41402E1701BBF31FE23F74D0AD3E169E414016E93A57BF20E23FB6B106491A9E414091820FF2431FE23F362BCBD1169E4140B07066B7951EE23F54A36902159E41407F12AF14AB1EE23F
20	0.027	\N	226	4507	\N	069_012	0	0103000020E61000000100000005000000B6B106491A9E414091820FF2431FE23F74D0AD3E169E414016E93A57BF20E23F051D09DE189E4140458D49173421E23F9E06D3051D9E4140180C684AC31FE23FB6B106491A9E414091820FF2431FE23F
22	0.027	\N	226	4148	\N	069_013	0	0103000020E610000001000000070000000BC8E7EE149E4140D56EF9502A24E23F8097F3F50F9E4140FCB9E3E2E725E23F05210B15119E41403B0EB8031826E23F901EBB8D129E41409477CBED0826E23FA3945B03179E41406BF130D7DB24E23FC87571BB169E4140C3E2B8027424E23F0BC8E7EE149E4140D56EF9502A24E23F
24	0.045	\N	226	4147	\N	069_014	0	0103000020E61000000100000005000000391C4ECC109E4140CE7069F39923E23FA75044EB0B9E41400FA57B035625E23F8097F3F50F9E4140FCB9E3E2E725E23F1AC9CCDD149E4140D83BBF4D3024E23F391C4ECC109E4140CE7069F39923E23F
26	0.028	\N	226	4141	\N	069_015	0	0103000020E6100000010000000500000096ADB2E20D9E41402A6E9C303323E23F751110B7099E41408FF011C9FE24E23FBD5454F50B9E41403CE4A56F5225E23F421740C9109E4140A33670099B23E23F96ADB2E20D9E41402A6E9C303323E23F
28	0.042	\N	226	4138	\N	069_016	0	0103000020E61000000100000006000000C7D4F6F1099E4140E569CBE5BA22E23F4E9048CA059E4140A35B12ED7124E23F751110B7099E41408FF011C9FE24E23F96ADB2E20D9E41402A6E9C303323E23F8FB38D660A9E4140D214A15CB322E23FC7D4F6F1099E4140E569CBE5BA22E23F
30	0.037	\N	226	4133	\N	069_017	0	0103000020E61000000100000006000000012960FE069E414084F7E51A4A22E23FB2A37DE0019E41408CFF520FE323E23F4E9048CA059E4140A35B12ED7124E23F706D96ED099E41402C2C3CB4BC22E23FC7D4F6F1099E4140E569CBE5BA22E23F012960FE069E414084F7E51A4A22E23F
33	0.036	\N	226	4128	\N	069_018	0	0103000020E61000000100000005000000C5A46746039E4140A554BA37B621E23FB0E8E2F4FE9D414006767ACA7923E23F9494C1E9019E41404AD2C92AE023E23F634F5AFD069E4140C64EA66C4A22E23FC5A46746039E4140A554BA37B621E23F
35	0.024	\N	226	4126	\N	069_019	0	0103000020E6100000010000000500000014182B1D019E41408BCABB3F6221E23FA0D0A7CBFC9D414034CF9C952923E23F3EEBDAF9FE9D4140E2E0E5C27723E23FAD13363F039E414024C0F427B921E23F14182B1D019E41408BCABB3F6221E23F
37	0.028	\N	226	4121	\N	069_020	0	0103000020E610000001000000050000003BA83F92FE9D41400567CC000321E23F4BC2C731FA9D414093D88213C622E23F665464CCFC9D41403DB6F7472923E23FB651BD1B019E41402E4A63D66221E23F3BA83F92FE9D41400567CC000321E23F
39	0.024	\N	226	4118	\N	069_021	0	0103000020E610000001000000050000006537105BFC9D41406CEB054BB120E23FDB2649FDF79D41408C4B836A7422E23F9BF88934FA9D4140B3009C7CC622E23F3BA83F92FE9D41400567CC000321E23F6537105BFC9D41406CEB054BB120E23F
41	0.049	\N	226	4115	\N	069_022	0	0103000020E6100000010000000500000044E50FD4F79D414007297A3E0420E23F94DC3EA5F39D414010948E97D521E23F899F9202F89D41400A95552E7522E23F3AD84660FC9D414007F84A0BB220E23F44E50FD4F79D414007297A3E0420E23F
43	0.021	\N	226	4112	\N	069_023	0	0103000020E61000000100000005000000EEFC322EF69D4140E7426A4BBF1FE23F0055F68EF19D4140DC28E0688D21E23F94DC3EA5F39D414010948E97D521E23F44E50FD4F79D414007297A3E0420E23FEEFC322EF69D4140E7426A4BBF1FE23F
45	0.026	\N	226	4167	\N	069_024	0	0103000020E61000000100000006000000B34C15A80D9E414020EF844F1B26E23F811837AF089E41402721B98F1028E23F956D4CE10A9E4140A55869051528E23F6AB23510109E414035FD633EB326E23F771543E00F9E41403F4593036B26E23FB34C15A80D9E414020EF844F1B26E23F
47	0.042	\N	226	4168	\N	069_025	0	0103000020E610000001000000060000000357B96E0A9E41409F1A6281A425E23F5AA576EC049E4140571ECD8EF227E23FE901B8D5059E4140B68EB9251528E23F811837AF089E41402721B98F1028E23FB34C15A80D9E414020EF844F1B26E23F0357B96E0A9E41409F1A6281A425E23F
49	0.061	\N	226	4163	\N	069_026	0	0103000020E61000000100000005000000C9AE3E20069E4140C82A7E950125E23F3A7EE7B7009E4140EB0710675527E23FC97FF8EF049E414041C72317F127E23F0357B96E0A9E41409F1A6281A425E23FC9AE3E20069E4140C82A7E950125E23F
51	0.045	\N	226	4158	\N	069_027	0	0103000020E61000000100000005000000CA286DF9029E41404E852C898D24E23F4A5308A0FD9D414078455519E026E23F3A7EE7B7009E4140EB0710675527E23FC9AE3E20069E4140C82A7E950125E23FCA286DF9029E41404E852C898D24E23F
52	0.045	\N	226	4154	\N	069_028	0	0103000020E6100000010000000500000032540AC8FF9D414063DE6E101724E23FEF441387FA9D4140FD97C2C67126E23F4A5308A0FD9D414078455519E026E23FCA286DF9029E41404E852C898D24E23F32540AC8FF9D414063DE6E101724E23F
54	0.044	\N	226	4151	\N	069_029	0	0103000020E610000001000000050000005803A633FD9D4140FFB058EFB423E23F0ED5F401F79D4140CB7D7FF0EE25E23FFE12ED87FA9D4140830528657126E23F4FE8E9CBFF9D41407EF226A01724E23F5803A633FD9D4140FFB058EFB423E23F
56	0.024	\N	226	4146	\N	069_030	0	0103000020E61000000100000005000000E5876217FB9D4140EC9768406C23E23F187510A7F59D4140272DA7CEBB25E23FB4D4C304F79D4140409E0AEEED25E23FF2B74727FD9D4140B7968661B923E23FE5876217FB9D4140EC9768406C23E23F
57	0.027	\N	226	4143	\N	069_031	0	0103000020E61000000100000005000000391CF629F99D4140E5B481D02323E23FF0308DD4F39D4140AF99584A7525E23F866387ABF59D4140E92E0EE9B925E23FE5876217FB9D4140EC9768406C23E23F391CF629F99D4140E5B481D02323E23F
59	0.052	\N	226	4142	\N	069_032	0	0103000020E610000001000000050000002409165CF59D41408764B9639D22E23FA5437845F09D4140BA26FD75F424E23FF0308DD4F39D4140AF99584A7525E23F6C133728F99D41406371CF922423E23F2409165CF59D41408764B9639D22E23F
61	0.039	\N	226	4137	\N	069_033	0	0103000020E61000000100000005000000DDFB47ACF29D4140E770A9DF3622E23F3A30C575ED9D414044DFCCA08B24E23F73F3AA4CF09D414087308A26F124E23F2409165CF59D41408764B9639D22E23FDDFB47ACF29D4140E770A9DF3622E23F
62	0.032	\N	226	4135	\N	069_034	0	0103000020E610000001000000050000009F90F0A5F09D4140ABABA75EEC21E23F3B49DBE7EA9D41405C2EDADF2924E23F3B25F678ED9D414086177B338A24E23F6679F5AEF29D41409831D5453722E23F9F90F0A5F09D4140ABABA75EEC21E23F
64	0.034	\N	226	4250	\N	069_035	0	0103000020E61000000100000006000000F59D5A34F99D414035F19BFAB509E23F6216FF61F79D4140A259351FD409E23F398A353DF69D4140EEF747185D0AE23F90FBEADAFD9D414006A52536550BE23F08F512A1FF9D41402D238D0E990AE23FF59D5A34F99D414035F19BFAB509E23F
66	0.046	\N	226	4038	\N	069_036	0	0103000020E61000000100000005000000E975D6DBF39D41403E11FF07660BE23FE8155B56F19D4140F1C4AB03870CE23F6AB927CAF89D41408514CE855C0DE23FEA38A137FB9D4140045E449F590CE23FE975D6DBF39D41403E11FF07660BE23F
68	0.046	\N	226	4035	\N	069_037	0	0103000020E61000000100000005000000398A353DF69D4140EEF747185D0AE23FA7DDB3DBF39D414036E08503660BE23FEA38A137FB9D4140045E449F590CE23F2800A0D8FD9D414091DE72EB540BE23F398A353DF69D4140EEF747185D0AE23F
70	0.095	\N	226	4041	\N	069_038	0	0103000020E6100000010000000700000009908C6CFC9D4140F7A440F4E10BE23F8C800403F69D4140760ED6FE720EE23FABA698FAF89D4140A5AD3ACCE60EE23F52445B5BFA9D41400941F2B1D10EE23F4D5D9A81FC9D4140586848EA250FE23F58394893029E414063D831269A0CE23F09908C6CFC9D4140F7A440F4E10BE23F
1	0.043	\N	226	4231	\N	069_001	0	0103000020E61000000100000007000000AE9489260F9E4140E77601921D0FE23FE34B80D9139E4140931D6803B80DE23FCF264CA0139E41405D712F5B4C0DE23FC4F6018D109E4140DF569713E50CE23FEECCA65C0B9E4140495FD5EF860EE23FEECCA65C0B9E4140495FD5EF860EE23FAE9489260F9E4140E77601921D0FE23F
3	0.047	\N	226	4040	\N	069_002	0	0103000020E6100000010000000500000055CFC7940B9E4140660E9F11360CE23F2FC55C87079E4140203AEA2CF30DE23FEECCA65C0B9E4140495FD5EF860EE23FC4F6018D109E4140DF569713E50CE23F55CFC7940B9E4140660E9F11360CE23F
76	0.046	\N	226	4033	\N	069_041	0	0103000020E61000000100000006000000CD0C666AEF9D41405C9F3F195C08E23FADA0599DEC9D4140C4E3EFB79F09E23F843917FEF29D4140AAF9F140750AE23F2F4EEC0BF59D41401D1C0BED8509E23F5F1819A6F49D414007B4C8111509E23FCD0C666AEF9D41405C9F3F195C08E23F
78	0.044	\N	226	4034	\N	069_042	0	0103000020E61000000100000005000000049AFAA4EC9D41405D3E84469C09E23FBB220318EA9D4140CB4017BDC60AE23FC9D40031F09D414060B9604A9F0BE23F843917FEF29D4140AAF9F140750AE23F049AFAA4EC9D41405D3E84469C09E23F
80	0.054	\N	226	4037	\N	069_043	0	0103000020E61000000100000006000000AC179F2AEA9D414059258B3BBE0AE23FA59A69D7E69D414040F76EFB2C0CE23F398562C9EB9D41402A23A000F30CE23F599EB2A7ED9D4140D40DA359D20CE23FC9D40031F09D414060B9604A9F0BE23FAC179F2AEA9D414059258B3BBE0AE23F
82	0.018	\N	226	4053	\N	069_044	0	0103000020E61000000100000005000000AE6B5EA6FE9D414080293FA39811E23FD31F2142FD9D4140D797937E2712E23FA4C11A2E029E4140A6E241FAE112E23F8AD730DE039E41403D8394DD5F12E23FAE6B5EA6FE9D414080293FA39811E23F
84	0.055	\N	226	4058	\N	069_045	0	0103000020E61000000100000005000000593DEB5BFD9D4140DAB2B94F2B12E23FF2D4870FF89D4140E9748D684D14E23F1ABEBA7CFB9D4140D9F013BFCF14E23FA4C11A2E029E4140A6E241FAE112E23F593DEB5BFD9D4140DAB2B94F2B12E23F
86	0.048	\N	226	4073	\N	069_046	0	0103000020E610000001000000040000004A250917F89D4140409D02634A14E23FAC9716F5EC9D41404F1AA489F018E23FE7064462FB9D4140212676D0CB14E23F4A250917F89D4140409D02634A14E23F
88	0.103	\N	226	4039	\N	069_047	0	0103000020E6100000010000000500000052FB3E7E059E41401C6DC990620BE23FA55D6AAFFE9D41408219E6E93B0EE23FECC39918059E41407092E511F20EE23F411395900B9E4140AB17BDDE370CE23F52FB3E7E059E41401C6DC990620BE23F
90	0.109	\N	226	4050	\N	069_048	0	0103000020E61000000100000005000000A05D6AAFFE9D41408219E6E93B0EE23F125378D8F79D4140072152C82211E23FA9BAD599FD9D41408E6AC8520412E23FECC39918059E4140A293E511F20EE23FA05D6AAFFE9D41408219E6E93B0EE23F
92	0.053	\N	226	4054	\N	069_049	0	0103000020E6100000010000000700000062AAECEBF79D4140D62253871A11E23FAE743F2BF59D41400677CEC23B12E23FE67ED1BAF59D41402F5994E06312E23F64FF9EFBF49D4140C27D5F35C412E23F79C3ED08FA9D41405968F2ED8113E23FA9BAD599FD9D41408E6AC8520412E23F62AAECEBF79D4140D62253871A11E23F
94	0.046	\N	226	4508	\N	069_050	0	0103000020E610000001000000050000002C8CFE01F59D414068B758FFC012E23FB17B576FF19D4140E3E221965114E23FED00F278F69D41403EDE0E50F714E23F76C3ED08FA9D41405968F2ED8113E23F2C8CFE01F59D414068B758FFC012E23F
96	0.048	\N	226	4062	\N	069_051	0	0103000020E61000000100000005000000B17B576FF19D4140E3E221965114E23F21AA27E3ED9D41405836ED281B16E23F9D469F91F29D41403E8970A29816E23FED00F278F69D41403EDE0E50F714E23FB17B576FF19D4140E3E221965114E23F
98	0.045	\N	226	4069	\N	069_052	0	0103000020E61000000100000005000000CF8916F3ED9D41405322DC211316E23FC92F0737EA9D4140E776DAA1C417E23FE17EDC48EE9D414095A298A56218E23FEF856F86F29D4140AB085B4E9D16E23FCF8916F3ED9D41405322DC211316E23F
100	0.042	\N	226	4076	\N	069_053	0	0103000020E610000001000000070000005B8A1C5AEA9D41401CB00DF4C917E23F64873F3BE69D41409243CD449E19E23F1C33F1CAE69D4140C04645A5161AE23FCE9FE718E99D41409B748E8C0A1AE23FDD17DF08ED9D41406FB20EDBEA18E23FE17EDC48EE9D414095A298A56218E23F5B8A1C5AEA9D41401CB00DF4C917E23F
102	0.068	\N	226	4045	\N	069_054	0	0103000020E610000001000000050000001A29192FEE9D4140C4599412100EE23FBD15611FEA9D414097ADA0B2E50FE23F7AB648B7F09D4140EEB8D8BAA910E23FAAE14691F49D41403883D592FA0EE23F1A29192FEE9D4140C4599412100EE23F
104	0.059	\N	226	4043	\N	069_055	0	0103000020E6100000010000000500000033763B23E99D4140EE65A197550DE23FEDA72160E49D41403708A63E2E0FE23F0CD1B633EA9D4140DD294783DC0FE23FE78F6D29EE9D4140BE843EA2120EE23F33763B23E99D4140EE65A197550DE23F
106	0.056	\N	226	4042	\N	069_056	0	0103000020E610000001000000050000002D6B88F9E69D4140E13AB651320CE23F098C4697E09D4140D8F731FABE0EE23F8E248370E49D4140C831CFE4270FE23F8BFEE681EA9D4140939147C7BF0CE23F2D6B88F9E69D4140E13AB651320CE23F
108	0.07	\N	226	4047	\N	069_057	0	0103000020E61000000100000007000000F683799CE09D4140069AA8E6BC0EE23F35A4EE1BDC9D4140527E1FA19910E23FE08022BCE09D4140CFCE3C0D3F11E23F1097F6DAE19D4140C6788B9FC310E23F127850DDE39D41407F75C7CE0B11E23F955C9D0EE79D4140A85915737E0FE23FF683799CE09D4140069AA8E6BC0EE23F
110	0.036	\N	226	4048	\N	069_058	0	0103000020E61000000100000005000000955C9D0EE79D4140A85915737E0FE23F23CC48D9E39D41406D4FFE3D0B11E23FC5CD3A9AE79D4140EE0D851D8711E23F60FD483AEB9D41403B28E48D0610E23F955C9D0EE79D4140A85915737E0FE23F
112	0.031	\N	226	4049	\N	069_059	0	0103000020E6100000010000000500000060FD483AEB9D41403B28E48D0610E23F2EBDDA95E79D41406789228D8611E23F7A385027EB9D4140E12AF26F0512E23F3C98C565EE9D4140DC42BECC6410E23F60FD483AEB9D41403B28E48D0610E23F
114	0.039	\N	226	4056	\N	069_060	0	0103000020E610000001000000070000003C98C565EE9D4140DC42BECC6410E23F3A44225CEA9D4140A23B89B85612E23F45762701EE9D414090435D14E112E23F52347E44F19D41400B870498AE11E23F91580830EF9D41402678BC226311E23F77B648B7F09D4140EEB8D8BAA910E23F3C98C565EE9D4140DC42BECC6410E23F
116	0.032	\N	226	4247	\N	069_061	0	0103000020E6100000010000000700000052347E44F19D41400B870498AE11E23F5527AD82EC9D4140A2DAF0906B13E23FCFC84A74EF9D41401E7539E7E913E23F86E0EAA0F29D4140C35ED9926812E23F9E7FF5CBF39D41407E5A6BAE9212E23FC24B258FF49D41409B89315B3412E23F52347E44F19D41400B870498AE11E23F
118	0.086	\N	226	4051	\N	069_062	0	0103000020E61000000100000007000000EE6ABB4BFA9D41409FBF18A71810E23FCDA6AA1FF89D4140DFB27C8DC70FE23FEE12DEC0F79D4140A10C274D770FE23F0FB10584F49D4140CAD19C5E000FE23F079EB632EF9D41406CD386DD6111E23F851B5312F59D4140899CC6734612E23FEE6ABB4BFA9D41409FBF18A71810E23F
120	0.035	\N	226	4510	\N	069_063	0	0103000020E61000000100000005000000598B6562EA9D4140F0C049A65712E23FB387CB8EE69D4140563981D73014E23F15E72375E99D41401D563E6D8E14E23F6FF2B0FEED9D41403650DDB6E012E23F598B6562EA9D4140F0C049A65712E23F
121	0.036	\N	226	4509	\N	069_064	0	0103000020E61000000100000005000000E8AE3548E69D41403A2F331B1812E23F1C0C2778E29D4140ABDFAA789F13E23F92582C9DE69D414026AA80E52914E23F22A00CD9E99D414053FA9CFE9912E23FE8AE3548E69D41403A2F331B1812E23F
123	0.036	\N	226	4057	\N	069_065	0	0103000020E61000000100000009000000D2B89939E69D41406A70CBF61D12E23F3413001CE49D414030862DECCE11E23F7306A14FE29D4140EC7E6694F111E23F9253E92EDF9D414016B5FDCC5113E23FF6A9CA88DF9D4140D95F0FB0CB13E23F56E8AAE9E09D41404AAB4CD40114E23FF73CA407E19D41406067D37C3314E23FBE3BC836E69D41402C2B16181F12E23FD2B89939E69D41406A70CBF61D12E23F
125	0.048	\N	226	4060	\N	069_066	0	0103000020E61000000100000007000000BC1F8078E29D414076ED49849F13E23FA0C8050CE19D41402A8DE8BA3114E23F623D8549E19D4140B25977337714E23FAE638F4EE09D41407DDA449BEC14E23F176D856DE69D4140C8A58022BE15E23F15E72375E99D41401D563E6D8E14E23FBC1F8078E29D414076ED49849F13E23F
127	0.048	\N	226	4063	\N	069_067	0	0103000020E61000000100000005000000CFBDA855E09D4140B70A1149E914E23F7F6926DADC9D4140637837615A16E23FBF54B354E39D4140A44FA2B1EC16E23F176D856DE69D4140C8A58022BE15E23FCFBDA855E09D4140B70A1149E914E23F
129	0.074	\N	226	4071	\N	069_068	0	0103000020E610000001000000060000007F6926DADC9D4140637837615A16E23F3D117FA5D99D41408586D497B717E23F28D9520DDA9D41404989A2F72D18E23F7732DD80DF9D41408C77F47EFA18E23F878CCE63E49D41408DFE38BD0217E23F7F6926DADC9D4140637837615A16E23F
131	0.056	\N	226	4065	\N	069_069	0	0103000020E6100000010000000500000015E72375E99D41401D563E6D8E14E23F82742158E39D41404C688562EB16E23FDC669C30E89D414079FBAFEC5817E23FA579A2F7EC9D4140A739B4721415E23F15E72375E99D41401D563E6D8E14E23F
133	0.045	\N	226	4074	\N	069_070	0	0103000020E61000000100000006000000B62E3B63E49D41400A3F91F80217E23F6987CB85DF9D4140CE9A9C82F818E23F4A259E42E29D4140323C3FC86719E23F474421E5E39D4140A07FCC9F4319E23FE556B429E89D41406B5B8F505817E23FB62E3B63E49D41400A3F91F80217E23F
135	0.023	\N	226	4233	\N	069_071	0	0103000020E6100000010000000600000092762858EF9D4140829AD12FE513E23FE68331A4EC9D414044EE5C2F7113E23FD9EE6A70E99D414027D157149014E23FCA6A8EF1EC9D414073BE8D6E1715E23F712E0F5FEF9D41406A56FE57E613E23F92762858EF9D4140829AD12FE513E23F
137	0.073	\N	226	4059	\N	069_072	0	0103000020E610000001000000080000008FCCA7E6D69D4140AD5BE677C212E23FB9397C53D39D4140C5387B794D14E23FD354D18ADB9D41403D3DB3E2A415E23F20C989B8DD9D41407E4AB20CB414E23FF90EA75EDD9D4140765CB5A63614E23F4BF07B1CDB9D41400EDBE365D713E23F7A8D8891DB9D4140EEC66ABE8B13E23F8FCCA7E6D69D4140AD5BE677C212E23F
139	0.044	\N	226	4061	\N	069_073	0	0103000020E6100000010000000500000094634A55D39D4140BA8800B24C14E23F72A8A043D19D41403E53FDBB2715E23FCFDBF27AD99D41401F58F39E7716E23FD354D18ADB9D41403D3DB3E2A415E23F94634A55D39D4140BA8800B24C14E23F
141	0.034	\N	226	4064	\N	069_074	0	0103000020E6100000010000000500000051FF3D4FD19D41407FF9CF962915E23FAAB425D3CF9D4140C0D7D6D0CF15E23F5E5D8CF6D79D414010E58B3A2717E23FCFDBF27AD99D41401F58F39E7716E23F51FF3D4FD19D41407FF9CF962915E23F
143	0.035	\N	226	4067	\N	069_075	0	0103000020E61000000100000006000000AAB425D3CF9D4140C0D7D6D0CF15E23F59803BCDCD9D4140AC5F99069B16E23F8FADFE5AD59D41402DF3BAA29017E23FC9DC4C39D79D414008928BF76A17E23FEA3544FBD79D41403A2971182517E23FAAB425D3CF9D4140C0D7D6D0CF15E23F
71	0.045	\N	226	4036	\N	069_039	0	0103000020E61000000100000005000000F0CC3071FC9D41408F11F527E00BE23F58394893029E414063D831269A0CE23F52FB3E7E059E41401C6DC990620BE23F08F512A1FF9D41402D238D0E990AE23FF0CC3071FC9D41408F11F527E00BE23F
74	0.043	\N	226	4232	\N	069_040	0	0103000020E61000000100000006000000E8155B56F19D4140F1C4AB03870CE23F5879F3CBEF9D41403E790992260DE23FD6CABF3DF09D4140E4BC8074A00DE23F8C800403F69D4140760ED6FE720EE23F8D7D4CC1F89D4140273812885B0DE23FE8155B56F19D4140F1C4AB03870CE23F
149	0.065	\N	226	4055	\N	069_078	0	0103000020E61000000100000005000000709C9D24DC9D414065D4A6D79A10E23FF10FC8DDD69D41400442B81DC612E23FFF9AF593DB9D41403A1C61248C13E23FE08022BCE09D4140CFCE3C0D3F11E23F709C9D24DC9D414065D4A6D79A10E23F
151	0.04	\N	226	4087	\N	069_079	0	0103000020E61000000100000005000000E3D36BD5DF9D414046CE9E4FD019E23F42A3F26ADA9D4140E206AE97CB1BE23FC74E307CDD9D41403945C445431CE23F95B101F3E29D41406CBFCC02441AE23FE3D36BD5DF9D414046CE9E4FD019E23F
153	0.041	\N	226	4235	\N	069_080	0	0103000020E61000000100000005000000B16F02A8DC9D4140371DD6FA5119E23FF5729531D79D41409218F3C6511BE23F42A3F26ADA9D4140E206AE97CB1BE23FE3D36BD5DF9D414046CE9E4FD019E23FB16F02A8DC9D4140371DD6FA5119E23F
156	0.041	\N	226	4085	\N	069_081	0	0103000020E610000001000000050000006A765BC8D99D41409F18DE31E418E23FBD607FA2D39D4140534103F0CD1AE23FF5729531D79D41409218F3C6511BE23F30F8E7A0DC9D414082565C945419E23F6A765BC8D99D41409F18DE31E418E23F
158	0.054	\N	226	4081	\N	069_082	0	0103000020E6100000010000000500000016812A24D59D4140F8E20EC53D18E23F5D3D98DDCF9D41402E80FE99491AE23F7F58A6B3D39D41401574696BD01AE23F6A765BC8D99D41409F18DE31E418E23F16812A24D59D4140F8E20EC53D18E23F
160	0.059	\N	226	4078	\N	069_083	0	0103000020E61000000100000007000000405B28A9CF9D414076E77AD49417E23F94CCFBFCCB9D4140F0BBCB2F2319E23FCCC3AD60CD9D41402B11DC4C5419E23F2FD4D564CC9D4140DDD7BE07BF19E23F5AD302E4CF9D414011D6E61C471AE23F7047341AD59D414049D22FA24118E23F405B28A9CF9D414076E77AD49417E23F
161	0.042	\N	226	4086	\N	069_084	0	0103000020E610000001000000050000002FD4D564CC9D4140DDD7BE07BF19E23FF2C740A9C79D4140C6262C7EC01BE23FD5D39708CB9D41405E239C553A1CE23F5AD302E4CF9D414011D6E61C471AE23F2FD4D564CC9D4140DDD7BE07BF19E23F
163	0.059	\N	226	4090	\N	069_085	0	0103000020E610000001000000050000001CA7715BD59D4140EB2A2CDAF41BE23FA9CC987ACE9D4140C242B037D81AE23FD5D39708CB9D41405E239C553A1CE23FA8D1C322D29D4140A5BEA87B381DE23F1CA7715BD59D4140EB2A2CDAF41BE23F
165	0.027	\N	226	4091	\N	069_086	0	0103000020E610000001000000050000005AD302E4CF9D414011D6E61C471AE23FA9CC987ACE9D4140C242B037D81AE23F5AB59553D59D4140E2EAF294F31BE23F4C363303D79D4140734EAD104B1BE23F5AD302E4CF9D414011D6E61C471AE23F
167	0.024	\N	226	4094	\N	069_087	0	0103000020E61000000100000005000000F94ED809D89D41406B39F2B1711BE23FBE0AA856D69D4140CE9DAE7A231CE23F4C0BAB44DB9D4140B93BD00CF91CE23FC74E307CDD9D41403945C445431CE23FF94ED809D89D41406B39F2B1711BE23F
168	0.036	\N	226	4093	\N	069_088	0	0103000020E610000001000000050000001C4DA45DD69D4140AC8023A0201CE23FA657DF35D39D41408B6B100F581DE23F2BFC04E8D79D414051BE297D001EE23F4C0BAB44DB9D4140B93BD00CF91CE23F1C4DA45DD69D4140AC8023A0201CE23F
170	0.029	\N	226	4096	\N	069_089	0	0103000020E61000000100000006000000C74E307CDD9D41403945C445431CE23F2BFC04E8D79D414051BE297D001EE23FAD0DD954D99D4140E7FA551D321EE23F018A0C57DB9D414004873E7B181EE23FAC0F402AE09D414071B356A8A51CE23FC74E307CDD9D41403945C445431CE23F
172	0.039	\N	226	4088	\N	069_090	0	0103000020E61000000100000006000000B9F3DAF6E29D41406D40B19A421AE23FB3E4737ADD9D414042B832E8431CE23FAC0F402AE09D414071B356A8A51CE23F06EDEB88E59D4140EFC79FB5101BE23FF157E55EE59D414060EF5FDBA21AE23FB9F3DAF6E29D41406D40B19A421AE23F
174	0.037	\N	226	4109	\N	069_091	0	0103000020E6100000010000000500000002B573D7D89D41405D3F0AE0DE1EE23F21B78EB1D29D4140612B0F8BB120E23FC369F0E2D59D41408D938CD62421E23FC1F420AFDB9D41408F7684A74A1FE23F02B573D7D89D41405D3F0AE0DE1EE23F
176	0.037	\N	226	4106	\N	069_092	0	0103000020E61000000100000005000000C2822392D59D4140FC460A956B1EE23FFAF5CFEDCF9D4140E51B15C34520E23F5A6D10BAD29D414047EB3BBEB220E23FA6DA46D3D89D41400CE7F51CE01EE23FC2822392D59D4140FC460A956B1EE23F
178	0.04	\N	226	4104	\N	069_093	0	0103000020E610000001000000050000004E632EDFD19D414087D858C2EB1DE23F904A4FE4CC9D4140E260ED7EDC1FE23FFAF5CFEDCF9D4140E51B15C34520E23F7FD5907ED59D4140983A1202721EE23F4E632EDFD19D414087D858C2EB1DE23F
180	0.038	\N	226	4102	\N	069_094	0	0103000020E610000001000000050000000EE5E78FCE9D41405277ABF97A1DE23F9D6AD1D0C99D41403026822E641FE23F3E3E9AF0CC9D41402166C2B4D71FE23FE9DA5FD6D19D414051A8CB30EF1DE23F0EE5E78FCE9D41405277ABF97A1DE23F
182	0.062	\N	226	4100	\N	069_095	0	0103000020E61000000100000005000000ED2C3A4EC99D414069EC0A03C41CE23F0DF51599C49D4140294137ADA01EE23F12997ED2C99D41409F36B781631FE23FD54BFB9ACE9D4140FA28AB827C1DE23FED2C3A4EC99D414069EC0A03C41CE23F
184	0.045	\N	226	4098	\N	069_096	0	0103000020E610000001000000050000004E7F715FC59D4140A4442421301CE23F54462DD2C09D4140526B9450141EE23F56F9BFA3C49D414008596C759C1EE23FED2C3A4EC99D414069EC0A03C41CE23F4E7F715FC59D4140A4442421301CE23F
186	0.042	\N	226	4095	\N	069_097	0	0103000020E61000000100000005000000D0D88998C19D4140DC1E9446A61BE23FD2EE193DBD9D41405970C7748A1DE23FD98264D7C09D41404DF8C425121EE23FA44BA54DC59D4140A75E4F86371CE23FD0D88998C19D4140DC1E9446A61BE23F
188	0.045	\N	226	40931	\N	069_098	0	0103000020E61000000100000005000000AF751646BD9D4140AD18FA620D1BE23F31CB1E8AB99D4140D12C8C95FB1CE23FD2EE193DBD9D41405970C7748A1DE23F303A8881C19D414081791943B01BE23FAF751646BD9D4140AD18FA620D1BE23F
190	0.062	\N	226	4089	\N	069_099	0	0103000020E61000000100000007000000B48FCDB7B89D4140FFE4016C5B1AE23F33833629B79D4140FEAEF58E791AE23F43D61D7AB49D414093DC3E4AE01BE23F0BE6B423B59D414026E4C2A14E1CE23F87AC0A8EB99D41403AB9948EF91CE23FAF751646BD9D4140AD18FA620D1BE23FB48FCDB7B89D4140FFE4016C5B1AE23F
192	0.044	\N	226	4083	\N	069_100	0	0103000020E610000001000000070000001E35F92EB19D41403A17C51B4619E23F97FEE992AD9D4140B6F827D73F1BE23F91799F60B09D41409844AE1DAA1BE23FBC1AFD2EB29D4140FCD7CCF5871BE23F92C446ACB49D4140CA1703C72E1AE23FBFAFA00CB49D41402BE3E661B019E23F1E35F92EB19D41403A17C51B4619E23F
194	0.039	\N	226	4082	\N	069_101	0	0103000020E610000001000000050000007D03F689AD9D414041D6E9C4C118E23F03E3826DAA9D414041212696D91AE23F97FEE992AD9D4140B6F827D73F1BE23F5C006938B19D41400E17B6794719E23F7D03F689AD9D414041D6E9C4C118E23F
196	0.045	\N	226	4080	\N	069_102	0	0103000020E610000001000000050000001C6B3995A99D4140D93BB4713F18E23FA7A9D560A69D41404FD9DD37491AE23F03E3826DAA9D414041212696D91AE23F9C472780AD9D41405F0C075EC818E23F1C6B3995A99D4140D93BB4713F18E23F
198	0.044	\N	226	4077	\N	069_103	0	0103000020E610000001000000050000003F2C55C8A59D4140B9877C13B117E23F43E8116CA29D414015FCA4D5B419E23FABA7EF67A69D414099059CB3441AE23F1C6B3995A99D4140D93BB4713F18E23F3F2C55C8A59D4140B9877C13B117E23F
200	0.046	\N	226	4075	\N	069_104	0	0103000020E610000001000000050000009AEF4733A29D4140DBE78DC43617E23FD774D3D79D9D4140FB270A6A1019E23F43E8116CA29D414015FCA4D5B419E23F26B4E6C1A59D4140418A9AEEB417E23F9AEF4733A29D4140DBE78DC43617E23F
202	0.037	\N	226	4072	\N	069_105	0	0103000020E61000000100000005000000E590F8E99E9D4140D9F425F4BC16E23F49F1888C9A9D4140164D5CA09E18E23FD774D3D79D9D4140FB270A6A1019E23F556FCF34A29D414092ABCBFA3617E23FE590F8E99E9D4140D9F425F4BC16E23F
204	0.041	\N	226	4070	\N	069_106	0	0103000020E61000000100000005000000ADFFB5929B9D4140A6DC55A54416E23F173CB1B1969D4140BF574F431118E23FEA9111969A9D41406FE452849A18E23FE590F8E99E9D4140D9F425F4BC16E23FADFFB5929B9D4140A6DC55A54416E23F
206	0.044	\N	226	4068	\N	069_107	0	0103000020E61000000100000005000000A4CFCFC9979D41400E5D544ABA15E23F8E68EAC4929D4140418033E98617E23F173CB1B1969D4140BF574F431118E23F5200028D9B9D41402D06C2BF4616E23FA4CFCFC9979D41400E5D544ABA15E23F
209	0.046	\N	226	4066	\N	069_108	0	0103000020E61000000100000005000000F0F0498F939D41402C4A78EB2715E23FD04214EA8E9D4140E919798FFD16E23F8E68EAC4929D4140418033E98617E23F60C0D2C4979D41406F0C2414BC15E23FF0F0498F939D41402C4A78EB2715E23F
211	0.044	\N	226	4230	\N	069_109	0	0103000020E61000000100000005000000EBF868C08F9D4140553199909D14E23F46F242098B9D414010730D357316E23F51DAE5F58E9D4140BA869CE4F816E23FF0F0498F939D41402C4A78EB2715E23FEBF868C08F9D4140553199909D14E23F
213	0.022	\N	226	4243	\N	069_110	0	0103000020E610000001000000050000000AAA485EFD9D4140D210B2468A28E23FDE2A6D3CF79D41403D94770B7C2AE23FEDFD618BF89D4140C2351B3ABE2AE23F13DE3E42FF9D4140EFC749B1D528E23F0AAA485EFD9D4140D210B2468A28E23F
215	0.022	\N	226	4242	\N	069_111	0	0103000020E61000000100000005000000E7F7DD6FFB9D41404883B5184428E23F8D1295CDF59D41400FCA4ADF3B2AE23FA300303EF79D41402C8E8B647C2AE23FEE612751FD9D41400BA77C708E28E23FE7F7DD6FFB9D41404883B5184428E23F
217	0.036	\N	226	4184	\N	069_112	0	0103000020E61000000100000005000000789417BAF89D4140FE3308DAE327E23F8C7FD8FFF29D4140EFD7DF89BF29E23F8D1295CDF59D41400FCA4ADF3B2AE23F6CA73679FB9D4140B1C04C8A4528E23F789417BAF89D4140FE3308DAE327E23F
219	0.034	\N	226	4244	\N	069_113	0	0103000020E61000000100000005000000E04A8BBCF59D4140737824937727E23FCA48CB91F09D41402469BA384B29E23F25D79007F39D4140FE1CB308BD29E23FB0683BB6F89D41408F8D9E1AE527E23FE04A8BBCF59D4140737824937727E23F
221	0.021	\N	226	4245	\N	069_114	0	0103000020E610000001000000050000004D3A17D6F39D41407D99F25F2B27E23FBAF6FA1AEF9D4140E11C6A0E0D29E23FCA48CB91F09D41402469BA384B29E23F263B20C5F59D4140A8D00ECF7827E23F4D3A17D6F39D41407D99F25F2B27E23F
147	0.046	\N	226	4084	\N	069_077	0	0103000020E61000000100000008000000EF5A4119C69D41404E39B4E7D619E23F3CED7BFCC29D41408ABD970A1D1BE23F8A61AF9EC79D41402F38B5F8C41BE23FCCC3AD60CD9D41402B11DC4C5419E23F94CCFBFCCB9D4140F0BBCB2F2319E23F3404A24AC99D4140148626B1471AE23F13A8F222C69D414082EFC0D8D219E23FEF5A4119C69D41404E39B4E7D619E23F
227	0.07	\N	226	4191	\N	069_117	0	0103000020E61000000100000007000000975FAC54FF9D414095187B74D028E23FEDFD618BF89D4140C2351B3ABE2AE23F1F522598FC9D414010DFE2C6862BE23F550EE7FEFD9D414019B091B57C2BE23F6D0D1AE2029E41409373D27F2D2AE23FC4D4345A029E4140226CD3C14429E23F975FAC54FF9D414095187B74D028E23F
229	0.027	\N	226	4169	\N	069_118	0	0103000020E61000000100000005000000B2AF984CEC9D41407086D9931526E23F60298683E79D4140A927AC3DF127E23FF94CA0D3E99D4140C745A6F34328E23F3DFBB39CEE9D41403BA1544C6B26E23FB2AF984CEC9D41407086D9931526E23F
231	0.033	\N	226	4164	\N	069_119	0	0103000020E61000000100000005000000A2B7193DE99D4140396D6348A325E23F1C00B0DFE49D4140E6DF87FE9027E23F60298683E79D4140A927AC3DF127E23F07454947EC9D414042E6ACA31726E23FA2B7193DE99D4140396D6348A325E23F
233	0.038	\N	226	4160	\N	069_120	0	0103000020E61000000100000005000000590DC4FDE59D41404C0EDE7C2F25E23F31575E9AE19D41403BA4A9301A27E23F1C00B0DFE49D4140E6DF87FE9027E23FA2B7193DE99D4140396D6348A325E23F590DC4FDE59D41404C0EDE7C2F25E23F
235	0.036	\N	226	4156	\N	069_121	0	0103000020E61000000100000005000000D9DE51DFE29D4140F61D2571BC24E23F546FD892DE9D414005933425A826E23F31575E9AE19D41403BA4A9301A27E23F590DC4FDE59D41404C0EDE7C2F25E23FD9DE51DFE29D4140F61D2571BC24E23F
236	0.031	\N	226	4152	\N	069_122	0	0103000020E61000000100000005000000D0277443E09D414029D089B05A24E23FA7BD18D4DB9D414015936E244526E23F0140189BDE9D4140A7D49F75A426E23FD9DE51DFE29D4140F61D2571BC24E23FD0277443E09D414029D089B05A24E23F
238	0.02	\N	226	4506	\N	069_123	0	0103000020E61000000100000005000000CDAF045BDE9D41404DEC6AC31524E23F5FBF6A36DA9D41407009B3BB0726E23F0CEE98DADB9D414064A588554226E23F610A0A3EE09D4140694950075D24E23FCDAF045BDE9D41404DEC6AC31524E23F
240	0.021	\N	226	4149	\N	069_124	0	0103000020E610000001000000050000007C1C8981DC9D4140BA9B0158D323E23F68D0E761D89D414046AAE9C9BD25E23F1E3EB642DA9D4140D1EFE5F50126E23FCDAF045BDE9D41404DEC6AC31524E23F7C1C8981DC9D4140BA9B0158D323E23F
242	0.036	\N	226	4145	\N	069_125	0	0103000020E61000000100000005000000E31A0F69D99D41403B5BB3C65923E23F1EDD6C4ED59D41405166C8FF4C25E23F68D0E761D89D414046AAE9C9BD25E23F7C1C8981DC9D4140BA9B0158D323E23FE31A0F69D99D41403B5BB3C65923E23F
244	0.037	\N	226	4140	\N	069_126	0	0103000020E610000001000000050000001D4E4849D69D41402D77C1A4E522E23F5AE1AA29D29D41405C66021FDA24E23F1EDD6C4ED59D41405166C8FF4C25E23F5B229D67D99D41404D4E7F765A23E23F1D4E4849D69D41402D77C1A4E522E23F
246	0.038	\N	226	4136	\N	069_127	0	0103000020E61000000100000005000000AE31F208D39D41407E3485966E22E23FD1B655E9CE9D41403910DD926524E23F080C892DD29D4140C9B98F49D824E23F667BED47D69D41406B203049E622E23FAE31F208D39D41407E3485966E22E23F
248	0.035	\N	226	4130	\N	069_128	0	0103000020E61000000100000005000000FF305B18D09D41400D5FB6100422E23FA423CFE4CB9D41404D27798BF823E23FD1B655E9CE9D41403910DD926524E23FAE31F208D39D41407E3485966E22E23FFF305B18D09D41400D5FB6100422E23F
249	0.022	\N	226	4129	\N	069_129	0	0103000020E6100000010000000700000091722A1ACF9D41401CDFBE36DD21E23F914847E0CD9D41402BE06D53F621E23F58861338CA9D4140D0A3D06A7723E23FB836F182CA9D4140CAA49D6AC623E23FD15F0FEFCB9D4140217759C6F323E23FFF305B18D09D41400D5FB6100422E23F91722A1ACF9D41401CDFBE36DD21E23F
251	0.032	\N	226	4123	\N	069_130	0	0103000020E610000001000000070000006B0749D3C99D4140CF56DBB51921E23FFB19C795C59D41401ABC00F41123E23FA8AA2492C79D4140BC71999F5523E23F7CA91DB3C89D41401C1389833C23E23F18A95A51CC9D4140617470ADBC21E23F2DD88101CC9D41400C20CEEE6E21E23F6B0749D3C99D4140CF56DBB51921E23F
253	0.04	\N	226	4120	\N	069_131	0	0103000020E610000001000000050000001B42057AC69D41403557EDE09920E23F648B7B46C29D4140A302EAA09422E23F2675AE9FC59D4140A9C5455A0D23E23F6B0749D3C99D4140CF56DBB51921E23F1B42057AC69D41403557EDE09920E23F
255	0.036	\N	226	4117	\N	069_132	0	0103000020E61000000100000005000000239C7F70C39D41408D7257122420E23FFF5CE750BF9D4140D40B17582622E23F648B7B46C29D4140A302EAA09422E23FF3474E75C69D4140DC179B199C20E23F239C7F70C39D41408D7257122420E23F
257	0.047	\N	226	4113	\N	069_133	0	0103000020E6100000010000000500000088BA5FEFBF9D4140BA0A7BC0A61FE23F3B0C8CE0BA9D414090BF19718821E23FFF5CE750BF9D4140D40B17582622E23F239C7F70C39D41408D7257122420E23F88BA5FEFBF9D4140BA0A7BC0A61FE23F
259	0.037	\N	226	4111	\N	069_134	0	0103000020E61000000100000006000000A6D2E0DBBC9D4140E8D2F6ED2B1FE23F835E04D7B79D4140A3B5569E0D21E23F3B0C8CE0BA9D414090BF19718821E23F88BA5FEFBF9D4140BA0A7BC0A61FE23F7C0A25F6BF9D414021A09BB2A71FE23FA6D2E0DBBC9D4140E8D2F6ED2B1FE23F
261	0.035	\N	226	4108	\N	069_135	0	0103000020E6100000010000000500000072157DAAB99D4140AAFE459EB31EE23F6FB6431DB59D4140FDF9AF64B320E23F835E04D7B79D4140A3B5569E0D21E23FF3B895D2BC9D4140C5EEE0692F1FE23F72157DAAB99D4140AAFE459EB31EE23F
263	0.037	\N	226	4107	\N	069_136	0	0103000020E610000001000000050000009CCE2965B69D41409562FDCC381EE23FFBDC8459B29D4140F8B7AF9C4720E23FDCC50F27B59D414000EE2017AF20E23FFB0506A8B99D4140579570B3B41EE23F9CCE2965B69D41409562FDCC381EE23F
265	0.023	\N	226	4105	\N	069_137	0	0103000020E6100000010000000500000011F276CCB49D41400A140E23FA1DE23F81FB4C2BB09D4140DF91CDE5F41FE23FFBDC8459B29D4140F8B7AF9C4720E23F8BDE3D5FB69D4140A6D51DD03B1EE23F11F276CCB49D41400A140E23FA1DE23F
267	0.028	\N	226	4103	\N	069_138	0	0103000020E61000000100000005000000A6465980B29D4140B665E96CA71DE23FEEBB40CBAD9D414023FD2830A21FE23F81FB4C2BB09D4140DF91CDE5F41FE23FD93455C7B49D414034F2CA54FC1DE23FA6465980B29D4140B665E96CA71DE23F
270	0.048	\N	226	40971	\N	069_139	0	0103000020E6100000010000000500000044319A02A69D4140671B8BCBEB1BE23FEF377B51A19D41403812DF88DF1DE23FB6EE3550A59D4140C154FDE9721EE23F7D0E65E9A99D414035294123731CE23F44319A02A69D4140671B8BCBEB1BE23F
273	0.048	\N	226	4099	\N	069_140	0	0103000020E61000000100000005000000087BCDE6A99D41409EDABD43741CE23FA3F54E57A59D41408F3A0BD46F1EE23F99FEEB54A99D4140BAB833CC071FE23F7BDF32D0AD9D414066C13601021DE23F087BCDE6A99D41409EDABD43741CE23F
275	0.045	\N	226	4101	\N	069_141	0	0103000020E610000001000000050000007BDF32D0AD9D414066C13601021DE23F99062E59A99D414054CE3EE0051FE23F16FDF0F3AC9D414061A1AC1B831FE23F3178F1C2B19D4140E115DCD4841DE23F7BDF32D0AD9D414066C13601021DE23F
276	0.044	\N	226	4199	\N	069_142	0	0103000020E610000001000000060000007CDBA319F49D4140CC2693107C2AE23F6B1BF8D3F19D4140A76FE0D4562BE23FA8D5C87DF99D4140157D37BFAB2CE23F1E8FC38BFB9D4140B05FAB3B1D2CE23FFE57C863FB9D41406F3250FDD02BE23F7CDBA319F49D4140CC2693107C2AE23F
278	0.034	\N	226	4203	\N	069_143	0	0103000020E610000001000000060000006B1BF8D3F19D4140A76FE0D4562BE23F8C48F4DDEF9D414020C3D670032CE23F981CF018F69D41400D3AAD35202DE23F5D322917F89D41405D453A180C2DE23FE638C878F99D41403B82ADE0AA2CE23F6B1BF8D3F19D4140A76FE0D4562BE23F
280	0.03	\N	226	4194	\N	069_144	0	0103000020E6100000010000000500000064ECCC6BF19D41404674B1BD032AE23F1BF263E0EC9D4140FC379F218D2BE23F04F88EE8EF9D4140AD108555052CE23F7CDBA319F49D4140CC2693107C2AE23F64ECCC6BF19D41404674B1BD032AE23F
281	0.022	\N	226	4190	\N	069_145	0	0103000020E610000001000000050000001D939D25EF9D41403070376D9129E23FB679D519EB9D4140152CF8F0442BE23F43D063E3EC9D4140547FFA1D8C2BE23F64ECCC6BF19D41404674B1BD032AE23F1D939D25EF9D41403070376D9129E23F
283	0.028	\N	226	4119	\N	069_146	0	0103000020E61000000100000005000000A16F7A76B39D4140E59845C1F420E23FBD240C1AB09D41403671B2278A22E23FB77DD3CFB29D4140EBD71D68EC22E23FF948EA9BB69D4140C7C197147121E23FA16F7A76B39D4140E59845C1F420E23F
285	0.03	\N	226	4124	\N	069_147	0	0103000020E61000000100000005000000F948EA9BB69D4140C7C197147121E23FB1E739D3B29D414025377714EB22E23FAF9B45EDB59D4140A7F29EB15C23E23F9D1A30E9B99D41405D07E757DB21E23FF948EA9BB69D4140C7C197147121E23F
287	0.034	\N	226	4127	\N	069_148	0	0103000020E610000001000000050000009E5C9BE0B99D4140F653E395DE21E23FA8FD4DF8B59D414097177F865823E23F0AFE33AAB99D41403989D107E123E23F2EBF3C86BD9D41408E42E7B36522E23F9E5C9BE0B99D4140F653E395DE21E23F
289	0.033	\N	226	4132	\N	069_149	0	0103000020E610000001000000050000000006467BBD9D41404C2077E96922E23FB3DDBDADB99D4140EEAD08ACDF23E23FB09D552FBD9D4140272E68646B24E23F7BB66AFBC09D414078AF8E0DEC22E23F0006467BBD9D41404C2077E96922E23F
291	0.031	\N	226	4139	\N	069_150	0	0103000020E610000001000000050000007BB66AFBC09D414078AF8E0DEC22E23F19E16D3ABD9D41409C6D5A046724E23F586D7FA2C09D41406AB597B1E224E23F169C9D64C49D4140694DD45B6423E23F7BB66AFBC09D414078AF8E0DEC22E23F
295	0.03	\N	226	4186	\N	069_152	0	0103000020E61000000100000005000000201C0C91EB9D41409384B46B0D29E23FFFC5506CE79D4140935F1E1DAA2AE23F6B25E26BEA9D4140F1502172272BE23F2F4ABE63EE9D4140554B4B747A29E23F201C0C91EB9D41409384B46B0D29E23F
297	0.029	\N	226	4183	\N	069_153	0	0103000020E61000000100000005000000858666AFE89D414048A771229F28E23FD1739F94E49D414003A75B4D342AE23F78E5EA6DE79D414016EC8D7DA92AE23F46398290EB9D4140010C5AA10D29E23F858666AFE89D414048A771229F28E23F
223	0.032	\N	226	4176	\N	069_115	0	0103000020E610000001000000050000002EE03B38F19D414027AFA920CB26E23F16B1523DEC9D4140CF55B9C6A028E23FF1546B20EF9D4140D50759F50D29E23F177791D0F39D4140784A3A922D27E23F2EE03B38F19D414027AFA920CB26E23F
225	0.02	\N	226	4246	\N	069_116	0	0103000020E61000000100000005000000E905B669EF9D41401AFA88F38626E23FA97AAB96EA9D4140E199EF9B6028E23F16B1523DEC9D4140CF55B9C6A028E23F47DDE72CF19D4140434BF64CCF26E23FE905B669EF9D41401AFA88F38626E23F
303	0.031	\N	226	4177	\N	069_156	0	0103000020E61000000100000005000000D614FA6FDF9D4140C7823EC44C27E23FE7FEB9D6DB9D41400C5E4B1CCF28E23F3A1E1517DF9D4140264AEAB45229E23FAE6308B6E29D4140D312A7E3C627E23FD614FA6FDF9D4140C7823EC44C27E23F
305	0.028	\N	226	4249	\N	069_157	0	0103000020E610000001000000050000008A64C307DC9D414016E0BCEFCC26E23FABADEC26D99D414088661CDA6A28E23FE25D7CD9DB9D41408EE6F88BCF28E23F5DCF886FDF9D41402028BFF34C27E23F8A64C307DC9D414016E0BCEFCC26E23F
307	0.033	\N	226	4173	\N	069_158	0	0103000020E610000001000000050000001210919AD89D41408BAA591B4D26E23F41B9EA7DD59D4140FA8DE2FEE027E23FABADEC26D99D414088661CDA6A28E23F63AD6D04DC9D414094E44ECFCE26E23F1210919AD89D41408BAA591B4D26E23F
310	0.028	\N	226	4162	\N	069_159	0	0103000020E61000000100000005000000C041108CD59D41405EB7F88DD825E23F40344F8DD29D41403672B82F6B27E23F9C90DE83D59D4140EA4F52FADD27E23F1210919AD89D41408BAA591B4D26E23FC041108CD59D41405EB7F88DD825E23F
312	0.03	\N	226	4159	\N	069_160	0	0103000020E61000000100000005000000DC76BE46D29D4140AE86DF7F6125E23FD0A0F651CF9D4140FCE88B25F926E23F40344F8DD29D41403672B82F6B27E23F39176D89D59D41400B6782F0D925E23FDC76BE46D29D4140AE86DF7F6125E23F
314	0.029	\N	226	4155	\N	069_161	0	0103000020E61000000100000005000000B5D9482ECF9D41408E07F237F324E23FA032981BCC9D414063BF1D588326E23F9F981A53CF9D41400D6F4688F826E23FDC76BE46D29D4140AE86DF7F6125E23FB5D9482ECF9D41408E07F237F324E23F
316	0.014	\N	226	4505	\N	069_162	0	0103000020E6100000010000000500000060EF69CCCD9D414003A80195BE24E23F62E9F173CA9D414004868A6D4326E23F7D358920CC9D41403707B5D48026E23FB5D9482ECF9D41408E07F237F324E23F60EF69CCCD9D414003A80195BE24E23F
319	0.029	\N	226	4150	\N	069_163	0	0103000020E61000000100000005000000A8D1F3B3CA9D414039A4070C4F24E23F23408A47C79D41409AD6CF5ECC25E23FB622C476CA9D4140D3D2A4254226E23F60EF69CCCD9D414003A80195BE24E23FA8D1F3B3CA9D414039A4070C4F24E23F
321	0.017	\N	226	4144	\N	069_164	0	0103000020E61000000100000007000000C0E3D79CC99D4140F2289AB02524E23F7905E96CC89D4140D968C9463724E23F3234C0B3C59D4140F7C82A0D5E25E23FAED88D0DC69D41409A6B5786A525E23FAFBF9B4AC79D4140287A0B09CB25E23FA8D1F3B3CA9D414039A4070C4F24E23FC0E3D79CC99D4140F2289AB02524E23F
323	0.066	\N	226	4229	\N	069_165	0	0103000020E61000000100000005000000A9C26400CD9D4140503E9F386E35E23F44D53519C89D414015164970BF36E23F6531B8E4CD9D4140B63DCB833738E23F534F3678D29D4140E947BC5AF536E23FA9C26400CD9D4140503E9F386E35E23F
325	0.043	\N	226	4228	\N	069_166	0	0103000020E610000001000000050000001BF57FF1CF9D41402E57A17BA134E23FA9C26400CD9D4140503E9F386E35E23F534F3678D29D4140E947BC5AF536E23F6F6EEED4D59D4140479109911C36E23F1BF57FF1CF9D41402E57A17BA134E23F
327	0.041	\N	226	4227	\N	069_167	0	0103000020E61000000100000005000000043486FAD29D4140AC6D0BBED433E23F00517BF7CF9D4140A329BBFCA234E23F8612F3CED59D4140D2C5EF0F1B36E23F81851EAED89D41408B61A6D44F35E23F043486FAD29D4140AC6D0BBED433E23F
329	0.043	\N	226	4226	\N	069_168	0	0103000020E61000000100000005000000D9F4B3D3D59D4140C527A9FC0133E23FDCD949EFD29D41404C6B6FBFD733E23F81851EAED89D41408B61A6D44F35E23F186FF8E6DB9D4140A0E8DD107D34E23FD9F4B3D3D59D4140C527A9FC0133E23F
331	0.046	\N	226	4225	\N	069_169	0	0103000020E610000001000000050000007F433C60D99D41402C3C47251A32E23F751866E6D59D4140DE7B3A8B0633E23F186FF8E6DB9D4140A0E8DD107D34E23FF824F4FBDE9D414076F1FD52B033E23F7F433C60D99D41402C3C47251A32E23F
333	0.042	\N	226	4224	\N	069_170	0	0103000020E61000000100000005000000A03E792DDC9D4140B62F366E5331E23F7F433C60D99D41402C3C47251A32E23FF824F4FBDE9D414076F1FD52B033E23F113BF210E29D4140BD1F209AE932E23FA03E792DDC9D4140B62F366E5331E23F
335	0.041	\N	226	4223	\N	069_171	0	0103000020E6100000010000000500000002237C42DF9D414081A45BBF9830E23FA03E792DDC9D4140B62F366E5331E23F113BF210E29D4140BD1F209AE932E23F6F5930DEE49D41409D6690E52532E23F02237C42DF9D414081A45BBF9830E23F
337	0.048	\N	226	4222	\N	069_172	0	0103000020E61000000100000007000000218A58A6E39D414071079F05DB2FE23FF21E646FE29D41400E886703CF2FE23F02237C42DF9D414081A45BBF9830E23F6F5930DEE49D41409D6690E52532E23F2FFD63B7E79D4140E949B5306231E23F4E0845B7E79D41406BB4ADEF1331E23F218A58A6E39D414071079F05DB2FE23F
339	0.019	\N	226	4221	\N	069_173	0	0103000020E6100000010000000700000033077C66E59D4140FAD5784A072FE23FE1291CBFE49D41407103036B292FE23F310A4DAFE49D41409981C7B4812FE23F1EE713ECE89D4140F8C0679FBC30E23FB9EE0523EA9D414077029E9CC230E23F445AF339EB9D41400ADA43567630E23F33077C66E59D4140FAD5784A072FE23F
342	0.02	\N	226	4503	\N	069_174	0	0103000020E610000001000000050000008B357F65E69D41403F286306BD2EE23F2DEEB472E59D4140CFB47C4C0A2FE23F445AF339EB9D41400ADA43567630E23FEC571E18ED9D414020703CE1F72FE23F8B357F65E69D41403F286306BD2EE23F
344	0.018	\N	226	4217	\N	069_175	0	0103000020E610000001000000050000006C9F2AC4E79D41402E0B92B7682EE23F8B357F65E69D41403F286306BD2EE23FEC571E18ED9D414020703CE1F72FE23F03F1C876EE9D4140A274C090A12FE23F6C9F2AC4E79D41402E0B92B7682EE23F
346	0.034	\N	226	4216	\N	069_176	0	0103000020E6100000010000000500000029CDE411EA9D4140B0CB1120C42DE23F09B277C8E79D414020BE7880692EE23F2781FE72EE9D41406CB8AFDFA02FE23F09054FFCF09D4140F5302FF1F42EE23F29CDE411EA9D4140B0CB1120C42DE23F
348	0.019	\N	226	4213	\N	069_177	0	0103000020E61000000100000005000000C5059468EB9D4140AB27C9CA672DE23F29CDE411EA9D4140B0CB1120C42DE23F09054FFCF09D4140F5302FF1F42EE23F77A1FC52F29D4140F5FE9098942EE23FC5059468EB9D4140AB27C9CA672DE23F
350	0.04	\N	226	4211	\N	069_178	0	0103000020E61000000100000007000000811FC07CEF9D4140E2DBE927C32CE23FCCDF758EED9D41402FE54A3ECF2CE23FC5059468EB9D4140AB27C9CA672DE23F77A1FC52F29D4140F5FE9098942EE23F1D9AE870F49D4140A263F112042EE23F6E10ED38F49D4140A4E2F8B6932DE23F811FC07CEF9D4140E2DBE927C32CE23F
352	0.052	\N	226	4241	\N	069_179	0	0103000020E6100000010000000500000055C4518CA59D41403FD2EF91E227E23F813229F5A09D414096BB6269F629E23F15302F94A49D41406CDF7ABA732AE23F8CBA6356AA9D4140A61C19018D28E23F55C4518CA59D41403FD2EF91E227E23F
355	0.051	\N	226	4298	\N	069_180	0	0103000020E610000001000000050000002A44C14EAA9D4140554269F18B28E23F3396738CA49D41408CAFDFAE722AE23FFDDC8304A99D41402AC2D812002BE23FEE9F0D63AE9D41400060CA571429E23F2A44C14EAA9D4140554269F18B28E23F
357	0.045	\N	226	4238	\N	069_181	0	0103000020E61000000100000005000000EE9F0D63AE9D41400060CA571429E23FFDDC8304A99D41402AC2D812002BE23F6A1982ADAC9D41407C86C3E57F2BE23F2F5DF91FB29D414046EB20A89129E23FEE9F0D63AE9D41400060CA571429E23F
359	0.048	\N	226	4239	\N	069_182	0	0103000020E610000001000000050000002F5DF91FB29D414046EB20A89129E23F7DB894BFAC9D4140650EF37D792BE23F3F9C17CEB09D4140A009AFB5FF2BE23F4473BA0EB69D414021B24C79112AE23F2F5DF91FB29D414046EB20A89129E23F
361	0.047	\N	226	4240	\N	069_183	0	0103000020E61000000100000005000000660DCE0BB69D4140AAAA618C122AE23F3F9C17CEB09D4140A009AFB5FF2BE23FDDF7D4C6B49D4140D0BE04118C2CE23F1F6AA0D5B99D41407964A14F962AE23F660DCE0BB69D4140AAAA618C122AE23F
363	0.053	\N	226	4201	\N	069_184	0	0103000020E610000001000000050000005A75EECAB99D414065C5A2749A2AE23FF0265CDDB49D4140C4692256832CE23FF1A8095FB99D414028889CEE1F2DE23FFCAA013CBE9D4140588C8FB02C2BE23F5A75EECAB99D414065C5A2749A2AE23F
365	0.049	\N	226	4204	\N	069_185	0	0103000020E61000000100000005000000114BE12CBE9D4140B1E169C1322BE23FFE43B75CB99D41402645EE9D1F2DE23FF87450AEBC9D414065903CB7902DE23F61A6F02DC39D4140FF9CAB1ED72BE23F114BE12CBE9D4140B1E169C1322BE23F
367	0.033	\N	226	4208	\N	069_186	0	0103000020E6100000010000000500000061A6F02DC39D4140FF9CAB1ED72BE23FF87450AEBC9D414065903CB7902DE23F9A92E899BF9D4140D87FD775F22DE23F444CD4BFC59D4140E0634459312CE23F61A6F02DC39D4140FF9CAB1ED72BE23F
369	0.066	\N	226	4210	\N	069_187	0	0103000020E61000000100000005000000444CD4BFC59D4140E0634459312CE23F9A92E899BF9D4140D87FD775F22DE23F4AB93849C59D41407FD0C86DAE2EE23FEDCF365BCB9D41402E33CCD3EF2CE23F444CD4BFC59D4140E0634459312CE23F
371	0.094	\N	226	4215	\N	069_188	0	0103000020E61000000100000005000000EDCF365BCB9D41402E33CCD3EF2CE23F4AB93849C59D41407FD0C86DAE2EE23FE06D8F62CD9D41408C234AA1C42FE23F834DB14CD39D41402D2D648A082EE23FEDCF365BCB9D41402E33CCD3EF2CE23F
375	0.049	\N	226	4219	\N	069_190	0	0103000020E610000001000000050000006D92CBD7D69D4140A30D2B628D2EE23FC44B376FD19D4140C525BCF34630E23F0539BEA3D59D4140AB005849CE30E23FB9F81070DB9D414037B524E34B2FE23F6D92CBD7D69D4140A30D2B628D2EE23F
377	0.031	\N	226	4220	\N	069_191	0	0103000020E610000001000000070000001198E76FDB9D41403C31EAED4B2FE23F0539BEA3D59D4140AB005849CE30E23FC7DD1BA0D79D414054ECE4F41131E23F599C3BBAD99D4140742AA754FB30E23FD03C8094DD9D41409CB42B7C1430E23F550A6880DD9D4140D7D11F25AB2FE23F1198E76FDB9D41403C31EAED4B2FE23F
293	0.027	\N	226	4234	\N	069_151	0	0103000020E61000000100000007000000169C9D64C49D4140694DD45B6423E23F1377AEA1C09D4140E227F593E224E23F7EFEADDAC29D4140C075F3E63325E23FEDAA8523C49D4140E15039CD1E25E23F6C0BB6D8C69D4140A8417D4F0224E23FC351DF84C69D414074E0080EB123E23F169C9D64C49D4140694DD45B6423E23F
299	0.031	\N	226	4181	\N	069_154	0	0103000020E610000001000000050000005345146AE59D4140CE6055D32628E23FAEE71590E19D414013D0C1BFBF29E23FD1739F94E49D414003A75B4D342AE23F858666AFE89D414048A771229F28E23F5345146AE59D4140CE6055D32628E23F
301	0.025	\N	226	4178	\N	069_155	0	0103000020E6100000010000000500000054FB47BAE29D41405A493D13C527E23F3A1E1517DF9D4140264AEAB45229E23F65691B97E19D414074CE45D6BC29E23F8AF32861E59D414090D04C862A28E23F54FB47BAE29D41405A493D13C527E23F
383	0.049	\N	226	4157	\N	069_194	0	0103000020E61000000100000005000000C1E045B4B89D414048B3D5BA8924E23F7284114CB39D414033F2D9ABAC26E23FBABB22D9B69D414077E537F41E27E23F327939AFBC9D414008038D201925E23FC1E045B4B89D414048B3D5BA8924E23F
385	0.049	\N	226	4161	\N	069_195	0	0103000020E610000001000000050000007A4AF8AABC9D41408D3071811725E23FE58CE1D4B69D41401B121C551D27E23FF4E9A4C1BA9D41403CFD96A79E27E23FB14CE467C09D4140D6CF9ED29525E23F7A4AF8AABC9D41408D3071811725E23F
387	0.037	\N	226	4165	\N	069_196	0	0103000020E61000000100000005000000B14CE467C09D4140D6CF9ED29525E23FF4E9A4C1BA9D41403CFD96A79E27E23FE40130B3BD9D41405221CFD5EC27E23F3C666D71C39D41407C2B46281426E23FB14CE467C09D4140D6CF9ED29525E23F
389	0.017	\N	226	4214	\N	069_197	0	0103000020E61000000100000005000000236BEC39DD9D414059128BE2D72DE23FB6FF49C4DA9D41401890B463602EE23F55019A58DF9D4140A895C8F3302FE23F4BF3D356E19D41406974FFD71E2FE23F236BEC39DD9D414059128BE2D72DE23F
391	0.019	\N	226	4209	\N	069_198	0	0103000020E61000000100000005000000CC09E994DA9D4140E7A3B842032DE23F7C11352DD79D4140BC3C6481CE2DE23F543E63CCDA9D4140FE003AA25E2EE23F236BEC39DD9D414059128BE2D72DE23FCC09E994DA9D4140E7A3B842032DE23F
393	0.029	\N	226	4207	\N	069_199	0	0103000020E61000000100000005000000904116B3D79D414077DF9DDA222CE23F0801A202D39D41401BC238643E2DE23F7C11352DD79D4140BC3C6481CE2DE23FCC09E994DA9D4140E7A3B842032DE23F904116B3D79D414077DF9DDA222CE23F
395	0.06	\N	226	4202	\N	069_200	0	0103000020E610000001000000050000006DFA703DD39D414098A729CFBE2AE23F98567026CD9D4140251EA6DA6B2CE23F0801A202D39D41401BC238643E2DE23FAF059FADD79D414057B81A25242CE23F6DFA703DD39D414098A729CFBE2AE23F
397	0.045	\N	226	4196	\N	069_201	0	0103000020E610000001000000050000005E50D521CF9D41407550FAFA392AE23F3BBCA146C99D4140901719C8EA2BE23F98567026CD9D4140251EA6DA6B2CE23FE09F613BD39D4140A1FE4A60BF2AE23F5E50D521CF9D41407550FAFA392AE23F
399	0.045	\N	226	4192	\N	069_202	0	0103000020E61000000100000005000000DE85FE4BCB9D4140E6DC3529BA29E23F01C70921C59D41409B0CBC69592BE23F3BBCA146C99D4140901719C8EA2BE23F5E50D521CF9D41407550FAFA392AE23FDE85FE4BCB9D4140E6DC3529BA29E23F
401	0.046	\N	226	4188	\N	069_203	0	0103000020E6100000010000000500000051D66F1CC79D4140B9D9200C2A29E23F6D414732C19D4140BC7275D5D52AE23FA581F223C59D4140CA8BE0A5582BE23FDE85FE4BCB9D4140E6DC3529BA29E23F51D66F1CC79D4140B9D9200C2A29E23F
403	0.046	\N	226	4185	\N	069_204	0	0103000020E61000000100000005000000BE3ECF03C39D4140B5400D739F28E23F9EFAA21BBD9D4140F8C15F78462AE23FB1A83439C19D4140F0EA6DE0D32AE23FF0D8C523C79D4140F5A0B3082B29E23FBE3ECF03C39D4140B5400D739F28E23F
405	0.047	\N	226	4182	\N	069_205	0	0103000020E61000000100000005000000E935966FBE9D414052ED41130928E23F62A3CA46B99D41402B0C5025C529E23F9EFAA21BBD9D4140F8C15F78462AE23FDD37670FC39D41404A0E61FBA028E23FE935966FBE9D414052ED41130928E23F
407	0.042	\N	226	4179	\N	069_206	0	0103000020E61000000100000005000000F4E9A4C1BA9D41403CFD96A79E27E23F61BA2730B59D4140D3CA214B3929E23F62A3CA46B99D41402B0C5025C529E23FBABC3B74BE9D41404CA1E5AB0928E23FF4E9A4C1BA9D41403CFD96A79E27E23F
410	0.043	\N	226	4174	\N	069_207	0	0103000020E610000001000000050000006600C293B69D4140EA4C42251527E23F3FFE4C5BB19D4140B78C0DF3B128E23F22DEC839B59D41402F9300853629E23FF4E9A4C1BA9D41403CFD96A79E27E23F6600C293B69D4140EA4C42251527E23F
412	0.04	\N	226	4171	\N	069_208	0	0103000020E61000000100000005000000019F9869B29D4140CA79C5929926E23F211E56ABAD9D41402E89CD223528E23F3FFE4C5BB19D4140B78C0DF3B128E23F06E74191B69D4140C3EAF8EA1527E23F019F9869B29D4140CA79C5929926E23F
414	0.045	\N	226	4166	\N	069_209	0	0103000020E6100000010000000500000035D93AE2AD9D41407A94B0610F26E23F3C2B2DFFA89D41402CB991B99227E23F211E56ABAD9D41402E89CD223528E23F38B3264AB29D41406FF840D39526E23F35D93AE2AD9D41407A94B0610F26E23F
416	0.016	\N	226	4504	\N	069_210	0	0103000020E61000000100000006000000826A7F67E49D414067CC1F2A7E2DE23F66FE6663E09D41408FDF7913782EE23F85113AF4E19D414097127F72F62EE23FF03A7FC2E59D4140480D7D85F62DE23FFD19829EE59D4140BDCD5B4AAE2DE23F826A7F67E49D414067CC1F2A7E2DE23F
418	0.023	\N	226	4212	\N	069_211	0	0103000020E61000000100000006000000F775B386E09D41407EDF2B5B012DE23F449F5CCBDD9D414032FE817CAE2DE23FF84E0D69E09D41408C25E7B3762EE23F25FAD56BE49D41407815F9D57E2DE23F3B631A34E19D41401D5D5454FE2CE23FF775B386E09D41407EDF2B5B012DE23F
420	0.017	\N	226	4205	\N	069_212	0	0103000020E61000000100000007000000F5D2414DDD9D41405F390060542CE23F3A86542DDB9D414052FA6D5FDD2CE23F0D8650D7DD9D4140459BFD86AB2DE23FABE09B83E09D41405844231F022DE23F62D537DFDF9D41407BD95841DD2CE23FECEF1CF7DF9D4140A4F63D34CE2CE23FF5D2414DDD9D41405F390060542CE23F
422	0.013	\N	226	42051	\N	069_213	0	0103000020E61000000100000005000000C6A311C3D99D4140ECABCB1B9A2BE23F581B735CD89D41404C7B5177FD2BE23F3A86542DDB9D414052FA6D5FDD2CE23FF5D2414DDD9D41405F390060542CE23FC6A311C3D99D4140ECABCB1B9A2BE23F
424	0.045	\N	226	4206	\N	069_214	0	0103000020E610000001000000070000008FF1333AE79D4140957CF95E6B2BE23FEF730249E29D41406DD005FF9F2CE23F40834CD7E69D414053F6E777542DE23FB91D2425E89D4140D4F535674A2DE23FD2A11147EB9D414030F90163762CE23FEC67190BEB9D4140FDB8B686052CE23F8FF1333AE79D4140957CF95E6B2BE23F
426	0.032	\N	226	4200	\N	069_215	0	0103000020E610000001000000080000004DFAD3FFE39D4140DF260EC7E82AE23F2FD5D350DE9D41400388CEC0822CE23FECEF1CF7DF9D4140A4F63D34CE2CE23FB8FF88E5DF9D41403FCAB546D92CE23FE842B173E19D4140ECD223AB812CE23FEF730249E29D41406DD005FF9F2CE23F8FF1333AE79D4140957CF95E6B2BE23F4DFAD3FFE39D4140DF260EC7E82AE23F
427	0.026	\N	226	4197	\N	069_216	0	0103000020E6100000010000000500000078D1C19FE19D4140BEC1F904872AE23F061C7253DC9D4140E834C406212CE23F2FD5D350DE9D41400388CEC0822CE23F4DFAD3FFE39D4140DF260EC7E82AE23F78D1C19FE19D4140BEC1F904872AE23F
429	0.029	\N	226	4195	\N	069_217	0	0103000020E610000001000000050000003AEBE5FEDE9D4140136D4DFF1E2AE23F5CF0A8C6D99D414047C9C1D89A2BE23F061C7253DC9D4140E834C406212CE23F57E8AC9BE19D41402BF7D840882AE23F3AEBE5FEDE9D4140136D4DFF1E2AE23F
431	0.023	\N	226	4193	\N	069_218	0	0103000020E61000000100000005000000D3273E57DD9D4140533B9E51DB29E23FB9278CE6D69D4140D8BD525F882BE23F581B735CD89D41404C7B5177FD2BE23F3AEBE5FEDE9D4140136D4DFF1E2AE23FD3273E57DD9D4140533B9E51DB29E23F
434	0.022	\N	226	4189	\N	069_219	0	0103000020E610000001000000050000006334F837DB9D41407F1055188629E23FA89376B1D59D414058BCF7DA2C2BE23FB9278CE6D69D4140D8BD525F882BE23FD3273E57DD9D4140533B9E51DB29E23F6334F837DB9D41407F1055188629E23F
436	0.035	\N	226	4187	\N	069_220	0	0103000020E61000000100000006000000611C7E1FD89D4140DEB50C870C29E23F9D68BBC5D29D41404ED45D12722AE23FB975E3CDD39D4140273C12EC982AE23FA89376B1D59D414058BCF7DA2C2BE23F6334F837DB9D41407F1055188629E23F611C7E1FD89D4140DEB50C870C29E23F
438	0.029	\N	226	4236	\N	069_221	0	0103000020E610000001000000050000006AB4DF33D59D41407AF8E47A9A28E23F01950DF3CF9D41406B9A2353102AE23F9D68BBC5D29D41404ED45D12722AE23F611C7E1FD89D4140DEB50C870C29E23F6AB4DF33D59D41407AF8E47A9A28E23F
440	0.025	\N	226	4248	\N	069_222	0	0103000020E610000001000000050000007EF71E75D29D4140FB5A09F83428E23F0C1BEAB0CD9D414098590E23C529E23F01950DF3CF9D41406B9A2353102AE23F0E518F32D59D4140F20C68D89A28E23F7EF71E75D29D4140FB5A09F83428E23F
442	0.04	\N	226	4180	\N	069_223	0	0103000020E61000000100000005000000F283884ACE9D4140DF7A88139C27E23FA207ED07CA9D414051873FD24729E23F0C1BEAB0CD9D414098590E23C529E23FAD841973D29D41408BFDBBA13528E23FF283884ACE9D4140DF7A88139C27E23F
444	0.042	\N	226	4175	\N	069_224	0	0103000020E610000001000000050000000A6CB865CA9D4140670593F40B27E23FA9F35CDDC59D4140EFAD4A3BBF28E23FA207ED07CA9D414051873FD24729E23FF283884ACE9D4140DF7A88139C27E23F0A6CB865CA9D4140670593F40B27E23F
446	0.04	\N	226	4172	\N	069_225	0	0103000020E61000000100000005000000D755A9CBC69D41403FC8F3188226E23F76507E0CC29D414043F515A23628E23F3F1084E6C59D4140106756CCBB28E23F0A6CB865CA9D4140670593F40B27E23FD755A9CBC69D41403FC8F3188226E23F
448	0.029	\N	226	4170	\N	069_226	0	0103000020E610000001000000050000001892AB57C49D41400FD596DD2726E23FBAC5E620BF9D41408A7C8024D627E23F76507E0CC29D414043F515A23628E23FF40A14C9C69D414019A983068326E23F1892AB57C49D41400FD596DD2726E23F
379	0.018	\N	226	4134	\N	069_192	0	0103000020E61000000100000005000000097F73DDAF9D41403815754A3F23E23F2A2F1A53AE9D4140F067F1F60224E23F4E28062FB39D41401061F7367524E23FEBF966D1B49D41401224EFC5F923E23F097F73DDAF9D41403815754A3F23E23F
381	0.062	\N	226	4153	\N	069_193	0	0103000020E61000000100000005000000EBF966D1B49D41401224EFC5F923E23F615F51DCAD9D4140F4224AAD0E26E23F3F52DB3EB39D4140595E3CFEB226E23F263B30BEB89D41400359F1248A24E23FEBF966D1B49D41401224EFC5F923E23F
145	0.062	\N	226	40971	\N	069_076	0	0103000020E6100000010000000500000098793ED1CD9D4140665809899B16E23FEF5A4119C69D41404E39B4E7D619E23F3404A24AC99D4140148626B1471AE23F2269FE00D19D41403BC513250317E23F98793ED1CD9D4140665809899B16E23F
373	0.043	\N	226	4218	\N	069_189	0	0103000020E61000000100000005000000834DB14CD39D41402D2D648A082EE23F88D09F7CCD9D4140B3A54DFCBC2FE23FC44B376FD19D4140C525BCF34630E23F6D92CBD7D69D4140A30D2B628D2EE23F834DB14CD39D41402D2D648A082EE23F
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

COPY public.settlement (id, name, county_id, settlement_type, geom, area, population, code, description) FROM stdin;
1	Bondeni	30	1	\N	50	500	Baringo1	\N
2	Kampi Wakulima	30	1	\N	76.4	1500	Baringo2	\N
3	Katorongoto	30	1	\N	36	1700	Baringo3	\N
4	Nubian	30	1	\N	53	2800	Baringo4	\N
5	Shauri_Timboroa Centre	30	1	\N	44.9	0	Baringo5	\N
6	Landi Matope	39	1	\N	5	761	Bungoma1	\N
7	Landi Matope_muslim school Webuye DEB Rail	39	1	\N	5	761	Bungoma2	\N
8	Maisha Matamu	39	1	\N	1	243	Bungoma3	\N
9	Mjini	39	1	\N	7.52	6597	Bungoma4	\N
10	Nangeni	39	1	\N	6	464	Bungoma5	\N
11	Chebiemit	28	1	\N	10	323	Elgeyo-Marakwet1	\N
12	Cheptongei	28	1	\N	11.5	874	Elgeyo-Marakwet2	\N
13	Kapcherop	28	1	\N	9.6	549	Elgeyo-Marakwet3	\N
14	Kapsowar 	28	1	\N	8.8	935	Elgeyo-Marakwet4	\N
27	A thousand street	43	1	\N	4.03	2727	Homa Bay1	\N
28	Kijijini-kendu Bay Old town	43	1	\N	3.93	3604	Homa Bay2	\N
29	Makongeni	43	1	\N	4.134	3970	Homa Bay3	\N
30	Masogo kayoya	43	1	\N	2.716	1201	Homa Bay4	\N
31	Ndhiwa settlement	43	1	\N	33.8	17885	Homa Bay5	\N
32	Nyandiwa	43	1	\N	8.04	4432	Homa Bay6	\N
33	Rusinga Old Town	43	1	\N	1.825	2725	Homa Bay7	\N
34	Shauri Yako	43	1	\N	7.613	9147	Homa Bay8	\N
35	Sofia	43	1	\N	4.3	7793	Homa Bay9	\N
36	Gichagi	34	1	\N	4.05	4541	Kajiado1	\N
37	Majengo	34	1	\N	20	1200	Kajiado2	\N
39	Mjini	37	1	\N	8.4	1123	Kakamega2	\N
41	Jua kali	37	1	\N	2.7	0	Kakamega4	\N
42	Lukoye	37	1	\N	10	1133	Kakamega5	\N
43	Shibale	37	1	\N	10	1256	Kakamega6	\N
47	Dagorretti Ruthimitu	22	1	\N	1.2	361	Kiambu2	\N
48	Kanjeru	22	1	\N	1.6	562	Kiambu3	\N
49	Kiamburi	22	1	\N	2.57	1023	Kiambu4	\N
50	Kiandutu	22	1	\N	40	20000	Kiambu5	\N
51	Matharau	22	1	\N	6.22	976	Kiambu6	\N
52	Kiangombe	22	1	\N	3.5	1000	Kiambu 1	\N
53	Misri	22	1	\N	9.47	2500	Kiambu 2	\N
56	Kwa Ndomo	3	1	\N	2.5	1500	Kilifi3	\N
59	Makaburini	3	1	\N	6.68	4508	Kilifi6	\N
60	Njoro ya Chini	3	1	\N	7.8	1800	Kilifi7	\N
62	Jacaba	3	1	\N	11.51	3640	Kilifi9	\N
63	Njoro Takatifu	3	1	\N	25.24	1350	Kilifi10	\N
65	Tabora	3	1	\N	5.88	2408	Kilifi12	\N
67	Bayamangozi	3	1	\N	25.5	0	Kilifi14	\N
68	Kalolo	3	1	\N	22	7105	Kilifi15	\N
69	Kibaoni	3	1	\N	8.6	0	Kilifi16	\N
70	Kibokoni M17E	3	1	\N	22.3	1077	Kilifi17	\N
71	Kisumu Ndogo	3	1	\N	22.6	3153	Kilifi18	\N
72	M27	3	1	\N	10.7	527	Kilifi19	\N
73	Mazeras Centre Miwani_Mgumo wa Pasta	3	1	\N	25	3747	Kilifi20	\N
74	Mtaani	3	1	\N	28.4	3897	Kilifi21	\N
75	Gathambi	20	1	\N	5.91	245	Kirinyaga1	\N
76	Gatugura_Gatundura	20	1	\N	7.85	333	Kirinyaga2	\N
77	Getuya	20	1	\N	2.25	231	Kirinyaga3	\N
78	Githogondo	20	1	\N	7.61	1047	Kirinyaga4	\N
79	Ithareini	20	1	\N	9.22	538	Kirinyaga5	\N
80	Kagumo	20	1	\N	8.82	1245	Kirinyaga6	\N
81	Kaitheri	20	1	\N	2.42	396	Kirinyaga7	\N
82	Kamuiru	20	1	\N	7.9	604	Kirinyaga8	\N
83	Kamuthanga	20	1	\N	2.8	979	Kirinyaga9	\N
84	Kiangoma	20	1	\N	7.77	561	Kirinyaga10	\N
85	Kiangombe	20	1	\N	7.73	223	Kirinyaga11	\N
86	Kianjiru	20	1	\N	2.78	359	Kirinyaga12	\N
87	Kiarukungu	20	1	\N	2.47	926	Kirinyaga13	\N
88	Kibirigwi	20	1	\N	8.25	630	Kirinyaga14	\N
89	Kimunye	20	1	\N	7.69	994	Kirinyaga15	\N
90	Mukinduri	20	1	\N	15	472	Kirinyaga16	\N
91	Ndindiruku	20	1	\N	4.23	2317	Kirinyaga17	\N
92	Rwambiti	20	1	\N	6.982	1011	Kirinyaga18	\N
93	Shauri yako	20	1	\N	0.2	292	Kirinyaga19	\N
64	Dingwini	3	1	0103000020E6100000010000001200000018DE378E750E4440B1ACCE8DCB7509C009860115640E4440E69B1648BA7509C0B8F460B25F0E4440E7319586B57509C00E9FDD0B5E0E4440C2590FA7B37509C00E5AA815480E444049CEF2208B7509C0FDC383F3470E4440F84FBB66347409C030AF691F480E4440C1F4F0E7FE7309C0FD9B0362480E444079829E1CB57309C058BF54774A0E444032AC53ADF87109C040748486510E444080D72B09F47109C01AB64E27550E4440994D85ECF17109C055246E906C0E444010532571E77109C0BC253C94780E4440DF1DB2E5EC7109C065762772790E444053BD5A7DFA7109C09382554F790E4440F4E6372DAA7209C0F45D88EF780E444014D245D0337309C034ED7F6C760E4440E583473EBE7509C018DE378E750E4440B1ACCE8DCB7509C0	3.34	518	Kilifi11	\N
20	Bulla Riig Phase 2	7	1	0103000020E61000000100000011000000C467CB231FD343407D6635D1C105DCBF253B1ED315D24340AD7C9B824D01DCBF33BCE40313D243407074FF7BD9FFDBBFD26D1CFE12D24340CBF0A27DD6FFDBBF3C47A6B713D243406071F71BADCADBBF32BFE9242ED34340A9E9BFC11032DBBF371930DB3BD343401E5AFA00692FDBBF61D73AFCA0D4434003AA020226EBDABF3D736507B6D4434078E30E94CCE8DABF7A155A51C8D443407247C302C2E6DABF628B5D7804D5434084D9E3FCC40CDBBFF546C8766CD54340B11E8E403C51DBBFEF2BE87A6CD54340494B3CCF6751DBBF853235836AD54340167D97EAB352DBBFE3B2A53A5DD54340BC2E723D825ADBBFD151850054D34340DC2677AB8AFDDBBFC467CB231FD343407D6635D1C105DCBF	351.42	13343	Garissa4	\N
26	County Phase 2	7	1	0103000020E610000001000000190000004163CB025CD343406AF9C94D1013DEBFAF554A6556D34340EE4DDE9A7402DEBF85F1D37B56D343402659DD203F02DEBF2EC2484959D343408152A22E99FBDDBF60EDBFF7CBD3434097A265AC9BA3DDBFBD5DF6C0CDD34340B1BCBEF6BDA2DDBF0472B26EF7D3434098DD5F8126ADDDBF137FBE76F9D34340122F2DC011AEDDBFD2CBDD07FBD34340D55BA733C7AEDDBF48BBF683FBD34340B6446C071CAFDDBF865B8F11FCD34340E567C2D17CAFDDBF4C9E878C3AD4434037F0E8AF11DCDDBF971F4CDB3BD443404598E0EE0BDDDDBFC91290B03CD44340591E97E81ADEDDBF9A6B512F3DD443403D4FCFF6BBDEDDBFB37A1B193FD443400BA6004B2AE1DDBF59414D1E3FD443408209434131E1DDBF15017D943FD4434087F006AECFE1DDBF289FC04F40D44340C700CFF523E3DDBFC0B8089640D44340FA8BBDABA3E3DDBF7B11466841D44340870B5A866DE5DDBF607B11514AD44340BE30AE3D62FCDDBFDD46E87949D44340022FC16F03FDDDBF5D0F1D6349D443408E39688314FDDDBF4163CB025CD343406AF9C94D1013DEBF	56.31	2517	Garissa10	\N
38	Kambi Somali	37	1	0103000020E610000001000000090000005459E0C1845F4140A5C0635C7C0CD23FA628956A715F4140127F59C65221D23FAB729B728F5F414054F07C3FEE28D23F157C816B915F41409AD327086E29D23F8D0E28859F5F414030350270CD2AD23F9DA320ECA95F414081DDDE051E2BD23FB1BFC7D5B55F4140B4DAF3A9BC1FD23FCFB99E62B95F41401F2B9498BB15D23F5459E0C1845F4140A5C0635C7C0CD23F	3.4	395	Kakamega1	\N
94	Thiguku	20	1	\N	7.85	743	Kirinyaga20	\N
97	Shauri yako	42	1	\N	27.73	2500	Kisumu3	\N
101	Bandani	42	1	\N	15	9534	Kisumu7	\N
102	Kibuye	42	1	\N	15	606	Kisumu8	\N
103	Manyatta A_Kona Mbaya and Migosi	42	1	\N	24	22474	Kisumu9	\N
104	Manyatta B 	42	1	\N	25	45150	Kisumu10	\N
105	Muhoroni_Sangoro- Swahili- Shauri Yako- Shauri Moyo  and  Bondeni	42	1	\N	20	3320	Kisumu11	\N
106	Nyawita	42	1	\N	13	11564	Kisumu12	\N
108	Kalundu Misuuni	15	1	\N	4.42	1624	Kitui2	\N
109	Kalundu slaughter	15	1	\N	12.02	1800	Kitui3	\N
110	Diani Complex	2	1	\N	2.01	2201	Kwale 1	\N
111	Tiwi Block 12	2	1	\N	65	2500	Kwale 2	\N
112	Faza village	5	1	\N	20	2849	Lamu1	\N
113	Kiunga old town	5	1	\N	25	1468	Lamu2	\N
114	Matondoni	5	1	\N	12	2974	Lamu3	\N
115	Mokowe old town	5	1	\N	20	3166	Lamu4	\N
116	Witu old town	5	1	\N	15	3698	Lamu5	\N
117	Wiyoni Village	5	1	\N	20	12099	Lamu6	\N
118	Canaani	16	1	\N	29	3243	Machakos1	\N
119	Jam City	16	1	\N	6	1124	Machakos2	\N
120	Kwa Mangeli	16	1	\N	3	2813	Machakos3	\N
121	Kwa Nzomo	16	1	\N	3	1042	Machakos4	\N
122	Slota	16	1	\N	8	5180	Machakos5	\N
123	Misongeni	17	1	\N	16.2	1443	Makueni1	\N
124	Mjini	17	1	\N	10.13	3103	Makueni2	\N
125	Soko mjinga	17	1	\N	6	727	Makueni3	\N
126	Majengo	12	1	\N	5	2410	Meru1	\N
128	Salama	12	1	\N	3	945	Meru3	\N
129	Jiw Dendi 	44	1	\N	36.54	0	Migori1	\N
130	Kindunguni	1	1	\N	24	2390	Mombasa1	\N
137	Chelanga	1	1	\N	2.124	3804	Mombasa8	\N
138	Hodi Hodi	1	1	\N	8.548	500	Mombasa9	\N
139	Kilimanjaro	1	1	\N	1.6	100	Mombasa10	\N
142	Kahawa Soweto	47	1	\N	8.99	4045	Nairobi2	\N
144	Mathare fire victims	47	1	\N	0.78	1950	Nairobi4	\N
145	Ex Grogon	47	1	\N	0.41	430	Nairobi5	\N
147	Redeemed	47	1	\N	0.47	907	Nairobi7	\N
148	Embakasi KCC	47	1	\N	13.2	9616	Nairobi8	\N
149	Embakasi Village	47	1	\N	2.28	1613	Nairobi9	\N
150	Kayole Soweto	47	1	\N	30	68805	Nairobi10	\N
158	Bondeni 	32	1	\N	2	0	Nakuru8	\N
159	Kabati 	32	1	\N	2	0	Nakuru9	\N
160	Karagita	32	1	\N	30	20255	Nakuru10	\N
161	Kwa Murogi 	32	1	\N	65.78	46004	Nakuru11	\N
162	Lake View	32	1	\N	26.84	16016	Nakuru12	\N
163	London 	32	1	\N	43.3	16083	Nakuru13	\N
164	Nyamurutu	32	1	\N	100	0	Nakuru14	\N
165	Mosoriot	29	1	\N	26.53	785	Nandi1	\N
166	Keroka Block  B	46	1	\N	6.2	678	Nyamira1	\N
167	Huruma   Ol Kalou	18	1	\N	30	923	Nyandarua1	\N
178	Gikomo_Kiawara	19	1	\N	21.89	911	Nyeri11	\N
186	Muruguru	19	1	\N	18.2	60	Nyeri19	\N
132	Misufini	1	1	0103000020E6100000010000000D0000003CD960AB37CA434034477C1CAE0110C068B4546918CA4340CA94C2E4EE0010C0BA628D0603CA43405FAE892084FF0FC03D1A2EEBC3C9434049C1BF3FE1F70FC0F8B7C2A114CA4340CA64771CA5F10FC0B078A17B29CA43404B65707986F10FC0C9EF5CA531CA434081312DD798F10FC016E9424D32CA43404710F4509AF10FC0CA38D3AD38CA4340B947676151F20FC06078B34C3ECA43406E90F7B9F2F20FC0F7E1B73C50CA4340C7115D4326F50FC0071B2CEB4BCA434093953FADF70010C03CD960AB37CA434034477C1CAE0110C0	24.04	1734	Mombasa3	\N
136	Likoni 203	1	1	0103000020E610000001000000120000007A53988FBDD34340FBBA0A79056310C026996F90A2D343402C959FCFA06210C0C2681B08E0D34340F4556A31655A10C0F1BB9E77E1D343405257DFA5445A10C053E6637614D44340CA2F3611555910C09EFC599656D4434088D09C35125910C04BB3978259D443401BFDF2410F5910C062CE91F166D4434058EAF0C4015910C0E6AFA6DF68D4434044A456C71D5910C050177DBE75D4434064F9E29FFF5910C0A148DFF075D44340C133ABFD115A10C0B5E553EA75D443409F1097031E5A10C06F7E483E75D44340BA91D973325A10C0C158788474D443408154E2B6465A10C091095CEE55D443406AF6A553575C10C0E0A5A351F0D343403F91A9F9EA6110C0AA81E4D3CCD3434064058661C76210C07A53988FBDD34340FBBA0A79056310C0	27.55	7058	Mombasa7	\N
169	Kihatha	19	1	0103000020E61000000100000007000000AA76F642D8724240B59709D0B9D9DBBFD4F0F32EB871424037224D6A8FD8DBBF359E92BF8C7142404541788D3BD8DBBF0F5AA0538D7142408F3D3B81834DDBBF109010EDCB724240CF4BDD4B344FDBBF8343670DD97242400DD39C21464FDBBFAA76F642D8724240B59709D0B9D9DBBF	21.3	250	Nyeri2	\N
174	Gitero	19	1	0103000020E6100000010000000C0000008046317BCF77424035E460731DD7DCBFD89C710ACE774240489F53327BD6DCBFDF1B19F6CB7742403FE33AF2B9CADCBFCC018A92C9774240DAB47BE938BDDCBF2055E3C3CA774240FEE7F8C2A7BCDCBFDFCD9537347842404EF32ED47CC1DCBFE05212953578424039E75ACD2AC2DCBF07FA93C235784240A5AAF8650CC5DCBFE1824708367842400AF00C2A76C9DCBFA22130B93678424085445CCAA9D4DCBF996CDD703578424076776EF359D5DCBF8046317BCF77424035E460731DD7DCBF	6.56	216	Nyeri7	\N
179	Miiri	19	1	0103000020E6100000010000000900000049EEC85131954240696320AB1BD5DEBFCD14A6620F954240BAF694A076C9DEBFEDDB945F1095424066BE30B945C5DEBFCED6B20D119542400A838CE4F4C3DEBFA011972112954240C7759E2FDFC1DEBF9F47F6F53B954240606482883DBFDEBFC2EF161040954240B01F97CCB8D4DEBF440FE1823C95424082DFD79DD0D4DEBF49EEC85131954240696320AB1BD5DEBF	3.34	116	Nyeri12	\N
182	Njoguini	19	1	0103000020E6100000010000000D000000C69D038AAC6E424018FE6BBE78DED9BF3C831C9A7B6E4240DBD932A190CAD9BFD25F655E7B6E42404C2DB782E7C9D9BF4C306DB0926E4240C27F48934AB6D9BF1C22A5F5936E4240BADB9C1114B6D9BFA62C8C7F6D6F42404EE40DC858C5D9BF5B2C473E6E6F42403FB0BB14BAC5D9BF24EB90586B6F4240547CD66A88CFD9BFC511B7C96A6F4240808908A34AD1D9BFCD130FA4686F4240F40A3086B5D7D9BF3F70442C676F4240010297B918DCD9BF5141082D666F4240F008A45A6ADCD9BFC69D038AAC6E424018FE6BBE78DED9BF	11.48	90	Nyeri15	\N
152	Kasarani B	32	1	0103000020E6100000010000000A000000F3876B5F56E641400AB5CB853316D3BF23C4B7B37DE54140D9CDDC791C04D3BF1E34142FA7E54140BCD48E4AE6A5D2BF4DB8F61649E6414041C4516D6EB4D2BFB8D1867B4AE64140CE8C2A0B7CBAD2BFC6539C344BE64140310C51F876BED2BF9F0A154D51E64140C78F98E2DAE0D2BF798F885453E64140491AE9A203EED2BF0EFB8D2C59E64140C5088109A715D3BFF3876B5F56E641400AB5CB853316D3BF	109.44	17881	Nakuru2	\N
154	Tarabete	32	1	0103000020E6100000010000000C0000009A53FE0746264240E0E2DBC3BBD9E6BFBB0C64D7DC254240979BD883AACEE6BFCF2511ADD125424029DFFB9EA0CCE6BF6C3944C0CB254240CB05EAD8C0CAE6BF0329654CC325424058F5B0BA03C8E6BFFA6F54C59E2542407C311BD3C1BBE6BFBF23FA2FA325424005CC10F6C2B9E6BF06FCC9A4A5254240105C9E76E5B8E6BF73213692A8254240E46C5C50E8B7E6BF9E528FB1D8254240AFB7F9E765A8E6BF0BBBE12C61264240725BEF03CDD5E6BF9A53FE0746264240E0E2DBC3BBD9E6BF	7.7	1959	Nakuru4	\N
96	Swahili	42	1	0103000020E6100000010000000C000000D362DBF5AA994140504F8E02252BC4BF0F335FB9619941409EABDAB2361AC4BF604A74264A9941407899C11E1DF0C3BF678BB40B5299414019498D280CEAC3BFA2F57992B1994140D57D62F55AE6C3BF58781F92B29941407B7C3387CAE6C3BFDC24CE5EB49941404187E8F1DCEBC3BFE50E15A7C7994140C2FFD3436722C4BFD12B1A1FC7994140608000D68723C4BF974FC45AC399414007EC37B18D24C4BF7FE5418EBA99414047BDDB7BEE26C4BFD362DBF5AA994140504F8E02252BC4BF	4.2	1500	Kisumu2	\N
100	Kopere	42	1	0103000020E6100000010000000E0000008D233426079741405F3C69D79B1CA5BF94116236DB964140316BF53052F5A2BF57DCA69FD39641405057FE14153AA2BF1A772CAB58974140F7116FB49ABAA2BFFFA1025C5E97414043AFA01F58C0A2BF9EAA2792669741405591096DA0C8A2BF8FC99D3567974140FED9ED2C26C7A3BFDA7B96CB679741405EF7811385BEA4BF2D12F2936797414050BD0CF321CBA4BF632474365D97414013F0881D54D4A4BF34C0D13658974140FC1F97F09BD8A4BFCA89F15055974140150193F712DBA4BF62A3EF7D42974140EB8C27B015EBA4BF8D233426079741405F3C69D79B1CA5BF	21.25	1708	Kisumu6	\N
189	Awelo	41	1	\N	30	1179	Siaya1	\N
190	Aseko_Mlekenyi	6	1	\N	15.18	3070	Taita Taveta1	\N
191	Kijiji Cha Chewa	6	1	\N	3	2196	Taita Taveta2	\N
192	Majengo Mapya	6	1	\N	23	1267	Taita Taveta3	\N
193	Upper Kariokor	6	1	\N	3	6203	Taita Taveta4	\N
194	Bora Imani	4	1	\N	12	2124	Tana River1	\N
195	Bura	4	1	\N	27	1726	Tana River2	\N
196	Chewani	4	1	\N	7	1296	Tana River3	\N
197	Hola Mission	4	1	\N	11	1511	Tana River4	\N
198	Jua Kali	4	1	\N	6	1763	Tana River5	\N
199	Kibuyu	4	1	\N	13	1799	Tana River6	\N
200	Makaburini	4	1	\N	11	2584	Tana River7	\N
201	Malindi ya Ngwena	4	1	\N	10	1241	Tana River8	\N
202	Mororo	4	1	\N	26	6642	Tana River9	\N
203	Mwangaza	4	1	\N	28	4303	Tana River10	\N
204	Wachakone	4	1	\N	8	963	Tana River11	\N
205	Kathwana	13	1	\N	8	265	Tharaka-Nithi1	\N
206	Marimanti	13	1	\N	30	1532	Tharaka-Nithi2	\N
207	Muslim village	13	1	\N	10	329	Tharaka-Nithi3	\N
208	Kipsongo A	26	1	\N	27	2098	Trans Nzoia1	\N
209	Matisi	26	1	\N	28	9882	Trans Nzoia2	\N
210	Mitume_Mau Mau	26	1	\N	20	22888	Trans Nzoia3	\N
211	Shanti 	26	1	\N	18	1794	Trans Nzoia4	\N
212	Shimo la Tewa	26	1	\N	4	549	Trans Nzoia5	\N
213	Tuwani	26	1	\N	22	16043	Trans Nzoia6	\N
214	Carlifornia Lodwar Municipality	23	1	\N	8.2	1769	Turkana1	\N
215	Kajuka Lodwar Municipality	23	1	\N	3.5	316	Turkana2	\N
216	Kambi Mawe   Lodwar Municipality	23	1	\N	6.3	638	Turkana3	\N
217	Lokichoggio Informal Settlement Lokichoggio Town	23	1	\N	9.48	1058	Turkana4	\N
218	Lokori Settlement Lokori Town	23	1	\N	2.03	1781	Turkana5	\N
219	Lowarengak Informal Settlement Lowarengak Centre	23	1	\N	14.88	2355	Turkana6	\N
220	Nabute   Lodwar Municipality	23	1	\N	2.6	326	Turkana7	\N
221	Nginoka Kim Lokichar Town	23	1	\N	7	1006	Turkana8	\N
222	Public Works  Lodwar Municipality	23	1	\N	2.4	735	Turkana9	\N
223	Soweto Lodwar Municipality	23	1	\N	12.8	2804	Turkana10	\N
224	Town Chini Lokichar Town	23	1	\N	13.3	848	Turkana11	\N
228	Kipkaren  Site  and  Service	27	1	\N	28.2	17676	Uasin Gishu4	\N
229	Mwanzo Site  and  Service	27	1	\N	5.8	22112	Uasin Gishu5	\N
230	Barwaqo	8	1	\N	29	2242	Wajir1	\N
231	Halane	8	1	\N	30	5509	Wajir2	\N
232	Hodhan	8	1	\N	24	867	Wajir3	\N
233	Jogoo	8	1	\N	27	3776	Wajir4	\N
234	Shallattey	8	1	\N	23	702	Wajir5	\N
235	Wagberi	8	1	\N	26.5	3823	Wajir6	\N
236	Aramaget	24	1	\N	10.5	626	West Pokot1	\N
237	Kabichbich	24	1	\N	7.53	375	West Pokot2	\N
141	Embakasi	47	1	0103000020E6100000010000001800000094328799DF74424045E22326A9E5F4BF54C5A5F0DE744240A98377467EE5F4BFE0B466B4DD744240D5A93CAD29E5F4BF3EC378AAC9744240569CB735CADFF4BFFA498D3DC7744240A6AEEF2EE0DBF4BF0168933DC7744240576C741BDCDBF4BF1FF1AA42C774424051D5F014D8DBF4BF52CCB34CC774424030DDC434D4DBF4BF96B86E5BC774424074C75E93D0DBF4BF77DB7E6EC77442406122A147CDDBF4BF8B0A6C85C7744240218C5266CADBF4BFC6C0A59FC7744240F6B39A01C8DBF4BF99AD86BCC77442407FEF8F28C6DBF4BFEBC658DBC7744240311FD8E6C4DBF4BFF3C059FBC774424010395944C4DBF4BFBE777EF2C87442401DC3CED7C1DBF4BFC18FF8B1CF744240BFD75EE6B0DBF4BFC68E9E66D274424052BD681BAADBF4BF1504E48AD2744240CAAEA426AADBF4BF5C0B8DAED2744240FCAD61FCAADBF4BFAD6284D0D274424027444E96ACDBF4BF31BEFB6F03754240B71FA5E542DEF4BFD99B7FBCEA744240458F6B691DE5F4BF94328799DF74424045E22326A9E5F4BF	2.28	1613	Nairobi1	\N
143	Kambi Moto	47	1	0103000020E6100000010000000B000000A97D0CD73E704240ABCD5177102CF4BF9F029EE23A704240FB7B324F082CF4BFE8C20B7935704240CD05240CF82BF4BFA22687A335704240EA49DAC07A2BF4BFF9BBCBB635704240B86C1BA7552BF4BF8451DE3B3670424051A3DC636E2AF4BF9A2D77483870424081B80747FF26F4BF8CDE63113E7042408FFB4C9E0727F4BF6F5EB53D417042407409C13D0C27F4BFF69E93D040704240F96D6D0D0F28F4BFA97D0CD73E704240ABCD5177102CF4BF	0.43	698	Nairobi3	\N
146	Mji wa Huruma	47	1	0103000020E61000000100000012000000D044C416EF694240EA8768FB74A8F3BF973387DEE26942402EE0EAC571A8F3BF1DE178C5E169424042D021386AA8F3BF1924C3A4D269424048C529F4F5A7F3BF066D320BD06942400B8DBA3BC7A7F3BFA8234EF5C06942404C24237420A6F3BF476A2A94CA694240541F8DFE46A2F3BFE8309B3ECE694240F59208204EA2F3BF4C42EA78D76942409EF0572D61A2F3BF088BB57EDC6942409959A7D96DA2F3BF69834F71E66942400096331B93A2F3BFDFE388E3EB694240CD4D99C3A8A2F3BF32CED8B0F869424077DA23F5DFA2F3BFAC326F6FF9694240B0C38FC145A3F3BFE52693B9F66942407D29401E1EA5F3BFB18E9995F2694240F4E4CD7726A7F3BF58BFA9A5EF69424032DB4C6844A8F3BFD044C416EF694240EA8768FB74A8F3BF	2.78	1500	Nairobi6	\N
140	Maganda	1	1	0103000020E610000001000000120000002051170D9DD24340482E7C3C676410C0BE6FA7837DD243407CCB0322086410C073832C92FED14340A38D42E9F86110C066ACE13EFED1434054C29E8CF26110C0F187C3B418D2434005988F84645F10C066984CD91AD2434092523D24385F10C0E8EB981E78D243403E734B44DB5D10C01DE704827BD24340BC8E0ABDE35D10C0C3AA198C7FD24340C9CD0868EF5D10C0E6CB4DFED4D24340A9193752936110C0612A6017D5D2434096F3B96C966110C06E1A0EEAC1D24340B1B830668F6210C038E8AF18C1D24340AC77F7FE996210C05B1F0E05B6D243409B830984296310C0795373BBB3D2434064F39527476310C030484086B2D24340FA37CBCD566310C0B40D07AA9DD24340D67503E9646410C02051170D9DD24340482E7C3C676410C0	97	5000	Mombasa11	\N
131	Kisumu Ndogo	1	1	0103000020E61000000100000010000000EA24FC8F0BD943406DFE84EFE02910C07315021400D943405294E948C92910C02955B0F3FCD843405F2BB9D8C22910C000D057FDF5D84340EC8ADBB5AD2910C055E91FF4F2D84340D956507EA42910C09CBEA72BC8D84340BC929E01C62810C06FD8D10ACAD84340C00331F3642710C03AEB73D9CED8434077C53922DA2610C0D1C9FD87D3D84340E7E3A67CE22610C0D69EA74DD6D84340960FE56EE72610C0FB9F5C7AD9D8434025844C74EF2610C09AE48EC0E3D84340F6BA016A092710C0BBCD1655E7D843403CBC063F252710C0039EE3F7F5D843404E298006972710C09689BB2315D94340E2B5FE4F542910C0EA24FC8F0BD943406DFE84EFE02910C0	5.99	3000	Mombasa2	\N
133	Kwa Hakatsa	1	1	0103000020E6100000010000001F0000001A6BA1DEDCCB4340B3B478A3340310C0DCC693ABAECB43401F8C3A945C0210C02D66363CA2CB43402FC0095F220210C0ABFA7FAB5ACB43401CD9F0A783F80FC0BD7F1D3C5CCB43407ADD2E8C39F80FC086B12AA593CB43405199C55620F40FC0F7E35FC694CB4340083732CD0DF40FC099A336AC96CB4340C818DB13F3F30FC0340FA41098CB434013DFC94DE2F30FC017446B2A99CB4340877C4FE6D6F30FC0C4C9E87B9BCB434084EDD850C4F30FC0509BCC259DCB4340B0C81D79BAF30FC0D6CFE2419FCB4340717332F1B2F30FC00B9EA4D4A1CB43404192DF63AEF30FC0C3809790A3CB4340337FC05EAEF30FC0040C8CD2A5CB4340F3451959B2F30FC0D1C8215BA8CB434040704691BBF30FC0F8B8F15AA9CB43401837BD2DC1F30FC0538B1400ACCB4340CBB7A9D4D9F30FC05CE4955EADCB434011D2C7F4E8F30FC012687655AFCB4340151D094902F40FC0528BCF32B0CB4340F7E9823B0FF40FC054F8C449D8CB4340F569EF67AAF60FC0839B952CD9CB434001194D35BCF60FC0F4D5D2740DCC43406B980CFD54FB0FC0EC4F05E90DCC43407E8C88529BFB0FC078AE79B1FACB4340644740BA840110C0C7A839FEE5CB4340AA8A560BBE0210C055302DB9E2CB4340A38B108CE80210C0241AAFFAE0CB43406F02F737FF0210C01A6BA1DEDCCB4340B3B478A3340310C0	20.9	3000	Mombasa4	\N
134	Mwatate	1	1	0103000020E6100000010000001A000000D5E7D6C65ED0434028C4071C972410C088AD03475CD04340D3645B7F962410C0BEC1944F36D04340F4426B5C372410C0C171352704D04340423C981F8B2310C08DEF2DBF02D04340894C377C852310C0378A668302D043407D1D02536B2310C086A7BF4502D04340C70977C9492310C0DE8A291502D0434091E1305A2F2310C0201D93EC01D0434062BFA663F72210C0FF75ED2A02D0434050F7D8C2F32210C0C956ACF020D04340B930B613ED2110C00D1B926522D04340E0AF0921E92110C0F26CCDF13AD043403454DD01FB2110C0783282583ED0434076CD04D4FD2110C006CD073C3FD0434043B2C090FE2110C0C7BA3E3E3FD0434033CD4A95FE2110C04CD311733FD043402897E001FF2110C0224CF43A46D04340B9D66E73152210C0A58C164347D043407D9EBCEF182210C0D9ABE70848D04340009C028C1B2210C08AC667D148D04340638E5F311E2210C08AA4A7DD4BD043404FBED49E282210C069BBDF5B60D0434006734FBC6E2210C0962E197866D04340DE60F03ED62310C0C639BC2F66D04340BE2034AD582410C0D5E7D6C65ED0434028C4071C972410C0	5.99	2074	Mombasa5	\N
226	Maili Nne	27	1	0103000020E6100000010000000B000000BA665F95F19D4140D4A8E785F907E23F0A74C6F48F9D4140261F12F68414E23FE52058538B9D41406415BFBB1016E23FD7F5164AA39D4140ABC3F45B652AE23FBD1A7054C89D4140704934C1F736E23F800942B8CE9D414002FF4AFFAE38E23FD5BAAE96259E4140EED51E6FDB21E23FF392167F259E4140C15542A77421E23FF3FDBBBC159E4140140FC083190DE23FBC018B13FB9D4140D309D8025209E23FBA665F95F19D4140D4A8E785F907E23F	9.99	1283	Uasin Gishu2	\N
135	Chaani	1	1	0103000020E610000001000000240000002DE7801482D0434042DBBDDAD62410C053FF6E4B7ED04340F2793D82CA2410C0D1733E937DD0434035408729C82410C02844318378D04340E23A9DA6B72410C0B574FF1672D04340EB1345B4A22410C0421F1BDF6FD04340A43428789B2410C0FCC362EB6BD04340F4A48C948E2410C0CCF7B8246AD04340BAA8B7C9882410C0F86F03196AD04340868E87A3882410C055F27C8468D04340C55F377C832410C0FC4DC2E866D04340E4559F2D7C2410C0CA1CE58F66D043405FBCE3997A2410C0469A150C66D04340B1080A43782410C091BE67D565D04340D30D9E4A772410C0171066AF65D04340DE87F19D762410C0D5AC6F6E63D043402454A6606C2410C0D3E70C015ED04340DCDBDE07F22210C0D63324EB5DD043400AE9B861EA2210C07D38CBE85DD04340164AE78FE92210C035620C025ED04340D479B78FA22210C0BA528B0C66D04340A31FC45A361E10C05145DC6266D043405B58488B2D1E10C0ECD237AF66D04340184909C22B1E10C09892A4BC66D04340BB46A5712B1E10C0FB6ABAB66CD043408E9351691A1E10C0DE9F5D3C86D0434039ECC652F01D10C005A9B31495D043408B13A63BF51D10C04F7C7DA897D043405D3CA5CEF71D10C0875593389BD04340A894B38DFB1D10C07B261548A0D04340AA35386A0E1E10C0DA535316A9D04340A3A9BFA6431E10C035DE454EB4D0434048882734A41E10C06FDEDF7EC5D0434006115A4D062010C0D6E27E80BBD043403293E4C5582410C0ED44AFEEADD04340AE447B53D22410C02DE7801482D0434042DBBDDAD62410C0	10.82	3729	Mombasa6	\N
54	Kibikoni M17E	3	1	0103000020E610000001000000CB000000127467F3930F4440ADB3BAA8B96609C05AE7B265A70E44404F29A753A26409C072E6929AA50E44406FC70A109E6409C034B89EC3A40E4440E1590F0B9C6409C05391C95D820E4440FB6F2A162F6409C0647BCDF9700E4440366FF224096009C05D0F22E8700E44404466EF6BDE5F09C0E85BB0E4850E4440601FDAA2AF5E09C092706103E80E4440467CF5A3D15F09C046473C85E90E4440F7E480FCDB5F09C0460B3C7FEA0E4440650097B0E25F09C0E4E0CCC6FE0E4440C09B88E56D6009C0C3FEA8A4FF0E4440EF2096D8736009C0B02AF9898D0F44409D33E8FD426409C095CBC87D8F0F44400E716E69506409C05A0D37F08F0F44405F07147C536409C0D48FC1D6930F4440F7C600F1036509C0CBD98FDA940F4440B5FDFEC4766509C0358015DB940F44402E0411B7776509C090CD20DC940F44406525549B796509C011F3ABDD940F444090152D717C6509C07383AFDE940F4440E107F4547E6509C08423B1DF940F4440E6C55D38806509C0A1E5AEE0940F4440D380A81B826509C040C9A8E1940F44406524B5FE836509C016BDA0E2940F4440F8A783E1856509C008C81AE3940F44402368DBD2866509C0FAD294E3940F4440742833C4876509C05F0A85E4940F44406E91A4A6896509C0D436FBE4940F44403B3ABE978A6509C0486371E5940F444005E3D7888B6509C0721BCEE6940F4440CACEE65B8E6509C0696940E7940F44400E60C24C8F6509C0EC2721E8940F44402194792E916509C0EF978FE8940F44407922361F926509C0F007FEE8940F4440D1B0F20F936509C0B4886AE9940F444078339000946509C0010AD7E9940F44406ECA4CF1946509C0879B41EA940F44404241CBE1956509C0F4837BEB940F4440E0BF46B3986509C08437E2EB940F4440C533A6A3996509C05FFC46EC940F444047B005949A6509C0FCD1A9EC940F4440F82046849B6509C098A70CED940F4440A79186749C6509C0347D6FED940F44407A02C7649D6509C0395B2FEE940F44403AD509459F6509C0956CE9EE940F444063AD2D25A16509C0478644EF940F444013183015A26509C02FDBF6EF940F4440C7D5F6F4A36509C0EE164EF0940F4440433DDAE4A46509C0AD52A5F0940F4440E3A4BDD4A56509C0B90D4CF1940F4440645927B4A76509C0836B9FF1940F4440C9BDEBA3A86509C0A46A3EF2940F4440276C1783AA6509C0E1C35BF9940F44408619B5AFD86509C012214AF9940F4440C29DC8D1DA6509C00F9B43F9940F4440FBC5C487DB6509C081143DF9940F4440C0D9A13DDC6509C0A5D32EF9940F444078249EF3DC6509C012A41EF9940F4440CB779AA9DD6509C07366FAF8940F4440F2065515DF6509C07559E6F8940F4440826B51CBDF6509C03A5DD0F8940F44403FC42E81E06509C07560BAF8940F4440D508ED36E16509C08275A2F8940F44402F6ACAECE16509C0DA9B88F8940F444050D4A7A2E26509C0AAC16EF8940F4440252A6658E36509C0C3F852F8940F44407188240EE46509C0AF4135F8940F4440CD0302C4E46509C00CF5F5F7940F444003E37E2FE66509C07A5FD4F7940F4440DE461EE5E66509C0BCDBB0F7940F4440CDC7DC9AE76509C0FD578DF7940F444096489B50E86509C001E567F7940F4440D2BD3A06E96509C04F8340F7940F4440883BDABBE96509C09C2119F7940F444041B97971EA6509C07FE2EDF6940F444059481927EB6509C060A3C2F6940F44404BD7B8DCEB6509C08D7595F6940F4440046F5892EC6509C0B84768F6940F44409706F847ED6509C0AF3006F6940F4440124418B3EE6509C0E724D5F5940F444093D89868EF6509C07F526BF5940F44403C249AD3F06509C0937A34F5940F44409AD21A89F16509C0F4B3FBF4940F4440BE899B3EF26509C0BF4886F4940F4440ACF47DA9F36509C0B32209F4940F44403B826014F56509C0688FCAF3940F4440C93EC2C9F56509C0FCAD45F3940F444081DA8534F76509C0DA5FFFF2940F44408CB9E7E9F76509C0B811B9F2940F44409498499FF86509C00CC372F2940F44404F638C54F96509C0809728F2940F4440BD53EE09FA6509C06A6BDEF1940F4440B62F31BFFA6509C06F6290F1940F44403B319374FB6509C0EF5842F1940F4440721ED629FC6509C07E68A2F0940F4440410A5C94FD6509C0DA924EF0940F444056119F49FE6509C035BDFAEF940F44406718E2FEFE6509C0DCF8A4EF940F44401B2825B4FF6509C044454DEF940F4440212C4969006609C07FA3F3EE940F4440104D8C1E016609C0FF813CEE940F4440E18BF388026609C09013DDED940F444085B2173E036609C020A57DED940F444003D93BF3036609C0FA471CED940F4440220860A8046609C01FFCB8EC940F4440E23F845D056609C08DC153EC940F44403A80A812066609C0756E85EB940F4440E1FDD17C076609C0C3671AEB940F44401C58F631086609C08660AFEA940F44400A9EFBE6086609C0697C40EA940F44408009209C096609C0C097D1E9940F4440AD6025510A6609C063C460E9940F444072C02A060B6609C05002EEE8940F4440D82830BB0B6609C03C407BE8940F4440439135700C6609C0BDA004E8940F4440E50A3B250D6609C0548413E7940F4440700F468F0E6609C089AC1AE6940F4440292232F90F6609C0AEA974E5940F4440D574C2E3106609C0E6191AE5940F444059571E63116609C09CE197E4940F444048F00418126609C025BB13E4940F444047A60ACD126609C06EA58DE3940F44409850F181136609C0939C7DE2940F444074B6BEEB146609C0BBBAF1E1940F4440A17AA5A0156609C02DEA63E1940F44406F478C55166609C0E92AD4E0940F4440DA1C730A176609C0A46B44E0940F444046F259BF176609C0BB311DDF940F444022AB0829196609C0FB3CEEDD940F4440A686B7921A6609C0638DB7DC940F4440A38466FC1B6609C0E75718DC940F4440948A2EB11C6609C06A2279DB940F4440A990F6651D6609C039FED7DA940F4440619FBE1A1E6609C0FDFA8DD9940F444046DF4E841F6609C0AA0AE7D8940F4440B4071739206609C0EB3C3CD8940F44408241DFED206609C02B6F91D7940F4440547BA7A2216609C0B6B2E4D6940F4440C5BD6F57226609C06C7E83D5940F4440B050E1C0236609C04BF5D0D4940F4440AD988A75246609C0488F1AD4940F44403806532A256609C0BC2864D3940F4440775FFCDE256609C005D4ABD2940F444078D5C493266609C058A1EFD1940F444096486E48276609C0AA6E33D1940F4440B1BB17FD276609C01A5F73D0940F44405854E0B1286609C0014FB3CF940F44408BD88966296609C07C61EFCE940F4440216E331B2A6609C03A934FCE940F4440C3D461AD2A6609C0F6C4AFCD940F4440643B903F2B6609C088080ECD940F4440EFBEDDD12B6609C0D95C6ACC940F4440AA360C642C6609C010281FCB940F4440A73769882D6609C0F69E77CA940F4440C6C0971A2E6609C0DB15D0C9940F4440E249C6AC2E6609C00C9E26C9940F44407BDBF43E2F6609C086377BC8940F4440D57523D12F6609C0FFD0CFC7940F444031105263306609C0C47B22C7940F44402AB380F5306609C0D33773C6940F4440C85EAF87316609C0E1F3C3C5940F44403B0ADE19326609C0918E61C4940F4440AE723B3E336609C0336DAEC3940F4440852F6AD0336609C0834C44C2940F444001A6A8F4346609C0F24ED6C0940F44402F420619366609C072611DC0940F4440E51835AB366609C080A8A7BE940F44401EC373CF376609C0AA122EBD940F44400793D1F3386609C0E09EB0BB940F4440BB5F10183A6609C0324E2FBA940F444023526E3C3B6609C09DB66CB9940F4440A53F7ECE3B6609C019ABE3B7940F44406454DCF23C6609C0274D90B5940F444048794AA93E6609C0F9E9C7B4940F4440D294793B3F6609C0A94533B3940F444025C9B85F406609C076C49AB1940F444003231784416609C05383CEB0940F44407F3B2716426609C0035400B0940F44400E7156A8426609C0F91760AE940F444069EDB4CC436609C06AF98FAD940F44402017C55E446609C0AFECBDAC940F4440EF5DF4F0446609C082E417AB940F444028F45215466609C0EBFE6DA9940F44407B9BB139476609C03A1498A8940F444038DFC1CB476609C05E3BC0A7940F4440E53FF15D486609C0A38910A6940F444036015082496609C07FFA5CA4940F4440AAD3AEA64A6609C0A5D7C9A1940F444065293D5D4C6609C0A732ECA0940F4440CBA36CEF4C6609C0A88D0EA0940F4440541E9C814D6609C07DFA2E9F940F4440CAB5EA134E6609C015D36F9D940F44401FBC49384F6609C05F4CCB9A940F44409D73F7EE506609C089F92098940F44402345A5A5526609C0663A5696940F44405A9323CA536609C090DA7095940F44406130535C546609C08F8C8994940F444058EAA1EE546609C000F0BA92940F4440F1492013566609C049B3D191940F4440880C6FA5566609C04E39FF8F940F44403C7DEDC9576609C0127467F3930F4440ADB3BAA8B96609C0	22.26	1364	Kilifi1	\N
55	Muyeye I	3	1	0103000020E610000001000000190000005180AC298D104440D877699A0F1E0AC01D5D2629801044409CF32B1B0B1E0AC01339B22F41104440962311245D1C0AC0C1F24EE0110E44403572559502FD09C0867F8EC1B10D44405D1AD25C3DE909C0B5C53E9FAE0D4440658B884171E509C0452C28FBBB0D444063FBCFCE36DF09C050E29001DA0D444044370FC179D509C080E33E8A890E44401CEBA612C8C709C0D644E5ADAD0E444072F5E99F3CC609C0FC5CA20B300F44406CA295109DC209C0B7428C4F5F0F44400A9068C9BAC209C07F64B578710F44402BF1A639C7C209C0C566AF3F7D0F4440E90CD5F3D4C209C0C7A178504210444062DD5EB856C609C02281D30BA7104440CFCEB81750C909C04ABD41DEA7104440ACB17F2A68C909C03C9AE390AD10444099E8009170CC09C09031EADE00114440BAA942B6170C0AC0172CE57901114440F6B03FDAD30C0AC090972139FE1044408DA6C28EE90D0AC038864D09FE1044405497D681F90D0AC0CE03BF91BD104440F4D980C5311B0AC03DCE02B794104440A1BA72C60B1E0AC05180AC298D104440D877699A0F1E0AC0	26	5000	Kilifi2	\N
57	M26 Kibokoni	3	1	0103000020E6100000010000000D000000C3B07E86210F4440EC3F46F1AA6509C03F30CB581C0F4440AF6C5342A26509C007A93C82100F4440AD24770C8D6509C0BE7A6D0B0C0F444073044A68816509C02A20A2C1FA0E44402C299C28056509C0E2484E4CFB0E4440C5EFD39ECC6409C08383C4AD120F4440CC54382AFB5E09C02EB3AF70280F4440B5025DBCFB5E09C0A346959E300F4440FB7AD10E215F09C0D7DCC3992F0F4440CB7C90A8AC6309C072337F142A0F4440AA35CF38D66409C01B8EFC94250F444087F804CE646509C0C3B07E86210F4440EC3F46F1AA6509C0	2.227	208	Kilifi4	\N
58	Jiwe Leupe	3	1	0103000020E61000000100000017000000E6F80EFA290144405158D5F215DD0AC05E574C6CE1004440A4B7847643DC0AC083899B16CD004440D8E93726C1D90AC086C424F8CC004440A9DED113BDD90AC0A8E0E8D1CC004440452C8DF7B7D90AC004605FA1CC0044405D60BEAB7CD90AC09253BF77CC0044404CD7AB5732D90AC0E077B11CE0004440B8A9373919D70AC0C62FEF1143014440A2C3829FF4D20AC032B2BCD85201444017A9028203D30AC04DC114455C0144402560B05F12D30AC08782F2F0660144406BF51A4B87D30AC0BF83DF0C65014440461B696164D40AC0D86ED6ED4A01444098F958B40CDC0AC03F3B56473E0144408F013B4973DC0AC0B7C84B523B014440DADE0A448BDC0AC05E704A40380144400B6DB929A4DC0AC098A7049D3701444065C2B155A9DC0AC00F38BEF6360144408208039AAEDC0AC0364004B83601444060436E95B0DC0AC0080E28D931014440B679C5FBD7DC0AC01DEB112B2B014440EA65C0910CDD0AC0E6F80EFA290144405158D5F215DD0AC0	12.6	1089	Kilifi5	\N
61	Shingila	3	1	0103000020E61000000100000013000000BAC259576FEE4340A0DDB4E97C0D0DC09161241A6FEE4340B52C971D510D0DC0EA16F8256FEE4340A58FA7AB470D0DC05D8167316FEE43406D01D0893E0D0DC0E529BD3B6FEE43403599FB48360D0DC0AD676C406FEE43402CFC438B320D0DC0F1AD3D8D6FEE43401DE08632F50C0DC0778A36986FEE4340FFAE027AEC0C0DC09FA75A8175EE43404E74A1CEAF0B0DC07841F81E82EE4340997E82F1D7090DC0CAC93ED08DEE4340367B09AEDA090DC0C815C641D4EE4340F77903E3FF090DC01D77993EE0EE4340477AE4CE080A0DC095B08B7AE0EE4340584F2353F00A0DC038D06782E0EE4340452D6582C00B0DC06D878A60DFEE4340BE6A98FE500D0DC0CF8447FACFEE43409538AA795C0D0DC0613A7D5581EE4340417EA0DB7B0D0DC0BAC259576FEE4340A0DDB4E97C0D0DC0	7	545	Kilifi8	\N
66	Muyeye II	3	1	0103000020E61000000100000012000000F69EF0995E0D44404CAF7E2AF9110AC069B3B804590D44407F8F6B8BB3110AC058B44006570D44400A779DAD9A110AC022B8C807550D4440E02CCFCF81110AC06C5B0EE1540D44400EFED9EC7F110AC07217C8DD3E0D44401EF867F91F060AC0713032B6E60D444070DFB99C59EE09C0E63F68C68D0E44401A8FEDB0C4E809C009D11F1CD20E44404AFC64359DE809C05316C564D50E44407665F79157EA09C03D2C89AB940E444005B294729D020AC071B1728B9F0D4440D9E7EEC8FB100AC0F9ED4D72970D444000D04EF152110AC02A5D9EAF930D44409E6A496A7B110AC08AF02C21900D4440BB28FFB0A1110AC0B1A69ED3890D44409DBA0087E5110AC09AC10531630D444083D5A014F7110AC0F69EF0995E0D44404CAF7E2AF9110AC0	106.54	14250	Kilifi13	\N
17	Namu Phase 1	7	1	0103000020E610000001000000100000008BA5562FFCD343407BE107FA5B8DDEBFD3A12D06FCD34340A9FC322D428DDEBFD2C152D17BD3434014FD45EFFD34DEBFB1FD01576DD343408405B0F31B2ADEBFCA20DAD153D343409BE15196A215DEBFA55B86DF70D34340EED684A66D0BDEBF1C7701F0ADD34340F5BAE3251B07DEBF49EC8C3035D44340238E02C820FEDDBFB20BF6563AD443407F6EABA8D7FDDDBF8162F6314DD443409F9BEA20E3FCDDBFED754EDF3ED54340E3C0442D0F55DEBFB44FE6A23DD54340094A8FFE7656DEBFA36E28A732D54340BCC3B28C395BDEBFA0A0FD4A30D543408269DFB1245CDEBF85A990212ED54340BCDE1706CD5CDEBF8BA5562FFCD343407BE107FA5B8DDEBF	158.5	4928	Garissa1	\N
18	Namu Phase 2	7	1	0103000020E6100000010000000D000000CBA9664A86D443402D7CA7BCA6EFDEBF905846CEFCD34340DDC918976D8DDEBF6708C797FCD34340B977A581458DDEBFDB7E4FD247D4434065528A13D078DEBF11E2767D49D44340CE7398AC8778DEBFCEE88D704CD4434043978F150E78DEBF23E3C7103FD54340CB5D7D1FE254DEBFE682ECE147D543407B49C8B8C856DEBF997041F757D54340C76BA96C095BDEBFDC7ADD1783D543409ABB85B69666DEBF57F2B24372D54340809FF7D732BBDEBF98B8DB6688D443403B51E8078FEFDEBFCBA9664A86D443402D7CA7BCA6EFDEBF	158.5	4928	Garissa2	\N
19	Bulla Riig Phase 1	7	1	0103000020E610000001000000100000005DBE046F00D44340ACC1CF84793EDCBF8FF6D88132D3434069C532D87CFEDBBF7BFE17FC32D34340C8F0AB9C65FCDBBF5275C22D56D34340BEE0E58B5199DBBF5388236080D44340BCDF706B0470DBBF688ECFFE6CD5434075A9026D3E51DBBFF1C7EF768DD54340B4D49B8AEF61DBBFA4D37CBA11D54340AC94CF005FA8DBBFFC316B25E1D44340EBFC4B6B7FC3DBBF7181A09350D4434084201272CD12DCBFCC209FC62DD443407F0C9B60DE25DCBFBF776E8828D44340075F98B6BD28DCBFB3BFA66127D443402EC6D17B5D29DCBF122822DC11D44340FD50429E0735DCBF7E72C77205D44340818EA8BAC13BDCBF5DBE046F00D44340ACC1CF84793EDCBF	351.42	13343	Garissa3	\N
21	Iskadek Phase 1	7	1	0103000020E61000000100000018000000E8C2A2E945D44340BB106A5CD5F3DDBF47D1B4B5CDD34340D895DB71C8A2DDBF2A2D9254CDD34340A2A15AA1D3A1DDBFB7C5C82BCFD34340C9F7E442AE99DDBF341362A5D1D34340ECF650352094DDBF105C4643D5D34340880EC7BDC68CDDBF9617F24021D44340F65D04FA6E27DDBFA7D0E1CB7BD44340DBA2716563B6DCBFCF9B678684D4434016B7AD4370B0DCBF950D7AEB89D44340FB5ACDE0C2ACDCBFE49912968DD443407443937E50AADCBF2793D75A9BD4434021E7C03320A1DCBF39A7E056B5D4434037351C9F8A9EDCBFA7DD5A8FC0D44340CA785B208A9DDCBF1A0CFE4CCAD443400B2F2EB1609DDCBFBEB0D790CDD443407525FD466B9DDCBF4AC2F8A006D54340EC54D9EE4FCCDCBFEF86B3F006D54340D22F3B5AECCDDCBF20AC909FE7D443408CD226CB3C76DDBF0EBD9B56A8D44340727F0309EACDDDBFCEA9432382D44340EE1588A11BEADDBFD8DD190C81D4434075E83E5563EADDBFD88DA20249D44340F6F71492CDF3DDBFE8C2A2E945D44340BB106A5CD5F3DDBF	203.41	4432	Garissa5	\N
22	Iskadek Phase 2	7	1	0103000020E6100000010000001D0000006CBC7E0FA7D4434003EDE5F9863BDEBF7C7079F8A6D4434003C24F867C3BDEBF843ECD3EA6D44340C1FD733A283BDEBFFA47F24A55D44340D8207108630CDEBFC756DECC4DD4434032AD5DF562FDDDBFD65301DB4CD44340CF42809249FBDDBFEB964FC74CD44340573A78D01DFBDDBF68C475184CD44340A210005299F9DDBFD906AC004BD443402C8CA9AB2BF7DDBF8A639DC04AD44340D2F12F589DF6DDBF232A196F49D44340834D166EAFF3DDBF82DCCF5949D4434096DD90412FF3DDBFB9157B4A49D44340FF60DAF0D2F2DDBF1A2F85B149D443406B72887BA0F2DDBFD5817C04A3D443404C736D5350CEDDBF344DE2B0A9D44340BC768E9BCBCBDDBFA8CB3DBA93D5434006DCC17275AEDDBF2B9BD96196D54340B437A50378AEDDBFCA3F402AA6D54340225C8E568DAFDDBF2313C2D4AFD543408DB4CE1540B0DDBF676C8C42B1D54340650AD5645CB0DDBFA2C026CEB7D54340542971FD4CB1DDBFC216FE74C4D54340C6CEC2F972B3DDBFA9791E84CDD543408E342F7A14B5DDBF59F250D3D4D5434049D134A167B6DDBF78BDD8A0D3D54340E5E5970914B8DDBF80A9CF77C7D54340F52930D6C3C7DDBF9DFE34157AD543404ED4ACFB7029DEBF6CBC7E0FA7D4434003EDE5F9863BDEBF	203.41	4432	Garissa6	\N
23	Makhanu Phase 1	7	1	0103000020E6100000010000001A000000A711500A55D5434032012EF06355DCBFCC95A3176BD4434035E36A53D653DCBF4BE3F89062D44340397C5CE3024EDCBF70081EF05BD44340283943B17149DCBFABD1D38A5AD44340D6ABA7817B48DCBF7B681A155AD4434055CBDC632A48DCBF1490367C58D44340244653A61047DCBF9DC3FC5A40D44340C19969486135DCBFDFDE38C736D4434085CEBAD8142EDCBFD513D8F53CD543405A7A7A9DE99BDBBFC5A0374F94D5434012984761566BDBBF347CFAA996D543409A72EF770B6ADBBF8941949597D543406AF81C208A69DBBF657F645DEBD54340CCE54136CCA0DBBFCC0A5C6EFAD543408F940FC7E1AADBBFD5F5A46FFAD54340748715249CABDBBF4014BF49FAD54340B1D005F921ACDBBFCD6C3334F2D54340337132301CB6DBBF6111566B98D5434077BA30064C24DCBFCE45C48474D5434028DE23391D50DCBFBC7C8C0D72D5434063514278F552DCBF548C04B86FD543400D043FCB5054DCBF4AB5E81363D54340D79AE285EC54DCBF90EBBA775DD543408A504A3F1C55DCBF3CC86CBB5CD543408D322E812255DCBFA711500A55D5434032012EF06355DCBF	267.73	7648	Garissa7	\N
24	Makhanu Phase 2	7	1	0103000020E6100000010000001300000011B9F061DAD44340081F5F34649CDCBF97D44485CBD44340C9A0B6E1B89BDCBF1F4D2507C8D4434028AE3B3F5A9ADCBF72446D6670D4434074DC6903AE58DCBF1504EBA76BD44340EB1964F55954DCBFCC95A3176BD4434035E36A53D653DCBF8941949597D543406AF81C208A69DBBF0074DD0998D543407773061C4769DBBF7806BD8D9AD5434089D9090BD467DBBFFCE07C0F44D64340B794C8BCEB6ADBBF4D8D54996AD643408343ADBF4082DBBFBCDEFC2870D643406128734DA186DBBF11E0B04478D643404D2FDE17038DDBBF518989C6A1D643407A89C81AA4C0DBBFA344BD83A2D64340C3265C5FCAC1DBBF8E8B9652A7D64340C35CBDFD84D9DBBFA5DA5DAA4FD643401493DD758D65DCBF0A9685A1A5D543400C78FE0A6980DCBF11B9F061DAD44340081F5F34649CDCBF	267.73	7648	Garissa8	\N
25	County Phase 1	7	1	0103000020E61000000100000019000000D9926D8A58D3434043B00F1D4D18DEBFAAE9FF8456D3434024B06E913A18DEBF541B36354FD34340C20450343D13DEBF595FD37C49D34340F7F15157C70EDEBFA6D32B2347D34340FBA7FE13170CDEBF071CD69546D343402D54A5BDE90ADEBF5DD6EFE745D34340AE1B14F97609DEBFC9924DA645D34340B24A4909EB08DEBFD4829A7344D34340F520C6205D06DEBFA107EC2140D34340967D70B827FDDDBF4AEF0F153BD34340D4CDFD3A63F2DDBF5245F6C93AD3434076CA311CC3F1DDBF919C38803AD343403B455FE325F1DDBFD207904539D34340C560320287EEDDBF2239CF3337D3434056D42E871DEADDBFC31438F617D343404A63B28608A6DDBF369AAD2319D343408DF4DA5296A5DDBFEF1C4B80BFD34340E5D3690EEC98DDBF33AAFBCFC0D34340C68786801C99DDBFCEC6EC9DCED3434033D224CB3BA0DDBF0D8A0776CED34340A4A66B283DA1DDBFF04DAFE7CDD343406327B430C0A2DDBFD0C05628C1D34340D82246939CBBDDBF8AD1FF379BD3434025B54B4F76F2DDBFD9926D8A58D3434043B00F1D4D18DEBF	56.31	2517	Garissa9	\N
107	Kaango Mosquito	15	1	0103000020E610000001000000110000009A77991EEB004340470B520762F2F5BF3A7E8893DF00434015BFFAFBFFF1F5BFE86F1870D8004340595418BD14F1F5BF382AC02CD5004340759170FF45F0F5BF26856461D0004340DEB3EA3B16EFF5BF4A0675C3CF0043408603B676FBEAF5BF8A4A7FA1100143407336324FF5E6F5BFB8E8F1421F0143409C95AB8C12E6F5BF1B972506600143402D9166CBCCE5F5BF5D82C6C762014340E87B87FC76E6F5BF904CD7323F014340CA4FAE0C38EBF5BF4942B49E3B0143402DFADC6FA9EBF5BF7894896322014340C959908233EEF5BFBBB6B401060143409986060ADAF0F5BFC2DC45A7FA0043408AD5BED087F1F5BFA350D4BFF500434036DE83E7D1F1F5BF9A77991EEB004340470B520762F2F5BF	7	3960	Kitui1	\N
15	Kathita	14	1	0103000020E610000001000000130000004BD5241744B94240D1B7D145B7FDE0BFC86725A542B94240597794238AFDE0BF41F11C093BB942404419C4D258FAE0BF0C7A345C30B94240638745DEA2F1E0BFC9F56CA329B942406F15C3C526ECE0BF111C497927B942401C32209C62EAE0BF777A9AA542B94240C1281B1BBFE6E0BF87D70D7847B942406AB7E4CD19E6E0BF21A524074FB942401814B3AE16E5E0BF02AF8A5151B94240584D4629C8E4E0BFCA3EA6A556B94240CDE0EAF135E6E0BF7CB1954F61B9424056B266FA11E9E0BF4B438CA466B94240F9FC40FF7FEAE0BFF704373D69B9424094373D3B32EBE0BFACF1A17F60B94240414EFD88EEF9E0BFD8BCD17C5FB9424020F4EA8E55FAE0BF3947A13256B94240C05F2311F4FBE0BF00378DB050B9424054A310527DFCE0BF4BD5241744B94240D1B7D145B7FDE0BF	5	1000	Embu1	\N
16	Kimangaru	14	1	0103000020E61000000100000039000000A21B639657C34240C20E30B5B987E1BF322BF46EF6C242408F8AF31ADF7FE1BF68A17C72F6C242409CABDFF2D87FE1BFABFC5C77F6C24240FDD048E4D07FE1BF0663C87CF6C2424079B2B74EC87FE1BF62897182F6C24240E14280ADBF7FE1BF0C9A8C88F6C24240FF3D60B5B67FE1BF46611F8FF6C242406559255CAD7FE1BF15A44C96F6C2424009661577A37FE1BF88970E9EF6C2424043560B0B997FE1BF9A3910A6F6C242402B2A71908E7FE1BF627D65B5F6C24240827BAE0E7B7FE1BF9B045DA4F7C2424032D61B0D4C7EE1BFACCA17B1F7C24240F4E839093C7EE1BFB4B321BEF7C24240665B63E22B7EE1BF9B25E2CAF7C242400C8E70561C7EE1BFBB0FE8D7F7C24240BF096ABC0C7EE1BF99473AE4F7C24240B53E2D36FE7DE1BFBF4F55F1F7C24240E2CE6E08EF7DE1BFB00496FDF7C242403B86B019E17DE1BF63F63E0AF8C24240308D15F4D27DE1BF3AF7F07DF8C2424028DADABC537DE1BF98BC2B8AF8C24240B23F9B65467DE1BF3FFC2195F8C24240E033C8A33A7DE1BF92B8FCA3F8C24240FC0019102B7DE1BF74E392B1F8C2424035D5EF401D7DE1BFD79EA5BEF8C24240C2876769107DE1BFE02ABACBF8C2424018C66007047DE1BFF92667D2F8C24240ADBA9AE7FD7CE1BF953655D6F8C24240BB828560FA7CE1BFE0D353D9F8C24240B71A87B0F77CE1BF91657AE0F8C24240A8945F6BF17CE1BFDB4152EAF8C242406DBD2410E97CE1BF80D767F4F8C24240B549F8C3E07CE1BFE12B66FEF8C2424043B2A5E1D87CE1BF53513C0BF9C24240B7E35F28CF7CE1BFC3063718F9C24240F3B8B3D0C57CE1BF8FC8BD24F9C24240D811293EBD7CE1BF0768B431F9C24240C3F70AD0B47CE1BF3E55DF46F9C2424045FD689BA77CE1BF7DD1F557F9C2424085DCAA199D7CE1BF75ECAC67F9C24240D96F0690937CE1BFD73CEE76F9C242400BC7416F8A7CE1BF3A98A285F9C24240AD5371C5817CE1BF788F0D94F9C242401FF0486A797CE1BFCC4811A219C34240BBA4EDB0046AE1BF432E14711FC3424040A0A8BC5169E1BF8FACED6D23C34240EC8E4EE2D668E1BF16582D6E34C34240482A367C5E67E1BFDF50010B35C342404D5096AA5C67E1BF37BE3339B2C3424030890885826EE1BF0A71BE26B2C342403FC4E69DE16EE1BF3A2A1A08B2C34240B560C66A456FE1BFFABCB4C0AFC34240925263434C76E1BF57692573ADC3424031CA4B372E7BE1BF2E5729C19EC342405A17C82DD97DE1BFA21B639657C34240C20E30B5B987E1BF	16.97	398	Embu2	\N
168	Gatitu	19	1	0103000020E610000001000000190000009C5370ABBF7F42408E0C412FE275DDBF2B23C396B27F42400BE4E5E2C873DDBFCB2A7F49AE7F42403923B404F672DDBFE4FE77138B7F42406B8449CFCD69DDBF2CF8BAC5817F42406A9BA4341466DDBF9282C24C727F4240F844CB4DE25FDDBFACA4ADF1587F4240A197C8CEED4DDDBFDFD16E5F597F4240BC6D3A1C1B4DDDBFF5C4ABB2747F4240693D7AD25142DDBFA719C577A67F4240E961186DAC2EDDBF17106877A97F424022805787842DDDBF6ABE28CBB67F424028580F926928DDBF58B36CCAC27F42402DB1F00ADE23DDBFDCB93D3BC47F4240E9D41203C523DDBFF362B42AC77F42404D5221313125DDBF042ABE32CC7F4240D2612669A127DDBFE450175FD17F42403EEBFB39232ADDBF00B056B2D57F4240522C4ED43B2CDDBFEFF65F8AEE7F42407B866DA8073DDDBF2716064DF27F4240A3366826D83FDDBFAEA8EEE7068042405598492D444FDDBFE0BA94E706804240B54AF155C151DDBF64B53828ED7F4240D8CDEAEE2760DDBF231AD891DB7F42408CBD8A8B8E68DDBF9C5370ABBF7F42408E0C412FE275DDBF	19.9	1015	Nyeri1	\N
170	Kihuyo	19	1	0103000020E610000001000000090000003AC994161C7442405B79D49DD6CCD8BF1957D2AC837342405D64BD0F1FA5D8BFFB8BE1E5E67342403E3AC795138CD8BF6020DF63F2734240BF570E275889D8BF190D4E711974424013EF77254D8FD8BFDC087AF52274424092BCF2C1C090D8BF8BDEBB3F2C7442402EE954892B92D8BFAB3E72CE2D744240F2849E186FBAD8BF3AC994161C7442405B79D49DD6CCD8BF	12.8	220	Nyeri3	\N
171	Riamukurwe	19	1	0103000020E6100000010000000C0000005F6FCC5AB97C424095A63DF304C4DCBF810592B7B77C4240C4A6D6C675C3DCBF9A9571178A7C4240089E6A91E48FDCBF5AFF174D8A7C4240D607161F8D8DDCBF3CCCDFF2CD7C42406289F71F4676DCBF9CD107F2F67C4240F6FBC1724F7CDCBF9467AA48F97C4240776051DE037FDCBF962E6376037D4240B7FEA22A7296DCBFAC109496037D4240DFB5F1202997DCBF47832F68FB7C4240B75E87F1F0A5DCBF53ACDB3FF87C424087999D05AEA7DCBF5F6FCC5AB97C424095A63DF304C4DCBF	12.5	480	Nyeri4	\N
172	Ithenguri	19	1	0103000020E6100000010000000D00000084B28938587B42403B30178D632BDEBF2E15ECDD4D7B42409B20698B3127DEBFDD442FA72B7B4240D62BA716EC17DEBFFD19A6484B7B4240B1FBF4D2A5F9DDBF00A40524527B4240A80A59B915F3DDBF236DAE50557B4240B88BF0CAB6F0DDBF6A53F0756A7B42407F2813979FE8DDBF6287FFD07A7B424066C473CD5FE2DDBF17DCABEA797B4240028E1637D7E9DDBFF47DE372797B4240360CCE3504EBDDBF1243428E677B424044CD47734912DEBFEC02AB7A5A7B42406FBE11671D2BDEBF84B28938587B42403B30178D632BDEBF	6.3	55	Nyeri5	\N
173	Gitathini	19	1	0103000020E610000001000000170000002B5D1C822B77424083AC713AA3F2DBBF7DFBC6BE3B764240998984AD3BDFDBBF8BEF39332E76424058979BF647D7DBBFC01E20662D764240B23C1E8D6DCADBBF550C525B2D764240F979D9804CC9DBBF6262715C2D7642401E874E0DB2C6DBBF6363D75C2D76424028268B6BC7C5DBBF74560A3F2E76424090CBABB954C5DBBF61BABC0665764240B32FE8406FC4DBBF29CC7A600A77424039C26B6B4CCFDBBFF800DF00117742404A7B6F14C3CFDBBFFBF7E8841A774240E0F2AB86E4D0DBBF633519B31D7742404A73B98456D1DBBF09295CB621774240BC42DE57E6D1DBBFBA258C87247742402FFE48EB5CD2DBBFA8944B72277742406F32E67301D3DBBFB77918452A774240D8663FB6A0D3DBBF739FE1B42B7742405F163443FDD3DBBF3A9BFE4F31774240248D806666D5DBBF3BA2AFC43477424081F01989A8D6DBBF16FC4EFE34774240611DC3D349D7DBBFD80122543077424000EDAAB0CAEFDBBF2B5D1C822B77424083AC713AA3F2DBBF	18	485	Nyeri6	\N
175	Chorongi	19	1	0103000020E6100000010000001100000083FFAE9BAC7B4240E58D30E9B8A6DCBF873F096CAB7B4240D362DC7F83A6DCBFBB2B3259A27B4240FB0E62C0309DDCBF8B1DCD5C987B4240DC305604EE92DCBF05C2C4E79B7B4240FAF1328AB28ADCBF4A40A1C69C7B4240E5ED0762158ADCBF1CB01E00BB7B42408B44B8FD5D82DCBF56E51E42BC7B42402E83A6AA6982DCBF2F16F953C37B424029570BE2EA84DCBF84832835CC7B4240F31DD9411088DCBF28585BE0CE7B4240AC3E3FCB1E8ADCBF90F0A12CD47B4240216922732490DCBF65A8995DDD7B4240549A7507979ADCBF1C8EE7ECDC7B42400D4151D02F9BDCBF8FE49326C07B4240375C6C7E0EA2DCBF1D092F5CB67B4240CFD890E264A4DCBF83FFAE9BAC7B4240E58D30E9B8A6DCBF	4.13	147	Nyeri8	\N
176	Kiamwathi	19	1	0103000020E6100000010000001A000000405D19AF967A42402CC628A92DB2DCBFDB927CEF807A4240C05201B6059EDCBF7409FA8F817A42405FED5F559D9BDCBF241FB192827A4240CDC81CBCBB97DCBF5A2601F4837A424069B00CD86E92DCBF332BCA5E917A4240FCBDFBDF9792DCBF2665BFBDCB7A4240E95DCF822994DCBF46B4DB30D87A424043B4F1C1A394DCBF314C2516D97A424005CEF58DAC94DCBF656FE441DA7A424059B9B0A12095DCBFB4DD5DB4DA7A42408C03C0FAC595DCBF6ACD3154DB7A4240F528C144BB96DCBF6F97FCE1DB7A4240E418ED59B397DCBF44937E8BDC7A4240231831DEF198DCBFA4E8B3DEDC7A424009953C239699DCBF56D8137FDD7A4240BE683EF4109BDCBF3F4DF58CDD7A424005F21272379BDCBFFCA5472ADE7A42400DD155BBF29CDCBF8CB0ED54DE7A424055B35DE76A9DDCBFE4C6F2CADE7A42400BEB4328F99EDCBFCC29D3E8DE7A42401547D4DA819FDCBFDC4E380BDF7A4240568E23CE2EA0DCBF26AD0D2FDF7A42409D4B11A103A1DCBF431D4D40DF7A4240B482FF1D97A1DCBFF298E51DDD7A42404E3F511744AADCBF405D19AF967A42402CC628A92DB2DCBF	12.38	231	Nyeri9	\N
177	Kiaruhiu_Kariki	19	1	0103000020E6100000010000001300000092DD8C324796424029A6E69E3948DCBFE9F3E8C2E49542404E901313C31EDCBF740C8D9DE495424075ABC3DBEA1DDCBFEA7B250FF09542400BE6EBDA860DDCBF076830FF49964240AC56A310C10ADCBF99E37F13B39642405D7006034B09DCBF40179494B496424006CB1F2D7309DCBF7590567ECA9642400DE820350615DCBFB6262303CC9642405DC1FB4B5C17DCBF13989AA3CD96424032E96CF2DC19DCBF7008A631CF964240D8B94742411CDCBFBFF3768AD0964240B6007FB0531EDCBF6B1062F7CF96424031AE840ADF1EDCBF999436A1B7964240F1C18506B434DCBF03B7F9294896424056DA87831C48DCBF296DEECF47964240BBD0A42C2748DCBF3D29FE3C479642406E4326923848DCBFCA13BE3947964240A890A9F43848DCBF92DD8C324796424029A6E69E3948DCBF	13.71	306	Nyeri10	\N
180	Ngorano	19	1	0103000020E6100000010000000D00000017B186F7448942409489A3B5E6D7DABF413F784EB6884240EDF916838F92DABFB2B1DE2DB088424021E0B93D088DDABFF3BB7C94AE884240E5213006BA89DABF0065F7D70E894240DB9460763A7DDABF39BB57C57A89424098B2780DF786DABF156CEA6C81894240995FE92D5488DABFC2543F50B78942408A7E88560C99DABFA4BE5FA1BE8942406F3E437F519BDABF79CA48F4BE894240B2B0F8BAF09BDABFA9FECB06AB8942400712D66C0DAEDABF0EF103939F89424042EC1D1776B8DABF17B186F7448942409489A3B5E6D7DABF	28.6	128	Nyeri13	\N
181	Giakaibei	19	1	0103000020E6100000010000000F00000023061B1229944240251F67F83CBDDABFC3F31F691E94424092B62A0373B9DABF0E39BFEF08944240BA0F00E5FFA9DABFA8B24F102A944240861E9AB25188DABF19253CF667944240A404C038EC5CDABF3083F34F9D944240C0017E137564DABFE8216E3AB194424088C822312668DABF31ADA7E6B194424067FA3E82BD68DABFA7656BE2AE9442409072DA673571DABF74BF7A85A994424095762BA04380DABF55200F09A7944240758DAE383E87DABFFD2873FFA59442400B20BCD9278ADABF6884E5658F944240ABE62982F894DABF4BE8783E2A944240A36B869B29BDDABF23061B1229944240251F67F83CBDDABF	16.19	57	Nyeri14	\N
183	Kanjora	19	1	0103000020E610000001000000130000006C6E721DB770424090642752C14FDABFA8CD5FE47C70424018633440BC4EDABFD4833F427C70424091354CDD044ADABFF7407F207A704240FE726CCF0C39DABFD4DB34C877704240F2CFD0D09222DABF2D1DD1ED77704240479733B17C1EDABF38C705507F70424042D97A8F3B1DDABF30DB6E3683704240681C0DD6D51CDABF85ECB437877042404D9E83837F1CDABF48506D3B9F70424099529DBB771BDABF7F58EB9CAA704240E2268606881BDABFC635A9E2AC704240268F6839A91BDABF4D5EDCEDC07042406DF18DEC8524DABF81C8D2D9C1704240FE50C759F724DABF8C40B15EC770424099990BDF174EDABF5283E88FC6704240B20DE14A9A4EDABF44BF68F8BF7042407B0B856C1A4FDABF70F3D55DB77042402049BE97BC4FDABF6C6E721DB770424090642752C14FDABF	9.07	184	Nyeri16	\N
184	Ruruguti	19	1	0103000020E610000001000000170000003A7E0E2F87724240A8E291405734E2BF2CF58DFA1C724240D4AB76B4DB32E2BF55582DB216724240925B6B42B232E2BFD2A3728A0B7242405E6464AB6832E2BF39639AE300724240984842A70332E2BF0203ECBAF67142408D1B2E4FA331E2BF4920C3999D714240B3A1B9FCDB20E2BF57BC832F9D714240110CD2759620E2BF384F3D34A1714240C9FAA4BFB01EE2BF54510758A2714240708BF50E9F1EE2BF3FE70E7C1A7242400E4F9406DB1CE2BF1A61747C1A72424095880C0EDB1CE2BF896DF1E52A724240468EC6851D1EE2BFDA854D88AA7242405C401DEB312AE2BFAB2C5744AB724240FC1D8B48712AE2BF014130E0A87242403912AA37282EE2BFE7AAA611A7724240D28919BCF630E2BFE895A9B1A57242402B45DC821933E2BFAEF7B3AEA4724240E38B19345B33E2BF0EED4634A1724240F5CEEA558133E2BFFC9FD3C39D7242405F34440AA733E2BF197C9D778E72424011135D8D4534E2BF3A7E0E2F87724240A8E291405734E2BF	22.89	535	Nyeri17	\N
185	Ihwagi	19	1	0103000020E6100000010000000D0000002059A3EDDA924240749170F903A6DCBF872A6FD5B492424037D54E796EA0DCBFF8C3ADB5A6924240DC018956E39ADCBF36E74408A692424008DEB27F5E9ADCBF2FED844EA5924240639A8DC0F38BDCBF56A27039D69242404AFD72D7BF74DCBFF3069A71D792424007E645447174DCBF02EE3574F49242407361703C6D77DCBFF1B5DF9DF4924240277C2E878177DCBFB906BCBCF4924240BBD0028F9077DCBF70898172F59242407B450B17E977DCBFDF609C21FF9242403392581FA284DCBF2059A3EDDA924240749170F903A6DCBF	5.62	172	Nyeri18	\N
188	Kiawara	19	1	0103000020E6100000010000000B000000EE98766EA1844240107069725BDBDDBF2C8E9D656D844240B3313A943AA3DDBF10A5ADE8A78442402CCDABAA3489DDBF8C4BD990DD844240928F4B6CBE75DDBF6D76DCAAE98442407986817E2B8ADDBF8D7E08410385424013502A3613B6DDBF47DBE089EE8442409188985BF8BDDDBFD3B3911FE18442408BBCF13E15C3DDBF9AACF8AED38442401D56EE8634C8DDBFE781628FC484424035150F11F8CDDDBFEE98766EA1844240107069725BDBDDBF	6	6011	Nyeri21	\N
46	Umoja	22	1	0103000020E6100000010000000E000000F46705043D8F42408453394227D7F0BF7B979D2A3A8F4240D992DF651CD7F0BF1F9EB540328F424018ED03C9F6D6F0BF9F415BC9D38E42404011FD45F2C8F0BF7AE1D863F88E4240DA1431E6B4C1F0BF69160F87178F424026E2CB8815C9F0BF9D9247892C8F424042EAAE3C53CEF0BFC01796C32D8F4240CAE8F6F7A4CEF0BF24219ED8328F4240687A994CF7CFF0BF40A135FD338F424070F9D5F143D0F0BFB2D592BA358F4240EC1B5E11D8D0F0BF1753216D368F4240CADCE27752D1F0BFEC4E7DDB378F4240FABEB19D4DD2F0BFF46705043D8F42408453394227D7F0BF	4.83	1752	Kiambu1	\N
151	Kasarani A	32	1	0103000020E61000000100000021000000CF196FF41BE741404F1F9EE56133D3BFF01930F655E641408C86BB1F15ECD2BF14C91EA453E6414030BA34AA8FE2D2BF561D8B0350E64140DAB11D6153D1D2BF65DE1E2C4FE64140F1546AF427CCD2BF8C744BA74CE641400CE8193A55BBD2BF2ECD36214CE64140C1044830BFB7D2BF83F25B2F4CE641400763CF7467B6D2BF8E04BB9975E641401675CF55E976D2BF32AE3B1C76E641403AC6850D2B76D2BF9C8B8DB87AE64140677AF2930270D2BFC9E0908886E64140B88C77A6706AD2BF178E3E008DE64140823F1DE08467D2BF616D181A9EE64140B489FBE5EB63D2BF2AE07390A5E641407BF03DB37663D2BFD844EE27AFE64140C6BEB7070863D2BFAB9C5070B6E641408723A0240863D2BF59130038C0E64140C7FE992DB963D2BFDA39E1FAC2E641401DEF65D80A64D2BF9E2B3ED1CAE6414017F2F7FAA065D2BF192E727EDAE64140D687F8FB426BD2BFB82B83E4DBE64140C66562A8EF6BD2BF582C210AE6E6414054E87FCCC472D2BFA1B2F358E7E641402368F018BF73D2BF23E591BF68E7414067426E88ADDBD2BF5D9F04AA6AE74140A519F4EC15DFD2BF85F9E71A6DE74140050B5185FDE3D2BFB8DD5E416EE74140BE14E8B5DAE7D2BFE92B478771E74140E751481D62FDD2BF505865C36FE7414084482AB7A002D3BF479F43CD6CE741409A86EEE5F307D3BF2954B95556E741403DB04109112FD3BFCF196FF41BE741404F1F9EE56133D3BF	109.44	17881	Nakuru1	\N
153	Eastleigh	32	1	0103000020E610000001000000120000008C4A3D2C51E74140C452F3D830FAD3BF00DBD8CA82E64140AA70B450CDBAD3BFAD682BE375E6414059E3729026B1D3BF2B21BFFE73E6414056E0F4A49DAFD3BF18B796956CE6414091B085CB8AA9D3BFD5BCA1C66BE64140BACCE8A7D5A8D3BFE426673079E64140010D49034589D3BFB1EBAE108EE641407EAD3F14FA81D3BFC7E2047F94E641406909D309E87FD3BF9D0DE28365E7414010EFCB049157D3BF3F2B330D67E741405F80FCF50358D3BF73F89EA17EE741406605BE2E2667D3BF203DBAB287E74140AB7B1146566DD3BF761BA56788E74140694676E06EA1D3BF9A2ED81B81E7414072AF497F0DB6D3BF01D6E22164E741408C5F94ADD8F6D3BF29A014735AE7414000584BB2A5F8D3BF8C4A3D2C51E74140C452F3D830FAD3BF	44.76	5798	Nakuru3	\N
155	Keringet	32	1	0103000020E610000001000000210000004BD0539C0ED941402FBC14C5E26EDBBFB669E1DB06D941406D13F42D5B6EDBBF0684EFA8F4D84140C5668CD91C6DDBBF75F0F294EED841400CB69FCFAB6CDBBFD4ED3709EAD841409301CB44576CDBBFE5AF8963E6D84140CE6A6170136CDBBFB0ED06CFE2D84140EF5249DBD06BDBBF9C6D1C67DFD841403ED88D83916BDBBFE2F6BCBDDBD8414021A1766A4D6BDBBF19034044D8D84140B626ECCB0C6BDBBFA125FAB7D4D84140F58705D0CA6ADBBFBAD979F0D0D841400DC39986846ADBBFD5FA2F8DCDD841407CCDE984456ADBBF0522929FC8D8414029EE92DDE969DBBFE9F19085BFD841408266DC354069DBBF3C26D4E6BCD84140327CC7F90C69DBBFA8B841B6B7D84140A0B1EC7DA768DBBF7F560474B2D841407DE992A84068DBBF40D7BD83B1D84140C0C30D4E2E68DBBF89DA82B6AED84140B124CE84F767DBBF83CD6AB9ACD841406CC79FE9D466DBBFBE28ECF98CD8414063855E68874EDBBF043B235388D84140649A95DB794ADBBFDEB6A6B588D841401513D4A5B648DBBFDE41783291D841404E3E0F108727DBBF9DE18EBA92D84140FEAED906F026DBBF692B76AFF2D841405BBA5428C026DBBFBE76849002D941402F6FD232CC26DBBF20AC049030D941408AF85DF9E24DDBBF7AADA05313D941409504FB97226BDBBFFBC14F6312D94140622B573E076CDBBF1BFF0DB40FD94140FA65A5F8926EDBBF4BD0539C0ED941402FBC14C5E26EDBBF	19.42	1502	Nakuru5	\N
156	Kongasis	32	1	0103000020E6100000010000000C000000C3BF0E4B3F13424038ADE01E5DC5E1BFA6A23B9F2F134240E8981CC6FFBFE1BF0168069F2F13424006149BB3FFBFE1BF0C1AD4B437134240F25B081BDEABE1BF44C48E203D1342401E51EB1A6F9EE1BFF588F34850134240EE6700AD299EE1BF52C14F37B813424087DFA83B959DE1BF99844B9AB9134240D89DD9B7D29DE1BF223468AEBC1342404305E3703DA0E1BF6A8244ADD6134240E629EC56A9B4E1BF52D0838FD51342407677510C3DB5E1BFC3BF0E4B3F13424038ADE01E5DC5E1BF	21.6	1440	Nakuru6	\N
157	Crater Lake	32	1	0103000020E6100000010000000C00000021495540A71E4240114FE0A1DF6FE8BF5D1FA98B971E4240937A26A36A6FE8BF4206BF8DFE1D424051BE88CFE66AE8BF80C4ED51FD1D4240B681F1CCAD6AE8BF6EFB8630FE1D4240308AB9E8D768E8BFBE20C962031E4240366DACAF015EE8BF9F6CEAB7071E42409B3ED5B30055E8BF1EDD0446091E42402E9644BCD154E8BF265EACC96A1E42403DE27E123E65E8BF0F5B4EC6A71E42409C561A2D846FE8BF34D25183A71E424007587DE7B16FE8BF21495540A71E4240114FE0A1DF6FE8BF	9.48	848	Nakuru7	\N
225	Hill school	27	1	0103000020E6100000010000000D0000003497B3C0F4A241405E618C738C18DF3F88F34C5EF0A24140F534AD40A119DF3F69C6A7DA6DA241405A484436D139DF3F73EF94136DA24140864BEECE043BDF3F6B89581D92A24140091AA22ECF64DF3F3BF317B094A24140164786436467DF3F7CB235BB99A24140715F4F82736CDF3F5DFB6BAAE0A24140F9DF1D0A8A5ADF3F962AFF7425A341401493C8182B49DF3F98BC60FE1EA3414002EB34CE6D42DF3F6C415B6417A341404B51E9D2803ADF3F349C3C95F7A2414042E2E7905719DF3F3497B3C0F4A241405E618C738C18DF3F	16.19	4000	Uasin Gishu1	\N
227	Kuinet	27	1	0103000020E610000001000000080000009F78EF7297A74140FC78E4D672CEE33F88F2FEFC96A74140B3982B8E97CEE33FAE37C8C3AEA74140E4E07942D1FFE33F3F19D2D0F6A74140D77E135B4B06E43F2BD9612302A84140AEF0A4E339E6E33FD7712D55C9A74140E5113EBBADD1E33F1D91DB36A3A7414003CC91DD35CFE33F9F78EF7297A74140FC78E4D672CEE33F	13.16	700	Uasin Gishu3	\N
44	Swahili Village	35	1	0103000020E6100000010000000F0000000BA5116806A34140D7E1B90D77A4D7BF58E633FA01A341403BCC8DC72BA3D7BFC5F6180DF7A24140F904F78FFA9FD7BF48AE1951D3A24140AD02869AA17FD7BF32327D15D3A2414086BD33536D7ED7BF7E021F89DDA2414045A16E70C774D7BF6732FF34E1A241408BD564CC6571D7BF79906C48F0A241408806CCA28463D7BF783AB43AF7A241405CCEE0941F5DD7BFC3B9EA7800A34140E3CE56501C59D7BFFB24340009A341402381831FD75CD7BF854F092930A34140F755CBFBC980D7BF6B0D152521A34140790C48C5779BD7BF45E94F6515A341408D1F90DB6B9FD7BF0BA5116806A34140D7E1B90D77A4D7BF	7.7	2338	Kericho1	\N
45	Majengo Talai	35	1	0103000020E61000000100000015000000315C4824A7A441405482AAECD81AD7BFBD6309E264A441407445052A760AD7BF8301812C64A441407E5590E1EB09D7BFC93BA6D561A441408934B4B12308D7BF32A49B9D5BA44140B965260C1703D7BF467B411A7BA44140CD0E7B06C3FCD6BF2E872046B9A44140936819CB7EF1D6BFEEA6C2D568A541401DD5E5986CDCD6BF51DFF0A969A54140E518D7C45ADCD6BF9C5E17546CA541406B00CF7321DCD6BF54168AF66DA54140635E0A4BFEDBD6BF7C1CB9E472A5414006FAF23D94DBD6BFCCC73DC077A54140971C50C32BDBD6BFFA619DF57CA5414048742DD835DED6BFD01CA324AAA54140CF12A7C7F5F8D6BF919CE7C3A9A54140C24EA3E1B1F9D6BFEA9063667CA54140246E8CF4FC03D7BF9880A05B75A541405AA90EBE4A05D7BFF6F661506EA54140E8E0F49C9806D7BF1FCA9DA850A541402D9178C0150CD7BF315C4824A7A441405482AAECD81AD7BF	23.12	772	Kericho2	\N
95	Bondeni	42	1	0103000020E610000001000000140000002D3E80AD5899414095DBAEA32DCAC3BF6C0E716D34994140C8716ED03AC6C3BFB0B4E3C2249941407779BDE4A6B1C3BF27911C0820994140177EE26652ABC3BFCE89507D279941406007F930EB99C3BF98CF493859994140C7B713E4EA45C3BF874BA33F6899414008DF8B980B3DC3BF70F5C3F370994140F1FB6E2DBD38C3BFC7FA4A38799941400AB1189C0A3CC3BFE5A1FF0E7E994140BA279EB6D13EC3BFFA6C1728839941408C19E0906C42C3BF47187005879941406A7C30E6D745C3BFCA7A6E458A9941402DB4D8A73349C3BF3947289793994140C8CC89875155C3BFEB4DCD5FA6994140CB4FF6F1F489C3BFDFF88F06AF994140F5E9B67133A2C3BF06D40E1081994140DDE0643379C2C3BF9F00E6F079994140E6798DC07AC4C3BFCD4B944966994140C5D1DE29DAC9C3BF2D3E80AD5899414095DBAEA32DCAC3BF	13.36	1500	Kisumu1	\N
301	Shauri Moyo	42	1	0103000020E61000000100000023000000458A6014049A41403100C9DA3EB9C4BF33826CDB019A4140A9FDE2F095B8C4BFB7753145FA9941406ED26B4D55B6C4BF21CA6ECAE99941400E7BFAC570B1C4BF5E760B6AE1994140D0D6631DF4AEC4BFE759E5D6DB9941402ED3A0664CADC4BF98535A0DBF9941409641D16AC0A4C4BF7068321AB4994140E30C432C80A1C4BFE6E5AE268D994140C7A8BEABEF95C4BF39FDF88F6399414028B31EB49689C4BFBE55AFCC52994140148CA9A29C84C4BF69BBAEB62E994140B41F47E7E579C4BF5BF2E4461C9941409DBCEA9C6C74C4BF7B8C3B4EF4984140BBACB5908E68C4BFA9995C5FE49841402DEFE88ED363C4BF98164757E6984140B08958147D57C4BF3599B525C4994140F0A45AB4F23DC4BF740FBC58CC9941403813CB4A1A3DC4BF0B5CC48BD4994140D79A3EE1413CC4BF7C1A6602DC99414098D6F5E47C3BC4BF4EC1EDECE1994140ED97CF5D623BC4BFA1494E46EB99414022DF37FE523BC4BF1FFE004AF7994140880D0F030D3CC4BF4C2C79ED059A414059505298063EC4BF904111C10F9A4140280F63470940C4BF4E8B86D31D9A41404661E400CA43C4BF5C0F2B80339A4140404CF19BE74BC4BFA7C3E8E1349A414001604D4E994CC4BF23DA53703B9A414062FDCB693D50C4BF6D924613519A41400CC36F306C5CC4BF402D539C4D9A4140393B19A9FE6CC4BF6B9BFFD3399A41401749C7528E84C4BF68DD9CB4319A41409C19D5BE848CC4BF51B58463089A4140F0AB8D7305B5C4BF458A6014049A41403100C9DA3EB9C4BF	37.75	850	Kisumu_5	\N
98	Kaloleni	42	1	0103000020E610000001000000160000001AE238B1546241405711B8C0156DB9BFD2747D9251624140B0EF42D0D66CB9BF6C4B735A306241409E8DCB8C2B60B9BF0BE380081B624140226065ADC131B9BFF87502C7FB6141409763FD8416B2B8BF11F0B7FAFC6141407753CE74CBA9B8BF7E563F610262414047CE74A7BC9FB8BF6B8AB143066241403DCFAFA38098B8BFD579604008624140B81DB34CCD94B8BFE74F31140962414022BB64D84293B8BFBF0D86BB296241403D921F85F778B8BF9F3DD8563C624140F901CF6F6883B8BF36CE48564A624140FDE8C5557A95B8BFE1472ADE4B6241408F29C9BFD899B8BF6E4190574C6241402BCA173A339BB8BF78FF97CE4E6241401BA8B3473CA2B8BFAF88C3614F6241409E2D7256E0A3B8BF7A445B4F57624140E16A2D50DAC1B8BF52A96998716241401ECC02B9A833B9BF968F1ADE7062414099814D31A538B9BFC62FBA7D566241406AC54FB0BC69B9BF1AE238B1546241405711B8C0156DB9BF	7.25	3000	Kisumu4	\N
99	Shauri Moyo	42	1	0103000020E6100000010000000D000000EBE7EA02829A414008C956D5C130C4BFABCFD5F5149A41404045EA48AC25C4BF2CD5A7BAFF99414059F910DEA1D1C3BFBB95C986009A4140A2A17A40EBCFC3BF47D5CA35189A41406A07044031C7C3BFB9A0D55B3C9A41402CBF8449DACAC3BF47D4AE1AA09A41406135CA987AFDC3BFE8653B9E9F9A414013011910E305C4BF1CE89C4E9F9A4140426077E3A90AC4BF6BDA88FF9D9A41408D01DA93C60DC4BF3388C7D59C9A41407669F792E90FC4BF42175C86899A41409916458B7128C4BFEBE7EA02829A414008C956D5C130C4BF	37.75	850	Kisumu5	\N
127	Mjini	37	1	0103000020E6100000010000000E00000090242BEDCD3E41400B3066B6B024D53F03ABCD1EC93E4140EC3BC4F76926D53F95B367B3BC3E414001EC187F562BD53F57B6E943BC3E4140C70AEBFF832BD53FEA655C2B693E41405533A93C9050D53F0B8CA57E703E4140937EF8527A5BD53FE733F0709A3E4140AF07D966085BD53FC187A2839A3E4140D843D4DB055BD53F3529BECD9A3E414054C42F1BFB5AD53F5F7D451CF73E4140D2033C7B3E4CD53F9054C9030A3F4140483CC1D96045D53F4DE53EC10A3F4140F67D7E985243D53FD8F3964EF63E41404601CFBCF932D53F90242BEDCD3E41400B3066B6B024D53F	8.4	1123	Meru2	\N
40	Amalemba	37	1	0103000020E6100000010000000F0000000328529C5E6041402EB0FFCBC61BD13F5CCB525A5D6041403FE17823711CD13FBE970B59586041401D47239F0833D13F942C9980596041407271F0693736D13FE7F23E1A6F60414026D33A52543ED13F44BB139074604140A8D101D33F3ED13F4B33483B896041408AE477A2383DD13FC0916C21D76041406BB6C96F782ED13F5BDF18C7D76041406A63058FA92AD13F1A30188DD76041409F7DFD098026D13F40594489CD60414051809BB7901CD13F771B6A0CCC6041408FBAAA10D11BD13F5E379FDEAD6041400B0A773BCE1BD13F708A1DE5696041404B889CDAC71BD13F0328529C5E6041402EB0FFCBC61BD13F	3.5	2500	Kakamega3	\N
187	Mweiga	19	1	0103000020E6100000010000002A000000EE00A05CD273424039D8B194F6ADD4BF5EFAA053CF7342401E60B17FF5ADD4BF6414A904CA7342406B2DBFF3B1ADD4BFD0ADB4B1B5734240B426B157AFACD4BFF6621404AB734240260D257827ACD4BF79191404AB7342406365217827ACD4BFBEA1E28B2B734240B8AFB2DDA48BD4BF75D45DCA11734240831348F5F182D4BF22670DE80D734240F8726D7A7A81D4BF48240FB71A734240FB460D4AD968D4BF5BB47E731D7342402F379B3CB766D4BF9018C5681E734240E165D808F865D4BFC07B2D85527342406F6C79246245D4BF0A18F1B252734240E56F0AA64C45D4BF1E0971E652734240B5DD50BE3A45D4BF42DF77DD557342409DCEBE414044D4BF96148132567342404EEE54B62E44D4BF5D2C60FBA173424058D2105B443AD4BF64211B51A273424005AA954F4B3AD4BF76C66DCDA3734240639CC9AE753AD4BFF831B018A473424062CEB75E803AD4BFDA91F590A5734240A61639E7C13AD4BFA8213ED1A573424048356936CF3AD4BFAA48DD3FA77342408C5FA7FC273BD4BF95331475A77342409BAAB8CF363BD4BFC20152D4A8734240954AE08DA63BD4BF4A3ABAFEA8734240C04A24D1B53BD4BF3857DC48AA7342404561F9E43B3CD4BF965E0F69AA734240D4251A934A3CD4BF32507398AB7342407A093DFDE53CD4BF0A3A5BAFAB734240F3DB7C25F33CD4BFBFCC8DBEAC734240945E268AA23DD4BFF4945DCDAC734240583C1A56AD3DD4BF3C3732B7AD734240FA6055FF6E3ED4BFC9935CBFAD7342409F28FEB7763ED4BF3445047FAE734240802E6099483FD4BF3B243182AE734240968389AB4C3FD4BFE6805113AF734240371E32672C40D4BFF9FD01ADE473424033CE92F7BAA2D4BF547632CBE17342403D9805ED40A5D4BF8333594ED8734240B8732C9954ADD4BFEE00A05CD273424039D8B194F6ADD4BF	19	2500	Nyeri20	\N
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
1	30
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, name, email, county_id, password, isactive, phone, "resetPasswordToken", "resetPasswordExpires", avatar) FROM stdin;
16	felix.mutua@gmail.com	Felix Mutua	felix.mutua@gmail.com	47	$2a$08$xNDcv6hetCGqf2dIKvO6fOVv/xnNVMsKHMQWpw8F7e3Z4krYuhvoO	t	\N	true	2022-08-29 16:47:06.194+03	https://i.pravatar.cc/150?img=3
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
17	fnmutua@jkuat.ac.ke	Nzive Mutua	fnmutua@jkuat.ac.ke	47	$2a$08$FhhX/X.kC3dsOaUIWl/E0e6hfev0yA5poj/q5MvTWgdidTn9rh8RG	f	\N	true	2022-08-29 16:49:31.414+03	https://i.pravatar.cc/150?img=0
21	felix.mutdua@gmail.com	Felix	felix.mutdua@gmail.com	\N	$2a$08$Jx6P3GpxDMZI0G9.v3jFJ.vkDEruz3yvcsDjTJqRO1OiBJOzD0kNW	f	\N	true	2022-09-20 12:04:20.978+03	\N
30	christinesabwa1@gmail.com	Christine	christinesabwa1@gmail.com	4	$2a$08$xNDcv6hetCGqf2dIKvO6fOVv/xnNVMsKHMQWpw8F7e3Z4krYuhvoO	t	\N	true	2022-10-19 10:47:17.132+03	\N
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

SELECT pg_catalog.setval('public.beneficiary_id_seq', 1, false);


--
-- Name: beneficiary_id_seq1; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.beneficiary_id_seq1', 1, false);


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

SELECT pg_catalog.setval('public.households_id_seq', 2161, true);


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

SELECT pg_catalog.setval('public.parcel_id_seq', 904, true);


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

SELECT pg_catalog.setval('public.settlement_id_seq', 308, true);


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

SELECT pg_catalog.setval('public.settlement_uploads_id_seq', 5, true);


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

SELECT pg_catalog.setval('public.users_id_seq', 30, true);


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
-- Name: beneficiary beneficiary_pkey1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary
    ADD CONSTRAINT beneficiary_pkey1 PRIMARY KEY (id);


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
-- Name: beneficiary_pkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX beneficiary_pkey ON public.beneficiary USING btree (id);


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
-- Name: beneficiary beneficiary_benefit_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary
    ADD CONSTRAINT beneficiary_benefit_type_id_fkey FOREIGN KEY (benefit_type_id) REFERENCES public.benefit_type(id) ON UPDATE CASCADE;


--
-- Name: beneficiary beneficiary_intervention_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary
    ADD CONSTRAINT beneficiary_intervention_id_fkey FOREIGN KEY (intervention_id) REFERENCES public.interventions(id) ON UPDATE CASCADE ON DELETE SET NULL;


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

