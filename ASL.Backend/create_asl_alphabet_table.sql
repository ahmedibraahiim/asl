-- Create the ASL alphabet table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'asl_alphabet')
BEGIN
    CREATE TABLE asl_alphabet (
        letter NVARCHAR(10) PRIMARY KEY,
        image_url NVARCHAR(MAX),
        video_url NVARCHAR(MAX),
        handshape_description NVARCHAR(MAX),
        example_word NVARCHAR(100),
        word_asl_video NVARCHAR(MAX)
    );
END

-- Insert data into the table (if not exists)
IF NOT EXISTS (SELECT * FROM asl_alphabet)
BEGIN
    INSERT INTO asl_alphabet (letter, image_url, video_url, handshape_description, example_word, word_asl_video)
    VALUES
        ('A', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251144/a1_xakxxz.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252906/a_crhvde.mp4', 'Closed fist, thumb beside index finger', 'Apple', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518061/Apple_smjvdb.mp4'),
        ('B', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251290/b1_1_eds43w.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252907/b_lwfuif.mp4', 'Palm facing out, fingers straight together', 'Book', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518061/Book_dumxaf.mp4'),
        ('C', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251425/c1_rgogdq.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252907/c_g8a2r0.mp4', 'Curved hand like the letter C', 'Cat', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518061/Cat_ulhbdn.mp4'),
        ('D', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251425/d1_cna96h.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252908/d_veyvku.mp4', 'Index up, other fingers touch thumb', 'Dog', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518061/Dog_hpthio.mp4'),
        ('E', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251526/e1_gtctjp.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252909/e_rgfsft.mp4', 'Fingers bent, thumb underneath', 'Elephant', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518062/Elephant_x0ezba.mp4'),
        ('F', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251526/f1_irgjux.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252910/fmp4_feuf6i.mp4', 'Index & thumb make circle, others up', 'Fish', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518061/Fish_ocxnwt.mp4'),
        ('G', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251525/g1_zdlxee.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252911/g_dq0bnu.mp4', 'Index & thumb extended sideways', 'Giraffe', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518063/Giraffe_efob74.mp4'),
        ('H', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251524/h1_zg2nby.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252912/h_so2ozo.mp4', 'Index & middle finger extended forward', 'Hat', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518063/Hat_vf0zgm.mp4'),
        ('I', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251524/i1_oaphv2.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252913/i_mru0hi.mp4', 'Little finger up, others closed', 'Ice cream', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518063/Ice_cream_h0f5nu.mp4'),
        ('J', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251654/j1_enqurf.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252914/j_qvr8wx.mp4', 'Little finger draws a "J" shape', 'Juice', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518064/Juice_jfov1k.mp4'),
        ('K', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251653/k1_srrtts.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252915/k_ts00v1.mp4', 'Index & middle raised, thumb in between', 'Kite', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518063/Kite_rrusy7.mp4'),
        ('L', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251652/l1_pkprby.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252917/l_ayeieg.mp4', 'Thumb & index form "L" shape', 'Lion', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518063/Lion_anvz33.mp4'),
        ('M', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251652/m1_nktu3f.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252918/m_eklrfs.mp4', '3 fingers over thumb (thumb under 3)', 'Monkey', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518064/Monkey_qtftxv.mp4'),
        ('N', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251651/n1_gts1g7.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252919/n_fhlrdl.mp4', '2 fingers over thumb (thumb under 2)', 'Nest', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518064/Nest_qgfeem.mp4'),
        ('O', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251650/o1_pejlig.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252920/o_r7ooly.mp4', 'Fingers form a round "O" shape', 'Orange', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518064/Orange_ddszfd.mp4'),
        ('P', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251838/p1_g3c2ja.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252921/p_seekue.mp4', 'Like K but pointed downward', 'Pizza', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518065/Pizza_gjztqi.mp4'),
        ('Q', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251837/q1_vvdikn.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252922/q_essijq.mp4', 'Like G but pointed downward', 'Queen', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518065/Queen_ehgzwa.mp4'),
        ('R', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251835/r1_o96awa.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252924/r_jvyf6k.mp4', 'Index & middle crossed', 'Rabbit', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518066/Rabbit_toty2d.mp4'),
        ('S', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251835/s1_mluhg6.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252925/s_r2qdyl.mp4', 'Fist closed, thumb across fingers', 'Sun', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518065/Sun_zpheia.mp4'),
        ('T', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251834/t1_xzaqyj.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252934/t_adr8gg.mp4', 'Thumb between index & middle finger', 'Turtle', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518065/Turtle_fbgpz6.mp4'),
        ('U', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251833/u1_vglsnt.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252935/u_tcipnf.mp4', 'Index & middle fingers together, up', 'Umbrella', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518066/Umbrella_gik2x8.mp4'),
        ('V', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251832/v1_nflkeu.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252936/v_so0axz.mp4', 'Index & middle in "V" shape', 'Violin', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518066/Violin_qbgomv.mp4'),
        ('W', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251831/w1_gtactq.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252937/w_kcqdpc.mp4', '3 fingers up like a "W"', 'Water', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518066/Water_yfiawg.mp4'),
        ('X', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251830/x1_dpx3hd.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252939/x_vn332s.mp4', 'Bent index finger', 'Xylophone', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518066/Xylophone_nb3y3y.mp4'),
        ('Y', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251830/y1_m3ndpi.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252940/y_yeitpn.mp4', 'Thumb & pinky out, rest closed', 'Yellow', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518066/Yellow_aolk5f.mp4'),
        ('Z', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251830/z1_ihqif2.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252941/z_tcdhzb.mp4', 'Index draws "Z" in air', 'Zebra', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518067/Zebra_mrr3qy.mp4');
END 