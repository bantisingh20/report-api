PGDMP  5    5    	    	        }            StoreManagement_v1    17.4    17.4 M               0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false                       0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false                       0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false                       1262    18588    StoreManagement_v1    DATABASE     �   CREATE DATABASE "StoreManagement_v1" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.1252';
 $   DROP DATABASE "StoreManagement_v1";
                     postgres    false            �            1259    18610 
   categories    TABLE     �   CREATE TABLE public.categories (
    category_id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text
);
    DROP TABLE public.categories;
       public         heap r       postgres    false            �            1259    18609    categories_category_id_seq    SEQUENCE     �   CREATE SEQUENCE public.categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public.categories_category_id_seq;
       public               postgres    false    222                        0    0    categories_category_id_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public.categories_category_id_seq OWNED BY public.categories.category_id;
          public               postgres    false    221            �            1259    18649    order_items    TABLE     �   CREATE TABLE public.order_items (
    order_item_id integer NOT NULL,
    order_id integer,
    product_id integer,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL
);
    DROP TABLE public.order_items;
       public         heap r       postgres    false            �            1259    18648    order_items_order_item_id_seq    SEQUENCE     �   CREATE SEQUENCE public.order_items_order_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public.order_items_order_item_id_seq;
       public               postgres    false    228            !           0    0    order_items_order_item_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public.order_items_order_item_id_seq OWNED BY public.order_items.order_item_id;
          public               postgres    false    227            �            1259    18635    orders    TABLE     %  CREATE TABLE public.orders (
    order_id integer NOT NULL,
    user_id integer,
    total numeric(10,2),
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    order_date timestamp without time zone
);
    DROP TABLE public.orders;
       public         heap r       postgres    false            �            1259    18634    orders_order_id_seq    SEQUENCE     �   CREATE SEQUENCE public.orders_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.orders_order_id_seq;
       public               postgres    false    226            "           0    0    orders_order_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public.orders_order_id_seq OWNED BY public.orders.order_id;
          public               postgres    false    225            �            1259    18685    payments    TABLE     �   CREATE TABLE public.payments (
    payment_id integer NOT NULL,
    order_id integer,
    payment_method character varying(50),
    amount numeric(10,2),
    payment_status character varying(20),
    paid_at timestamp without time zone
);
    DROP TABLE public.payments;
       public         heap r       postgres    false            �            1259    18684    payments_payment_id_seq    SEQUENCE     �   CREATE SEQUENCE public.payments_payment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.payments_payment_id_seq;
       public               postgres    false    232            #           0    0    payments_payment_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.payments_payment_id_seq OWNED BY public.payments.payment_id;
          public               postgres    false    231            �            1259    18619    products    TABLE        CREATE TABLE public.products (
    product_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    category_id integer,
    stock integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.products;
       public         heap r       postgres    false            �            1259    18618    products_product_id_seq    SEQUENCE     �   CREATE SEQUENCE public.products_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.products_product_id_seq;
       public               postgres    false    224            $           0    0    products_product_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.products_product_id_seq OWNED BY public.products.product_id;
          public               postgres    false    223            �            1259    18590    report_configuration    TABLE     [  CREATE TABLE public.report_configuration (
    report_id integer NOT NULL,
    report_name character varying(1000) NOT NULL,
    user_id integer,
    fieldtype character varying(500) NOT NULL,
    table_name text[],
    selected_columns text[],
    filter_criteria jsonb[],
    group_by jsonb[],
    sort_order jsonb[],
    axis_config jsonb[]
);
 (   DROP TABLE public.report_configuration;
       public         heap r       postgres    false            �            1259    18589 "   report_configuration_report_id_seq    SEQUENCE     �   CREATE SEQUENCE public.report_configuration_report_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 9   DROP SEQUENCE public.report_configuration_report_id_seq;
       public               postgres    false    218            %           0    0 "   report_configuration_report_id_seq    SEQUENCE OWNED BY     i   ALTER SEQUENCE public.report_configuration_report_id_seq OWNED BY public.report_configuration.report_id;
          public               postgres    false    217            �            1259    18697    reviews    TABLE     (  CREATE TABLE public.reviews (
    review_id integer NOT NULL,
    user_id integer,
    product_id integer,
    rating integer,
    comment text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);
    DROP TABLE public.reviews;
       public         heap r       postgres    false            �            1259    18696    reviews_review_id_seq    SEQUENCE     �   CREATE SEQUENCE public.reviews_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ,   DROP SEQUENCE public.reviews_review_id_seq;
       public               postgres    false    234            &           0    0    reviews_review_id_seq    SEQUENCE OWNED BY     O   ALTER SEQUENCE public.reviews_review_id_seq OWNED BY public.reviews.review_id;
          public               postgres    false    233            �            1259    18666    shipping_addresses    TABLE       CREATE TABLE public.shipping_addresses (
    address_id integer NOT NULL,
    user_id integer,
    order_id integer,
    address_line1 text,
    address_line2 text,
    city text,
    state text,
    zip_code text,
    country text,
    phone_number text
);
 &   DROP TABLE public.shipping_addresses;
       public         heap r       postgres    false            �            1259    18665 !   shipping_addresses_address_id_seq    SEQUENCE     �   CREATE SEQUENCE public.shipping_addresses_address_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 8   DROP SEQUENCE public.shipping_addresses_address_id_seq;
       public               postgres    false    230            '           0    0 !   shipping_addresses_address_id_seq    SEQUENCE OWNED BY     g   ALTER SEQUENCE public.shipping_addresses_address_id_seq OWNED BY public.shipping_addresses.address_id;
          public               postgres    false    229            �            1259    18599    users    TABLE     B  CREATE TABLE public.users (
    user_id integer NOT NULL,
    name character varying(100),
    email character varying(100) NOT NULL,
    password character varying(100) NOT NULL,
    role character varying(20) DEFAULT 'customer'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.users;
       public         heap r       postgres    false            �            1259    18598    users_user_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.users_user_id_seq;
       public               postgres    false    220            (           0    0    users_user_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;
          public               postgres    false    219            M           2604    18613    categories category_id    DEFAULT     �   ALTER TABLE ONLY public.categories ALTER COLUMN category_id SET DEFAULT nextval('public.categories_category_id_seq'::regclass);
 E   ALTER TABLE public.categories ALTER COLUMN category_id DROP DEFAULT;
       public               postgres    false    222    221    222            T           2604    18652    order_items order_item_id    DEFAULT     �   ALTER TABLE ONLY public.order_items ALTER COLUMN order_item_id SET DEFAULT nextval('public.order_items_order_item_id_seq'::regclass);
 H   ALTER TABLE public.order_items ALTER COLUMN order_item_id DROP DEFAULT;
       public               postgres    false    227    228    228            Q           2604    18638    orders order_id    DEFAULT     r   ALTER TABLE ONLY public.orders ALTER COLUMN order_id SET DEFAULT nextval('public.orders_order_id_seq'::regclass);
 >   ALTER TABLE public.orders ALTER COLUMN order_id DROP DEFAULT;
       public               postgres    false    226    225    226            V           2604    18688    payments payment_id    DEFAULT     z   ALTER TABLE ONLY public.payments ALTER COLUMN payment_id SET DEFAULT nextval('public.payments_payment_id_seq'::regclass);
 B   ALTER TABLE public.payments ALTER COLUMN payment_id DROP DEFAULT;
       public               postgres    false    232    231    232            N           2604    18622    products product_id    DEFAULT     z   ALTER TABLE ONLY public.products ALTER COLUMN product_id SET DEFAULT nextval('public.products_product_id_seq'::regclass);
 B   ALTER TABLE public.products ALTER COLUMN product_id DROP DEFAULT;
       public               postgres    false    223    224    224            I           2604    18593    report_configuration report_id    DEFAULT     �   ALTER TABLE ONLY public.report_configuration ALTER COLUMN report_id SET DEFAULT nextval('public.report_configuration_report_id_seq'::regclass);
 M   ALTER TABLE public.report_configuration ALTER COLUMN report_id DROP DEFAULT;
       public               postgres    false    217    218    218            W           2604    18700    reviews review_id    DEFAULT     v   ALTER TABLE ONLY public.reviews ALTER COLUMN review_id SET DEFAULT nextval('public.reviews_review_id_seq'::regclass);
 @   ALTER TABLE public.reviews ALTER COLUMN review_id DROP DEFAULT;
       public               postgres    false    233    234    234            U           2604    18669    shipping_addresses address_id    DEFAULT     �   ALTER TABLE ONLY public.shipping_addresses ALTER COLUMN address_id SET DEFAULT nextval('public.shipping_addresses_address_id_seq'::regclass);
 L   ALTER TABLE public.shipping_addresses ALTER COLUMN address_id DROP DEFAULT;
       public               postgres    false    230    229    230            J           2604    18602    users user_id    DEFAULT     n   ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);
 <   ALTER TABLE public.users ALTER COLUMN user_id DROP DEFAULT;
       public               postgres    false    220    219    220                      0    18610 
   categories 
   TABLE DATA           D   COPY public.categories (category_id, name, description) FROM stdin;
    public               postgres    false    222   �a                 0    18649    order_items 
   TABLE DATA           [   COPY public.order_items (order_item_id, order_id, product_id, quantity, price) FROM stdin;
    public               postgres    false    228   �a                 0    18635    orders 
   TABLE DATA           Z   COPY public.orders (order_id, user_id, total, status, created_at, order_date) FROM stdin;
    public               postgres    false    226   �c                 0    18685    payments 
   TABLE DATA           i   COPY public.payments (payment_id, order_id, payment_method, amount, payment_status, paid_at) FROM stdin;
    public               postgres    false    232   =e                 0    18619    products 
   TABLE DATA           h   COPY public.products (product_id, name, description, price, category_id, stock, created_at) FROM stdin;
    public               postgres    false    224   -g       	          0    18590    report_configuration 
   TABLE DATA           �   COPY public.report_configuration (report_id, report_name, user_id, fieldtype, table_name, selected_columns, filter_criteria, group_by, sort_order, axis_config) FROM stdin;
    public               postgres    false    218   *l                 0    18697    reviews 
   TABLE DATA           ^   COPY public.reviews (review_id, user_id, product_id, rating, comment, created_at) FROM stdin;
    public               postgres    false    234   �m                 0    18666    shipping_addresses 
   TABLE DATA           �   COPY public.shipping_addresses (address_id, user_id, order_id, address_line1, address_line2, city, state, zip_code, country, phone_number) FROM stdin;
    public               postgres    false    230   q                 0    18599    users 
   TABLE DATA           Q   COPY public.users (user_id, name, email, password, role, created_at) FROM stdin;
    public               postgres    false    220   �w       )           0    0    categories_category_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.categories_category_id_seq', 3, true);
          public               postgres    false    221            *           0    0    order_items_order_item_id_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public.order_items_order_item_id_seq', 60, true);
          public               postgres    false    227            +           0    0    orders_order_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.orders_order_id_seq', 30, true);
          public               postgres    false    225            ,           0    0    payments_payment_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.payments_payment_id_seq', 30, true);
          public               postgres    false    231            -           0    0    products_product_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.products_product_id_seq', 30, true);
          public               postgres    false    223            .           0    0 "   report_configuration_report_id_seq    SEQUENCE SET     P   SELECT pg_catalog.setval('public.report_configuration_report_id_seq', 3, true);
          public               postgres    false    217            /           0    0    reviews_review_id_seq    SEQUENCE SET     D   SELECT pg_catalog.setval('public.reviews_review_id_seq', 30, true);
          public               postgres    false    233            0           0    0 !   shipping_addresses_address_id_seq    SEQUENCE SET     P   SELECT pg_catalog.setval('public.shipping_addresses_address_id_seq', 30, true);
          public               postgres    false    229            1           0    0    users_user_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.users_user_id_seq', 20, true);
          public               postgres    false    219            a           2606    18617    categories categories_pkey 
   CONSTRAINT     a   ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (category_id);
 D   ALTER TABLE ONLY public.categories DROP CONSTRAINT categories_pkey;
       public                 postgres    false    222            g           2606    18654    order_items order_items_pkey 
   CONSTRAINT     e   ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (order_item_id);
 F   ALTER TABLE ONLY public.order_items DROP CONSTRAINT order_items_pkey;
       public                 postgres    false    228            e           2606    18642    orders orders_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);
 <   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_pkey;
       public                 postgres    false    226            k           2606    18690    payments payments_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (payment_id);
 @   ALTER TABLE ONLY public.payments DROP CONSTRAINT payments_pkey;
       public                 postgres    false    232            c           2606    18628    products products_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_id);
 @   ALTER TABLE ONLY public.products DROP CONSTRAINT products_pkey;
       public                 postgres    false    224            [           2606    18597 .   report_configuration report_configuration_pkey 
   CONSTRAINT     s   ALTER TABLE ONLY public.report_configuration
    ADD CONSTRAINT report_configuration_pkey PRIMARY KEY (report_id);
 X   ALTER TABLE ONLY public.report_configuration DROP CONSTRAINT report_configuration_pkey;
       public                 postgres    false    218            m           2606    18706    reviews reviews_pkey 
   CONSTRAINT     Y   ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (review_id);
 >   ALTER TABLE ONLY public.reviews DROP CONSTRAINT reviews_pkey;
       public                 postgres    false    234            i           2606    18671 *   shipping_addresses shipping_addresses_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.shipping_addresses
    ADD CONSTRAINT shipping_addresses_pkey PRIMARY KEY (address_id);
 T   ALTER TABLE ONLY public.shipping_addresses DROP CONSTRAINT shipping_addresses_pkey;
       public                 postgres    false    230            ]           2606    18608    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public                 postgres    false    220            _           2606    18606    users users_pkey 
   CONSTRAINT     S   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public                 postgres    false    220            p           2606    18655 %   order_items order_items_order_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id);
 O   ALTER TABLE ONLY public.order_items DROP CONSTRAINT order_items_order_id_fkey;
       public               postgres    false    4709    226    228            q           2606    18660 '   order_items order_items_product_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);
 Q   ALTER TABLE ONLY public.order_items DROP CONSTRAINT order_items_product_id_fkey;
       public               postgres    false    224    4707    228            o           2606    18643    orders orders_user_id_fkey    FK CONSTRAINT     ~   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 D   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_user_id_fkey;
       public               postgres    false    226    220    4703            t           2606    18691    payments payments_order_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id);
 I   ALTER TABLE ONLY public.payments DROP CONSTRAINT payments_order_id_fkey;
       public               postgres    false    226    232    4709            n           2606    18629 "   products products_category_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id);
 L   ALTER TABLE ONLY public.products DROP CONSTRAINT products_category_id_fkey;
       public               postgres    false    222    4705    224            u           2606    18712    reviews reviews_product_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);
 I   ALTER TABLE ONLY public.reviews DROP CONSTRAINT reviews_product_id_fkey;
       public               postgres    false    224    234    4707            v           2606    18707    reviews reviews_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 F   ALTER TABLE ONLY public.reviews DROP CONSTRAINT reviews_user_id_fkey;
       public               postgres    false    234    4703    220            r           2606    18677 3   shipping_addresses shipping_addresses_order_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.shipping_addresses
    ADD CONSTRAINT shipping_addresses_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id);
 ]   ALTER TABLE ONLY public.shipping_addresses DROP CONSTRAINT shipping_addresses_order_id_fkey;
       public               postgres    false    4709    226    230            s           2606    18672 2   shipping_addresses shipping_addresses_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.shipping_addresses
    ADD CONSTRAINT shipping_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 \   ALTER TABLE ONLY public.shipping_addresses DROP CONSTRAINT shipping_addresses_user_id_fkey;
       public               postgres    false    220    230    4703               1   x�3�t�IM.)���L.���2�t���3�9�s�K22��A�=... W&B         �  x�5S[RE1�.�aʫ�{q��0��x�KJ�Ԗ-�˗�����uZsK��X=�-����v��f�	7����7���S�+W3���+������#Q�J&��������-$/��s� ��J�� ���z�v���c?�5��)�dLG(q�2��@1��!:����#Z�((p���	���| Q�#���+�A#�7�"�������*&����P���8J{�����!By�\ ֐���J#���;��hpհ��1ٓ0n�Q�m�L�	p�]W��2R�H�d���`@��[Mx�i�CĨ�k�#�����%`>J�vI<z�&��)���Vh�$f�O��7r��ȟP;]2FFz/�uI"N��> �n�w6��c-0a���C��z�˂{����.��_�9�ZoKm�F�1d���<L�IM�o�q'�@��\j6:ҥ�:�SG̭���oD�tv5��)��Rc�y�i�ϭ��{�u� 1/H��GE�1���         V  x��U�n�0<����#	�o�ZP��j�~��HL/�+���x<�ar��qZ��kE�C�!�g
���<���<9����ާey	!O�IA���۴�������ȭ�^���T��`$�=�
�l��(=���������0�����4�
��Fѳ�C���� �J�B��'5K�C˫R�j��`�ъ���N�"5Ra�&�]	-frl_+T �f[��/�mRH(_bv�Bb7�"!��=��b���De�L�Ԇ">|mخ�D�A�S���3�I%�M�O9E���g��IX��t�6�jZZX�6�j���m����         �  x�eTKn1]ӧ���G����@0���h`n6�}9i�!e�+[���p^o�����u���v��.���IY��߈��A@��z���q[/�N7`Q4����~:n���,0
�Ƙ,��P_�vH�� \�m��)���
5Oi��u=�F������&&¬�K�0�b;�A�?�^�w���G��S).����X�w�1kĲ�0���[�9�1��dF�2"�,,3xM k�c��.�eq��#l�>��5���D��y��y@q��+����d�
��oe���?�(�y�'�T����Xs
w2�̕f�)r��4pg,��C <^y�F��,0������X�:�eu�x��d�z�z�V҉�_��zi}���x�P�fy���Ŗ���PK��ï�;TA� J+G�t�p�b�uo/Cp�)�#��4��̥��Z2sN�9� ��W,c�#&��T�Ջ��ݞ��͔�u�D����I�H~��p�Xm         �  x��V�r�8<�_�� _Rn�7vv7NT+U���E�� ���o��H]l�%M��t�P�Go�n���V�_ls�<�q��`܁���Θ,EVTL��b2�Շ����\��E�Q����,�$��%tL|.x覘��(qE��������Q��$�p�ޥ`RfM�
�K`{�1*yT�'؆�W6~:����4u _��x�'3L�d�
�"B�v*��0���4?&�!��^�U�3�\X�:[K.�������3���ƞL y�>�9�3z��޾���g�,�_�c-���	����{}Fe�e���&g���23�V�o`�M����o�W���/����[�Ӆ'��[��UQf��m.��أF��؅m-r��d���=h��x�B�ZPr��S
lԘ��Kk���o�v�\~������T��3� G�5q|��3�l�~11������K��/!b�{Z���j�����Z�����*Zc�غ��+˟�
�Yfof�~o#���Z����4�Xe5��E 	�H��u����5bڞ���I�I���#)�J�ez
����U��V����#�םm��[��A�L,H���8+��ž�Iȏ8��#�`�8����z��m��a�yNF�A
�߈۫�@�I�g��#��vSp|(J��@P��(وL�o�\��FK?�ql;��ɕ�F{�6�$z�5�r��o�#l������U:��@� �c2�ta\L&M3y�G�G��l]�y"V� ��F!�c���9ed�y3V�2ç�-Q��AA]ݓQٍؗ?����.C�Ä��s��Y���,o�!"s��	�gn�s0�8�����$C-��d���	�@ZڀC�8(j�)�@+���Fl;d_ ��Ē,
D��o�)ً'���/�r!�����q0#j��r�U���^,^�� �;��V�L�so笸N��|���	��SN����dq���mu0~�|�Ub������"��=��t�G|�"Eu�t^����7�#+��$�����y���36{"W�?���,��\�Y�[���'��xط��Fq�I5g�űe��5���Zے֬��߅���A�ȷ#B�V������ղ&Vlc��o��8u�v����f2;�)�T���6?����,�(��kÀ0�|���a'��=^���c�@�Z�Y��.�����_��'dn��1��M�u�Z�u�����GŢ�*�
��X�ٿ�����pw��      	   �  x��T=o�0��W��(Jڭ[�6[�H]"!.Ԓ?��A�������6c#!s���Ï��D@�-�E����T�D
*oPV�ԪON��7HKȣ�7
Z�c�\��lvW�
T���T
[bv�ng{
����퐴޶K�M2�E���#1�v�Ѥ�]�C�� |�\��o՝$�}ā0s�4޹���\,"@�%h���5J~	���j=�g��jY�����}雪e�=�}?{��xȦ���x��0��*�ԧO��9&k����Fh{g�n���WG����6u��7��K��n�>f����k����I������1�P��|H���O���
�Z!�,��ro�)�������"QTb����Hv�N78�D��y���\&=�         �  x�mU�n�6}f�b~���$���m��f�ݗ����bM�I�������� %��3sn�J���>��Q�6���x�DmrSve��ŀ�B�t��L6��4f��ͪ�R��4?wFi�֍ڪ�6ј�?��m;��`�j��Tk|U�^i�qr�s�!�w�J'�^[��Sx��<�L����?�ҿy����Z:����?t�y��m��[��*�Q�^m�o!��)�M�J�u
ʨ����د�~)�Q?G�*zr!��F�o#�2�5Ďoi�����q�=^3�#�#��y{�.�bX�_Л��A��?���c�V� ��Y��J�� �/!^nk� S�>N��dz���׍���b��1����Ķ����s8��3�`� ��^Xh������"��:oW�"Ӿ����_wd��L��y{ԡ�PZW�k���ݨG��w�|�R��ˏy��Te�w-b��L.�2�`l�y���HA/�
�l��|,�g(�Q���v��7��x�@.d+��Ļ�_Q��)@ ǩ_"��=�ȥ2WsjX̀Rށ�%�sń�ٯ�����'�$���t��l�8��Zٿ��A�<K��tv��A� `F�\����+�d�>�8��k&���	s\��J�UW��)X}�-8����~�^�:��������;����6gԅ�ʆ��������7唘��V�����J>�\E=_\��d���s�ڻ�f��� -p�c�`P�}������ޢVK(>E�(}/�7U�Q�D��aFR��PQ�k"7Y|��kT�Wч�%nԷ���u���G��+�H��iI��"@@�����\ �;����A>���{¦k�U%i3���}����M�:D�+"q5Q�� w��y^�����
נ\G���cEG���?����3��         J  x�eVMo�8=����1��G�IO>l'�����\����b���v��},��Y̥`�d��իW%�_k&X%��WGߜ�e��n�ó��1}=��k�UUU�Û���#�oN}�h�ÜiQȂ]��Foq�L�%�����-_����w\�|�B��C����v?�7���d���w�w�o]c�=��ɪBʜ]�g�}��}���P����o���W�����7.*1��`��/U���m��.��&��0�)S����C������H~~�<������x&��R]�WGh� P���	����dFm�*��F��0�R����z~�f|��eYJʌ`���~O�sfd�����g�]�^���U�3~{�(4̈́��K�л�ڶ����?�(T���K��rط-+��{�-��s:�X^d�o�P^���n�ˋmOo��/s.3���j����O/��m�`U�r�6�u�$�:��L�J�ۡ�ߵ�3�� �5��|i�h�Vs.Jc�'0_�m_�r�r�C�{�J��t�0U�l�_D�G��Q��>�U��g�h�Y�J%������DΖH \TSAL�ʹ4`ڱ�&+f��u����!���We�����]��\dO[V�
�_-:�D�)K�\"74���D#gT~��(q,��/��(��}ͨ��C��=ް� gJ}a��l�ŰZW�ڵ��7h7@6�K��w�>f|�'�T�	��	����|�@l�ԅ���-9$�Z�|�4��u���:5yx�]D)�(�П�%|��^����9�n�<��6����zq�MY(j�� ���Ox��,���E���j~��=м�9ح�����=hG����r��7�b�ŷ��N S��pml��$��m��¢vM�x�KK]dUb����M��$}���j��f͵6%!~�^^�;%6�����4{p�UP��VRj)A����BE��a��Pf�	���0�p?�>��+���r���#�TX�4N���p<h�e�n��2��~�(���G͠ޅЙa
�����*���S��a�By�'S	�QҷQ�7x$��Ɠ�x����7KV��P����I� [h��h�h��o��oB4���,�j�>����]�k�.4��n�J�	+*33�>���+CsjI������M�eq�
U(ɾF���@��89��)YV����M��gm�Tun�����5}*��<�,?[�*B���w$��% ���^���5����������aן�L�:=%��B�qn��x��(e�V�=�fZ(kX��h���� ����R�x�:E"�����W�Z8&�Iݓ����6U��VKS��,p�=`,�f]*�k��(��;^(���*��Y`��
�>�t�� �c�JX�	������������S�
���i�_V�\�\��m_�v\��WH�N����: 	@آ̀0�)��p���)�
���H�R��@ѱ�e��°y�Gה$�Ls���/4n7�DR���!&o �Y%ݛ@L	����مk~8�w��V"��h%ʌ��Jtōѣ�/}g�nD������)-�2AB��=�i=�؍҂�H�f��I�p��iB�
; ߇��_�}���E��         @  x����n�0����İlǩsR�נ�{�
kja�Mr��*?}�FN�K��H���>J�h�8��K�s����Z�P�>����
l��x}o<���fg��)������ǳ�|<��0��Yia�`��w�J礫�קJN�ֳ�̕C��ZL9��b�9�Mk
�����9��:��T�=��s�s��~EQ�-=�:ܣB���1��.RE���h�����a'�R�R��@�T�X�44�����\�k��Q-n �:F/*�Zr_"o�*b�$�/�)�V�wNv��Oy���Do�E� ���*|����><�,����@8�s��zVȑug5v�N�YQ��4����n��!��B�?4�u�1�G�Ԑ�@F�[M	�-c�7������'�g%�	�qJh�A+��e��;���:�nE�c��{�PJl�\+��sn���k��K\�����\�������`�lSB�� "��Z�����k�%��f���Ěu7�[�Rg-�p������e}*� -����(��������R=,U��iWSH/���l�#�i�����1�6nV�mM�(����p0� x�     