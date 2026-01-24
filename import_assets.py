import os
import shutil
from PIL import Image

# Configuration
SOURCE_DIR = r'c:\Users\smk15\Desktop\code\MadWeek3\public\sprites copy'
DEST_DIR = r'c:\Users\smk15\Desktop\code\MadWeek3\public\sprites\holo'

# Mapping: Source Folder Name -> Dest Filename
# We will take the first PNG found in the source folder
ASSET_MAP = {
    # Characters
    'sAmeIdle': 'char_ame.png',
    'sGuraIdle': 'char_gura.png',
    'sInaIdle': 'char_ina.png',
    'sKiaraIdle': 'char_kiara.png', # Assuming existence, will check
    'sCalliIdle': 'char_calli.png', # Assuming existence
    'sBaeIdle': 'char_bae.png',
    'sKronieIdle': 'char_kronie.png',
    'sMumeiIdle': 'char_mumei.png',
    'sFaunaIdle': 'char_fauna.png',
    'sSanaIdle': 'char_sana.png',
    'sIrysIdle': 'char_irys.png',
    
    # Map
    'BG_newgrass_0': 'map_grass.png',
    'sStage1Port': 'map_stage1.png',
    
    # UI / Menu
    'sMenu': 'ui_menu_bg.png',
    'sShopBG': 'ui_shop_bg.png',
    'spr_HoloCureTitle': 'ui_title.png',
    'sHudArea': 'ui_hud_base.png',
    'sHudButton': 'ui_button.png', # New button asset
    'sHudHPIcon': 'ui_icon_hp.png',
    'sHudAtkIcon': 'ui_icon_atk.png',
    'sHudSpdIcon': 'ui_icon_spd.png',
    'sHudCrtIcon': 'ui_icon_crt.png',
    'sHudPickupIcon': 'ui_icon_pickup.png',
    'sHudCooldownIcon': 'ui_icon_haste.png',
    
    # Level Up / Upgrades
    'sItemSquare': 'ui_item_box.png',
    'sUiPortraitFrame': 'ui_char_frame.png',
    'sUiPortraitBg': 'ui_char_bg.png',
    'sUpgradeBackground': 'ui_levelup_bg.png',
    'sUiLevelHeaderWhite': 'ui_levelup_text.png', # Using white as generic header
    
    # Upgrade Icons (Samples)
    'sStudyGlasses': 'item_glasses.png',
    'sUberSheep': 'item_ubersheep.png',
    'sBodyPillow': 'item_pillow.png',
    'sNurseHorn': 'item_horn.png',
    'sPikiPikiPiman': 'item_piman.png',
    'sSake': 'item_sake.png',
    'sHalu': 'item_halu.png',
    
    # Enemies
    'sShrimp': 'enemy_shrimp.png',
    'sDeadBeat': 'enemy_deadbeat.png',
    'sTakodachi': 'enemy_takodachi.png',
    'sKFP': 'enemy_kfp.png',
}

def import_assets():
    if not os.path.exists(DEST_DIR):
        os.makedirs(DEST_DIR)
        print(f"Created directory: {DEST_DIR}")

    for src_folder, dest_name in ASSET_MAP.items():
        folder_path = os.path.join(SOURCE_DIR, src_folder)
        
        # Check if folder exists
        if not os.path.exists(folder_path):
            print(f"[SKIP] Folder not found: {src_folder}")
            continue
            
        # Find first PNG
        found_png = False
        for file in os.listdir(folder_path):
            if file.lower().endswith('.png'):
                src_file = os.path.join(folder_path, file)
                dest_file = os.path.join(DEST_DIR, dest_name)
                
                try:
                    # Load and Save (to convert/resize if needed)
                    with Image.open(src_file) as img:
                        # User requested "very small px". 
                        # Most Holo sprites are ALREADY very small pixel art (e.g. 25x30).
                        # So we generally just copy them. 
                        # But for Backgrounds, they might be huge.
                        
                        # Just copy for now, maybe convert to WebP for performance
                        dest_file_webp = os.path.splitext(dest_file)[0] + '.webp'
                        img.save(dest_file_webp, 'WEBP')
                        print(f"[OK] Imported: {src_folder} -> {os.path.basename(dest_file_webp)} ({img.width}x{img.height})")
                        found_png = True
                        break # Take only one frame
                except Exception as e:
                    print(f"[ERR] Failed to process {src_file}: {e}")
        
        if not found_png:
            print(f"[WARN] No PNG found in {src_folder}")

if __name__ == "__main__":
    import_assets()
