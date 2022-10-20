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
    geom public.geometry,
    description character varying
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
1	1	69	69	1	1
2	2	69	69	1	1
3	3	69	69	1	1
4	4	69	69	1	1
5	5	69	69	1	1
6	6	69	69	1	1
7	7	69	69	1	1
8	8	69	69	1	1
9	9	69	69	1	1
10	10	69	69	1	1
11	11	69	69	1	1
12	12	69	69	1	1
13	13	69	69	1	1
14	14	69	69	1	1
15	15	69	69	1	1
16	16	69	69	1	1
17	17	69	69	1	1
18	18	69	69	1	1
19	19	69	69	1	1
20	20	69	69	1	1
21	21	69	69	1	1
22	22	69	69	1	1
23	23	69	69	1	1
24	24	69	69	1	1
25	25	69	69	1	1
26	26	69	69	1	1
27	27	69	69	1	1
28	28	69	69	1	1
29	29	69	69	1	1
30	30	69	69	1	1
31	31	69	69	1	1
32	32	69	69	1	1
33	33	69	69	1	1
34	34	69	69	1	1
35	35	69	69	1	1
36	36	69	69	1	1
37	37	69	69	1	1
38	38	69	69	1	1
39	39	69	69	1	1
40	40	69	69	1	1
41	41	69	69	1	1
42	42	69	69	1	1
43	43	69	69	1	1
44	44	69	69	1	1
45	45	69	69	1	1
46	46	69	69	1	1
47	47	69	69	1	1
48	48	69	69	1	1
49	49	69	69	1	1
50	50	69	69	1	1
51	51	69	69	1	1
52	52	69	69	1	1
53	53	69	69	1	1
54	54	69	69	1	1
55	55	69	69	1	1
56	56	69	69	1	1
57	57	69	69	1	1
58	58	69	69	1	1
59	59	69	69	1	1
60	60	69	69	1	1
61	61	69	69	1	1
62	62	69	69	1	1
63	63	69	69	1	1
64	64	69	69	1	1
65	65	69	69	1	1
66	66	69	69	1	1
67	67	69	69	1	1
68	68	69	69	1	1
69	69	69	69	1	1
70	70	69	69	1	1
71	71	69	69	1	1
72	72	69	69	1	1
73	73	69	69	1	1
74	74	69	69	1	1
75	75	69	69	1	1
76	76	69	69	1	1
77	77	69	69	1	1
78	78	69	69	1	1
79	79	69	69	1	1
80	80	69	69	1	1
81	81	69	69	1	1
82	82	69	69	1	1
83	83	69	69	1	1
84	84	69	69	1	1
85	85	69	69	1	1
86	86	69	69	1	1
87	87	69	69	1	1
88	88	69	69	1	1
89	89	69	69	1	1
90	90	69	69	1	1
91	91	69	69	1	1
92	92	69	69	1	1
93	93	69	69	1	1
94	94	69	69	1	1
95	95	69	69	1	1
96	96	69	69	1	1
97	97	69	69	1	1
98	98	69	69	1	1
99	99	69	69	1	1
100	100	69	69	1	1
101	101	69	69	1	1
102	102	69	69	1	1
103	103	69	69	1	1
104	104	69	69	1	1
105	105	69	69	1	1
106	106	69	69	1	1
107	107	69	69	1	1
108	108	69	69	1	1
109	109	69	69	1	1
110	110	69	69	1	1
111	111	69	69	1	1
112	112	69	69	1	1
113	113	69	69	1	1
114	114	69	69	1	1
115	115	69	69	1	1
116	116	69	69	1	1
117	117	69	69	1	1
118	118	69	69	1	1
119	119	69	69	1	1
120	120	69	69	1	1
121	121	69	69	1	1
122	122	69	69	1	1
123	123	69	69	1	1
124	124	69	69	1	1
125	125	69	69	1	1
126	126	69	69	1	1
127	127	69	69	1	1
128	128	69	69	1	1
129	129	69	69	1	1
130	130	69	69	1	1
131	131	69	69	1	1
132	132	69	69	1	1
133	133	69	69	1	1
134	134	69	69	1	1
135	135	69	69	1	1
136	136	69	69	1	1
137	137	69	69	1	1
138	138	69	69	1	1
139	139	69	69	1	1
140	140	69	69	1	1
141	141	69	69	1	1
142	142	69	69	1	1
143	143	69	69	1	1
144	144	69	69	1	1
145	145	69	69	1	1
146	146	69	69	1	1
147	147	69	69	1	1
148	148	69	69	1	1
149	149	69	69	1	1
150	150	69	69	1	1
151	151	69	69	1	1
152	152	69	69	1	1
153	153	69	69	1	1
154	154	69	69	1	1
155	155	69	69	1	1
156	156	69	69	1	1
157	157	69	69	1	1
158	158	69	69	1	1
159	159	69	69	1	1
160	160	69	69	1	1
161	161	69	69	1	1
162	162	69	69	1	1
163	163	69	69	1	1
164	164	69	69	1	1
165	165	69	69	1	1
166	166	69	69	1	1
167	167	69	69	1	1
168	168	69	69	1	1
169	169	69	69	1	1
170	170	69	69	1	1
171	171	69	69	1	1
172	172	69	69	1	1
173	173	69	69	1	1
174	174	69	69	1	1
175	175	69	69	1	1
176	176	69	69	1	1
177	177	69	69	1	1
178	178	69	69	1	1
179	179	69	69	1	1
180	180	69	69	1	1
181	181	69	69	1	1
182	182	69	69	1	1
183	183	69	69	1	1
184	184	69	69	1	1
185	185	69	69	1	1
186	186	69	69	1	1
187	187	69	69	1	1
188	188	69	69	1	1
189	189	69	69	1	1
190	190	69	69	1	1
191	191	69	69	1	1
192	192	69	69	1	1
193	193	69	69	1	1
194	194	69	69	1	1
195	195	69	69	1	1
196	196	69	69	1	1
197	197	69	69	1	1
198	198	69	69	1	1
199	199	69	69	1	1
200	200	69	69	1	1
201	201	69	69	1	1
202	202	69	69	1	1
203	203	69	69	1	1
204	204	69	69	1	1
205	205	69	69	1	1
206	206	69	69	1	1
207	207	69	69	1	1
208	208	69	69	1	1
209	209	69	69	1	1
210	210	69	69	1	1
211	211	69	69	1	1
212	212	69	69	1	1
213	213	69	69	1	1
214	214	69	69	1	1
215	215	69	69	1	1
216	216	69	69	1	1
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
1	69	Abdi Ali Isaak	Male	4389049	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
2	69	Abdikadir Shiekh Mohamed	Male	5071335	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
3	69	Abdullah Hassan Haji Hussein	Male	5964784	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
4	69	Abraham K. Chesire	Male	4125821	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
5	69	Hassan Adanabdi	Male	10760454	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
6	69	Achilles Kimurgor Ngeny	Male	5932469	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
7	69	Aden Ali Dika	Male	1232826	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
8	69	Agnes Wanini Kaniu	Female	2338898	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
9	69	Alfred Matundura Mochere	Male	25065871	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
10	69	Ali Adan Osman	Male	1232667	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
11	69	Ali Ahmed Warsama	Male	134906	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
12	69	Ali Hassan Isack	Male	27671099	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
13	69	Anastasia Jepngetich Masai	Female	11605041	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
14	69	Anjalina Kanda Rotich	Female	3138704	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
15	69	Anorld Maswai Ngeywo	Male	1156124	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
16	69	Bahati P. Ag. Elijah	Male	BAHATI P. AG. ELIJAH	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
17	69	Bernard Kipkoech Langat	Male	24172010	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
18	69	Berry Auma Yuaya	Female	5981073	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
19	69	Bishar Omar Mohamed	Female	20935326	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
20	69	Boniface Pepela Matofari	Male	10747462	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
21	69	Catherine Ipaliopagala	Female	4384977	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
22	69	Charles Chonjo Makokha	Male	22575998	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
23	69	Charles K. A. Ruto	Male	12553722	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
24	69	Christine Chepketer Barno	Female	8762878	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
25	69	Clement Kharunda Siahi	Male	10659532	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
26	69	Clement Kibirgen Serem	Male	723044	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
27	69	Daniel Kipchirchir Koros	Male	1226151	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
28	69	Daniel Liyula Muliru	Male	DANIEL LIYULA MULIRU	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
29	69	Daniel Ngetich	Male	877620	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
30	69	Daniel Tiliareng’ Kibowen	Male	336891	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
31	69	David Berech Kebenei	Male	6578457	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
32	69	David Karanja	Male	847843	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
33	69	David Kipkoech Cherus	Male	9604644	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
34	69	David Kiplangat Kipsang	Male	1448838	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
35	69	David Kunusia	Male	13613215	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
36	69	Dennis Simeon Odinga	Male	10840510	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
37	69	Dinah Chebet	Female	10937286	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
38	69	Dinah Chemase	Female	20960766	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
39	69	Dominic Andole Mwimani	Male	14552392	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
40	69	Dorcas Akou Munyes	Female	12424194	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
41	69	Dorcas Masese Isrita	Male	300709	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
42	69	Edward K. Chesingil	Male	20043374	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
43	69	Edward Kemboi Chesingil	Male	20043374	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
44	69	Elijah Kipkoech Sugut	Male	20697153	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
45	69	Eliud Kipchumba Keen	Male	27917947	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
46	69	Eliud Kipkoech Lagat	Male	13202352	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
47	69	Elizabeth Chepkemboi	Female	563405	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
48	69	Elizabeth Matsitsa Mwangi	Female	13205654	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
49	69	Elphas Kipkemboi Ngelechei	Male	7444365	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
50	69	Emily Jepkemboi Misoi	Female	3264274	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
51	69	Eric Morara Orina	Male	12898637	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
52	69	Ernest Kibet	Male	1221030	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
53	69	Esther Kalunda	Female	22548355	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
54	69	Esther Ngelel	Female	5602280	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
55	69	Eunice Njambi Gitau	Female	1230027	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
56	69	Eunice Wandia Kavinya	Female	20655808	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
57	69	Eunice Wangoi	Female	8627569	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
58	69	Fatuma Adan Ali	Female	21301442	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
59	69	Francis Anari Nyanumba	Male	1634687	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
60	69	Francis Karanja Kianda	Male	320245	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
61	69	Francis Kibagendi Mogute	Male	2980079	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
62	69	Fred Welch Muleshe	Male	9871955	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
63	69	Getrude Mutoro Wanyonyi	Female	23955645	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
64	69	Gidion A. Maiyo	Male	3265936	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
65	69	Gladys Moraa Nyachieo	Female	12877095	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
66	69	Go For Restoration Of Truth	Male	CHURCH	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
67	69	Goretty Akinyi Ochieng	Female	13206168	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
68	69	Grace Colleta	Female	6086699	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
69	69	Haron Luvisia Makokha	Male	13434856	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
70	69	Hassan Owgiro Wissack	Male	HASSAN OWGIRO WISSACK	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
71	69	Hellen Chepkoech Chepkwony	Female	5452746	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
72	69	Hellen Chepkoechchepkwony	Female	5452746	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
73	69	Hellenathulumutanda	Female	1899914	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
74	69	Hellenzipporah Willey	Female	997310	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
75	69	Henry Kirwa Sambai	Male	1449808	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
76	69	Hilda Ayuma Samwel	Female	726175	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
77	69	Hussein Mohamed Muhamud	Male	23875691	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
78	69	Ibrahim Adanbatelo	Male	3253487	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
79	69	Ibrahim Aden Ali Dika	Male	23510780	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
80	69	Ibrahim Edin Konre	Male	1449338	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
81	69	Ibrahim Hussein Farah	Male	11651948	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
82	69	Ibrahim Ibrenrobow	Male	9567956	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
83	69	Ibrahim Wafula Khatete	Male	2086220	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
84	69	Isaac Adan	Male	838101	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
85	69	Isaac Kiptepis Chemrokok	Male	5791478	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
86	69	Isaac N. Njuguna Kimengi	Male	3463082	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
87	69	Ismael Issak Ibren	Male	12755957	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
88	69	Issack Hussein Abdula	Male	ISSACK HUSSEIN ABDULA	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
89	69	Jacob Kipsang Arap Yego	Male	21341278	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
90	69	James Michori Maina	Male	846866	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
91	69	James Wathika Gituro	Male	1446766	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
92	69	Jane Maru	Female	3444018	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
93	69	Jane Njeri Kaniaru	Female	9252376	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
94	69	Japheth Kittur Chemaiyo	Male	5303326	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
95	69	Jaqueline Mukungu Maina	Female	20939812	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
96	69	Jeniffer Toiyoi Toroitich	Female	3541848	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
97	69	Jepkurgat Birgen	Male	5300202	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
98	69	Joel K. Kotutwo	Male	3322434	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
99	69	Joel Rotich Chirchir	Male	9570345	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
100	69	John Alex Bore	Male	235238	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
101	69	John Kimathi Muriuki	Male	11490396	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
102	69	John Makau Ofisi	Male	977607	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
103	69	John Masisa Olwanyi	Male	1444297	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
104	69	John Ogola Okumu	Male	433424/63	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
105	69	Joseph Chesire Chemuna	Male	4342878	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
106	69	Joseph Kamau Toro	Male	16064310	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
107	69	Joseph Kipchumba Kigen	Male	10704708	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
108	69	Joseph Kiptoo Ruto	Male	8626254	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
109	69	Joseph Ngetich Langat	Male	6424953	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
110	69	Joseph Wafula	Male	12878478	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
111	69	Josephat Kiptarbei Kirwa	Male	253278	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
112	69	Joshua Kipsang Kibiego	Male	4901812	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
113	69	Josiah Nyamohanga Kerario	Male	2827045	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
114	69	Josphine Kerubo	Female	303108	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
115	69	Joyce Jeruto Kipkore	Female	9865394	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
116	69	Judith Nabwile Nyongesa	Female	11328244	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
117	69	Julius Kadima Lanya	Male	6877189	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
118	69	Julius Kiprop Mosbei	Male	23997064	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
119	69	Julius Maina Mathenge	Male	723426	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
120	69	Julius Mwangi Njuguna	Male	726825	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
121	69	Justus Muriuki Marimi	Male	1234420	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
122	69	Kalist Ouma Wasike	Male	1226785	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
123	69	Kennedy Josephat Okonda	Male	10840544	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
124	69	Khadija Adan Abdi	Female	11193974	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
125	69	Kimuikey Jonathan Magut	Male	1811331	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
126	69	Kipkering Arap Keino	Male	1251715	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
127	69	Kipkosgei Murei	Female	1228408	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
128	69	Kiprop Philemon Kandie	Female	10376643	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
129	69	Kiprotich Bitock	Male	1228142	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
130	69	Kipserem Mutai	Male	1451739	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
131	69	Leah Jepkemoi Chumo	Female	1279781	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
132	69	Lucas Barasa	Male	585690	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
133	69	Lucy Wanjiro	Female	6861967/69	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
134	69	Luka Kipkoech Bitok	Male	9991259	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
135	69	Luka Leiyeyo Ole Roimen	Male	10403958	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
136	69	Maimuna Kakenyankinangaei	Female	9252409	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
137	69	Marcella Jebatia Kibet	Female	9839874	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
138	69	Margaret Njeri Gaithuya	Female	5783344	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
139	69	Margaret Wambui	Female	839018	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
140	69	Margaret Wambui Michori	Female	839018	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
141	69	Margaret Wanjiku Nyuri	Female	1934526	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
142	69	Mariam Barkale	Female	24009107	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
143	69	Mary Anyango Mukele	Female	261498	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
144	69	Mary Chepchirchir Choge	Female	839527	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
145	69	Mary Nanjala Kayanda	Female	4144676	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
146	69	Mary Nasmiyu Simiyu	Female	5737822	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
147	69	Mary Wanjiku	Female	1446626	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
148	69	Mathew Kibet Kimurua	Male	287818	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
149	69	Maxwell Misoga	Male	20005587	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
150	69	Milca Ogolla	Male	1232405	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
151	69	Milka Toroitich Lutia	Male	283556	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
152	69	Mohamed Abdi Osman	Male	13004986	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
153	69	Mohamed Ali Ego	Male	16078279	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
154	69	Mohamed Alioido	Male	1450336	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
155	69	Moses Arap Yego	Male	3937265	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
156	69	Moses Kamau Wangari	Male	25282290	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
157	69	Moses Kemboi Kiprono	Male	1785730	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
158	69	Moses Kipsang Murei	Male	448736	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
159	69	Mwangi Njoroge Bahati P. Ag. Elijah	Male	725677	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
160	69	Nahashon Kiptum Samoei	Male	22455986	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
161	69	Nasambu Rose Wilfrida Ogola	Female	258223	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
162	69	Nelly Chepchirchir Kebenei	Female	23666910	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
163	69	Nelson Adeya Kisali	Male	11167521	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
164	69	Oliver James Guto	Male	11792847	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
165	69	Pamellah Toto Papai	Female	4213176	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
166	69	Patrick Wachira Gitura	Male	12473272	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
167	69	Paul Kipyego Kosgei	Male	1230441	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
168	69	Paul Kivisi Musanga	Male	1170732	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
169	69	Paul Kosgei Kutto	Male	6846836	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
170	69	Paul Ronoh Kurgat	Male	8333364	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
171	69	Peter Kirwa Kebenei	Male	1108234	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
172	69	Peter Wabwire Okuku	Male	10121546	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
173	69	Philip K. Kosgey	Male	21617017	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
174	69	Philip Kipkemei Murei	Male	1233584	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
175	69	Philip Kipketer Kosgei	Male	21617017	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
176	69	Philip Mulogosi	Male	7968673	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
177	69	Pius Wamalwa Munialo	Male	976253	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
178	69	Rachel Muthoni Gacheru	Female	12948021	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
179	69	Regina Jerotich Kemboi	Female	12878784	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
180	69	Robert Tinega Zakayo	Male	407460	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
181	69	Ronald Kipkech Kipterei	Male	13069317	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
182	69	Sadia Hussein Ali	Male	1182928	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
183	69	Saine Kimeli John	Male	10761914	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
184	69	Salima Mohamed Hassan	Female	25953310	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
185	69	Sammy Mirikau Mukolwe	Male	1228691	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
186	69	Sammy Ndiema Kalinjonya	Male	27815172	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
187	69	Samson Kipkosgei Tuwei	Male	3295383	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
188	69	Samuel Kiplel Kirwa	Male	11121582	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
189	69	Samwelwaruguwanyoike	Male	10183470	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
190	69	Sarah Cherono Cheruiyot	Female	1237386	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
191	69	Sarah Imbogo	Female	9169424	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
192	69	Sarah Jeruto Sammy	Female	6860030	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
193	69	Sefania Salambo	Female	8715817	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
194	69	Shadrack Kingetich	Male	20337474	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
195	69	Shaphan Lunani Makunda	Male	8837489	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
196	69	Simeon Agwata Nyamagwa	Male	304333	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
197	69	Simon Kipkemboi	Male	4638347	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
198	69	Simon Kitum Chemweno	Male	1225750	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
199	69	Sofia Anyango Ogutu	Female	14453703	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
200	69	Solomon Ihachi Chibelenje	Male	57670882	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
201	69	Stephen Angwenyi Nyamweya	Male	10013600	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
202	69	Stephen Koech	Male	13206399	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
203	69	Susan Arua Chuma	Female	12642986	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
204	69	Susana Jelamai Mutai	Female	8327224	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
205	69	Teresa Chemenjo Lelei	Female	3999338	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
206	69	William Kiprop Ronoh	Male	11604311	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
207	69	William Ndinya Omollo	Male	1097291	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
208	69	William Omweri	Male	6117612	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
209	69	William Wanjohi Mureithi	Male	7456816	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
210	69	Willymina Ngaira Magotsi	Female	5632689	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
211	69	Wilson K C Chelimo	Male	6597192	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
212	69	Wilson K. Rono	Male	12464743	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
213	69	Wilson Kimosibei Ngisirei	Male	6857261	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
214	69	Wilson Kiptanui Ronoh	Male	12464743	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
215	69	Yegon Dominic Kipngetich	Male	22415513	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
216	69	Zacchaus Omai Juma	Male	22767364	NA	NULL	NULL	NULL	NULL	NULL	\\x4e554c4c	0	0	0	0	0	0	0	0	0	0	0	0	0	NULL	NULL	NULL	NULL	NULL	NULL
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

