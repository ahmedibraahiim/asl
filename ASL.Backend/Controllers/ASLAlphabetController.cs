using ASL.Backend.Data;
using ASL.Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IO;
using Microsoft.Data.SqlClient;

namespace ASL.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ASLAlphabetController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<ASLAlphabetController> _logger;
    private bool _initialized = false;

    public ASLAlphabetController(
        ApplicationDbContext context,
        IWebHostEnvironment env,
        ILogger<ASLAlphabetController> logger)
    {
        _context = context;
        _env = env;
        _logger = logger;
    }

    private async Task EnsureTableInitialized()
    {
        if (_initialized) return;

        try
        {
            _logger.LogInformation("Checking if asl_alphabet table exists...");

            // Create table directly if it doesn't exist - using proper SQL execution
            var createTableSql = @"
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
            END";

            await _context.Database.ExecuteSqlRawAsync(createTableSql);
            _logger.LogInformation("asl_alphabet table check completed");

            // Check if data needs to be inserted - using direct ADO.NET approach
            bool tableHasData = false;
            var connection = _context.Database.GetDbConnection();
            await connection.OpenAsync();

            try
            {
                using (var command = connection.CreateCommand())
                {
                    command.CommandText = "SELECT COUNT(*) FROM asl_alphabet";
                    var result = await command.ExecuteScalarAsync();
                    tableHasData = Convert.ToInt32(result) > 0;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if table has data");
                tableHasData = false;
            }
            finally
            {
                await connection.CloseAsync();
            }

            if (!tableHasData)
            {
                _logger.LogInformation("Populating asl_alphabet table with data...");

                // Read the data insertion part of the SQL script
                var scriptPath = Path.Combine(_env.ContentRootPath, "create_asl_alphabet_table.sql");
                if (System.IO.File.Exists(scriptPath))
                {
                    var fullScript = System.IO.File.ReadAllText(scriptPath);

                    // Extract the INSERT statement part
                    var insertStart = fullScript.IndexOf("INSERT INTO asl_alphabet");
                    if (insertStart >= 0)
                    {
                        var insertScript = fullScript.Substring(insertStart);
                        // Remove the BEGIN/END wrapper if present
                        insertScript = insertScript
                            .Replace("IF NOT EXISTS (SELECT * FROM asl_alphabet)", "")
                            .Replace("BEGIN", "")
                            .Replace("END", "");

                        await _context.Database.ExecuteSqlRawAsync(insertScript);
                        _logger.LogInformation("asl_alphabet table populated successfully");
                    }
                    else
                    {
                        // If we can't find the insertion part, add the data directly
                        await InsertDefaultData();
                    }
                }
                else
                {
                    _logger.LogWarning($"SQL script not found at {scriptPath}, inserting default data");
                    await InsertDefaultData();
                }
            }

            _initialized = true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initializing ASL alphabet table");
            throw; // Rethrow to show the error in the API response
        }
    }

    private async Task InsertDefaultData()
    {
        // Insert at least the first few letters directly to ensure some data is available
        var insertSql = @"
        INSERT INTO asl_alphabet (letter, image_url, video_url, handshape_description, example_word, word_asl_video)
        VALUES 
        ('A', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251144/a1_xakxxz.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252906/a_crhvde.mp4', 'Closed fist, thumb beside index finger', 'Apple', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518061/Apple_smjvdb.mp4'),
        ('B', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251290/b1_1_eds43w.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252907/b_lwfuif.mp4', 'Palm facing out, fingers straight together', 'Book', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518061/Book_dumxaf.mp4'),
        ('C', 'https://res.cloudinary.com/dtyfb3izp/image/upload/v1745251425/c1_rgogdq.jpg', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745252907/c_g8a2r0.mp4', 'Curved hand like the letter C', 'Cat', 'https://res.cloudinary.com/dtyfb3izp/video/upload/v1745518061/Cat_ulhbdn.mp4');";

        await _context.Database.ExecuteSqlRawAsync(insertSql);
        _logger.LogInformation("Default data inserted successfully");
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ASLAlphabet>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ASLAlphabet>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ASLAlphabet>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> GetAlphabet([FromQuery] string? search = null, [FromQuery] bool exactMatch = false)
    {
        try
        {
            // Ensure table is initialized
            await EnsureTableInitialized();

            // Case 1: Single letter exact match request
            if (exactMatch && !string.IsNullOrWhiteSpace(search) && search.Length == 1)
            {
                var letterParam = new SqlParameter("@letter", search.ToUpper());
                var singleLetterQuery = @"SELECT 
                            letter, 
                            image_url AS ImageUrl, 
                            video_url AS VideoUrl, 
                            handshape_description AS HandshapeDescription, 
                            example_word AS ExampleWord, 
                            word_asl_video AS WordASLVideo 
                            FROM asl_alphabet 
                            WHERE letter = @letter";

                var letterResult = await _context.ASLAlphabets
                    .FromSqlRaw(singleLetterQuery, letterParam)
                    .FirstOrDefaultAsync();

                if (letterResult == null)
                {
                    return NotFound(ApiResponse<ASLAlphabet>.ErrorResponse($"Letter '{search}' not found"));
                }

                return Ok(ApiResponse<ASLAlphabet>.SuccessResponse(letterResult, $"Retrieved data for letter '{search}'"));
            }

            // Case 2: Search or get all
            var query = @"SELECT 
                        letter, 
                        image_url AS ImageUrl, 
                        video_url AS VideoUrl, 
                        handshape_description AS HandshapeDescription, 
                        example_word AS ExampleWord, 
                        word_asl_video AS WordASLVideo 
                      FROM asl_alphabet";

            // Add search condition if provided
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchParam = new SqlParameter("@search", $"%{search}%");
                query += @" WHERE letter LIKE @search
                           OR handshape_description LIKE @search
                           OR example_word LIKE @search";

                // Execute with parameter to avoid SQL injection
                var result = await _context.ASLAlphabets
                    .FromSqlRaw(query, searchParam)
                    .ToListAsync();

                return Ok(ApiResponse<IEnumerable<ASLAlphabet>>.SuccessResponse(
                    result,
                    $"Found {result.Count} results for search term '{search}'"));
            }

            // If no search, add ordering and execute
            query += " ORDER BY letter";
            var allResults = await _context.ASLAlphabets.FromSqlRaw(query).ToListAsync();

            return Ok(ApiResponse<IEnumerable<ASLAlphabet>>.SuccessResponse(
                allResults,
                $"Retrieved all {allResults.Count} alphabet entries"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving alphabet data");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<IEnumerable<ASLAlphabet>>.ErrorResponse($"An error occurred while retrieving alphabet data: {ex.Message}"));
        }
    }
}