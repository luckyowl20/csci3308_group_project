-- Color data for the color table, should not be modified.
-- Colors "light" and "dark" are for the colors used in light and dark mode. Others are for UI colors the user can change to. 
--Defualt is green and light.

INSERT INTO colors (name, light_code, code, dark_code) 
VALUES
    ('light', 'rgb(255, 255, 255)', 'rgb(248, 249, 250)', 'rgb(234, 234, 234)'),
    ('dark', 'rgb(60, 60, 60)', 'rgb(40, 40, 40)', 'rgb(30, 30, 30)'),
    --colors below that are white (all 255) still need to be assigned. 
    ('red', 'rgb(255, 255, 255)', 'rgb(128, 31, 31)', 'rgb(255, 255, 255)'),
    ('orange', 'rgb(255, 255, 255)', 'rgb(152, 87, 41)', 'rgb(255, 255, 255)'),
    ('yellow', 'rgb(255, 255, 255)', 'rgb(187, 153, 41)', 'rgb(255, 255, 255)'),
    ('green', 'rgb(255, 255, 255)', 'rgb(45, 104, 66)', 'rgb(255, 255, 255)'),
    ('blue', 'rgb(255, 255, 255)', 'rgb(56, 86, 183)', 'rgb(255, 255, 255)'),
    ('purple', 'rgb(255, 255, 255)', 'rgb(115, 45, 118)', 'rgb(255, 255, 255)');