COPY public.settlement (id, name, county_id, settlement_type, area, population, code, geom, description) FROM stdin;
2	Kahawa Soweto	47	1	8.99	4045	Nairobi_2	\N	\N
3	Kambi Moto	47	1	0.43	698	Nairobi_3	\N	\N
4	Mathare fire victims	47	1	0.78	1950	Nairobi_4	\N	\N
5	Ex-Grogon	47	1	0.41	430	Nairobi_5	\N	\N
6	Mji wa Huruma	47	1	2.78	1500	Nairobi_6	\N	\N
7	Redeemed	47	1	0.47	907	Nairobi_7	\N	\N
13	Chaani	1	1	10.82	3729	Mombasa_6	\N	\N
14	Likoni 203	1	1	27.55	7058	Mombasa_7	\N	\N
15	Kibikoni M17E	3	1	22.26	1364	Kilifi_1	\N	\N
16	Muyeye I	3	1	26	5000	Kilifi_2	\N	\N
17	Kwa Ndomo	3	1	2.5	1500	Kilifi_3	\N	\N
19	Jiwe Leupe	3	1	12.6	1089	Kilifi_5	\N	\N
20	Makaburini	3	1	6.68	4508	Kilifi_6	\N	\N
21	Njoro ya Chini	3	1	7.8	1800	Kilifi_7	\N	\N
22	Shingila	3	1	7	545	Kilifi_8	\N	\N
23	Jacaba	3	1	11.51	3640	Kilifi_9	\N	\N
24	Njoro Takatifu	3	1	25.24	1350	Kilifi_10	\N	\N
25	Dingwini	3	1	3.34	518	Kilifi_11	\N	\N
26	Tabora	3	1	5.88	2408	Kilifi_12	\N	\N
27	Muyeye II	3	1	106.54	14250	Kilifi_13	\N	\N
29	Namu Phase 2	7	1	158.5	4928	Garissa_2	\N	\N
31	Bulla Riig Phase 2	7	1	351.42	13343	Garissa_4	\N	\N
33	Iskadek Phase 2	7	1	203.41	4432	Garissa_6	\N	\N
35	Makhanu Phase 2	7	1	267.73	7648	Garissa_8	\N	\N
37	County Phase 2	7	1	56.31	2517	Garissa_10	\N	\N
39	Kathita	14	1	5	1000	Embu_1	\N	\N
40	Kimangaru	14	1	16.97	398	Embu_2	\N	\N
41	Gatitu	19	1	19.9	1015	Nyeri_1	\N	\N
42	Kihatha	19	1	21.3	250	Nyeri_2	\N	\N
43	Kihuyo	19	1	12.8	220	Nyeri_3	\N	\N
44	Riamukurwe	19	1	12.5	480	Nyeri_4	\N	\N
45	Ithenguri	19	1	6.3	55	Nyeri_5	\N	\N
51	Gikomo/Kiawara	19	1	21.89	911	Nyeri_11	\N	\N
59	Muruguru	19	1	18.2	60	Nyeri_19	\N	\N
60	Umoja	22	1	4.83	1752	Kiambu_1	\N	\N
66	Kong’asis	32	1	21.6	1440	Nakuru_6	\N	\N
67	Crater Lake	32	1	9.48	848	Nakuru_7	\N	\N
68	Hill school	27	1	16.19	4000	Uasin Gishu_1	\N	\N
81	Amalemba	37	1	3.5	2500	Kakamega_3	\N	\N
83	A thousand street	43	1	4.03	2727	Homa Bay_43	\N	\N
84	Aramaget	24	1	10.5	626	West Pokot_24	\N	\N
85	Aseko/Mlekenyi	6	1	15.18	3070	Taita Taveta_6	\N	\N
86	Awelo	41	1	30	1179	Siaya_41	\N	\N
87	Bandani	42	1	15	9534	Kisumu_42	\N	\N
88	Barwaqo	8	1	29	2242	Wajir_8	\N	\N
89	Bayamangozi	3	1	25.5	0	Kilifi_3	\N	\N
90	Bondeni	30	1	50	500	Baringo_30	\N	\N
91	Bondeni 	32	1	2	0	Nakuru_32	\N	\N
92	Bora Imani	4	1	12	2124	Tana River_4	\N	\N
93	Bura	4	1	27	1726	Tana River_4	\N	\N
94	Canaani	16	1	29	3243	Machakos_16	\N	\N
95	Carlifornia-Lodwar Municipality	23	1	8.2	1769	Turkana_23	\N	\N
96	Chebiemit	28	1	10	323	Elgeyo-Marakwet_28	\N	\N
97	Chelanga	1	1	2.124	3804	Mombasa_1	\N	\N
98	Cheptongei	28	1	11.5	874	Elgeyo-Marakwet_28	\N	\N
99	Chewani	4	1	7	1296	Tana River_4	\N	\N
100	Dagorretti-Ruthimitu	22	1	1.2	361	Kiambu_22	\N	\N
101	Diani Complex	2	1	2.01	2201	Kwale _2	\N	\N
102	Embakasi KCC	47	1	13.2	9616	Nairobi_47	\N	\N
79	Kambi Somali	37	1	3.4	395	Kakamega_1	0103000020E6100000010000000B00000061F38293855F414045CB9EEFA60CD23F6FC2E777845F4140258DAEE2E70CD23FCA9B79DE715F41405ABF0B14F120D23F3D138334725F4140E2E02BEC8521D23FAB729B728F5F414054F07C3FEE28D23F157C816B915F4140A2D327086E29D23F8D0E28859F5F41402D350270CD2AD23F9DA320ECA95F41407EDDDE051E2BD23F897030CDB75F414071CEDCE8D321D23FCFB99E62B95F41401A2B9498BB15D23F61F38293855F414045CB9EEFA60CD23F	\N
62	Kasarani B	32	1	109.44	17881	Nakuru_2	0103000020E61000000100000008000000F338BF1F55E64140C35117DCDD14D3BFE54DD1147EE54140F0A662B18F03D3BF5B34A845A7E54140D9EE1AEBB5A5D2BF87196F8749E64140BD14EB1B58B4D2BF14C3583053E6414088C89107CBEDD2BFB67154BD56E641402CA4C3551A14D3BF3DFE83A356E641407C46A2ED4114D3BFF338BF1F55E64140C35117DCDD14D3BF	\N
8	Kindunguni	1	1	24	2390	Mombasa_1	0103000020E610000001000000120000002051170D9DD24340482E7C3C676410C0BE6FA7837DD243407DCB0322086410C073832C92FED14340A38D42E9F86110C066ACE13EFED1434054C29E8CF26110C0F187C3B418D2434005988F84645F10C066984CD91AD2434092523D24385F10C0E8EB981E78D243403E734B44DB5D10C01DE704827BD24340BC8E0ABDE35D10C0C3AA198C7FD24340C9CD0868EF5D10C0E6CB4DFED4D24340AA193752936110C0612A6017D5D2434096F3B96C966110C06E1A0EEAC1D24340B1B830668F6210C038E8AF18C1D24340AC77F7FE996210C05B1F0E05B6D243409B830984296310C0795373BBB3D2434064F39527476310C030484086B2D24340FA37CBCD566310C0B40D07AA9DD24340D57503E9646410C02051170D9DD24340482E7C3C676410C0	\N
34	Makhanu Phase 1	7	1	267.73	7648	Garissa_7	0103000020E610000001000000110000000CB9F061DAD4434033205F34649CDCBF94D44485CBD44340C2A0B6E1B89BDCBF2EDCA29CC8D443407B132B8B8B9ADCBFB95AB66E70D44340AC839BA55158DCBF78329E4E69D443403F9D5706CD52DCBF2453B2623BD44340DF6340F47B2DDCBF0622D3973BD44340F4425952092CDCBF57411D4A97D54340E63847720467DBBFF7E07C0F44D64340F095C8BCEB6ADBBF498D54996AD643401647ADBF4082DBBFB8DEFC2870D64340EA2B734DA186DBBF2BDFCC4478D64340865EE72D038DDBBFC9793B18A2D643409714B76C84C1DBBF888B9652A7D64340C75CBDFD84D9DBBFA0DA5DAA4FD643406C95DD758D65DCBF089685A1A5D54340D07CFE0A6980DCBF0CB9F061DAD4434033205F34649CDCBF	\N
82	Mweiga	19	1	19	2500	Nyeri_20	0103000020E61000000100000010000000A99AC7ECD2734240A48A036C41AED4BF7436D6A9CF73424070FB4A4240AED4BFD496ABA6AB7342404125EA0676ACD4BF66B80CB72C734240E4911D0EA88BD4BF19ABAE33127342402DFEC1257F82D4BFC36E5E510E7342405DFDF9AA0781D4BF2B895F201B734240F4ABD17B6668D4BFC64E15D21E7342408BB6C8398565D4BF46A9B03B8773424026193489F450D4BFDCE7D537AA734240222FC0BD9B4AD4BF8D53A536B4734240ABA41188CB48D4BFA15E9B86E5734240F91AFE9747A2D4BF9B1485DBDC734240D64149BE66A9D4BFF7B2C1DDD7734240C9F8F08580ADD4BF9C37EF58D57342409CC54168FFADD4BFA99AC7ECD2734240A48A036C41AED4BF	\N
55	Njoguini	19	1	11.48	90	Nyeri_15	0103000020E610000001000000090000005C006F0FAE6E42402AC2A9AD9DDFD9BF13716106796E4240A62619CA0ACAD9BF6EFCAF68936E4240726A4042DAB3D9BF7E1199E0706F4240E51DFA7CCCC3D9BFE559D27D6D6F42401812CB2042CFD9BF6F5C94EC6C6F4240BCA517690AD1D9BFE4DBB1E46C6F424013DA27FB21D1D9BF4894F7DC686F4240208E91BD2DDDD9BF5C006F0FAE6E42402AC2A9AD9DDFD9BF	\N
71	Swahili Village	35	1	7.7	2338	Kericho_1	0103000020E6100000010000000B000000C19C670D06A34140A1C021CE3D9DD7BF9646C301C7A241404CB887C37E78D7BF783AB43AF7A2414063CEE0941F5DD7BFC3B9EA7800A34140DFCE56501C59D7BFFB24340009A341401F81831FD75CD7BF854F092930A34140F455CBFBC980D7BFA02FCF9129A34140CE651F5DBC88D7BFDB7CB8EA25A341405BA75DD3978BD7BFA0347CF51AA34140BA03772F2A94D7BF8E4DF39D17A3414038BF06A19D95D7BFC19C670D06A34140A1C021CE3D9DD7BF	\N
47	Gitero	19	1	6.56	216	Nyeri_7	0103000020E61000000100000005000000825ABFBDCB774240603D318483D8DCBF0A39DC84C6774240E5721F52FEBADCBFF2E4551C387842403F7AE85932C0DCBF950C747E39784240D6F85A509ED6DCBF825ABFBDCB774240603D318483D8DCBF	\N
103	Embakasi Village	47	1	2.28	1613	Nairobi_47	\N	\N
104	Faza village	5	1	20	2849	Lamu_5	\N	\N
105	Gathambi	20	1	5.91	245	Kirinyaga_20	\N	\N
106	Gatugura (Gatundura)	20	1	7.85	333	Kirinyaga_20	\N	\N
107	Getuya	20	1	2.25	231	Kirinyaga_20	\N	\N
108	Gichagi	34	1	4.05	4541	Kajiado_34	\N	\N
109	Githogondo	20	1	7.61	1047	Kirinyaga_20	\N	\N
110	Halane	8	1	30	5509	Wajir_8	\N	\N
111	Hodhan	8	1	24	867	Wajir_8	\N	\N
112	Hodi Hodi	1	1	8.548	500	Mombasa_1	\N	\N
113	Hola Mission	4	1	11	1511	Tana River_4	\N	\N
114	Huruma - Ol Kalou	18	1	30	923	Nyandarua_18	\N	\N
115	Ithareini	20	1	9.22	538	Kirinyaga_20	\N	\N
116	Jam City	16	1	6	1124	Machakos_16	\N	\N
117	Jiw Dendi 	44	1	36.54	0	Migori_44	\N	\N
118	Jogoo	8	1	27	3776	Wajir_8	\N	\N
119	Jua kali	37	1	2.7	0	Kakamega_37	\N	\N
120	Jua Kali	4	1	6	1763	Tana River_4	\N	\N
121	Kabati 	32	1	2	0	Nakuru_32	\N	\N
122	Kabichbich	24	1	7.53	375	West Pokot_24	\N	\N
123	Kagumo	20	1	8.82	1245	Kirinyaga_20	\N	\N
124	Kaitheri	20	1	2.42	396	Kirinyaga_20	\N	\N
125	Kajuka-Lodwar Municipality	23	1	3.5	316	Turkana_23	\N	\N
126	Kalolo	3	1	22	7105	Kilifi_3	\N	\N
127	Kalundu Misuuni	15	1	4.42	1624	Kitui_15	\N	\N
128	Kalundu slaughter	15	1	12.02	1800	Kitui_15	\N	\N
129	Kambi Mawe - Lodwar Municipality	23	1	6.3	638	Turkana_23	\N	\N
130	Kampi Wakulima	30	1	76.4	1500	Baringo_30	\N	\N
131	Kamuiru	20	1	7.9	604	Kirinyaga_20	\N	\N
132	Kamuthanga	20	1	2.8	979	Kirinyaga_20	\N	\N
133	Kanjeru	22	1	1.6	562	Kiambu_22	\N	\N
134	Kapcherop	28	1	9.6	549	Elgeyo-Marakwet_28	\N	\N
135	Kapsowar 	28	1	8.8	935	Elgeyo-Marakwet_28	\N	\N
136	Karagita	32	1	30	20255	Nakuru_32	\N	\N
137	Kathwana	13	1	8	265	Tharaka-Nithi_13	\N	\N
138	Katorongoto	30	1	36	1700	Baringo_30	\N	\N
139	Kayole Soweto	47	1	30	68805	Nairobi_47	\N	\N
140	Keroka Block -B	46	1	6.2	678	Nyamira_46	\N	\N
141	Kiamburi	22	1	2.57	1023	Kiambu_22	\N	\N
142	Kiandutu	22	1	40	20000	Kiambu_22	\N	\N
143	Kiangoma	20	1	7.77	561	Kirinyaga_20	\N	\N
144	Kiangombe	22	1	3.5	1000	Kiambu _22	\N	\N
145	Kiangombe	20	1	7.73	223	Kirinyaga_20	\N	\N
146	Kianjiru	20	1	2.78	359	Kirinyaga_20	\N	\N
147	Kiarukungu	20	1	2.47	926	Kirinyaga_20	\N	\N
148	Kiawara	19	1	6	6011	Nyeri_19	\N	\N
149	Kibaoni	3	1	8.6	0	Kilifi_3	\N	\N
150	Kibirigwi	20	1	8.25	630	Kirinyaga_20	\N	\N
151	Kibokoni M17E	3	1	22.3	1077	Kilifi_3	\N	\N
152	Kibuye	42	1	15	606	Kisumu_42	\N	\N
153	Kibuyu	4	1	13	1799	Tana River_4	\N	\N
154	Kijiji Cha Chewa	6	1	3	2196	Taita Taveta_6	\N	\N
155	Kijijini(kendu Bay Old town)	43	1	3.93	3604	Homa Bay_43	\N	\N
156	Kilimanjaro	1	1	1.6	100	Mombasa_1	\N	\N
157	Kimunye	20	1	7.69	994	Kirinyaga_20	\N	\N
158	Kipkaren  Site & Service	27	1	28.2	17676	Uasin Gishu_27	\N	\N
159	Kipsongo A	26	1	27	2098	Trans Nzoia_26	\N	\N
160	Kisumu Ndogo	3	1	22.6	3153	Kilifi_3	\N	\N
161	Kiunga old town	5	1	25	1468	Lamu_5	\N	\N
162	Kwa Mangeli	16	1	3	2813	Machakos_16	\N	\N
163	Kwa Murogi 	32	1	65.78	46004	Nakuru_32	\N	\N
164	Kwa Nzomo	16	1	3	1042	Machakos_16	\N	\N
165	Lake View	32	1	26.84	16016	Nakuru_32	\N	\N
166	Landi Matope	39	1	5	761	Bungoma_39	\N	\N
167	Landi Matope (muslim school-Webuye DEB-Rail)	39	1	5	761	Bungoma_39	\N	\N
168	Lokichoggio Informal Settlement-Lokichoggio Town	23	1	9.48	1058	Turkana_23	\N	\N
169	Lokori Settlement-Lokori Town	23	1	2.03	1781	Turkana_23	\N	\N
170	London 	32	1	43.3	16083	Nakuru_32	\N	\N
171	Lowarengak Informal Settlement-Lowarengak Centre	23	1	14.88	2355	Turkana_23	\N	\N
172	Lukoye	37	1	10	1133	Kakamega_37	\N	\N
173	M27	3	1	10.7	527	Kilifi_3	\N	\N
174	Maganda	1	1	97	5000	Mombasa_1	\N	\N
175	Maisha Matamu	39	1	1	243	Bungoma_39	\N	\N
176	Majengo	34	1	20	1200	Kajiado_34	\N	\N
177	Majengo	12	1	5	2410	Meru_12	\N	\N
178	Majengo Mapya	6	1	23	1267	Taita Taveta_6	\N	\N
179	Makaburini	4	1	11	2584	Tana River_4	\N	\N
180	Makongeni	43	1	4.134	3970	Homa Bay_43	\N	\N
181	Malindi ya Ngwena	4	1	10	1241	Tana River_4	\N	\N
182	Manyatta A (Kona Mbaya and Migosi)	42	1	24	22474	Kisumu_42	\N	\N
183	Manyatta B 	42	1	25	45150	Kisumu_42	\N	\N
184	Marimanti	13	1	30	1532	Tharaka-Nithi_13	\N	\N
185	Masogo kayoya	43	1	2.716	1201	Homa Bay_43	\N	\N
186	Matharau	22	1	6.22	976	Kiambu_22	\N	\N
187	Matisi	26	1	28	9882	Trans Nzoia_26	\N	\N
188	Matondoni	5	1	12	2974	Lamu_5	\N	\N
189	Mazeras Centre Miwani/Mgumo wa Pasta	3	1	25	3747	Kilifi_3	\N	\N
190	Misongeni	17	1	16.2	1443	Makueni_17	\N	\N
191	Misri	22	1	9.47	2500	Kiambu _22	\N	\N
192	Mitume (Mau Mau)	26	1	20	22888	Trans Nzoia_26	\N	\N
193	Mjini	39	1	7.52	6597	Bungoma_39	\N	\N
194	Mjini	17	1	10.13	3103	Makueni_17	\N	\N
195	Mjini	12	1	4.63	708	Meru_12	\N	\N
196	Mokowe old town	5	1	20	3166	Lamu_5	\N	\N
197	Mororo	4	1	26	6642	Tana River_4	\N	\N
198	Mosoriot	29	1	26.53	785	Nandi_29	\N	\N
199	Mtaani	3	1	28.4	3897	Kilifi_3	\N	\N
200	Muhoroni (Sangoro  Swahili  Shauri Yako  Shauri Moyo & Bondeni)	42	1	20	3320	Kisumu_42	\N	\N
201	Mukinduri	20	1	15	472	Kirinyaga_20	\N	\N
202	Muslim village	13	1	10	329	Tharaka-Nithi_13	\N	\N
203	Mwangaza	4	1	28	4303	Tana River_4	\N	\N
204	Mwanzo Site & Service	27	1	5.8	22112	Uasin Gishu_27	\N	\N
205	Nabute - Lodwar Municipality	23	1	2.6	326	Turkana_23	\N	\N
206	Nangeni	39	1	6	464	Bungoma_39	\N	\N
207	Ndhiwa settlement	43	1	33.8	17885	Homa Bay_43	\N	\N
208	Ndindiruku	20	1	4.23	2317	Kirinyaga_20	\N	\N
209	Nginoka Kim-Lokichar Town	23	1	7	1006	Turkana_23	\N	\N
210	Nubian	30	1	53	2800	Baringo_30	\N	\N
211	Nyamurutu	32	1	100	0	Nakuru_32	\N	\N
212	Nyandiwa	43	1	8.04	4432	Homa Bay_43	\N	\N
213	Nyawita	42	1	13	11564	Kisumu_42	\N	\N
214	Public Works- Lodwar Municipality	23	1	2.4	735	Turkana_23	\N	\N
215	Rusinga Old Town	43	1	1.825	2725	Homa Bay_43	\N	\N
216	Rwambiti	20	1	6.982	1011	Kirinyaga_20	\N	\N
217	Salama	12	1	3	945	Meru_12	\N	\N
218	Shallattey	8	1	23	702	Wajir_8	\N	\N
219	Shanti 	26	1	18	1794	Trans Nzoia_26	\N	\N
220	Shauri (Timboroa Centre)	30	1	44.9	0	Baringo_30	\N	\N
221	Shauri Yako	43	1	7.613	9147	Homa Bay_43	\N	\N
222	Shauri yako	20	1	0.2	292	Kirinyaga_20	\N	\N
223	Shibale	37	1	10	1256	Kakamega_37	\N	\N
224	Shimo la Tewa	26	1	4	549	Trans Nzoia_26	\N	\N
225	Slota	16	1	8	5180	Machakos_16	\N	\N
226	Sofia	43	1	4.3	7793	Homa Bay_43	\N	\N
227	Soko mjinga	17	1	6	727	Makueni_17	\N	\N
228	Soweto-Lodwar Municipality	23	1	12.8	2804	Turkana_23	\N	\N
229	Thiguku	20	1	7.85	743	Kirinyaga_20	\N	\N
230	Tiwi Block 12	2	1	65	2500	Kwale _2	\N	\N
231	Town Chini-Lokichar Town	23	1	13.3	848	Turkana_23	\N	\N
232	Tuwani	26	1	22	16043	Trans Nzoia_26	\N	\N
233	Upper Kariokor	6	1	3	6203	Taita Taveta_6	\N	\N
234	Wachakone	4	1	8	963	Tana River_4	\N	\N
235	Wagberi	8	1	26.5	3823	Wajir_8	\N	\N
236	Witu old town	5	1	15	3698	Lamu_5	\N	\N
237	Wiyoni Village	5	1	20	12099	Lamu_5	\N	\N
36	County Phase 1	7	1	56.31	2517	Garissa_9	0103000020E6100000010000001400000045F97E2557D343405FAA55853414DEBFB0982A4F4DD34340B9857C149B0FDEBF8EEC26EB46D34340C980B25EFB01DEBFC1D3A3813BD34340BAC9EB999DE9DDBF30F951803BD3434088146DC09AE9DDBF3BC668BF1DD343400E9AE7D3BCA8DDBF28B9EDE61ED34340C9759FC8BDA7DDBFAFCE27031FD343403CF6EF6DA5A7DDBFE2F32E5FBDD3434019DF25687C9BDDBF64D06FF1BFD3434008EAAAF3FE9BDDBFB1549F9CF5D34340533190F8C1ACDDBF9C188FD8F9D34340E7BA06E75CAEDDBFD4FF3E65FBD343407308DFE2FEAEDDBFC6951D923AD44340FC1F524F19DCDDBFE10FF7CE3CD4434051DD6EFB16DEDDBF8D72AE903FD443401F7F49ACD3E2DDBFDE6F5AEA40D44340D4B134B225E5DDBF2BBEFC264AD4434095CF122CB3FBDDBF70A3F5CC48D4434075861E99AFFCDDBF45F97E2557D343405FAA55853414DEBF	\N
63	Eastleigh	32	1	44.76	5798	Nakuru_3	0103000020E61000000100000011000000A13D5EF942E741400182E844ECF3D3BFC57722439BE64140BEF3959161B9D3BFE426673079E64140CF0B49034589D3BF374793777FE641408411B8232087D3BFE10150B285E6414017AC93310585D3BFDA67139C94E64140FAF1E994FE7FD3BF094EA8A665E741404B3AA8C46757D3BF442CB1D080E74140B8AAB902F968D3BF7E4FD37E87E74140E98EF102696DD3BFF4E8D61988E74140D996B05E60A1D3BF16E5DF9481E741403D437376DBB4D3BFAC1854DC7DE741403592D6D95CB9D3BF6CAD5F3476E74140DA0EF603A2C2D3BFE2004C6675E74140F7502D8E79C3D3BF9290253252E741409DF65CABFEE5D3BFBA518AF647E741406E68229205F0D3BFA13D5EF942E741400182E844ECF3D3BF	\N
46	Gitathini	19	1	18	485	Nyeri_6	0103000020E6100000010000001600000087944E0328774240CAA6E06D8CF6DBBF5667D0502D7642400B5618453FE1DBBF4BC9950B2C7642401EC9FC1F03CADBBFED1874002C764240E83D9323D9C8DBBF58E48A022C764240203439CB00C4DBBF085B70F1837642405850BAF76AC1DBBF1F9760EB85764240F6B50C0E6AC1DBBFC3537D518C764240771BD57AD0C1DBBF78E3B7DF91764240D1BAB26829C2DBBF346736BD117742405E6C1E0270CEDBBFF1D7915E1B774240E6FE8CEF94CFDBBFD3137AAD247742405DC2C28FE2D0DBBF19F8096E2B7742402A9BBE6C5FD2DBBF9BAB32A4327742409F69AEFF2FD4DBBF90AD864A39774240D93352D89BD6DBBF3EE048943C7742409FDD127B01D8DBBF817D5AEE3D77424027A2710CABD8DBBF0F0EF50A40774240120E065DDCD9DBBF40BCD4E2477742404CAA5B34ACDEDBBFC7D727194C774240C763FE666BE1DBBFE13491E73D774240B647FEC5C0E9DBBF87944E0328774240CAA6E06D8CF6DBBF	\N
58	Ihwagi	19	1	5.62	172	Nyeri_18	0103000020E6100000010000000A000000FF0D2BF3D99242406DB69EEE1FA6DCBFD7D8297DC892424000E5B9943DA4DCBF6C0CF8E7B09242404BC8804C10A1DCBF517363C0A29242404A0BA87F9C9BDCBFAF2BC217A2924240A4252FE9B68BDCBF31A88E7BA2924240CB041226128BDCBF5CFCDCD0D4924240FE9EB45FFE72DCBF540E4ACEF5924240F9BFD77C4F76DCBF1D07C9F3FD924240850F77E17C84DCBFFF0D2BF3D99242406DB69EEE1FA6DCBF	\N
32	Iskadek Phase 1	7	1	203.41	4432	Garissa_5	0103000020E6100000010000001D0000004B69EAD9A1D44340D5D24342B53DDEBF579D58DF50D4434088B53CAFFA0CDEBF86A6225CD2D34340C09BE83E29A2DDBFF5D54ADBD7D34340C6A051AF6093DDBF876B7BDBD7D34340CD8B12316093DDBFE974EDB3D8D34340A1BA4F523691DDBFE1322E3FDAD34340AA4DF7D34D8EDDBFEA45849475D4434044B1653F4EBDDCBF74CCF5AA77D443400325AA79BCBADCBF0DD5F37979D44340CE3EC2D8C5B8DCBFA324FF8579D443405E6EA5E8B9B8DCBF2DD37A8B7CD44340D35C6ED071B6DCBFDCB9824682D443409566FB2B93B2DCBF427D07EB98D443400F4E5FC2A0A6DCBF7608D1859DD44340B03E41B845A4DCBF7E9C56C39FD443401ACF19D058A3DCBF0DCEA718A0D4434084F67A5B4DA3DCBFCEC022ABA6D44340F11E150A7CA2DCBFF19EEF3EB5D4434000CBA5B8B2A0DCBFAFBA22E9BDD44340AD9D3AC502A0DCBF5655107CBED443400B0B5B1EF79FDCBFB87AD0A6CBD4434024A5C427309FDCBF7E38CAC703D543401A83EAC7E4CCDCBF5B9064BD04D543402CC9F66AF1CDDCBF05860375D4D54340219C398EBDB5DDBF3C3BA258D4D54340D927A4AA84B7DDBF43C88E0EC5D543407F7490AD25CCDDBFE347C11D7AD54340C4BBA48D132ADEBF4B69EAD9A1D44340D5D24342B53DDEBF	\N
38	Kaango Mosquito	15	1	7	3960	Kitui_1	0103000020E610000001000000110000009A77991EEB004340470B520762F2F5BF3A7E8893DF00434013BFFAFBFFF1F5BFE86F1870D8004340575418BD14F1F5BF382AC02CD5004340779170FF45F0F5BF26856461D0004340DDB3EA3B16EFF5BF4A0675C3CF0043408703B676FBEAF5BF8A4A7FA1100143407136324FF5E6F5BFB8E8F1421F0143409D95AB8C12E6F5BF1B972506600143402B9166CBCCE5F5BF5D82C6C762014340E77B87FC76E6F5BF904CD7323F014340C84FAE0C38EBF5BF4942B49E3B0143402EFADC6FA9EBF5BF7894896322014340C959908233EEF5BFBBB6B401060143409786060ADAF0F5BFC2DC45A7FA0043408BD5BED087F1F5BFA350D4BFF500434036DE83E7D1F1F5BF9A77991EEB004340470B520762F2F5BF	\N
76	Kaloleni	42	1	7.25	3000	Kisumu_4	0103000020E610000001000000160000001AE238B1546241405F11B8C0156DB9BFD2747D9251624140CCEF42D0D66CB9BF6C4B735A30624140818DCB8C2B60B9BF0BE380081B624140306065ADC131B9BFF87502C7FB6141409763FD8416B2B8BF11F0B7FAFC6141409453CE74CBA9B8BF7E563F61026241402BCE74A7BC9FB8BF6B8AB143066241405ACFAFA38098B8BFD579604008624140931DB34CCD94B8BFE74F31140962414037BB64D84293B8BFBF0D86BB2962414052921F85F778B8BF9F3DD8563C6241400F02CF6F6883B8BF36CE48564A62414004E9C5557A95B8BFE1472ADE4B6241407229C9BFD899B8BF6E4190574C6241404FCA173A339BB8BF78FF97CE4E6241403FA8B3473CA2B8BFAF88C3614F624140B32D7256E0A3B8BF7A445B4F57624140FE6A2D50DAC1B8BF52A969987162414025CC02B9A833B9BF968F1ADE70624140A8814D31A538B9BFC62FBA7D5662414055C54FB0BC69B9BF1AE238B1546241405F11B8C0156DB9BF	\N
56	Kanjora	19	1	9.07	184	Nyeri_16	0103000020E6100000010000001100000098731AD0B77042408F374BA6FA51DABFED9552A97D704240B7A35D98F250DABF7E86B1AB7C70424037D90BC49149DABFAB5DF1897A70424013D302B79938DABFFA14A73178704240229E83B91F22DABF4254435778704240EC191A9A091EDABF01A177B97F70424064227178C81CDABF011CFD039170424012162A49F71ADABF91CC1BCF95704240DDA10C1CA01ADABF721E93909F704240D01E43FD201ADABFA84A6622AB7042403C8D598D311ADABFD8BF34E6AF7042404C82F529771ADABF84BBC8E9C3704240118A50A62E23DABF53FC31FDC9704240722748A99C50DABFD0315D9FC9704240284EBA03A650DABF7DA5037CC070424039EC1CA45751DABF98731AD0B77042408F374BA6FA51DABF	\N
48	Chorongi	19	1	4.13	147	Nyeri_8	0103000020E610000001000000110000003CC7707BAD7B4240EE0B864015A6DCBF327894B6AB7B4240EE8F0AABC5A5DCBFA62A55C9997B424055258E184993DCBF7FA99B2D9E7B4240353468C4238BDCBF5C37CA549F7B4240F6165022248ADCBF0B6775B8BB7B42400CD11E098482DCBF9C938003BE7B424052AF1B308D82DCBFBEDA7868C17B42407BBF62F09B83DCBF00488421C37B4240DB9487864384DCBF80FBCDA5C67B4240E8054C9D9985DCBF5B976022CB7B4240661341E48987DCBF85C9657FCE7B4240409BF430AF89DCBFCB5F528EDC7B42402903F0C39399DCBFA36837D8DB7B424097CFEA56979ADCBFE58E37A1BF7B4240D3321FF3ABA1DCBF12677A28B87B424007B371F28BA3DCBF3CC7707BAD7B4240EE0B864015A6DCBF	\N
50	Kiaruhiu/Kariki	19	1	13.71	306	Nyeri_10	0103000020E6100000010000000B000000F467239A47964240678E6B6AC647DCBF429FB414DE95424094DDE26E7A1DDCBF5A2ACD2BEC954240126F599AC80BDCBFFFC88C61B59642408F046E0F2406DCBFD4C7EC11CC964240642713F01612DCBFAE68A651D49642405345F160C71EDCBFD962D642BC964240548F50D6CA32DCBFAE12FFACBA9642400E039C680A34DCBFCA4F8E9148964240BB343F51A947DCBFB9AD53A147964240CCCBBFC1C547DCBFF467239A47964240678E6B6AC647DCBF	\N
9	Kisumu Ndogo	1	1	5.99	3000	Mombasa_2	0103000020E61000000100000010000000EA24FC8F0BD943406DFE84EFE02910C07315021400D943405294E948C92910C02955B0F3FCD843405F2BB9D8C22910C000D057FDF5D84340EC8ADBB5AD2910C055E91FF4F2D84340D956507EA42910C09CBEA72BC8D84340BC929E01C62810C06FD8D10ACAD84340C00331F3642710C03AEB73D9CED8434077C53922DA2610C0D1C9FD87D3D84340E7E3A67CE22610C0D69EA74DD6D84340960FE56EE72610C0FB9F5C7AD9D8434025844C74EF2610C09AE48EC0E3D84340F6BA016A092710C0BBCD1655E7D843403CBC063F252710C0039EE3F7F5D843404E298006972710C09689BB2315D94340E2B5FE4F542910C0EA24FC8F0BD943406DFE84EFE02910C0	\N
65	Keringet	32	1	19.42	1502	Nakuru_5	0103000020E610000001000000130000000EE180760FD941409796B41FFA6EDBBF6F8DEFA8F4D841405FA987D91C6DDBBF1DA62DADAED84140CE651269FF67DBBFE5CADAD088D841409060637B814ADBBF17C1C7AD88D84140F7668734B448DBBF5C54C1FF89D8414044057DB88A43DBBF05887E778AD84140326B6E8AB641DBBF0F6540F18AD8414058DE4F78DA3FDBBFE56003DD8BD841403E15A9A4403CDBBF93FBDF568CD8414073C33C2A643ADBBF6FBAADD58CD841407427375D7438DBBFB2A7655791D841403BFE10337627DBBFEEB4F65592D841401AA7B31A0427DBBF0BA712ABE0D8414037F2426FCE26DBBF9572BF8702D9414097131DB0C826DBBF66B2096B30D94140726B20D06F4DDBBFCF4D936B30D94140CFF3BE6E074EDBBF7AADA05313D941409104FB97226BDBBF0EE180760FD941409796B41FFA6EDBBF	\N
49	Kiamwathi	19	1	12.38	231	Nyeri_9	0103000020E61000000100000015000000796E0C81957A42406F878D962EB2DCBF6AB0FC0E817A424064A02495AC9EDCBF22EF6E58817A4240835AD97E929DDCBFD2EF564D827A424092B556EDE599DCBF2035F45C847A42404B4958A1FB91DCBFB1D5BE97847A4240B3E663D81991DCBF87A1C4DA917A4240AE8670494191DCBF0293F740CC7A424041A7431CD392DCBF43A085B9DB7A4240A5D3C1066B93DCBFA86B00E6DD7A4240A8C898FCDB96DCBF10B8F5BBDE7A424059C33C116D98DCBF57D632A3DF7A4240EE5EE0A1709ADCBF82313150E07A4240F0F27974579CDCBF7BE55A89E07A4240F9329586F89CDCBF2EFFCAFFE07A42400FBEB8B78F9EDCBF7F310217E17A42405763136F059FDCBFCBB2C96BE17A42408781756F11A1DCBF08C2C07BE17A4240340FE77D5EA3DCBFBF545261E17A4240A64184257DA6DCBFD6CA4517E17A4240AE1AAE5C84A9DCBF796E0C81957A42406F878D962EB2DCBF	\N
78	Kopere	42	1	21.25	1708	Kisumu_6	0103000020E6100000010000000E0000008D233426079741407C3C69D79B1CA5BF94116236DB964140316BF53052F5A2BF57DCA69FD39641401657FE14153AA2BF1A772CAB5897414022126FB49ABAA2BFFFA1025C5E97414060AFA01F58C0A2BF9EAA2792669741407291096DA0C8A2BF8FC99D356797414038DAED2C26C7A3BFDA7B96CB6797414098F7811385BEA4BF2D12F2936797414016BD0CF321CBA4BF632474365D97414022F0881D54D4A4BF34C0D13658974140EE1F97F09BD8A4BFCA89F15055974140E90093F712DBA4BF62A3EF7D42974140258D27B015EBA4BF8D233426079741407C3C69D79B1CA5BF	\N
70	Kuinet	27	1	13.16	700	Uasin Gishu_3	0103000020E610000001000000080000009F78EF7297A74140FA78E4D672CEE33F88F2FEFC96A74140B5982B8E97CEE33FAE37C8C3AEA74140E2E07942D1FFE33F3F19D2D0F6A74140D37E135B4B06E43F2BD9612302A84140B1F0A4E339E6E33FD7712D55C9A74140E5113EBBADD1E33F1D91DB36A3A74140FFCB91DD35CFE33F9F78EF7297A74140FA78E4D672CEE33F	\N
11	Kwa Hakatsa	1	1	20.9	3000	Mombasa_4	0103000020E6100000010000001F0000001A6BA1DEDCCB4340B3B478A3340310C0DCC693ABAECB43401F8C3A945C0210C02D66363CA2CB43402FC0095F220210C0ABFA7FAB5ACB43401DD9F0A783F80FC0BD7F1D3C5CCB43407BDD2E8C39F80FC086B12AA593CB43405099C55620F40FC0F7E35FC694CB4340083732CD0DF40FC099A336AC96CB4340C718DB13F3F30FC0340FA41098CB434012DFC94DE2F30FC017446B2A99CB4340887C4FE6D6F30FC0C4C9E87B9BCB434084EDD850C4F30FC0509BCC259DCB4340AFC81D79BAF30FC0D6CFE2419FCB4340717332F1B2F30FC00B9EA4D4A1CB43404292DF63AEF30FC0C3809790A3CB4340347FC05EAEF30FC0040C8CD2A5CB4340F4451959B2F30FC0D1C8215BA8CB434040704691BBF30FC0F8B8F15AA9CB43401837BD2DC1F30FC0538B1400ACCB4340CBB7A9D4D9F30FC05CE4955EADCB434010D2C7F4E8F30FC012687655AFCB4340161D094902F40FC0528BCF32B0CB4340F6E9823B0FF40FC054F8C449D8CB4340F569EF67AAF60FC0839B952CD9CB434001194D35BCF60FC0F4D5D2740DCC43406A980CFD54FB0FC0EC4F05E90DCC43407E8C88529BFB0FC078AE79B1FACB4340644740BA840110C0C7A839FEE5CB4340AA8A560BBE0210C055302DB9E2CB4340A38B108CE80210C0241AAFFAE0CB43406F02F737FF0210C01A6BA1DEDCCB4340B3B478A3340310C0	\N
72	Majengo Talai	35	1	23.12	772	Kericho_2	0103000020E61000000100000015000000315C4824A7A441404C82AAECD81AD7BFBD6309E264A441407645052A760AD7BF8301812C64A44140765590E1EB09D7BFC93BA6D561A441408334B4B12308D7BF32A49B9D5BA44140BD65260C1703D7BF467B411A7BA44140C40E7B06C3FCD6BF2E872046B9A441408E6819CB7EF1D6BFEEA6C2D568A5414014D5E5986CDCD6BF51DFF0A969A54140E018D7C45ADCD6BF9C5E17546CA541407100CF7321DCD6BF54168AF66DA541405E5E0A4BFEDBD6BF7C1CB9E472A54140FFF9F23D94DBD6BFCCC73DC077A54140951C50C32BDBD6BFFA619DF57CA541403F742DD835DED6BFD01CA324AAA54140D812A7C7F5F8D6BF919CE7C3A9A54140BA4EA3E1B1F9D6BFEA9063667CA54140206E8CF4FC03D7BF9880A05B75A5414061A90EBE4A05D7BFF6F661506EA54140DFE0F49C9806D7BF1FCA9DA850A541402D9178C0150CD7BF315C4824A7A441404C82AAECD81AD7BF	\N
52	Miiri	19	1	3.34	116	Nyeri_12	0103000020E6100000010000000A000000AEF1E4E122954240926F9D613AD6DEBF3C8FF0C90D954240B49B29D6D6CEDEBF5B37E0340F9542406ED6414AD3C8DEBF3F0CD8E70F9542405B73B727DCC5DEBFF3594D121095424015DE78028AC5DEBFDD58F81A11954240F9BDC5058AC3DEBF1C44DAA911954240DC1517A075C2DEBF52ED52383D954240EA69C5C591BFDEBF9B1DC0664295424090950B623CD5DEBFAEF1E4E122954240926F9D613AD6DEBF	\N
10	Misufini	1	1	24.04	1734	Mombasa_3	0103000020E6100000010000000D0000003CD960AB37CA434034477C1CAE0110C068B4546918CA4340CA94C2E4EE0010C0BA628D0603CA434060AE892084FF0FC03D1A2EEBC3C9434049C1BF3FE1F70FC0F8B7C2A114CA4340C964771CA5F10FC0B078A17B29CA43404B65707986F10FC0C9EF5CA531CA434080312DD798F10FC016E9424D32CA43404810F4509AF10FC0CA38D3AD38CA4340B847676151F20FC06078B34C3ECA43406F90F7B9F2F20FC0F7E1B73C50CA4340C7115D4326F50FC0071B2CEB4BCA434093953FADF70010C03CD960AB37CA434034477C1CAE0110C0	\N
54	Giakaibei	19	1	16.19	57	Nyeri_14	0103000020E610000001000000100000008789716C29944240CFED5CEC25BFDABF0DF6EA5422944240486908E708BCDABF55A90CD51D944240E4800255DAB9DABF63B023E5069442401E358A2557A9DABFAAEFE2AA2894424058AC7A458888DABF9026656668944240BE29C7AEDC5BDABFBE46F6916894424026FE10B0DC5BDABFA8E9E6F899944240F27008BF5D62DABF6B3BFE299E944240554081AA2463DABF7553B85DB294424064EBEE5BE366DABFD6175A74B4944240C549D7B14B67DABF94CA56BDAC944240D5E8781AF47CDABFA4F46A13AA944240163FAB716E84DABF19DCA9B2A7944240DB07B05D1B8BDABF3E738E888F944240681EF55C1F96DABF8789716C29944240CFED5CEC25BFDABF	\N
53	Ngorano	19	1	28.6	128	Nyeri_13	0103000020E6100000010000000C0000001BA1BF5F45894240DCDC0A9573D7DABFC336B8B6B68842408B58EE651C92DABF5DF61E96B08842402457D720958CDABF232FFD8FAE884240AFAEDA1E6688DABF5DFC32400F894240A9F2445AC77CDABF4CB469307D894240810A7AF26485DABFD2522447C5894240FED921F41C96DABF517EEA46C5894240AD5B37D9F297DABF2AF12BC5A18942408F68236E38B8DABFF9AD158FA1894240F759DA9669B8DABF35947D77A1894240A72CA2087FB8DABF1BA1BF5F45894240DCDC0A9573D7DABF	\N
57	Ruruguti	19	1	22.89	535	Nyeri_17	0103000020E610000001000000130000003DE3578887724240941D6F5FC834E2BF2827322E22724240B6E250DD3333E2BF094A0D971E724240BD3AE02D1C33E2BF9B23DABB0B7242401E51A1C99F32E2BFA386C2DCF3714240D0F6A466BD31E2BF4A14A0A89A714240DA12CA01BF21E2BF6223F9A89A7142408493F3D5CD20E2BFBD847F68A1714240D4DD692F9E1DE2BFA07632A958724240ED4CAA8D7600E2BFD4BE8AE089724240C62655960010E2BF4118766BAE7242405930B4B0BC28E2BFB96C516EAD7242406DCA76ED452AE2BF19E71A45A9724240CB1236A5BC30E2BF03EBB839A97242400FA7D453CE30E2BF64DB2D5BA7724240BAB8A4B3B533E2BFC2C7E09B9E724240A4E3FB981534E2BF5F267B548F7242409E200DEBB334E2BF41D1D1238F724240C37F48E3B534E2BF3DE3578887724240941D6F5FC834E2BF	\N
77	Shauri Moyo	42	1	37.75	850	Kisumu_5	0103000020E6100000010000000D000000EBE7EA02829A41400CC956D5C130C4BFABCFD5F5149A41405245EA48AC25C4BF2CD5A7BAFF99414047F910DEA1D1C3BFBB95C986009A41409BA17A40EBCFC3BF47D5CA35189A41406A07044031C7C3BFB9A0D55B3C9A414033BF8449DACAC3BF47D4AE1AA09A41407335CA987AFDC3BFE8653B9E9F9A414022011910E305C4BF1CE89C4E9F9A4140496077E3A90AC4BF6BDA88FF9D9A41407F01DA93C60DC4BF3388C7D59C9A41407969F792E90FC4BF42175C86899A41408A16458B7128C4BFEBE7EA02829A41400CC956D5C130C4BF	\N
75	Shauri yako	42	1	27.73	2500	Kisumu_3	0103000020E61000000100000023000000458A6014049A41403100C9DA3EB9C4BF33826CDB019A4140ADFDE2F095B8C4BFB7753145FA9941406ED26B4D55B6C4BF21CA6ECAE9994140FC7AFAC570B1C4BF5E760B6AE1994140C1D6631DF4AEC4BFE759E5D6DB9941403DD3A0664CADC4BF98535A0DBF9941409641D16AC0A4C4BF7068321AB4994140EE0C432C80A1C4BFE6E5AE268D994140CFA8BEABEF95C4BF39FDF88F639941403AB31EB49689C4BFBE55AFCC52994140068CA9A29C84C4BF69BBAEB62E994140B41F47E7E579C4BF5BF2E4461C9941408EBCEA9C6C74C4BF7B8C3B4EF4984140CAACB5908E68C4BFA9995C5FE498414034EFE88ED363C4BF98164757E6984140A98958147D57C4BF3599B525C4994140F7A45AB4F23DC4BF740FBC58CC9941402E13CB4A1A3DC4BF0B5CC48BD4994140CD9A3EE1413CC4BF7C1A6602DC99414098D6F5E47C3BC4BF4EC1EDECE1994140F497CF5D623BC4BFA1494E46EB99414030DF37FE523BC4BF1FFE004AF79941408B0D0F030D3CC4BF4C2C79ED059A41404A505298063EC4BF904111C10F9A4140240F63470940C4BF4E8B86D31D9A41403461E400CA43C4BF5C0F2B80339A4140324CF19BE74BC4BFA7C3E8E1349A41400F604D4E994CC4BF23DA53703B9A414062FDCB693D50C4BF6D924613519A4140FEC26F306C5CC4BF402D539C4D9A4140483B19A9FE6CC4BF6B9BFFD3399A41401049C7528E84C4BF68DD9CB4319A4140A319D5BE848CC4BF51B58463089A4140F0AB8D7305B5C4BF458A6014049A41403100C9DA3EB9C4BF	\N
74	Swahili	42	1	4.2	1500	Kisumu_2	0103000020E6100000010000000C000000D362DBF5AA994140624F8E02252BC4BF0F335FB9619941408CABDAB2361AC4BF604A74264A9941407F99C11E1DF0C3BF678BB40B5299414019498D280CEAC3BFA2F57992B1994140E37D62F55AE6C3BF58781F92B2994140837C3387CAE6C3BFDC24CE5EB49941404587E8F1DCEBC3BFE50E15A7C7994140C9FFD3436722C4BFD12B1A1FC7994140558000D68723C4BF974FC45AC399414000EC37B18D24C4BF7FE5418EBA99414047BDDB7BEE26C4BFD362DBF5AA994140624F8E02252BC4BF	\N
64	Tarabete	32	1	7.7	1959	Nakuru_4	0103000020E610000001000000100000005DAEB654DD2542400CA9AA53BDCEE6BF0D179138D1254240D33546459CCCE6BFE4D9C4A6CC254240B8EF8DB11CCBE6BFA938D3C5BB254240D44444B67CC5E6BFC09D89C7A4254240E9E6392BB6BDE6BFACC10A2CA02542406587C4E11DBCE6BF09CF5770A02542407DC9B480A2BBE6BF98658718B32542401679B93B95B5E6BF3B8940CFB52542407B5687E4B8B4E6BF62D0129DB82542405ACEFB5ADAB3E6BF6DFF4832C325424046716223C1B0E6BF753EB311C525424051DEE070B5B0E6BF13AADAF9EA2542400BF6D32819BCE6BF1458412CF42542400DED26700DBFE6BF36D4C12305264240E69135D3BEC4E6BF5DAEB654DD2542400CA9AA53BDCEE6BF	\N
1	Embakasi	47	1	2.28	1613	Nairobi_1	0103000020E61000000100000018000000918A0201E0744240935B19FABAE5F4BF361DA120CA7442409EFD075DDDDFF4BF8042B9B3C774424037C29256F3DBF4BF1264BFB3C77442400ADF1743EFDBF4BF38F0D6B8C7744240CFB7943CEBDBF4BFE5CDDFC2C7744240673D695CE7DBF4BFFCBB9AD1C774424037B003BBE3DBF4BF06E0AAE4C7744240249B466FE0DBF4BF8B0F98FBC7744240D198F88DDDDBF4BF80C5D115C8744240DA544129DBDBF4BF56B1B232C874424037213750D9DBF4BFFBC88451C8744240C7DA7F0ED8DBF4BFB2C08571C87442403474016CD7DBF4BF6963AA68C9744240719D7AFFD4DBF4BF09EF2328D07442407802240EC4DBF4BFC4B5C9DCD27442403D0E3843BDDBF4BFC8270F01D3744240707E744EBDDBF4BF212BB824D3744240C9E73124BEDBF4BF017EAF46D374424042D01EBEBFDBF4BFC03C20E6037542407B8EE40D56DEF4BF0B5EA032EB744240905AB49030E5F4BFF462A96EE67442406C7A977D6BE5F4BF78FFDF46E5744240F2B0FFC679E5F4BF918A0201E0744240935B19FABAE5F4BF	\N
73	Bondeni	42	1	13.36	1500	Kisumu_1	0103000020E610000001000000140000002D3E80AD589941408EDBAEA32DCAC3BF6C0E716D34994140CB716ED03AC6C3BFB0B4E3C2249941407079BDE4A6B1C3BF27911C08209941401B7EE26652ABC3BFCE89507D279941406007F930EB99C3BF98CF493859994140D9B713E4EA45C3BF874BA33F6899414013DF8B980B3DC3BF70F5C3F370994140F8FB6E2DBD38C3BFC7FA4A38799941400DB1189C0A3CC3BFE5A1FF0E7E994140B6279EB6D13EC3BFFA6C1728839941408819E0906C42C3BF47187005879941405B7C30E6D745C3BFCA7A6E458A99414026B4D8A73349C3BF3947289793994140C1CC89875155C3BFEB4DCD5FA6994140C84FF6F1F489C3BFDFF88F06AF99414004EAB67133A2C3BF06D40E1081994140D6E0643379C2C3BF9F00E6F079994140F8798DC07AC4C3BFCD4B944966994140D3D1DE29DAC9C3BF2D3E80AD589941408EDBAEA32DCAC3BF	\N
30	Bulla Riig Phase 1	7	1	351.42	13343	Garissa_3	0103000020E6100000010000001D000000AAAD9A0802D443404A7A99F0013BDCBFE52786FD10D2434059E576BEC401DCBF7090A46311D24340A7AE18F381D7DBBF2CD6A0D711D243401DF071E43CD2DBBF669B1C4E12D2434056BE98D0DACCDBBF0C1D6C7712D2434076D5A93C1ACBDBBF76C1F0812DD343409BFE76ACC031DBBF4DA330DB30D343406F5447131A31DBBF5A8BD9B73BD34340907C2FBBFD2EDBBF2FA85215A3D443405C2A610FA1EADABFBB74C89CA8D44340BD4420DDF6E9DABF252DA8EDB0D443402EFFCDE3F6E8DABF01378586B9D44340F207F242EEE7DABF67E5A053C5D4434062A0B10283E6DABFD154395CC9D44340080879DB06E6DABF8D94C43CCAD44340B3465F448BE6DABFA187CBBCCCD44340644A1EB31FE8DABFCA29B81CD0D443409B07509E41EADABF29F447FAF7D443404C0C1DA57203DBBF93070311FFD44340ED5B2766ED07DBBF93EB130506D543402931A942520CDBBF5231CB8E6DD54340C8570D658250DBBF665C518285D54340353B2CD7B561DBBF5A1A8C8185D54340E2CB4C1D0B63DBBFBFB09CC272D54340C4CFF226A06DDBBF5F64EE46BCD44340639F0521FED3DBBF38C43BDD24D443403FE11399D528DCBFF233467204D443401EFD4164FC3ADCBFAAAD9A0802D443404A7A99F0013BDCBF	\N
61	Kasarani A	32	1	109.44	17881	Nakuru_1	0103000020E610000001000000210000003C74B6F91CE74140C07BA03F0A32D3BF01B05F1056E6414031EA0F651EECD2BF658A115A50E6414000A016CB43D2D2BF607A092450E64140811A9AA715D1D2BF7006CF134CE6414013E41C5336B6D2BF40BB14D975E64140219C7CFE2B76D2BF17633B4277E641408AE3429D6874D2BF2CE1576E78E6414051F596553773D2BF99C7A6917AE6414011C3F2CE2F71D2BF0371A1BE7BE64140842D7F9E4770D2BF2A7666B17DE6414098586DBCEF6ED2BFA49A884C86E64140962B25490E6AD2BF1089280588E64140C743CC6B5969D2BF9AAB8F1C89E6414060C3FB6BF068D2BF60302D348AE641402318F6638868D2BFF72290F88CE641407C3EFD4F8A67D2BF61605E169EE641409707DE19ED63D2BF15F7AB15A8E64140EAF700E54F63D2BFAF719C58AFE64140E0244E70E962D2BFB8E84323B6E641409182C8180863D2BF5C5BC65AC0E641403EACDB2FC663D2BFB3DD5233C3E641403846AC580E64D2BF0EC2B9EDCAE6414037B4835D8C65D2BF96F2A663DAE6414004737D69246BD2BFAC082D71DDE64140C651762B096DD2BF6390DC86E7E64140914CE918AB73D2BF283139A467E7414088D9CECE86DAD2BF30E9E1E968E741406A7FBD3CDBDBD2BF674ADF2A6DE741408FE8C076CFE2D2BF8C540D6C71E741401611553AAAFCD2BF5825731271E741405A68202E8602D3BFB6565D3956E74140BE8F0E208F2FD3BF3C74B6F91CE74140C07BA03F0A32D3BF	\N
80	Mjini	37	1	8.4	1123	Kakamega_2	0103000020E6100000010000000E00000090242BEDCD3E41400E3066B6B024D53F03ABCD1EC93E4140E33BC4F76926D53F95B367B3BC3E4140F8EB187F562BD53F57B6E943BC3E4140CA0AEBFF832BD53FEA655C2B693E41405333A93C9050D53F0B8CA57E703E4140977EF8527A5BD53FE733F0709A3E4140AB07D966085BD53FC187A2839A3E4140DA43D4DB055BD53F3529BECD9A3E41404FC42F1BFB5AD53F5F7D451CF73E4140CF033C7B3E4CD53F9054C9030A3F4140463CC1D96045D53F4DE53EC10A3F4140FD7D7E985243D53FD8F3964EF63E41404601CFBCF932D53F90242BEDCD3E41400E3066B6B024D53F	\N
12	Mwatate	1	1	5.99	2074	Mombasa_5	0103000020E6100000010000001A000000D5E7D6C65ED0434028C4071C972410C088AD03475CD04340D3645B7F962410C0BEC1944F36D04340F4426B5C372410C0C171352704D04340423C981F8B2310C08DEF2DBF02D043408A4C377C852310C0378A668302D043407D1D02536B2310C086A7BF4502D04340C70977C9492310C0DE8A291502D0434091E1305A2F2310C0201D93EC01D0434062BFA663F72210C0FF75ED2A02D0434050F7D8C2F32210C0C956ACF020D04340B930B613ED2110C00D1B926522D04340E0AF0921E92110C0F26CCDF13AD043403454DD01FB2110C0783282583ED0434076CD04D4FD2110C006CD073C3FD0434043B2C090FE2110C0C7BA3E3E3FD0434033CD4A95FE2110C04CD311733FD043402897E001FF2110C0224CF43A46D04340B9D66E73152210C0A58C164347D043407D9EBCEF182210C0D9ABE70848D04340009C028C1B2210C08AC667D148D04340638E5F311E2210C08AA4A7DD4BD043404FBED49E282210C069BBDF5B60D0434006734FBC6E2210C0962E197866D04340DE60F03ED62310C0C639BC2F66D04340BE2034AD582410C0D5E7D6C65ED0434028C4071C972410C0	\N
28	Namu Phase 1	7	1	158.5	4928	Garissa_1	0103000020E61000000100000013000000A0F84E9A88D443405BDAA450C2EFDEBF300AC38786D44340AFCF840794EFDEBFD3AC9DE77DD34340033B0204CD32DEBF6F66D8D57DD343402141B207BF32DEBFEFAF3EF07CD34340F68134550A32DEBFA3D7C4DA71D34340F4DDD02E5129DEBF30E69E9266D3434043AFB4267020DEBF165E77895FD34340EB6BF6CA9B1ADEBFA78B8FC65CD34340421C54953918DEBFC25E23DE59D34340739372FAB615DEBF58CB25985AD3434071E27D309514DEBF586E681571D34340FEA9C94FCB0CDEBF78B9F82CB0D34340DA3D42775608DEBFC31741C202D44340FDF151D0D502DEBF97524DC148D44340B2D14D967BFEDDBF23DA4B084BD44340F968C7B33AFFDDBFFCFAB58183D54340A50D4DAE1466DEBF5AE96A1872D54340654DEE9B5FBADEBFA0F84E9A88D443405BDAA450C2EFDEBF	\N
18	M26 Kibokoni	3	1	2.227	208	Kilifi_4	0103000020E610000001000000CA00000061375848940F44403D92702DAA6609C02181AFBAA70E4440BE7679D8926409C033978FEFA50E44409D4EDD948E6409C0B6739B18A50E444060FCE18F8C6409C02D05C8B2820E4440A9B7029B1F6409C098C3CC4E710E44406F75FEA9F95F09C00558213D710E4440C17FFDF0CE5F09C02394AE39860E444067B5F627A05E09C081C05A58E80E44407DFA0229C25F09C0F88335DAE90E444096DE8D81CC5F09C0823B35D4EA0E444020A4A335D35F09C0460EC51BFF0E444082478E6A5E6009C01621A1F9FF0E444071809B5D646009C0DB39EADE8D0F4440D2C2BC82336409C0D5C1B9D28F0F44404B5442EE406409C0E4FD2745900F444039C3E700446409C01D50B22B940F444004E7CB75F46409C03A8E802F950F4440A987C449676509C09F340630950F44406082D63B686509C0F2811131950F4440118C19206A6509C066A79C32950F4440FB58F2F56C6509C0C037A033950F4440CB33B9D96E6509C0C8D7A134950F444051DA22BD706509C0DE999F35950F4440C77D6DA0726509C0757D9936950F4440E0097A83746509C044719137950F4440FF754866766509C021878538950F44400BDFF748786509C07FBE7539950F44409330692B7A6509C06217623A950F4440BD6A9C0D7C6509C081CFBE3B950F44406333ABE07E6509C0741D313C950F4440F3B886D17F6509C0F1DB113D950F44409ED53DB3816509C0F04B803D950F44404458FAA3826509C0EFBBEE3D950F4440EDDAB694836509C0AF3C5B3E950F4440E3515485846509C0F9BDC73E950F44402ADD1076856509C07C4F323F950F44404F488F66866509C0E2376C40950F4440DFA30A38896509C06FEBD240950F4440160C6A288A6509C047B03741950F4440EE7CC9188B6509C07B5BFD41950F4440F4464AF98C6509C015316042950F44401BAC8AE98D6509C0150F2043950F44408767CDC98F6509C06C20DA43950F44405E28F1A9916509C01D3A3544950F44406787F399926509C0018FE744950F4440D02DBA79946509C0BECA3E45950F4440A0899D69956509C07B069645950F444099E58059966509C083C13C46950F4440D082EA38986509C04C1F9046950F444093DBAE28996509C0691E2F47950F4440AA72DA079B6509C0C4774C4E950F4440FAE17534C96509C0FAD43A4E950F4440B14B8956CB6509C0FA4E344E950F4440166B850CCC6509C06DC82D4E950F4440057662C2CC6509C095871F4E950F4440E3B75E78CD6509C005580F4E950F444062025B2ECE6509C03839FD4D950F4440104138E4CE6509C06A1AEB4D950F4440E17F159ACF6509C0700DD74D950F44409CDB1150D06509C03711C14D950F4440862BEF05D16509C07514AB4D950F44404667ADBBD16509C08629934D950F4440CCBF8A71D26509C0E24F794D950F444019216827D36509C0B5755F4D950F4440186E26DDD36509C0D0AC434D950F444091C3E492D46509C0BFF5254D950F44401C36C248D56509C0724F064D950F4440D19C80FED56509C023A9E64C950F4440AC033FB4D66509C09613C54C950F4440B65EDE69D76509C0DB8FA14C950F4440D4D69C1FD86509C0200C7E4C950F4440C74E5BD5D86509C02899584C950F444031BBFA8AD96509C0CAD5094C950F4440FDA439F6DA6509C0B096DE4B950F4440442BD9ABDB6509C09657B34B950F444067B17861DC6509C0C729864B950F44404E401817DD6509C0F6FB584B950F444010CFB7CCDD6509C0F6E4F64A950F4440E9FAD737DF6509C033D9C54A950F44409A8658EDDF6509C0D3065C4A950F4440A5C05958E16509C0EC2E254A950F44403366DA0DE26509C05268EC49950F444088145BC3E26509C027FD7649950F4440D76D3D2EE46509C024D7F948950F4440C8E91F99E56509C0DE43BB48950F4440889D814EE66509C07C623648950F4440A62745B9E76509C06014F047950F4440E3FDA66EE86509C043C6A947950F44401CD40824E96509C09D776347950F44400B964BD9E96509C0164C1947950F4440AA7DAD8EEA6509C00520CF46950F4440D750F043EB6509C011178146950F44408F4952F9EB6509C0960D3346950F4440F52D95AEEC6509C0321D9345950F44402F081B19EE6509C0F471EB44950F4440BE04A183EF6509C0A1AD9544950F4440A40BE438F06509C00FFA3D44950F4440DD0608EEF06509C05158E443950F4440031F4BA3F16509C0DD362D43950F44403C4CB20DF36509C076C8CD42950F4440146AD6C2F36509C00C5A6E42950F4440CA87FA77F46509C0EDFC0C42950F44401DAE1E2DF56509C018B1A941950F444010DD42E2F56509C08D764441950F4440A0146797F66509C083237640950F4440B4809001F86509C0D81C0B40950F444024D2B4B6F86509C0A315A03F950F4440480FBA6BF96509C08D31313F950F4440F471DE20FA6509C0EC4CC23E950F444055C0E3D5FA6509C09679513E950F44405217E98AFB6509C07FF56B3D950F444093D6F3F4FC6509C00756F53C950F44406947F9A9FD6509C0DAC77C3C950F4440E8C0FE5EFE6509C0AD39043C950F4440643A0414FF6509C0F3610B3B950F44408C3BF07D006609C0235F653A950F4440D6828068016609C062CF0A3A950F44402D5FDCE7016609C01F978839950F444053EFC29C026609C0B0700439950F4440899CC851036609C0025B7E38950F4440123EAF06046609C09E56F637950F44403AE895BB046609C039526E37950F444061927C70056609C06970E236950F4440C64D6325066609C0E49F5436950F4440CB114ADA066609C0A9E0C435950F444070DE308F076609C06D213535950F444015AB1744086609C097E70D34950F44406452C6AD096609C0E9F2DE32950F44405A1C75170B6609C06643A831950F4440CA0824810C6609C0F30D0931950F4440F605EC350D6609C07FD86930950F44404603B4EA0D6609C059B4C82F950F444038097C9F0E6609C031B17E2E950F444091370C09106609C0E8C0D72D950F44403A57D4BD106609C07E25822C950F444050B96427126609C01469D52B950F4440FDF22CDC126609C0DF34742A950F44405B749E45146609C0C8ABC129950F444095B347FA146609C0D0450B29950F44405C1810AF156609C04FDF5428950F4440D568B963166609C0A48A9C27950F444014D68118176609C00258E026950F44406B402BCD176609C05F252426950F4440C4AAD481186609C0DB156425950F4440A53A9D36196609C0CD05A424950F444014B646EB196609C05418E023950F4440EA42F09F1A6609C01B4A4023950F444071A21E321B6609C0E17BA022950F4440FC014DC41B6609C07CBFFE21950F44406F7E9A561C6609C0D6135B21950F444011EFC8E81C6609C021DF0F20950F4440E0E1250D1E6609C001CDC01E950F4440ECE582311F6609C03B55171E950F44406C70B1C31F6609C04388C01C950F4440F3960EE8206609C01133131C950F4440D6323D7A216609C02BEF631B950F444059D76B0C226609C043ABB41A950F4440B77B9A9E226609C008465219950F4440FBD5F7C2236609C0B4249F18950F4440BA8B2655246609C019043517950F44400BF46479256609C09D06C715950F44400A82C29D266609C02A190E15950F4440A951F12F276609C04C609813950F4440B4ED2F54286609C06D95DB12950F444090CE5EE6286609C08CCA1E12950F44406FAF8D78296609C0D956A110950F4440F46DCC9C2A6609C04106200F950F44402F522AC12B6609C0B86E5D0E950F44409C383A532C6609C001E9980D950F4440CF3B69E52C6609C04963D40C950F44402C3F98772D6609C07A05810A950F4440CD4E062E2F6609C058A2B809950F4440416335C02F6609C01FFE2308950F4440688974E4306609C0037D8B06950F444015D5D208326609C0EB3BBF05950F44407CE6E29A326609C0A80CF104950F4440F414122D336609C0B6D05003950F444020837051346609C033B28002950F4440C4A580E3346609C084A5AE01950F44407AE5AF75356609C06F9D0800950F4440856D0E9A366609C0F0B75EFE940F4440AA066DBE376609C04BCD88FD940F444052437D50386609C07BF4B0FC940F4440E69CACE2386609C0AA1BD9FB940F44407AF6DB74396609C0D94201FB940F44400B500B073A6609C0547B27FA940F44401DB23A993A6609C0CDB34DF9940F444050146A2B3B6609C01A91BAF6940F4440C954F8E13C6609C028ECDCF5940F444016C827743D6609C03547FFF4940F4440873B57063E6609C017B41FF4940F4440E5CBA5983E6609C0C88C60F2940F44400CC404BD3F6609C03906BCEF940F44404566B273416609C08BB311ED940F44408322602A436609C081F446EB940F44408C62DE4E446609C0B89461EA940F44407DF80DE1446609C0C4467AE9940F44405CAB5C73456609C04EAAABE7940F4440C7FCDA97466609C0A56DC2E6940F444043B8292A476609C0C5F3EFE4940F4440CA1AA84E486609C061375848940F44403D92702DAA6609C0	\N
69	Maili Nne	27	1	9.99	1283	Uasin Gishu_2	0103000020E6100000010000000E000000CD0C666AEF9D4140609F3F195C08E23FEBF868C08F9D4140583199909D14E23F46F242098B9D414013730D357316E23F813229F5A09D414093BB6269F629E23F44D53519C89D414012164970BF36E23F6531B8E4CD9D4140B83DCB833738E23F113BF210E29D4140BA1F209AE932E23F03F1C876EE9D4140A174C090A12FE23F956D4CE10A9E4140A55869051528E23FA3945B03179E41406AF130D7DB24E23F39A0ABAE239E414055D11B0E7C21E23F14D3A77E239E4140241C0C2F0821E23FCF264CA0139E414059712F5B4C0DE23FCD0C666AEF9D4140609F3F195C08E23F	Maili Nne Informal Settlement is located within Eldoret town, in Uasin Gishu county and is approximately 6 kilometers to the west of Eldoret town and off Eldoret -Webuye road. The size of the settlement is 12.8 Hectares Ha.
\.


--
-- Data for Name: settlement_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settlement_status (id, settlement_id, no_dwelling, pop_density, ave_hh_size, ave_room_occupancy, ave_plot_size, avg_living_area, prop_permanent, prop_semi, prop_temp, avg_cost_perm, avg_cost_semi, avg_cost_temp, prop_avail_piped_water, dist_piped_water, prop_other_water, prop_conn_elec, prop_conn_other_elec, avg_mon_income, prop_hh_perm_income, prop_hh_income_home, prop_renting, prop_lpg, prop_firewood, prop_kerosene, prop_biogas, prop_elec, avg_mon_rent, hiv_prevalence, prop_food_aid, prop_female_hh, prop_child_hh, main_hazard, hazard_freq, dist_urban_centre, survey_status, encumbrance, ownership, land_owner, occupation_duration, mode_occupation, date_report) FROM stdin;
1	69	100	45.9	23	4	12	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2	69	23	12.8	12	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
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

SELECT pg_catalog.setval('public.households_id_seq', 1, false);


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
-- Name: settlement_status settlement_status_settlement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement_status
    ADD CONSTRAINT settlement_status_settlement_id_fkey FOREIGN KEY (settlement_id) REFERENCES public.settlement(id) ON UPDATE CASCADE;


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

