package api

import (
	"fmt"
	"html/template"
	"log"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/cybersamx/authx/pkg/auth"
	"github.com/cybersamx/authx/pkg/config"
	"github.com/cybersamx/authx/pkg/models"
	"github.com/cybersamx/authx/pkg/store"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/locales/en"
	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	ent "github.com/go-playground/validator/v10/translations/en"
)

const (
	signinTmplName  = "signin"
	profileTmplName = "profile"
	err401TmplName  = "401"
	successURI      = "/profile"
	rootURI         = "/"
)

type HTMLHandlers struct {
	uni      *ut.UniversalTranslator
	validate *validator.Validate
	tmpl     *template.Template
	cfg      *config.Config
	ds       store.DataStore
}

func NewHTMLHandlers(cfg *config.Config, ds store.DataStore) *HTMLHandlers {
	handlers := new(HTMLHandlers)
	handlers.initValidation()
	handlers.initTemplates(cfg.TemplatesDir)

	handlers.cfg = cfg
	handlers.ds = ds

	return handlers
}

func (hh *HTMLHandlers) initValidation() {
	locale := "en"
	english := en.New()
	hh.uni = ut.New(english, english)
	trans, ok := hh.uni.GetTranslator(locale)
	if !ok {
		log.Panicf("failed to get translator for %s locale", locale)
	}

	hh.validate, ok = binding.Validator.Engine().(*validator.Validate)
	if !ok {
		log.Panicf("failed to cast to *validator.Validate")
	}
	if err := ent.RegisterDefaultTranslations(hh.validate, trans); err != nil {
		log.Panicf("failed to register validation translator: %v", err)
	}
}

func (hh *HTMLHandlers) initTemplates(tmplDir string) {
	files, err := filepath.Glob(fmt.Sprintf("%s/*.gohtml", tmplDir))
	if err != nil {
		log.Panicf("failed to get files in %s: %v", tmplDir, err)
	}

	// Load the template file.
	hh.tmpl = template.Must(template.ParseFiles(files...))
}

func (hh *HTMLHandlers) renderTemplate(ctx *gin.Context, tmplName string, data interface{}) {
	if err := hh.tmpl.ExecuteTemplate(ctx.Writer, tmplName, data); err != nil {
		_ = ctx.AbortWithError(http.StatusInternalServerError, err)
	}
}

// TODO: Refactor too many if-else statements.

func (hh *HTMLHandlers) SignIn() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// GET  = displays the page.
		// POST = handles the form submission.
		if ctx.Request.Method == http.MethodGet {
			hh.renderTemplate(ctx, signinTmplName, nil)
		} else if ctx.Request.Method == http.MethodPost {
			var msg strings.Builder

			var login models.User
			if err := ctx.ShouldBind(&login); err != nil {
				vErrs, ok := err.(validator.ValidationErrors)
				if !ok {
					log.Panicf("failed to cast validator.ValidationErrors: %v", err)
				}

				trans, _ := hh.uni.GetTranslator("en")

				for _, e := range vErrs {
					msg.WriteString(fmt.Sprintln(e.Translate(trans)))
				}
			} else {
				user, err := auth.Authenticate(ctx, hh.ds, login.Username, login.Password)
				if err == auth.ErrUserNotFound {
					msg.WriteString("User not found")
				} else if err == auth.ErrInvalidCredentials {
					msg.WriteString("Invalid credentials")
				} else if err != nil {
					msg.WriteString(fmt.Sprintf("Internal error: %s", err))
				}

				// Generate oauth2 object and save.
				if msg.Len() == 0 {
					aTTL := time.Duration(hh.cfg.AccessTTL) * time.Second
					rTTL := time.Duration(hh.cfg.RefreshTTL) * time.Second
					otoken, err := auth.CreateOAuthToken(ctx, hh.ds, user.ID, hh.cfg.AccessSecret, aTTL, rTTL)
					if err != nil {
						msg.WriteString(fmt.Sprintf("Internal error: %s", err))
					} else {
						// Save session to the cookie.
						session := UserSession{
							OAuth2Token: *otoken,
							UserID:      user.ID,
						}
						ss := NewSessionStore(hh.cfg.SessionSecret)
						if err := ss.SetSession(ctx.Writer, ctx.Request, &session); err != nil {
							msg.WriteString(fmt.Sprintf("Internal error: %s", err))
						}
					}
				}
			}

			if msg.Len() > 0 {
				content := &struct {
					Error string
				}{
					Error: msg.String(),
				}

				hh.renderTemplate(ctx, signinTmplName, content)

				return
			}

			// Redirect if successful
			http.Redirect(ctx.Writer, ctx.Request, successURI, http.StatusFound)
		} else {
			// Other methods
			http.Error(ctx.Writer, fmt.Sprintf("%s not supported", ctx.Request.Method), http.StatusNotImplemented)
			return
		}
	}
}

func (hh *HTMLHandlers) Profile() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		ss := NewSessionStore(hh.cfg.SessionSecret)

		// GET  = displays the page.
		// POST = handles the form submission.
		if ctx.Request.Method == http.MethodGet {
			var content interface{}

			uid, ok := ctx.Get(keyUserID)
			if !ok {
				hh.renderTemplate(ctx, err401TmplName, nil)
				return
			}

			user, err := hh.ds.GetUser(ctx, uid.(string))
			if err != nil {
				_ = ctx.AbortWithError(http.StatusInternalServerError, err)
				return
			}

			if user == nil {
				hh.renderTemplate(ctx, err401TmplName, nil)
				return
			}

			content = &struct {
				Username string
			}{
				Username: user.Username,
			}

			hh.renderTemplate(ctx, profileTmplName, content)
		} else if ctx.Request.Method == http.MethodPost {
			if err := ss.ClearSession(ctx.Writer, ctx.Request); err != nil {
				fmt.Printf("failed to clear session: %v", err)
			}

			// Redirect if successful
			http.Redirect(ctx.Writer, ctx.Request, rootURI, http.StatusFound)
		}
	}
}
