/*
  === ENABLE REALTIME REPLICATION ===
  
  Run this script in the Supabase SQL Editor to enable real-time 
  notifications for the key tables used in the application.
*/

-- Enable Realtime for core tables
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE pet_gallery;
ALTER PUBLICATION supabase_realtime ADD TABLE gallery_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE gallery_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE flash_sales;

-- Ensure RLS is enabled on these tables (best practice)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_sales ENABLE ROW LEVEL SECURITY;
