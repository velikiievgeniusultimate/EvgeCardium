package game.vibecards.loader;

import android.content.Context;
import org.json.JSONObject;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.concurrent.Executors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

final class UpdateManager {
    interface Callback { void ready(File entry); }
    private static final long MAX_DOWNLOAD = 40L * 1024 * 1024, MAX_FILE = 12L * 1024 * 1024;
    private final Context context; private final String channel;
    UpdateManager(Context context,String channel){this.context=context;this.channel=channel;ensureBundledGame();}
    File activeEntry(){String slot=context.getSharedPreferences("updates",0).getString("slot","bundled");return new File(root(),slot+"/index.html");}
    void checkAsync(Callback cb){Executors.newSingleThreadExecutor().execute(()->{try{JSONObject m=new JSONObject(readUrl(channel,256*1024));int remote=m.getInt("version"),local=context.getSharedPreferences("updates",0).getInt("version",1);if(remote<=local)return;String url=m.getString("url"),sha=m.getString("sha256");if(!url.startsWith("https://"))throw new IOException("HTTPS required");byte[] zip=download(url,MAX_DOWNLOAD);if(!hex(MessageDigest.getInstance("SHA-256").digest(zip)).equalsIgnoreCase(sha))throw new IOException("Digest mismatch");String slot="slot-"+remote;File dir=new File(root(),slot);unzip(zip,dir);File entry=new File(dir,m.optString("entry","index.html"));if(!entry.isFile())throw new IOException("Missing entry");context.getSharedPreferences("updates",0).edit().putString("slot",slot).putInt("version",remote).apply();cb.ready(entry);}catch(Exception ignored){}});}
    private File root(){return new File(context.getFilesDir(),"game");}
    private void ensureBundledGame(){File dst=new File(root(),"bundled");if(new File(dst,"index.html").isFile())return;copyAssets("",dst);}
    private void copyAssets(String path,File dst){try{String[] list=context.getAssets().list(path);if(list==null)return;if(list.length==0){dst.getParentFile().mkdirs();try(InputStream in=context.getAssets().open(path);OutputStream out=new FileOutputStream(dst)){byte[] b=new byte[8192];for(int n;(n=in.read(b))>=0;)out.write(b,0,n);}}else{dst.mkdirs();for(String n:list)copyAssets(path.isEmpty()?n:path+"/"+n,new File(dst,n));}}catch(IOException ignored){}}
    private static String readUrl(String url,long max)throws IOException{return new String(download(url,max),StandardCharsets.UTF_8);}
    private static byte[] download(String value,long max)throws IOException{HttpURLConnection c=(HttpURLConnection)new URL(value).openConnection();c.setConnectTimeout(8000);c.setReadTimeout(15000);c.setInstanceFollowRedirects(true);try(InputStream in=c.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[16384];long total=0;for(int n;(n=in.read(b))>=0;){total+=n;if(total>max)throw new IOException("Too large");out.write(b,0,n);}return out.toByteArray();}finally{c.disconnect();}}
    private static void unzip(byte[] data,File dir)throws IOException{dir.mkdirs();String root=dir.getCanonicalPath()+File.separator;try(ZipInputStream zin=new ZipInputStream(new ByteArrayInputStream(data))){for(ZipEntry e;(e=zin.getNextEntry())!=null;){File out=new File(dir,e.getName());if(!out.getCanonicalPath().startsWith(root))throw new IOException("Unsafe path");if(e.isDirectory()){out.mkdirs();continue;}out.getParentFile().mkdirs();try(OutputStream os=new FileOutputStream(out)){byte[] b=new byte[8192];long total=0;for(int n;(n=zin.read(b))>=0;){total+=n;if(total>MAX_FILE)throw new IOException("File too large");os.write(b,0,n);}}}}}
    private static String hex(byte[] b){StringBuilder s=new StringBuilder();for(byte x:b)s.append(String.format("%02x",x));return s.toString();}
}
